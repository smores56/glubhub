import React, { useContext, useState, useEffect, useCallback } from "react";
import {
  ProfileTab,
  routeRoster,
  routeLogin,
  routeEditProfile,
  profileDetails,
  profileMoney,
  profileAttendance,
  profileSemesters,
  routeProfile,
  renderRoute
} from "state/route";
import { GlubHubContext, useGlubRoute } from "utils/context";
import {
  RemoteData,
  loading,
  notSentYet,
  SubmissionState,
  loaded,
  resultToRemote,
  sending,
  resultToSubmissionState,
  failedToSend
} from "state/types";
import { Member } from "state/models";
import { get, NewToken, deleteRequest, chain } from "utils/request";
import {
  getToken,
  setOldToken,
  setToken,
  fullName,
  getOldToken
} from "utils/helpers";
import {
  EmailLink,
  PhoneLink,
  Section,
  Container,
  Column,
  Columns,
  Box
} from "components/Basics";
import { ButtonGroup, Button, LinkButton } from "components/Buttons";
import { switchUser, deleteUser } from "state/permissions";
import ErrorBox from "components/ErrorBox";
import DeleteModal from "components/DeleteModal";
import { Details } from "./Details";
import { Attendance } from "./Attendance";
import { Semesters } from "./Semesters";
import { Money } from "./Money";
import { RemoteContent, RequiresPermission } from "components/Complex";

interface ProfileProps {
  email: string;
  tab: ProfileTab | null;
}

export const Profile: React.FC<ProfileProps> = ({ email, tab }) => {
  const { user, members, updateMembers } = useContext(GlubHubContext);

  const [member, setMember] = useState<RemoteData<Member>>(loading);

  const updateMember = useCallback(
    (member: Member) => {
      setMember(loaded(member));
      updateMembers(members.map(m => (m.email === member.email ? member : m)));
    },
    [setMember, members, updateMembers]
  );

  useEffect(() => {
    const loadMember = async () => {
      const member = members.find(m => m.email === email);

      if (member) {
        setMember(loaded(member));
      } else {
        const result = await get<Member>(`/members/${email}`);
        setMember(resultToRemote(result));
      }
    };

    loadMember();
  }, [email, members, setMember]);

  return (
    <>
      <Section>
        <Container>
          <RemoteContent
            data={member}
            render={member => (
              <Columns>
                <Column narrow>
                  <ProfilePic member={member} />
                </Column>
                <Column>
                  <ProfileTextContent member={member} />
                  <br />
                  <UserActions member={member} />
                </Column>
              </Columns>
            )}
          />
        </Container>
      </Section>
      {!!user?.positions?.length && (
        <Section>
          <Container>
            <Box>
              <RemoteContent
                data={member}
                render={member => (
                  <>
                    <ProfileTabs member={member} tab={tab || profileDetails} />
                    <TabContent
                      member={member}
                      tab={tab || profileDetails}
                      updateMember={updateMember}
                    />
                  </>
                )}
              />
            </Box>
          </Container>
        </Section>
      )}
    </>
  );
};

const ProfileTextContent: React.FC<{ member: Member }> = ({ member }) => (
  <>
    <p>
      <h1 className="subtitle is-3" style={{ marginBottom: "initial" }}>
        {fullName(member)}
      </h1>
      <i>"{member.about || "no quote"}"</i>
    </p>
    <br />
    {member.positions?.length ? member.positions.join(", ") : "Member"}
    <br />
    <EmailLink email={member.email} />
    <br />
    <PhoneLink phone={member.phoneNumber} />
    <br />
    {member.section || "Homeless"}
    <br />
    {member.major || "No major"}
    {member.minor && `, minoring in ${member.minor}`}
  </>
);

const ProfilePic: React.FC<{ member: Member }> = ({ member }) => (
  <img
    width={250}
    height={250}
    src={member.picture || "https://picsum.photos/250"}
    alt=""
  />
);

