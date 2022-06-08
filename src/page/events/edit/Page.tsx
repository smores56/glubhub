import React, { useState, useEffect, useContext, useCallback, FormEvent } from "react";
import { GlubEvent, Semester, Info } from "state/models";
import {
  RemoteData,
  loading,
  notSentYet,
  resultToRemote,
  sending,
  errorSending,
  SubmissionState,
  isLoaded,
  isLoading,
  isSending,
  failedToSend
} from "state/types";
import { get, post } from "utils/request";
import { GlubHubContext, useGlubRoute } from "utils/context";
import { Title, Column } from "components/Basics";
import {
  TextInput,
  stringType,
  dateType,
  timeType,
  numberType,
  RadioInput,
  SelectInput,
  uniformType,
  TextareaInput,
  CheckboxInput
} from "components/Forms";
import ErrorBox from "components/ErrorBox";
import {
  gigFormFromEvent,
  eventFormFromEvent,
  buildUpdateBody,
  GigForm,
  EventForm
} from "./state";
import { SubmitButton } from "components/Buttons";
import { eventDetails, routeEvents } from "state/route";

interface EditEventProps {
  event: GlubEvent;
  updateEvent: (updated: GlubEvent) => void;
}

export const EditEvent: React.FC<EditEventProps> = ({ event, updateEvent }) => {
  const { info, currentSemester } = useContext(GlubHubContext);
  const { replaceRoute } = useGlubRoute();

  const [eventForm, updateEventForm] = useState(eventFormFromEvent(event));
  const [gigForm, updateGigForm] = useState(
    gigFormFromEvent(event, info?.uniforms || [])
  );
  const [semesters, setSemesters] = useState<RemoteData<Semester[]>>(loading);
  const [state, setState] = useState(notSentYet);

  const submit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    setState(sending);

    const body = buildUpdateBody(eventForm, gigForm);
    const url = `events/${event.id}`;
    const update = await post(url, body);

    if (update.successful) {
      const updatedEvent = await get<GlubEvent>(url);
      if (updatedEvent.successful) {
        updateEvent(updatedEvent.data);
        replaceRoute(routeEvents(event.id, eventDetails));
      } else {
        setState(errorSending(updatedEvent.error));
      }
    } else {
      setState(errorSending(update.error));
    }
  }, [setState, eventForm, gigForm, event, updateEvent, replaceRoute]);

  useEffect(() => {
    const loadSemesters = async () => {
      const result = await get<Semester[]>("semesters");
      setSemesters(resultToRemote(result));
    };

    loadSemesters();
  }, [setSemesters]);

  const formData: FormData = {
    info,
    state,
    semesters,
    currentSemester,
    gig: gigForm,
    event: eventForm,
    updateGig: updateGigForm,
    updateEvent: updateEventForm
  };

  return (
    <div>
      <Title centered>Edit Event</Title>
      <form onSubmit={submit}>
        <LeftColumn {...formData} />
        <MiddleColumn {...formData} />
        <RightColumn {...formData} />
      </form>
    </div>
  );
};

interface FormData {
  gig: GigForm;
  event: EventForm;
  info: Info | null;
  state: SubmissionState;
  currentSemester: Semester | null;
  semesters: RemoteData<Semester[]>;
  updateGig: (gig: GigForm) => void;
  updateEvent: (event: EventForm) => void;
}

