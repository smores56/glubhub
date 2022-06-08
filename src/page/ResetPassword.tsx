import React, { useState, useCallback, FormEvent } from "react";
import { Md5 } from "ts-md5";
import { post } from "utils/request";
import { routeLogin } from "state/route";
import ErrorBox from "components/ErrorBox";
import { useGlubRoute } from "utils/context";
import { Column, Title4, Box } from "components/Basics";
import { TextInput, passwordType } from "components/Forms";
import { ButtonGroup, SubmitButton } from "components/Buttons";
import {
  notSentYet,
  sending,
  errorSending,
  isSending,
  failedToSend
} from "state/types";

export const ResetPassword: React.FC<{ token: string | null }> = ({
  token
}) => {
  const { goToRoute } = useGlubRoute();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [state, setState] = useState(notSentYet);

  const submit = useCallback(async (event: FormEvent) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      alert("Your passwords don't match.");
      return;
    }

    setState(sending);
    const body = { passHash: Md5.hashStr(password) };
    const result = await post(`reset_password?token=${token}`, body);

    if (result.successful) {
      goToRoute(routeLogin);
      alert("Your password has been successfully reset!");
    } else {
      setState(errorSending(result.error));
    }
  }, [password, token, confirmPassword, setState, goToRoute]);

  return (
    <div className="container fullheight">
      <div className="columns is-centered is-vcentered">
        <Column narrow>
          <form onSubmit={submit} style={{ padding: "10px" }}>
            <Box>
              <Title4>Reset your Password</Title4>
              <p>
                Good job getting this far. Gimme a new password, and you'll be
                reborn like it's Avatar 2009.
              </p>
              <br />
              <TextInput
                type={passwordType}
                value={password}
                onInput={setPassword}
                title="Password"
                placeholder="••••••••"
                required
              />
              <TextInput
                type={passwordType}
                value={confirmPassword}
                onInput={setConfirmPassword}
                title="Confirm Password"
                placeholder="••••••••"
                required
              />

              <ButtonGroup alignment="is-right">
                <SubmitButton color="is-primary" loading={isSending(state)}>
                  call me Jake Sully
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