const UserActions: React.FC<{ member: Member }> = ({ member }) => {
  const { goToRoute } = useGlubRoute();
  const { user, updateUser, members, updateMembers } = useContext(
    GlubHubContext
  );

  const [loginAsState, setLoginAsState] = useState(notSentYet);
  const [deleteState, setDeleteState] = useState<SubmissionState | null>(null);

  const logout = useCallback(() => {
    setToken(null);
    updateUser(null);

    goToRoute(routeLogin);
  }, [updateUser, goToRoute]);

  const logBackIn = useCallback(async () => {
    const oldToken = getOldToken();
    if (!oldToken) return;

    setLoginAsState(sending);
    const result = await chain(get("logout"), () => {
      setOldToken(null);
      setToken(oldToken);
      return get<Member | null>("user");
    });

    setLoginAsState(resultToSubmissionState(result));
    if (result.successful) {
      updateUser(result.data);
    }
  }, [setLoginAsState, updateUser]);

  const loginAsMember = useCallback(async () => {
    setLoginAsState(sending);

    const result = await chain(
      get<NewToken>(`members/${member.email}/login_as`),
      newToken => {
        const token = getToken();
        setOldToken(token);
        setToken(newToken.token);
        return get<Member | null>("user");
      }
    );

    setLoginAsState(resultToSubmissionState(result));
    if (result.successful) {
      updateUser(result.data);
    }
  }, [setLoginAsState, updateUser, member]);

  const deleteMember = useCallback(async () => {
    setDeleteState(sending);

    const result = await deleteRequest(`members/${member.email}?confirm=true`);
    setDeleteState(resultToSubmissionState(result));

    if (result.successful) {
      updateMembers(members.filter(m => m.email !== member.email));
      goToRoute(routeRoster);
    }
  }, [setDeleteState, member.email, updateMembers, members, goToRoute]);

  if (user?.email === member.email) {
    return (
      <ButtonGroup>
        {getOldToken() ? (
          <Button onClick={logBackIn}>Log back in as yourself</Button>
        ) : (
          <Button onClick={logout}>Log out</Button>
        )}
        <LinkButton route={routeEditProfile}>Edit your profile</LinkButton>
      </ButtonGroup>
    );
  } else {
    const firstName = member.preferredName || member.firstName;

    return (
      <ButtonGroup>
        <RequiresPermission permission={switchUser}>
          <Button onClick={loginAsMember}>Log in as {firstName}</Button>
        </RequiresPermission>
        <RequiresPermission permission={deleteUser}>
          <Button onClick={() => setDeleteState(notSentYet)}>
            Delete {firstName}
          </Button>
        </RequiresPermission>

        {failedToSend(loginAsState) && <ErrorBox error={loginAsState.error} />}
        {deleteState && (
          <DeleteMemberModal
            member={member}
            state={deleteState}
            cancel={() => setDeleteState(null)}
            confirm={deleteMember}
          />
        )}
      </ButtonGroup>
    );
  }
};

interface DeleteMemberModalProps {
  member: Member;
  state: SubmissionState;
  cancel: () => void;
  confirm: () => void;
}

const DeleteMemberModal: React.FC<DeleteMemberModalProps> = ({
  member,
  state,
  cancel,
  confirm
}) => (
  <DeleteModal
    title={`Delete ${fullName(member)}?`}
    state={state}
    confirm={confirm}
    cancel={cancel}
  >
    <>
      Are you sure you want to delete {fullName(member)}?
      <br />
      <i>Think of what Uncle Ben would say. No, not the rice one.</i>
    </>
  </DeleteModal>
);

interface ProfileTabsProps {
  member: Member;
  tab: ProfileTab;
}

const ProfileTabs: React.FC<ProfileTabsProps> = ({ member, tab }) => (
  <div className="tabs">
    <ul>
      {[profileDetails, profileMoney, profileAttendance, profileSemesters].map(
        profileTab => (
          <li
            className={tab.route === profileTab.route ? "is-active" : undefined}
          >
            <a href={renderRoute(routeProfile(member.email, profileTab))}>
              {profileTab.name}
            </a>
          </li>
        )
      )}
    </ul>
  </div>
);

interface TabContentProps {
  member: Member;
  tab: ProfileTab;
  updateMember: (member: Member) => void;
}

const TabContent: React.FC<TabContentProps> = ({
  member,
  tab,
  updateMember
}) => {
  switch (tab.route) {
    case "attendance":
      return <Attendance member={member} />;
    case "semesters":
      return <Semesters member={member} />;
    case "money":
      return <Money member={member} />;
    case "details":
      return <Details member={member} update={updateMember} />;
  }
};
