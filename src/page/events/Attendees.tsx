import React, { useState, useEffect } from "react";
import { get } from "utils/request";
import { fullName } from "utils/helpers";
import { EventAttendee } from "state/models";
import { Column, Title } from "components/Basics";
import { RemoteData, loading, resultToRemote } from "state/types";
import { SECTION_ORDER } from "state/constants";
import { RemoteContent } from "components/Complex";
import { Table } from "components/Table";

export const Attendees: React.FC<{ eventId: number }> = ({ eventId }) => {
  const [attendees, setAttendees] = useState<RemoteData<EventAttendee[]>>(
    loading
  );

  useEffect(() => {
    const loadAttendees = async () => {
      const url = `events/${eventId}/see_whos_attending`;
      const resp = await get<EventAttendee[]>(url);
      setAttendees(resultToRemote(resp));
    };

    loadAttendees();
  }, [eventId, setAttendees]);

  return (
    <RemoteContent
      data={attendees}
      render={attendees => <AttendeeTables attendees={attendees} />}
    />
  );
};

const AttendeeTables: React.FC<{ attendees: EventAttendee[] }> = ({
  attendees
}) => {
  const { attending, notAttending } = separateAttendees(attendees);

  return (
    <Column>
      <Title centered>Attending</Title>
      {SECTION_ORDER.map(
        section =>
          attending.get(section) && (
            <AttendeeTable section={section} {...attending.get(section)!} />
          )
      )}
      <Title centered>Not Attending</Title>
      {SECTION_ORDER.map(
        section =>
          notAttending.get(section) && (
            <AttendeeTable section={section} {...notAttending.get(section)!} />
          )
      )}
    </Column>
  );
};

interface AttendeeTableProps extends SeparateByConfirmed {
  section: string | null;
}

const AttendeeTable: React.FC<AttendeeTableProps> = ({
  section,
  confirmed,
  notConfirmed
}) => (
  <Table fullwidth scrollable>
    <thead>
      <tr>
        <th>{section}</th>
        <th>Confirmed</th>
        <th>Not Confirmed</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style={{ width: "20%" }}></td>
        <AttendeeNameList attendees={confirmed} />
        <AttendeeNameList attendees={notConfirmed} />
      </tr>
    </tbody>
  </Table>
);

const AttendeeNameList: React.FC<{ attendees: EventAttendee[] }> = ({
  attendees
}) => (
  <td style={{ width: "40%" }}>
    {attendees.map((attendee, index) => (
      <>
        {fullName(attendee.member)}
        {index !== attendees.length - 1 && <br />}
      </>
    ))}
  </td>
);

interface SeparateByAttending {
  attending: Map<string | null, SeparateByConfirmed | null>;
  notAttending: Map<string | null, SeparateByConfirmed | null>;
}

interface SeparateByConfirmed {
  confirmed: EventAttendee[];
  notConfirmed: EventAttendee[];
}

const separateAttendees = (attendees: EventAttendee[]): SeparateByAttending => {
  const attending = attendees.filter(a => a.attendance.shouldAttend);
  const notAttending = attendees.filter(a => !a.attendance.shouldAttend);

  const separateByConfirmed = (
    givenAttendees: EventAttendee[]
  ): Map<string | null, SeparateByConfirmed | null> =>
    new Map(
      SECTION_ORDER.map(section => {
        const inSection = givenAttendees.filter(
          a => a.member.section === section
        );

        return [
          section,
          inSection.length
            ? {
                confirmed: inSection.filter(a => a.attendance.confirmed),
                notConfirmed: inSection.filter(a => !a.attendance.confirmed)
              }
            : null
        ];
      })
    );

  return {
    attending: separateByConfirmed(attending),
    notAttending: separateByConfirmed(notAttending)
  };
};
