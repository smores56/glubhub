import React, { useState, useEffect, useCallback } from "react";
import {
  RemoteData,
  loading,
  notSentYet,
  resultToRemote,
  isLoaded,
  sending,
  resultToSubmissionState,
  loaded,
  mapLoaded
} from "state/types";
import { GigRequest } from "state/models";
import { get, post } from "utils/request";
import { Title, Box, EmailLink, PhoneLink } from "components/Basics";
import { timeFormatter, simpleDateWithYearFormatter } from "utils/datetime";
import { ButtonGroup, Button, LinkButton } from "components/Buttons";
import { routeAdmin, adminCreateEvent, routeEvents } from "state/route";
import { RemoteContent, SubmissionStateBox } from "components/Complex";
import { Table } from "components/Table";

export const GigRequests: React.FC = () => {
  const [requests, updateRequests] = useState<RemoteData<GigRequest[]>>(
    loading
  );
  const [state, setState] = useState(notSentYet);

  const dismissRequest = useCallback(
    async (request: GigRequest) => {
      if (!isLoaded(requests) || request.status !== "Pending") return;
      setState(sending);

      const result = await post(`gig_requests/${request.id}/dismiss`, {});
      setState(resultToSubmissionState(result));

      if (result.successful) {
        updateRequests(
          loaded(
            requests.data.map(r =>
              r.id === request.id ? { ...r, status: "Dismissed" } : r
            )
          )
        );
      }
    },
    [requests, setState, updateRequests]
  );

  const reopenRequest = useCallback(
    async (request: GigRequest) => {
      if (!isLoaded(requests) || request.status !== "Dismissed") return;
      setState(sending);

      const result = await post(`gig_requests/${request.id}/reopen`, {});
      setState(resultToSubmissionState(result));

      if (result.successful) {
        updateRequests(
          loaded(
            requests.data.map(r =>
              r.id === request.id ? { ...r, status: "Pending" } : r
            )
          )
        );
      }
    },
    [requests, setState, updateRequests]
  );

  useEffect(() => {
    const loadGigRequests = async () => {
      const result = await get<GigRequest[]>(`gig_requests?all=true`);
      updateRequests(resultToRemote(result));
    };

    loadGigRequests();
  }, [updateRequests]);

  return (
    <>
      <Title>Gig Requests</Title>
      <Box>
        <RemoteContent
          data={mapLoaded(requests, all =>
            all.filter(r => r.status === "Pending")
          )}
          render={requests => (
            <GigRequestTable
              requests={requests}
              reopen={reopenRequest}
              dismiss={dismissRequest}
            />
          )}
        />
        <SubmissionStateBox state={state} />
      </Box>
      <Title>Accepted Gig Requests</Title>
      <Box>
        <RemoteContent
          data={mapLoaded(requests, all =>
            all.filter(r => r.status === "Accepted")
          )}
          render={requests => (
            <GigRequestTable
              requests={requests}
              reopen={reopenRequest}
              dismiss={dismissRequest}
            />
          )}
        />
      </Box>
      <Title>Dismissed Gig Requests</Title>
      <Box>
        <RemoteContent
          data={mapLoaded(requests, all =>
            all.filter(r => r.status === "Dismissed")
          )}
          render={requests => (
            <GigRequestTable
              requests={requests}
              reopen={reopenRequest}
              dismiss={dismissRequest}
            />
          )}
        />
      </Box>
    </>
  );
};

interface GigRequestTableProps {
  requests: GigRequest[];
  reopen: (request: GigRequest) => void;
  dismiss: (request: GigRequest) => void;
}

const GigRequestTable: React.FC<GigRequestTableProps> = ({
  requests,
  reopen,
  dismiss
}) => (
    <Table scrollable style={{ width: "100%" }}>
      <thead>
        <tr style={{ width: "100%" }}>
          <th>When Submitted</th>
          <th>Event Name</th>
          <th>Event Date</th>
          <th>Contact</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        {requests.map(request => (
          <>
            <SingleGigRequest request={request} />
            <GigRequestButtons
              request={request}
              reopen={reopen}
              dismiss={dismiss}
            />
          </>
        ))}
      </tbody>
    </Table>
  );

const SingleGigRequest: React.FC<{ request: GigRequest }> = ({ request }) => (
  <tr key={request.id} className="no-bottom-border">
    <td>
      {simpleDateWithYearFormatter(request.time)}
      <br />
      {timeFormatter(request.time)}
    </td>
    <td>{request.name}</td>
    <td>
      {simpleDateWithYearFormatter(request.startTime)}
      <br />
      {timeFormatter(request.startTime)}
      <br />
      {request.location}
    </td>
    <td>
      {request.organization}
      <br />
      {request.contactName}
      <br />
      <PhoneLink phone={request.contactPhone} />
      <br />
      <EmailLink email={request.contactEmail} />
    </td>
    <td>
      <i>"{request.comments || "no description given"}"</i>
    </td>
  </tr>
);

interface GigRequestButtonsProps {
  request: GigRequest;
  reopen: (request: GigRequest) => void;
  dismiss: (request: GigRequest) => void;
}

const GigRequestButtons: React.FC<GigRequestButtonsProps> = ({
  request,
  reopen,
  dismiss
}) => {
  let leftButton: JSX.Element;
  let rightButton: JSX.Element;

  switch (request.status) {
    case "Pending":
      leftButton = (
        <Button onClick={() => dismiss(request)}>We do not deign</Button>
      );
      rightButton = (
        <LinkButton
          color="is-primary"
          route={routeAdmin(adminCreateEvent(request.id))}
        >
          We deign
        </LinkButton>
      );
      break;

    case "Accepted":
      leftButton = <Button>Too late to go back now</Button>;
      rightButton = (
        <LinkButton route={routeEvents(request.event, null)}>
          We deigned
        </LinkButton>
      );
      break;

    case "Dismissed":
      leftButton = <Button>We did not deign</Button>;
      rightButton = <Button onClick={() => reopen(request)}>Hol up</Button>;
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
