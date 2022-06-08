import React, { useContext, PropsWithChildren } from "react";
import { eventIsOver, permittedTo, fullName } from "utils/helpers";
import { GlubEvent } from "state/models";
import { RemoteData, SubmissionState } from "state/types";
import ErrorBox from "./ErrorBox";
import { GlubHubContext } from "utils/context";
import { Tooltip, CheckOrCross, Spinner, Box } from "./Basics";

export const AttendanceIcon: React.FC<{ event: GlubEvent }> = ({ event }) => {
  if (!event.attendance || eventIsOver(event)) {
    return <></>;
  }

  const colorClass = event.attendance.confirmed
    ? "has-text-success"
    : "has-text-grey";
  const tooltipContent = `${
    event.attendance.confirmed ? "confirmed" : "unconfirmed"
  }, ${event.attendance.shouldAttend ? "attending" : "not attending"}`;

  return (
    <div className={colorClass}>
      <Tooltip content={tooltipContent} type="right">
        <CheckOrCross checked={event.attendance.shouldAttend} />
      </Tooltip>
    </div>
  );
};

interface RemoteContentProps<T> {
  data: RemoteData<T>;
  render: (data: T) => JSX.Element;
  notAsked?: JSX.Element;
}

export const RemoteContent = <T extends any>({
  data,
  render,
  notAsked
}: PropsWithChildren<RemoteContentProps<T>>) => {
  switch (data.status) {
    case "notAsked":
      return notAsked || <></>;

    case "loading":
      return <Spinner />;

    case "loaded":
      return render(data.data);

    case "errorLoading":
      return <ErrorBox error={data.error} />;
  }
};

export const RequiresPermission: React.FC<{ permission: string }> = ({
  permission,
  children
}) => {
  const { user } = useContext(GlubHubContext);

  return user && permittedTo(user, permission) ? <>{children}</> : <></>;
};

interface SidebarProps<T> {
  data: RemoteData<T>;
  render: (data: T) => JSX.Element;
  close: () => void;
}

export const Sidebar = <T extends any>({
  data,
  render,
  close
}: PropsWithChildren<SidebarProps<T>>) => {
  if (data.status === "notAsked") {
    return <div className="sidenav" hidden />;
  }

  return (
    <div>
      <div className="transparent-overlay" onClick={close} />
      <div className="sidenav" style={{ padding: "20px", paddingTop: "80px" }}>
        {data.status === "loading" ? (
          <Spinner />
        ) : data.status === "loaded" ? (
          render(data.data)
        ) : (
          <ErrorBox error={data.error} />
        )}
      </div>
    </div>
  );
};

export const SubmissionStateBox: React.FC<{ state: SubmissionState }> = ({
  state
}) => {
  switch (state.status) {
    case "notSentYet":
      return <></>;

    case "sending":
      return <Spinner />;

    case "errorSending":
      return <ErrorBox error={state.error} />;
  }
};

export const Modal: React.FC<{ close: () => void }> = ({ close, children }) => (
  <div className="modal is-active">
    <div className="modal-background" onClick={close} />
    <div className="modal-content" style={{ textAlign: "center" }}>
      <Box>{children}</Box>
    </div>
  </div>
);

export const MemberName: React.FC<{ email: string }> = ({ email }) => {
  const { members } = useContext(GlubHubContext);
  const member = members.find(member => member.email === email);

  if (member) {
    return <>{fullName(member)}</>;
  } else {
    return <i>{email}</i>;
  }
};
