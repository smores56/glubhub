import React, { useContext } from "react";
import {
  Section,
  Container,
  Box,
  EmailLink,
  PhoneLink
} from "components/Basics";
import { Member } from "state/models";
import { fullName } from "utils/helpers";
import { GlubHubContext } from "utils/context";
import { routeProfile, renderRoute } from "state/route";
import { Table } from "components/Table";

export const Roster: React.FC = () => {
  const { members } = useContext(GlubHubContext);

  const memberRow = (member: Member) => (
    <tr key={member.email}>
      <td>
        <a href={renderRoute(routeProfile(member.email, null))}>
          {fullName(member)}
        </a>
      </td>
      <td>{member.section || "Homeless"}</td>
      <td>
        <EmailLink email={member.email} />
      </td>
      <td>
        <PhoneLink phone={member.phoneNumber} />
      </td>
      <td>{member.location}</td>
    </tr>
  );

  return (
    <Section>
      <Container>
        <Box>
          <Table fullwidth scrollable>
            <thead>
              <tr>
                <th>Name</th>
                <th>Section</th>
                <th>E-mail</th>
                <th>Phone</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>{members.map(memberRow)}</tbody>
          </Table>
        </Box>
      </Container>
    </Section>
  );
};
