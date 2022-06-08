import React, { useState, useCallback, useContext } from "react";
import { routeEvents, eventRequestAbsence, eventEdit } from "state/route";
import DeleteModal from "components/DeleteModal";
import { eventIsOver } from "utils/helpers";
import { post, deleteRequest } from "utils/request";
import { viewEventPrivateDetails } from "state/permissions";
import { GlubEvent, SimpleAttendance, Uniform, Gig } from "state/models";
import {
  SubmissionState,
  notSentYet,
  sending,
  errorSending,
  isSending,
  failedToSend
} from "state/types";
import { Divider, PhoneLink, EmailLink } from "components/Basics";
import { Button } from "components/Buttons";
import { fullDateTimeFormatter, timeFormatter } from "utils/datetime";
import { GlubHubContext, useGlubRoute } from "utils/context";
import ErrorBox from "components/ErrorBox";
import { RequiresPermission } from "components/Complex";

interface DetailsProps {
  event: GlubEvent;
  deletedEvent: () => void;
  updateEvent: (event: GlubEvent) => void;
}

export const Details: React.FC<DetailsProps> = ({
  event,
  updateEvent,
  deletedEvent
}) => {
  const { replaceRoute } = useGlubRoute();
  const { info } = useContext(GlubHubContext);

  const [rsvpState, setRsvpState] = useState<SubmissionState>(notSentYet);

  const updateAttending = useCallback(
    async (url: string, attending: boolean) => {
      if (!event.attendance) return;

      setRsvpState(sending);
      const result = await post(url, {});

      if (result.successful) {
        setRsvpState(notSentYet);
        updateEvent({
          ...event,
          attendance: {
            ...event.attendance,
            confirmed: true,
            shouldAttend: attending
          }
        });
      } else {
        setRsvpState(errorSending(result.error));
      }
    },
    [event, setRsvpState, updateEvent]
  );

  const rsvp = useCallback(
    (attending: boolean) =>
      updateAttending(`events/${event.id}/rsvp/${attending}`, attending),
    [event, updateAttending]
  );

  const confirm = useCallback(
    () => updateAttending(`events/${event.id}/confirm`, true),
    [event, updateAttending]
  );

  const uniform =
    (event.gig?.uniform &&
      info?.uniforms.find(u => u.id === event.gig?.uniform)) ||
    null;

  return (
    <div>
      <SubtitleAndLocation event={event} />
      {event.comments && (
        <>
          <p>{event.comments}</p>
          <br />
          <br />
        </>
      )}
      <span>
        <AttendanceBlock
          event={event}
          rsvpState={rsvpState}
          rsvp={rsvp}
          confirm={confirm}
        />
      </span>
      {event.gig?.performanceTime && (
        <p>Perform at: {timeFormatter(event.gig.performanceTime)}</p>
      )}
      <p>
        This event is worth <b>{event.points}</b> points
      </p>
      {event.section && <p>This event is for the {event.section} section</p>}
      {uniform && <UniformSection uniform={uniform} />}
      <AbsenceRequestButton
        event={event}
        requestAbsence={() =>
          replaceRoute(routeEvents(event.id, eventRequestAbsence))
        }
      />
      <OfficerInfoSection event={event} deletedEvent={deletedEvent} />
      {failedToSend(rsvpState) && <ErrorBox error={rsvpState.error} />}
    </div>
  );
};