const LeftColumn: React.FC<FormData> = ({
  event,
  gig,
  updateEvent,
  updateGig
}) => (
    <Column>
      <TextInput
        type={stringType}
        value={event.name}
        onInput={name => updateEvent({ ...event, name })}
        title="Event Name"
        placeholder="Flashmobbing the HOMO SEX IS SIN people"
        helpText="Make it descriptive, make it short."
        required
      />
      <TextInput
        type={stringType}
        value={event.location}
        onInput={location => updateEvent({ ...event, location })}
        title="Event Location"
        placeholder="Your mom's house 😂"
        helpText="ha gottem"
      />
      <TextInput
        type={dateType}
        value={event.callDate}
        onInput={callDate => updateEvent({ ...event, callDate })}
        title="Date of Event"
        required
      />
      <TextInput
        type={timeType}
        value={event.callTime}
        onInput={callTime => updateEvent({ ...event, callTime })}
        title="Call Time"
        helpText="4:20 lamo"
        required
      />
      <TextInput
        type={timeType}
        value={gig.performanceTime}
        onInput={performanceTime => updateGig({ ...gig, performanceTime })}
        title="Event Time"
        helpText="4:21 lamo"
      />
      <TextInput
        type={timeType}
        value={event.releaseTime}
        onInput={releaseTime => updateEvent({ ...event, releaseTime })}
        title="Release Time"
        helpText="4:22 lamo"
      />
      <TextInput
        type={dateType}
        value={event.releaseDate}
        onInput={releaseDate => updateEvent({ ...event, releaseDate })}
        title="Release Date"
      />
      <TextInput
        type={numberType}
        value={event.points}
        onInput={points => updateEvent({ ...event, points })}
        title="How many points is this worth?"
        placeholder="69"
      />
    </Column>
  );

const allSemesters = (data: FormData): string[] =>
  isLoaded(data.semesters)
    ? data.semesters.data.map(s => s.name)
    : [data.currentSemester?.name || ""];

const MiddleColumn: React.FC<FormData> = props => (
  <Column>
    <RadioInput
      render={x => x}
      values={props.info?.eventTypes.map(t => t.name) || []}
      selected={props.event.type}
      onInput={type => props.updateEvent({ ...props.event, type })}
      title="Event Type"
    />
    <SelectInput
      values={allSemesters(props)}
      selected={props.event.semester}
      type={stringType}
      onInput={semester => props.updateEvent({ ...props.event, semester })}
      title="Semester"
      loading={isLoading(props.semesters)}
    />
    <SelectInput
      values={[null, ...(props.info?.uniforms || [])]}
      selected={props.gig.uniform}
      type={uniformType(props.info)}
      onInput={uniform => props.updateGig({ ...props.gig, uniform })}
    />
    <TextareaInput
      value={props.event.comments}
      onInput={comments => props.updateEvent({ ...props.event, comments })}
      title="Event Summary"
      placeholder="We're gonna get in there, we're gonna use our mouths, and we're gonna get out."
    />
  </Column>
);

const RightColumn: React.FC<FormData> = ({
  event,
  updateEvent,
  gig,
  updateGig,
  state
}) => (
    <Column>
      <CheckboxInput
        checked={gig.public}
        content="This event is public, so I want it to show up on the external site"
        onChange={pub => updateGig({ ...gig, public: pub })}
      />
      {gig.public && (
        <>
          <TextInput
            type={stringType}
            value={gig.summary}
            onInput={summary => updateGig({ ...gig, summary })}
            title="Public Summary"
            placeholder="Friends? Countrymen? Bueller?"
            helpText="Careful, real people will see this"
          />
          <TextareaInput
            value={gig.description}
            onInput={description => updateGig({ ...gig, description })}
            title="Public Description"
            helpText="Careful, real people will see this"
            placeholder="We the people, in order to kick a more perfect ass, I don't know where this is going"
          />
        </>
      )}
      <CheckboxInput
        checked={!event.defaultAttend}
        content="No one has to come to this event (forum, fundatory, etc)"
        onChange={defaultNotAttend =>
          updateEvent({ ...event, defaultAttend: !defaultNotAttend })
        }
      />
      <CheckboxInput
        checked={event.gigCount}
        content="This event counts as a volunteer gig"
        onChange={gigCount => updateEvent({ ...event, gigCount })}
      />
      <br />
      <br />
      <SubmitButton color="is-primary" loading={isSending(state)}>
        Update
    </SubmitButton>
      {failedToSend(state) && <ErrorBox error={state.error} />}
    </Column>
  );
