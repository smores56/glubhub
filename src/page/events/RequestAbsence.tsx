import React, { useState, useCallback, useContext, FormEvent } from "react";
import ErrorBox from "components/ErrorBox";
import { post, success } from "utils/request";
import { GlubHubContext } from "utils/context";
import { TextareaInput } from "components/Forms";
import { Subtitle, Title } from "components/Basics";
import { GlubEvent, AbsenceRequest } from "state/models";
import { BackButton, ButtonGroup, SubmitButton } from "components/Buttons";
import {
  notSentYet,
  errorSending,
  sending,
  isSending,
  failedToSend
} from "state/types";

interface RequestAbsenceProps {
  event: GlubEvent;
  cancel: () => void;
  success: (request: AbsenceRequest) => void;
}

export const RequestAbsence: React.FC<RequestAbsenceProps> = props => {
  const { user } = useContext(GlubHubContext);

  const [reason, setReason] = useState("");
  const [state, setState] = useState(notSentYet);

  const submit = useCallback(async (event: FormEvent) => {
    event.preventDefault();
    setState(sending);

    const body = { reason };
    const url = `absence_requests/${props.event.id}`;
    const resp = await post(url, body);

    if (resp.successful) {
      const newRequest = {
        member: user?.email || "",
        event: props.event.id,
        time: new Date().getTime(),
        reason,
        state: "Pending"
      };
      success(newRequest);
    } else {
      setState(errorSending(resp.error));
    }
  }, [setState, reason, props, user]);

  return (
    <div>
      <BackButton content="back to event" click={props.cancel} />
      <Title centered>Absence Request</Title>
      <Subtitle centered>for {props.event.name}</Subtitle>
      <br />
      <form onSubmit={submit}>
        <TextareaInput
          value={reason}
          onInput={setReason}
          title="But y tho"
          placeholder="Excuses, excuses"
          required
        />
        <ButtonGroup alignment="is-right">
          <SubmitButton color="is-primary" loading={isSending(state)}>
            Beg for Mercy
          </SubmitButton>
        </ButtonGroup>
      </form>
      {failedToSend(state) && <ErrorBox error={state.error} />}
    </div>
  );
};