const SubtitleAndLocation: React.FC<{ event: GlubEvent }> = ({ event }) => (
  <p className="subtitle is-5">
    {fullDateTimeFormatter(event.callTime)}
    <br />
    {event.location && (
      <a
        href={`https://www.google.com/maps/search/${event.location}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {event.location}
      </a>
    )}
  </p>
);

interface AttendanceBlockProps {
  event: GlubEvent;
  rsvpState: SubmissionState;
  confirm: () => void;
  rsvp: (attending: boolean) => void;
}

const AttendanceBlock: React.FC<AttendanceBlockProps> = ({
  event,
  rsvpState,
  confirm,
  rsvp
}) => {
  const { attendance, rsvpIssue } = event;

  if (!attendance) {
    // No attendance for inactive members
    return <></>;
  } else if (eventIsOver(event)) {
    // Show whether the member attended the event
    return <AttendanceSummary points={event.points} attendance={attendance} />;
  } else if (!rsvpIssue) {
    // If the event isn't over but they can still RSVP
    return (
      <RsvpActions rsvp={rsvp} rsvpState={rsvpState} attendance={attendance} />
    );
  } else if (attendance.confirmed) {
    // If they can't RSVP but are already confirmed
    return <>We know you're coming</>;
  } else if (["Sectional", "Tutti Gig", "Rehearsal"].includes(event.type)) {
    // If they can't RSVP but are still allowed to confirm
    return (
      <>
        <p>You're coming, right?</p>
        <Button
          color="is-primary"
          loading={isSending(rsvpState)}
          onClick={confirm}
        >
          yep, I'll be there
        </Button>
      </>
    );
  } else {
    // Can't confirm or RSVP, so show the error
    return <p className="has-text-grey-light is-italic">{rsvpIssue}</p>;
  }
};

interface RsvpActionsProps {
  attendance: SimpleAttendance;
  rsvpState: SubmissionState;
  rsvp: (attending: boolean) => void;
}

const RsvpActions: React.FC<RsvpActionsProps> = ({
  attendance,
  rsvpState,
  rsvp
}) => {
  const rsvpButton = (attending: boolean, content: string) => (
    <Button
      color="is-primary"
      loading={isSending(rsvpState)}
      outlined={!attending}
      onClick={() => rsvp(attending)}
    >
      {content}
    </Button>
  );

  if (attendance.confirmed) {
    if (attendance.shouldAttend) {
      return (
        <>
          <p>
            You're <b>confirmed</b> to be <b>attending</b>
          </p>
          {rsvpButton(false, "oops jk, gotta dip")}
        </>
      );
    } else {
      return (
        <>
          <p>The officers know you won't be there</p>
          {rsvpButton(true, "sike I can come. put me in coach!")}
        </>
      );
    }
  } else {
    if (attendance.shouldAttend) {
      return (
        <>
          <p>You're coming, right?</p>
          {rsvpButton(false, "sorry fam, not this time")}
          <span> </span>
          {rsvpButton(true, "yep, I'll be there")}
        </>
      );
    } else {
      return (
        <>
          <p>You're not coming, right?</p>
          {rsvpButton(true, "akshually I can come. you're welcome")}
        </>
      );
    }
  }
};

interface AttendanceSummaryProps {
  points: number;
  attendance: SimpleAttendance;
}

const AttendanceSummary: React.FC<AttendanceSummaryProps> = ({
  points,
  attendance
}) => {
  if (attendance.didAttend) {
    if (attendance.shouldAttend) {
      return <>You were there! What a great time. Real #tbt material.</>;
    } else {
      return <>Wow, thanks for coming. What a guy!</>;
    }
  } else {
    if (attendance.shouldAttend) {
      return (
        <>
          You <b>weren't there</b>, and that's <b>not ok</b>. You lost{" "}
          {`${points}`} points.{" "}
          <a href="mailto:gleeclub_officers@lists.gatech.edu?subject=Attendance Issue">
            Email the officers
          </a>{" "}
          if you think that's not right.
        </>
      );
    } else {
      return (
        <>
          You <b>weren't there</b>, but that's <b>ok</b>.
        </>
      );
    }
  }
};

const UniformSection: React.FC<{ uniform: Uniform }> = ({ uniform }) => (
  <p>
    <span>{uniform.name} </span>
    <span
      style={{ cursor: "pointer" }}
      className="icon tooltip has-tooltip-bottom is-tooltip-multiline has-text-grey-light is-small"
      data-tooltip={uniform.description || ""}
    >
      <i className="far fa-question-circle" />
    </span>
    <br />
  </p>
);

interface AbsenceRequestButtonProps {
  event: GlubEvent;
  requestAbsence: () => void;
}

const AbsenceRequestButton: React.FC<AbsenceRequestButtonProps> = ({
  event,
  requestAbsence
}) => {
  if (eventIsOver(event) && !event.rsvpIssue) {
    return <></>;
  } else if (event.absenceRequest) {
    return (
      <Button color="is-primary" outlined>
        {`Request ${event.absenceRequest.state}`}
      </Button>
    );
  } else {
    return (
      <Button color="is-primary" outlined onClick={requestAbsence}>
        Request Absence
      </Button>
    );
  }
};

interface OfficerInfoSectionProps {
  event: GlubEvent;
  deletedEvent: () => void;
}

const OfficerInfoSection: React.FC<OfficerInfoSectionProps> = ({
  event,
  deletedEvent
}) => {
  const { replaceRoute } = useGlubRoute();

  const [deleteState, setDeleteState] = useState<SubmissionState | null>(null);

  const deleteEvent = useCallback(async () => {
    setDeleteState(sending);
    const result = await deleteRequest(`events/${event.id}`);

    if (result.successful) {
      deletedEvent();
    } else {
      setDeleteState(errorSending(result.error));
    }
  }, [event, deletedEvent, setDeleteState]);

  return (
    <RequiresPermission permission={viewEventPrivateDetails}>
      <Divider />
      {event.gig && (
        <>
          <ContactInfo gig={event.gig} />
          {event.gig.price !== null ? `${event.gig.price}` : ""}
        </>
      )}
      <br />
      <Button
        onClick={() => replaceRoute(routeEvents(event.id, eventEdit))}
        style={{ marginBottom: "5px" }}
      >
        Edit this bitch
      </Button>
      <br />
      <Button
        color="is-danger"
        outlined
        onClick={() => setDeleteState(notSentYet)}
        style={{ marginBottom: "5px" }}
      >
        Yeet this bitch into the void
      </Button>

      {deleteState && (
        <DeleteModal
          title={`Delete ${event.name}?`}
          cancel={() => setDeleteState(null)}
          confirm={deleteEvent}
          state={deleteState}
        >
          <p>
            Are you sure you want to delete this event? Once you delete it, it's
            gone like Donkey Kong.
          </p>
        </DeleteModal>
      )}
    </RequiresPermission>
  );
};

const ContactInfo: React.FC<{ gig: Gig }> = ({ gig }) => {
  if (!gig.contactName && !gig.contactEmail && !gig.contactPhone) {
    return (
      <p>
        <i>No contact info</i>
      </p>
    );
  }

  return (
    <p>
      <u>Contact</u>
      <br />
      {gig.contactName || <i>idk who</i>}
      <br />
      {gig.contactPhone ? (
        <PhoneLink phone={gig.contactPhone} />
      ) : (
        <i>no number, bro</i>
      )}
      <br />
      {gig.contactEmail ? (
        <EmailLink email={gig.contactEmail} />
      ) : (
        <i>no email, dude</i>
      )}
    </p>
  );
};
