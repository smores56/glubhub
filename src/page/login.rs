use crate::{route::Route, types::SubmissionState};
use dioxus::core::Element;
use web_sys::event::SubmitEvent;

pub fn login(cx: Scope) -> Element {
    let email = use_state(&cx, String::new);
    let password = use_state(&cx, String::new);
    let (state, send_login) = use_mutation_lazy(&cx);
    let history = use_history().expect("Unable to get history");

    let on_successful_login = move |token| {
        set_token(&token);
        // TODO: refreshAll
        history.push(Route::Home);
    };

    let submit = {
        let send_login = send_login.clone();

        move |event: Event| {
            event.prevent_default();
            send_login.send(());

            // TODO: alert on error
            alert("Your username and/or password were incorrect.");
        }
    };

    html! {
        <Container classes={classes!(FullHeight)}>
            <Columns centered=true vcentered=true>
                <Column classes={classes!(Narrow)}>
                    <Box>
                        <form onSubmit={submit}>
                            <img style="width: 100%;" alt="" src="./glubhub.svg" />
                            <TextInput
                                type={emailType}
                                value={email}
                                onInput={setEmail}
                                title="Who are you?"
                                placeholder="gburdell3@gatech.edu"
                            />
                            <TextInput
                                type={passwordType}
                                value={password}
                                onInput={setPassword}
                                title="Oh yeah? Prove it."
                                placeholder="••••••••"
                            />

                            <div>
                                <SubmitButton
                                    color="is-primary"
                                    fullwidth
                                    loading={isSending(state)}
                                >
                                    {"I posit that I am worthy"}
                                </SubmitButton>
                                <br />
                                <div className="field is-grouped is-grouped-centered is-expanded">
                                <Control>
                                    <LinkButton route={routeForgotPassword}>
                                        {"I have forgotten who I am"}
                                    </LinkButton>
                                </Control>
                                <Control>
                                    <LinkButton
                                        route={routeEditProfile}
                                        color="is-primary"
                                        outlined
                                    >
                                        {"I am not anyone yet"}
                                    </LinkButton>
                                </Control>
                                </div>
                                </div>
                            </form>
                        </Box>
                    </Column>
                </div>
            </div>
        </Container>
    }
}
