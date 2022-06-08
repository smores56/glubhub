use crate::types::RemoteData;
use crate::{constants::API_URL, types::SubmissionState};
use cynic::selection_set::SelectionSet;
use cynic::{Operation, QueryFragment, QueryRoot};
use reqwasm::http::Request;
use yew::{use_effect, use_state, Callback, UseStateHandle};

pub fn use_query_lazy<F, D>(fragment: F) -> (UseStateHandle<RemoteData<D>>, Callback<F::Arguments>)
where
    F: QueryFragment + QueryRoot,
    F::SelectionSet: SelectionSet<'_, D, _>,
{
    let state = use_state::<T>(|| RemoteData::NotAsked);

    let make_query = {
        let state = state.clone();

        Callback::from(move || {
            state.set(RemoteData::Loading);

            wasm_bindgen_futures::spawn_local(async move {
                let result = query_api(operation).await;
                state.set(result.into());
            });
        })
    };

    (state, make_query)
}

pub fn use_query<F, D>(fragment: F) -> (UseStateHandle<RemoteData<D>>, Callback<F::Arguments>)
where
    F: QueryFragment + QueryRoot,
    F::SelectionSet: SelectionSet<'_, D, _>,
{
    let (state, make_query) = use_query_lazy(operation);
    make_query();

    (state, make_query)
}

pub fn use_mutation_lazy<T>(
    operation: Operation<'_, T>,
) -> (UseStateHandle<SubmissionState>, Callback<()>) {
    let state = use_state::<T>(|| SubmissionState::NotSentYet);

    let make_mutation = {
        let state = state.clone();

        Callback::from(move || {
            state.set(SubmissionState::Sending);

            wasm_bindgen_futures::spawn_local(async move {
                let result = match query_api(operation).await {
                    Ok(()) => SubmissionState::NotSentYet,
                    Err(error) => SubmissionState::Error(error),
                };

                state.set(result);
            });
        })
    };

    (state, make_mutation)
}

pub fn use_mutation<T>(
    operation: Operation<'_, T>,
) -> (UseStateHandle<SubmissionState>, Callback<()>) {
    let (state, make_mutation) = use_mutation_lazy(operation)?;
    make_mutation.emit(());

    (state, make_mutation)
}

async fn query_api<T>(operation: Operation<'_, T>) -> GlubhubResult<T> {
    let mut request = Request::post(API_URL).json(operation);
    if let Some(token) = get_token() {
        request.header(GREASE_TOKEN_HEADER_NAME, token);
    }

    let response = request.send().await?;
    let data = response.json().await?;

    Ok(data)
}
