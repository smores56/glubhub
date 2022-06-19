use crate::constants::API_URL;
use crate::error::GlubhubResult;
use crate::token::get_token;
use crate::types::{RemoteData, SubmissionState};
use cynic::selection_set::SelectionSet;
use cynic::{MutationBuilder, Operation, QueryBuilder, QueryFragment, QueryRoot};
use dioxus::core::Scope;
use dioxus::hooks::{use_coroutine, use_state, UseCoroutine, UseState};
use dioxus::prelude::UnboundedReceiver;
use reqwasm::http::Request;

pub fn use_query_lazy<'c, Q: QueryBuilder<'c>, P>(
    cx: &'c Scope<P>,
) -> (
    &'c UseState<RemoteData<Q::ResponseData>>,
    &'c UseCoroutine<Q::Arguments>,
) {
    let state = use_state::<T>(cx, || RemoteData::NotAsked);

    let make_query = {
        let state = state.clone();

        use_coroutine(cx, move |receiver: UnboundedReceiver<Q::Arguments>| {
            while let Some(arguments) = receiver.next().await {
                state.set(RemoteData::Loading);

                let result = query_api(Q::build(arguments)).await;
                state.set(result.into());
            }
        })
    };

    (state, make_query)
}

pub fn use_query<'c, Q: QueryBuilder<'c>, P>(
    cx: &'c Scope<P>,
    arguments: Q::Arguments,
) -> (
    &'c UseState<RemoteData<Q::ResponseData>>,
    &'c UseCoroutine<Q::Arguments>,
) {
    let (state, make_query) = use_query_lazy(cx);
    make_query.send(arguments);

    (state, make_query)
}

pub fn use_mutation_lazy<'c, M: MutationBuilder<'c>, P>(
    cx: &'c Scope<P>,
) -> (
    &'c UseState<RemoteData<M::ResponseData>>,
    &'c UseCoroutine<M::Arguments>,
) {
    let state = use_state(cx, || SubmissionState::NotSentYet);

    let make_mutation = {
        let state = state.clone();

        use_coroutine(
            cx,
            async move |receiver: UnboundedReceiver<Q::Arguments>| {
                while let Some(arguments) = receiver.next().await {
                    state.set(RemoteData::Loading);

                    let result = match query_api(operation).await {
                        Ok(()) => SubmissionState::NotSentYet,
                        Err(error) => SubmissionState::Error(error),
                    };

                    state.set(result);
                }
            },
        )
    };

    (state, make_mutation)
}

pub fn use_mutation<'c, M: MutationBuilder<'c>, P>(
    cx: &'c Scope<P>,
    arguments: M::Arguments,
) -> (
    &'c UseState<RemoteData<M::ResponseData>>,
    &'c UseCoroutine<M::Arguments>,
) {
    let (state, make_mutation) = use_mutation_lazy(cx)?;
    make_mutation.send(arguments);

    (state, make_mutation)
}

async fn query_api<D>(operation: Operation<'_, D>) -> GlubhubResult<D> {
    let mut request = Request::post(API_URL).json(operation);
    if let Some(token) = get_token() {
        request.header(GREASE_TOKEN_HEADER_NAME, token);
    }

    let response = request.send().await?;
    let data = response.json().await?;

    Ok(data)
}
