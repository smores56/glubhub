import React, { useState, useEffect, useContext, useCallback, FormEvent } from "react";
import {
  RemoteData,
  loaded,
  loading,
  notSentYet,
  mapLoaded,
  resultToRemote,
  isLoaded,
  isSending,
  failedToSend,
  SubmissionState,
  sending,
  resultToSubmissionState,
  isLoading
} from "state/types";
import { Semester, GigRequest, GlubEventType } from "state/models";
import { get, postReturning, NewId } from "utils/request";
import { GlubHubContext, useGlubRoute } from "utils/context";
import { Title, Box, Columns, Column } from "components/Basics";
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
import { SubmitButton } from "components/Buttons";
import ErrorBox from "components/ErrorBox";
import {
  EventAndGigForm,
  allRepeatPeriods,
  RepeatPeriod,
  eventFormFromGigRequest,
  gigFormFromGigRequest,
  emptyEventForm,
  emptyGigForm,
  formJson
} from "./state";
import { routeEvents } from "state/route";
import { RemoteContent } from "components/Complex";

export const CreateEvent: React.FC<{ gigRequestId: number | null }> = ({
  gigRequestId
}) => {
  const { currentSemester } = useContext(GlubHubContext);
  const { goToRoute } = useGlubRoute();

  const [form, updateForm] = useState<RemoteData<EventAndGigForm>>(loading);
  const [semesters, setSemesters] = useState<RemoteData<Semester[]>>(loading);
  const [state, setState] = useState(notSentYet);

  const submit = useCallback(async (event: FormEvent) => {
    event.preventDefault();

    if (!isLoaded(form)) return;
    setState(sending);

    const url = gigRequestId
      ? `gig_requests/${gigRequestId}/create_event`
      : `events`;
    const result = await postReturning<any, NewId>(url, formJson(form.data));

    setState(resultToSubmissionState(result));
    if (result.successful) {
      goToRoute(routeEvents(result.data.id, null));
    }
  }, [form, setState, gigRequestId, goToRoute]);

  useEffect(() => {
    const loadSemesters = async () => {
      const result = await get<Semester[]>(`semesters`);
      setSemesters(resultToRemote(result));
    };

    loadSemesters();
    if (gigRequestId !== null) {
      get<GigRequest>(`gig_requests/${gigRequestId}`).then(result => {
        updateForm(
          mapLoaded(resultToRemote(result), r => ({
            event: eventFormFromGigRequest(r, currentSemester!),
            gig: gigFormFromGigRequest(r)
          }))
        );
      });
    } else {
      updateForm(
        loaded({ event: emptyEventForm(currentSemester!), gig: emptyGigForm })
      );
    }
  }, [setSemesters, currentSemester, updateForm, gigRequestId]);

  return (
    <>
      <Title>Create Event</Title>
      <Box>
        <RemoteContent
          data={form}
          render={form => (
            <form onSubmit={submit}>
              <Columns>
                <LeftColumn
                  form={form}
                  update={form => updateForm(loaded(form))}
                />
                <MiddleColumn
                  form={form}
                  update={form => updateForm(loaded(form))}
                  semesters={semesters}
                />
                <RightColumn
                  form={form}
                  update={form => updateForm(loaded(form))}
                  state={state}
                />
              </Columns>
            </form>
          )}
        />
      </Box>
    </>
  );
};

interface LeftColumnProps {
  form: EventAndGigForm;
  update: (form: EventAndGigForm) => void;
}

const LeftColumn: React.FC<LeftColumnProps> = ({ form, update }) => (
  <Column>
    <TextInput
      type={stringType}
      value={form.event.name}
      onInput={name => update({ ...form, event: { ...form.event, name } })}
      title="Event Name"
      placeholder="Flashmobbing the HOMO SEX IS SIN people"
      helpText="Make it descriptive, make it short."
      required
    />
    <TextInput
      type={stringType}
      value={form.event.location}
      onInput={location =>
        update({ ...form, event: { ...form.event, location } })
      }
      title="Event Location"
      placeholder="Your mom's house 😂"
      helpText="ha gottem"
    />
    <TextInput
      type={dateType}
      value={form.event.callDate}
      onInput={callDate =>
        update({ ...form, event: { ...form.event, callDate } })
      }
      title="Date of Event"
      required
    />
    <TextInput
      type={timeType}
      value={form.event.callTime}
      onInput={callTime =>
        update({ ...form, event: { ...form.event, callTime } })
      }
      title="Call Time"
      helpText="4:20 lamo"
      required
    />
    <TextInput
      type={timeType}
      value={form.gig.performanceTime}
      onInput={performanceTime =>
        update({ ...form, gig: { ...form.gig, performanceTime } })
      }
      title="Event Time"
      helpText="4:21 lamo"
    />
    <TextInput
      type={timeType}
      value={form.event.releaseTime}
      onInput={releaseTime =>
        update({ ...form, event: { ...form.event, releaseTime } })
      }
      title="Release Time"
      helpText="4:22 lamo"
    />
    <TextInput
      type={dateType}
      value={form.event.releaseDate}
      onInput={releaseDate =>
        update({ ...form, event: { ...form.event, releaseDate } })
      }
      title="Release Date"
    />
    <TextInput
      type={numberType}
      value={form.event.points}
      onInput={points => update({ ...form, event: { ...form.event, points } })}
      title="How many points is this worth?"
      placeholder="69"
    />
  </Column>
);

