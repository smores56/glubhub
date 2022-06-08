// import React from "react";
// import { SubmissionState, isSending, failedToSend } from "state/types";
// import ErrorBox from "./ErrorBox";
// import { DeleteButton, Button } from "./Buttons";

use ybc::{Modal, ModalCard};
use yew::{function_component, html, Callback};

use crate::types::SubmissionState;

pub struct DeleteModalProps {
    pub title: String,
    pub state: SubmissionState,
    pub confirm: Callback<()>,
    pub cancel: Callback<()>,
}

#[function_component(DeleteModal)]
pub fn delete_modal(props: &DeleteModalProps) -> Html {
    let footer = html! {
        <>
            <Button onClick={confirm} loading={isSending(state)} color="is-danger">
                {"Delete"}
            </Button>
            <Button onClick={cancel}>
                {"Cancel"}
            </Button>
            if let SubmissionState::FailedToSend(error) = state {
                <ErrorBox error={error} />
            }
        </>
    };

    html! {
        // <Modal classes={classes!("is-active")}>
        <div className="modal is-active">
            <div className="modal-background" onClick={props.cancel} />
            <div className="modal-card">
                <header className="modal-card-head">
                    <p className="modal-card-title">{props.title}</p>
                    <DeleteButton click={props.cancel} />
                </header>
                <section className="modal-card-body">{props.children}</section>
                { footer }
            </div>
        </div>
    }
}
