use yew::events::{Event, FormEvent};
use yew_router::{hooks::use_history, history::History};
use web_sys::event::SubmitEvent;

use crate::{route::Route, types::SubmissionState};

#[function_component(Login)]
pub fn login() -> Html {
    let email = use_state(String::new);
    let password = use_state(String::new);
    let (state, send_login) = use_mutation();
    let history = use_history().expect("Unable to get history");

    let on_successful_login = Callback::from(|token: String| {
        set_token(&token);
        // TODO: refreshAll
        history.push(Route::Home);
    });

    let submit = Callback::from(move |event: Event| {
        event.preventDefault();
        let event: SubmitEvent = event.target_unchecked_into();

        state.set(SubmissionState::Sending);
    const body = { email, passHash: Md5.hashStr(password) };
    const resp = await postReturning<typeof body, NewToken>("login", body);

    if (resp.successful) {
      onSuccessfulLogin(resp.data.token);
    } else if (resp.error.message === "member already logged in") {
      onSuccessfulLogin(resp.error.token);
    } else {
      setState(errorSending(resp.error));
      alert("Your username and/or password were incorrect.");
    }
  }, [email, password, setState, onSuccessfulLogin]);

  return (
    <div className="container fullheight">
      <div
        className="columns is-centered is-vcentered"
        style={{ display: "flex" }}
      >
        <Column narrow>
          <Box>
            <form onSubmit={submit}>
              <img style={{ width: "100%" }} alt="" src="./glubhub.svg" />
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
                  I posit that I am worthy
                </SubmitButton>
                <br />
                <div className="field is-grouped is-grouped-centered is-expanded">
                  <Control>
                    <LinkButton route={routeForgotPassword}>
                      I have forgotten who I am
                    </LinkButton>
                  </Control>
                  <Control>
                    <LinkButton
                      route={routeEditProfile}
                      color="is-primary"
                      outlined
                    >
                      I am not anyone yet
                    </LinkButton>
                  </Control>
                </div>
              </div>
            </form>
          </Box>
        </Column>
      </div>
    </div>
  );
};
