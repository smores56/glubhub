import React, { useState, useEffect, useCallback } from "react";
import {
  RemoteData,
  loading,
  notSentYet,
  resultToRemote,
  sending,
  checkSubmissionResult,
  loaded,
  mapLoaded,
  isLoaded
} from "state/types";
import { Title, Box } from "components/Basics";
import { get, post } from "utils/request";
import { ButtonGroup, Button } from "components/Buttons";
import { AbsenceRequest, GlubEvent } from "state/models";
import { renderRoute, routeEvents, routeProfile } from "state/route";
import { dateFormatter, timeFormatter } from "utils/datetime";
import {
  RemoteContent,
  SubmissionStateBox,
  MemberName
} from "components/Complex";
import { Table } from "components/Table";

export const AbsenceRequests: React.FC = () => {
  const [requestsAndEvents, updateRequestsAndEvents] = useState<
    RemoteData<[AbsenceRequest, GlubEvent][]>
  >(loading);
  const [state, setState] = useState(notSentYet);

  const respondToAbsenceRequest = useCallback(
    async (request: AbsenceRequest, action: "approve" | "deny") => {
      if (!isLoaded(requestsAndEvents)) return;
      setState(sending);

      const url = `absence_requests/${request.event}/${request.member}/${action}`;
      const update = await post(url, {});

      checkSubmissionResult<null>(update, setState);
      if (update.successful) {
        updateRequestsAndEvents(
          loaded(
            requestsAndEvents.data.map(([r, e]) => [
              r.event === request.event && r.member === request.member
                ? { ...r, state: action === "approve" ? "Approved" : "Denied" }
                : r,
              e
            ])
          )
        );
      }
    },
    [requestsAndEvents, updateRequestsAndEvents, setState]
  );

  useEffect(() => {
    const loadAbsenceRequests = async () => {
      const result = await get<[AbsenceRequest, GlubEvent][]>(
        `absence_requests`
      );
      updateRequestsAndEvents(resultToRemote(result));
    };

    loadAbsenceRequests();
  }, [updateRequestsAndEvents]);

  return (
    <div style={{ width: "100%" }}>
      <Title>Open Absence Requests</Title>
      <Box>
        <RemoteContent
          data={mapLoaded(requestsAndEvents, x =>
            x.filter(([r, e]) => r.state === "Pending")
          )}
          render={requestsAndEvents => (
            <AbsenceRequestTable
              requestsAndEvents={requestsAndEvents}
              respond={respondToAbsenceRequest}
            />
          )}
        />
      </Box>
      <Title>Closed Absence Requests</Title>
      <Box>
        <RemoteContent
          data={mapLoaded(requestsAndEvents, x =>
            x.filter(([r, e]) => r.state !== "Pending")
          )}
          render={requestsAndEvents => (
            <AbsenceRequestTable
              requestsAndEvents={requestsAndEvents}
              respond={respondToAbsenceRequest}
            />
          )}
        />
      </Box>
      <SubmissionStateBox state={state} />
    </div>
  );
};

type RespondToAbsenceRequestFn = (
  request: AbsenceRequest,
  action: "approve" | "deny"
) => Promise<void>;

interface AbsenceRequestTableProps {
  requestsAndEvents: [AbsenceRequest, GlubEvent][];
  respond: RespondToAbsenceRequestFn;
}

const AbsenceRequestTable: React.FC<AbsenceRequestTableProps> = ({
  requestsAndEvents,
  respond
}) => (
  <Table scrollable style={{ width: "100%" }}>
    <thead>
      <tr style={{ width: "100%" }}>
        <th>When Submitted</th>
        <th>Event Name</th>
        <th>Event Date</th>
        <th>Loser</th>
        <th>Excuse</th>
      </tr>
    </thead>
    <tbody>
      {requestsAndEvents.map(([request, event]) => (
        <>
          <AbsenceRequestRow request={request} event={event} />
          <AbsenceRequestButtons request={request} respond={respond} />
        </>
      ))}
    </tbody>
  </Table>
);

interface AbsenceRequestRowProps {
  request: AbsenceRequest;
  event: GlubEvent;
}

const AbsenceRequestRow: React.FC<AbsenceRequestRowProps> = ({
  request,
  event
}) => (
  <tr key={request.time} className="no-bottom-border">
    <td>
      {dateFormatter(request.time)}
      <br />
      {timeFormatter(request.time)}
    </td>
    <td>
      <a href={renderRoute(routeEvents(event.id, null))}>{event.name}</a>
    </td>
    <td>
      {dateFormatter(event.callTime)}
      <br />
      {timeFormatter(event.callTime)}
      <br />
      {event.location || ""}
    </td>
    <td>
      <a href={renderRoute(routeProfile(request.member, null))}>
        <MemberName email={request.member} />
      </a>
    </td>
    <td>
      <i>{`"${request.reason}"`}</i>
    </td>
  </tr>
);

interface AbsenceRequestButtonsProps {
  request: AbsenceRequest;
  respond: RespondToAbsenceRequestFn;
}

const AbsenceRequestButtons: React.FC<AbsenceRequestButtonsProps> = ({
  request,
  respond
}) => {
  let leftButton: JSX.Element;
  let rightButton: JSX.Element;

  switch (request.state) {
    case "Pending":
      leftButton = (
        <Button onClick={() => respond(request, "deny")}>Get fukt nerd</Button>
      );
      rightButton = (
        <Button color="is-primary" onClick={() => respond(request, "approve")}>
          Bestow mercy
        </Button>
      );
      break;

    case "Approved":
      leftButton = (
        <Button onClick={() => respond(request, "deny")}>
          Jk get fukt nerd
        </Button>
      );
      rightButton = <Button>Mercy bestowed</Button>;
      break;

    case "Denied":
      leftButton = <Button>Nerd got fukt</Button>;
      rightButton = (
        <Button
          style={{ whiteSpace: "normal", maxWidth: "150px", height: "initial" }}
          onClick={() => respond(request, "approve")}
        >
          I have heard your pleas and acquiesced to your request
        </Button>
      );
      break;
  }

  return (
    <tr className="no-bottom-border">
      <td colSpan={5}>
        <ButtonGroup alignment="is-right">
          {leftButton}
          {rightButton}
        </ButtonGroup>
      </td>
    </tr>
  );
};
