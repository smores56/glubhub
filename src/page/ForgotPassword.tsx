import React, { useState, useCallback, FormEvent } from "react";
import {
  notSentYet,
  errorSending,
  sending,
  isSending,
  failedToSend
} from "state/types";
import { post } from "utils/request";
import { useGlubRoute } from "utils/context";
import { routeLogin } from "state/route";
import { Column, Title4, Box } from "components/Basics";
import { TextInput, emailType } from "components/Forms";
import { ButtonGroup, LinkButton, SubmitButton } from "components/Buttons";
import ErrorBox from "components/ErrorBox";

export const ForgotPassword: React.FC = () => {
  const { goToRoute } = useGlubRoute();

  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [state, setState] = useState(notSentYet);

  const submit = useCallback(async (event: FormEvent) => {
    event.preventDefault();

    if (email !== confirmEmail) {
      alert("Your emails don't match.");
      return;
    }

    setState(sending);
    const result = await post(`forgot_password/${email}`, {});

    if (result.successful) {
      alert(
        "Check your email for a password reset link, " +
        "it should be there in a few minutes."
      );
      goToRoute(routeLogin);
    } else {
      setState(errorSending(result.error));
    }
  }, [goToRoute, email, confirmEmail, setState]);

  return (
    <div className="container fullheight">
      <div className="columns is-centered is-vcentered">
        <Column narrow>
          <form onSubmit={submit} style={{ padding: "10px" }}>
            <Box>
              <Title4>Forgot your password?</Title4>
              <p>
                That sucks. But don't "oh geez, oh frick", just slap some emails
                down and we will send you an email with a reset link.
              </p>
              <br />
              <TextInput
                type={emailType}
                value={email}
                onInput={setEmail}
                title="E-mail"
                placeholder="gburdell3@gatech.edu"
                required
              />
              <TextInput
                type={emailType}
                value={confirmEmail}
                onInput={setConfirmEmail}
                title="Confirm E-mail"
                placeholder="bgurdell3@gatech.edu"
                required
              />

              <ButtonGroup alignment="is-right">
                <LinkButton route={routeLogin}>uh, nvm</LinkButton>
                <SubmitButton color="is-primary" loading={isSending(state)}>
                  halp
                </SubmitButton>
              </ButtonGroup>
              {failedToSend(state) && <ErrorBox error={state.error} />}
            </Box>
          </form>
        </Column>
      </div>
    </div>
  );
};
