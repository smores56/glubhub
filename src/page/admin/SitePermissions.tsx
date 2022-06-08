import React, { useState, useCallback, useEffect, useContext } from "react";
import {
  RemoteData,
  loading,
  notSentYet,
  isLoaded,
  loaded,
  resultToRemote,
  checkSubmissionResult,
  sending
} from "state/types";
import { RolePermission, Permission, Info, GlubEventType } from "state/models";
import { post, get } from "utils/request";
import { Title, Box, Tooltip } from "components/Basics";
import { GlubHubContext } from "utils/context";
import { rolePermissionsAreEqual } from "utils/helpers";
import { CheckboxInput } from "components/Forms";
import { RemoteContent, SubmissionStateBox } from "components/Complex";

export const SitePermissions: React.FC = () => {
  const { info } = useContext(GlubHubContext);

  const [rolePermissions, updateRolePermissions] = useState<
    RemoteData<RolePermission[]>
  >(loading);
  const [state, setState] = useState(notSentYet);

  const toggleRolePermission = useCallback(
    async (rolePermission: RolePermission, enabled: boolean) => {
      if (!isLoaded(rolePermissions)) return;
      setState(sending);

      if (enabled) {
        updateRolePermissions(
          loaded([...rolePermissions.data, rolePermission])
        );
      } else {
        updateRolePermissions(
          loaded(
            rolePermissions.data.filter(
              rp => !rolePermissionsAreEqual(rp, rolePermission)
            )
          )
        );
      }

      const body = {
        name: rolePermission.permission,
        eventType: rolePermission.eventType
      };
      const url = `permissions/${rolePermission.role}/${
        enabled ? "enable" : "disable"
      }`;
      const result = await post(url, body);

      checkSubmissionResult(result, setState);
    },
    [rolePermissions, updateRolePermissions, setState]
  );

  useEffect(() => {
    const loadRolePermissions = async () => {
      const result = await get<RolePermission[]>(`role_permissions`);
      updateRolePermissions(resultToRemote(result));
    };

    loadRolePermissions();
  }, [updateRolePermissions]);

  return (
    <>
      <Title>Permissions</Title>
      <Box>
        <RemoteContent
          data={rolePermissions}
          render={rolePermissions => (
            <table>
              <tbody>
                <tr>
                  <th></th>
                  {info?.roles.map(role => (
                    <th className="vertheader">
                      <div>{role.name}</div>
                    </th>
                  ))}
                </tr>
                {info?.permissions.map(permission => (
                  <>
                    {permissionEventTypes(permission, info).map(eventType => (
                      <tr>
                        <td style={{ whiteSpace: "nowrap" }}>
                          {permission.name}
                          {eventType && `:${eventType}`}
                        </td>
                        {info.roles.map(role => (
                          <PermissionCheckbox
                            rolePermission={{
                              role: role.name,
                              permission: permission.name,
                              eventType
                            }}
                            currentPermissions={rolePermissions}
                            toggle={toggleRolePermission}
                          />
                        ))}
                      </tr>
                    ))}
                  </>
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

const permissionEventTypes = (
  permission: Permission,
  info: Info
): (GlubEventType | null)[] => [
  null,
  ...(permission.type === "Static" ? [] : info.eventTypes.map(et => et.name))
];

interface PermissionCheckboxProps {
  rolePermission: RolePermission;
  currentPermissions: RolePermission[];
  toggle: (rp: RolePermission, enabled: boolean) => void;
}

const PermissionCheckbox: React.FC<PermissionCheckboxProps> = ({
  rolePermission,
  currentPermissions,
  toggle
}) => (
  <td>
    <Tooltip content={rolePermission.role}>
      <CheckboxInput
        content=""
        checked={currentPermissions.some(rp =>
          rolePermissionsAreEqual(rp, rolePermission)
        )}
        onChange={enabled => toggle(rolePermission, enabled)}
      />
    </Tooltip>
  </td>
);
