use crate::constants::SUBMISSION_STATE_BOX_ID;
use crate::types::GlubhubError;
use yew::{function_component, html, Properties};

#[derive(Properties, PartialEq)]
pub struct ErrorBoxProps {
    pub error: GlubhubError,
}

#[function_component(ErrorBox)]
fn error_box(props: &ErrorBoxProps) -> Html {
    let message = props.error.to_string();
    // TODO: rename these
    let title = match props.error {
        GlubhubError::NetworkError(err) => "network error",
        GlubhubError::Other(err) => "internal error",
    };

    html! {
        <article
            id={SUBMISSION_STATE_BOX_ID}
            class="message is-danger"
            style="padding-top: 5px; padding-bottom: 5px;"
        >
            <div class="message-header">
                <p>
                    { "Something went wrong. (" }
                    <i> { title } </i>
                    { ")" }
                </p>
            </div>
            <div class="message-body">{message}</div>
        </article>
    }
}
