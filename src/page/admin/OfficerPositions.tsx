import React, { useState, useEffect, useCallback, useContext } from "react";
import { GlubHubContext } from "utils/context";
import { MemberRole, Role, Member } from "state/models";
import { Title, Box } from "components/Basics";
import { get, post, collect2, success } from "utils/request";
import {
  RemoteData,
  loading,
  notSentYet,
  resultToRemote,
  resultToSubmissionState,
  sending,
  loaded,
  isLoaded
} from "state/types";
import { inlineMiddleStyle } from "utils/style";
import { SelectInput, memberType } from "components/Forms";
import { RemoteContent, SubmissionStateBox } from "components/Complex";

export const OfficerPositions: React.FC = () => {
  const { info } = useContext(GlubHubContext);

  const [roles, updateRoles] = useState<RemoteData<MemberRole[]>>(loading);
  const [state, setState] = useState(notSentYet);

  const toggleOfficer = useCallback(
    async (role: Role, from: Member | null, to: Member | null) => {
      if (!isLoaded(roles)) return;

      setState(sending);

      const removeRole = from
        ? post(`roles/remove`, { role: role.name, member: from.email })
        : Promise.resolve(success(null));
      const addRole = to
        ? post(`roles/add`, { role: role.name, member: to.email })
        : Promise.resolve(success(null));
      const result = await collect2(removeRole, addRole);

      setState(resultToSubmissionState(result));
      if (result.successful) {
        updateRoles(
          loaded([
            ...roles.data.filter(
              memberRole =>
                memberRole.role.name !== role.name ||
                memberRole.member.email !== from?.email
            ),
            ...(to ? [{ role, member: to }] : [])
          ])
        );
      }
    },
    [roles, setState, updateRoles]
  );

  useEffect(() => {
    const loadOfficers = async () => {
      const roles = await get<MemberRole[]>(`member_roles`);
      updateRoles(resultToRemote(roles));
    };

    loadOfficers();
  }, [updateRoles]);

  const roleGroups = (roles: MemberRole[]): [Role, Member | null][] =>
    info!.roles
      .sort((r1, r2) => r1.rank - r2.rank)
      .flatMap(role => {
        const members = roles
          .filter(memberRole => memberRole.role.name === role.name)
          .map(memberRole => memberRole.member);
        const slots = [...members, null].slice(0, role.maxQuantity);

        return slots.map(slot => [role, slot] as [Role, Member | null]);
      });

  return (
    <>
      <Title>Positions</Title>
      <Box>
        <RemoteContent
          data={roles}
          render={roles => (
            <table style={{ borderSpacing: "5px", borderCollapse: "separate" }}>
              <tbody>
                {roleGroups(roles).map(([role, member]) => (
                  <MemberDropdown
                    role={role}
                    member={member}
                    toggle={toggleOfficer}
                  />
                ))}
              </tbody>
            </table>
          )}
        />
        <SubmissionStateBox state={state} />
      </Box>
    </>
  );
};

interface MemberDropdownProps {
  role: Role;
  member: Member | null;
  toggle: (role: Role, from: Member | null, to: Member | null) => void;
}

const MemberDropdown: React.FC<MemberDropdownProps> = ({
  role,
  member,
  toggle
}) => {
  const { members } = useContext(GlubHubContext);

  return (
    <tr>
      <td style={{ paddingRight: "10px" }}>
        <span style={inlineMiddleStyle}>{role.name}</span>
      </td>
      <td>
        <SelectInput
          type={memberType(members)}
          values={[null, ...members]}
          selected={member}
          onInput={newMember => toggle(role, member, newMember)}
        />
      </td>
    </tr>
  );
};