interface MiddleColumnProps {
  form: EventAndGigForm;
  update: (form: EventAndGigForm) => void;
  semesters: RemoteData<Semester[]>;
}

const MiddleColumn: React.FC<MiddleColumnProps> = ({
  form,
  update,
  semesters
}) => {
  const { currentSemester, info } = useContext(GlubHubContext);

  return (
    <Column>
      <RadioInput<GlubEventType>
        render={x => x}
        values={info?.eventTypes.map(type => type.name) || []}
        selected={form.event.type}
        onInput={type => update({ ...form, event: { ...form.event, type } })}
        title="Event Type"
      />
      <SelectInput
        type={stringType}
        values={
          isLoaded(semesters)
            ? semesters.data.map(s => s.name)
            : [currentSemester!.name]
        }
        selected={form.event.semester}
        onInput={semester =>
          update({ ...form, event: { ...form.event, semester } })
        }
        title="Semester"
        loading={isLoading(semesters)}
      />
      <SelectInput
        type={uniformType(info)}
        values={[null, ...(info?.uniforms || [])]}
        selected={form.gig.uniform}
        onInput={uniform => update({ ...form, gig: { ...form.gig, uniform } })}
        title="Uniform"
      />
      <TextareaInput
        value={form.event.comments}
        onInput={comments =>
          update({ ...form, event: { ...form.event, comments } })
        }
        title="Event Summary"
        placeholder="We're gonna get in there, we're gonna use our mouths, and we're gonna get out."
      />
    </Column>
  );
};

interface RightColumnProps {
  form: EventAndGigForm;
  update: (form: EventAndGigForm) => void;
  state: SubmissionState;
}

const RightColumn: React.FC<RightColumnProps> = ({ form, update, state }) => (
  <Column>
    <CheckboxInput
      content="This event is public, so I want it to show up on the external site"
      checked={form.gig.public}
      onChange={isPublic =>
        update({ ...form, gig: { ...form.gig, public: isPublic } })
      }
    />
    {form.gig.public && (
      <>
        <TextInput
          type={stringType}
          value={form.gig.summary}
          onInput={summary =>
            update({ ...form, gig: { ...form.gig, summary } })
          }
          title="Public Summary"
          helpText="Careful, real people will see this"
          placeholder="Friends? Countrymen? Bueller?"
        />
        <TextareaInput
          value={form.gig.description}
          onInput={description =>
            update({ ...form, gig: { ...form.gig, description } })
          }
          title="Public Description"
          helpText="Careful, real people will see this"
          placeholder="We the people, in order to kick a more perfect ass, I don't know where this is going"
        />
      </>
    )}
    <CheckboxInput
      content="No one has to come to this event (forum, fundatory, etc)"
      checked={!form.event.defaultAttend}
      onChange={defaultNotAttend =>
        update({
          ...form,
          event: { ...form.event, defaultAttend: !defaultNotAttend }
        })
      }
    />
    <CheckboxInput
      content="This event counts as a volunteer gig"
      checked={form.event.gigCount}
      onChange={gigCount =>
        update({ ...form, event: { ...form.event, gigCount } })
      }
    />
    <SelectInput
      type={stringType}
      values={allRepeatPeriods}
      selected={form.event.repeat}
      onInput={period =>
        update({
          ...form,
          event: { ...form.event, repeat: period as RepeatPeriod }
        })
      }
      title="Repeat"
    />
    <TextInput
      type={dateType}
      value={form.event.repeatUntil}
      onInput={repeatUntil =>
        update({ ...form, event: { ...form.event, repeatUntil } })
      }
      title="Repeat Until"
      required={form.event.repeat !== "No"}
    />
    <br />
    <SubmitButton color="is-primary" loading={isSending(state)}>
      Yeehaw
    </SubmitButton>
    {failedToSend(state) && <ErrorBox error={state.error} />}
  </Column>
);
