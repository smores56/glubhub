import "./App.css";
import React, { useState, useCallback, useEffect } from "react";

import { useGlubRoute, GlubHubContext } from "utils/context";
import { Admin } from "page/admin/Page";
import { EditCarpools } from "page/events/EditCarpools";
import { EditProfile } from "page/EditProfile";
import { Events } from "page/events/Page";
import { ForgotPassword } from "page/ForgotPassword";
import { Login } from "page/Login";
import { Minutes } from "page/minutes/Page";
import { Profile } from "page/profile/Page";
import { Repertoire } from "page/repertoire/Page";
import { ResetPassword } from "page/ResetPassword";
import { Roster } from "page/Roster";
import { Navbar } from "components/Navbar";
import { ConfirmAccountHeader } from "components/ConfirmAccount";
import { Router } from "react-router-dom";
import { createBrowserHistory } from "history";
import { Home } from "page/home/Page";
import {
  RemoteData,
  loading,
  errorLoading,
  loaded,
  isLoaded
} from "state/types";
import { Member, Info, Semester } from "state/models";
import { getToken, setToken } from "utils/helpers";
import { collect4, get, success } from "utils/request";
import { RemoteContent } from "components/Complex";
import { routeLogin } from "state/route";

const history = createBrowserHistory();

const App: React.FC = () => {
  const [appData, setAppData] = useState<
    RemoteData<{
      user: Member | null;
      members: Member[];
      info: Info;
      currentSemester: Semester;
    }>
  >(loading);

  const refreshAll = useCallback(async () => {
    const hasToken = !!getToken();
    const result = await collect4(
      get<Member | null>("user"),
      get<Info>("static"),
      get<Semester>("semesters/current"),
      hasToken
        ? get<Member[]>("members")
        : Promise.resolve(success([] as Member[]))
    );

    if (result.successful) {
      const [user, info, currentSemester, members] = result.data;
      setAppData(loaded({ user, members, info, currentSemester }));
    } else if (result.error.message === "login required") {
      setToken(null);
    } else {
      setAppData(errorLoading(result.error));
    }
  }, [setAppData]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  return (
    <Router history={history}>
      <div id="app">
        <Navbar
          {...(isLoaded(appData) ? appData.data : { user: null, info: null })}
        />
        <GlubHubContext.Provider
          value={
            isLoaded(appData) ? ({
              ...(appData.data),
              refreshAll,
              updateUser: _ => {},
              updateMembers: _ => {},
              updateInfo: _ => {},
              updateCurrentSemester: _ => {},
            }) : ({
              user: null,
              info: null!,
              currentSemester: null!,
              members: [],
              refreshAll,
              updateUser: _ => {},
              updateMembers: _ => {},
              updateInfo: _ => {},
              updateCurrentSemester: _ => {},
           })
          }
        >
          <ConfirmAccountHeader />
        </GlubHubContext.Provider>
        <div style={{ paddingBottom: "50px" }} />
        <div className="center">
          <RemoteContent
            data={appData}
            render={appData => (
              <GlubHubContext.Provider
                value={{
                  ...appData,
                  refreshAll,
                  updateUser: user => setAppData(loaded({ ...appData, user })),
                  updateMembers: members =>
                    setAppData(loaded({ ...appData, members })),
                  updateInfo: info => setAppData(loaded({ ...appData, info })),
                  updateCurrentSemester: currentSemester =>
                    setAppData(loaded({ ...appData, currentSemester }))
                }}
              >
                <CurrentPage loggedIn={!!appData.user} />
              </GlubHubContext.Provider>
            )}
          />
        </div>
      </div>
    </Router>
  );
};

export default App;

const CurrentPage: React.FC<{ loggedIn: boolean }> = ({ loggedIn }) => {
  const { location, goToRoute } = useGlubRoute();

  if (!loggedIn) {
    switch (location?.route) {
      case "edit-profile":
        return <EditProfile />;

      case "forgot-password":
        return <ForgotPassword />;

      case "reset-password":
        return <ResetPassword token={location.token} />;

      default:
        if (location?.route !== "login") {
          goToRoute(routeLogin);
        }
        return <Login />;
    }
  }

  switch (location?.route) {
    case "admin":
      return <Admin tab={location.tab} />;

    case "edit-carpools":
      return <EditCarpools eventId={location.eventId} />;

    case "edit-profile":
      return <EditProfile />;

    case "events":
      return <Events eventId={location.eventId} tab={location.tab} />;

    case "forgot-password":
      return <ForgotPassword />;

    case "login":
      return <Login />;

    case "minutes":
      return <Minutes minutesId={location.minutesId} tab={location.tab} />;

    case "profile":
      return <Profile email={location.email} tab={location.tab} />;

    case "repertoire":
      return <Repertoire songId={location.songId} tab={location.tab} />;

    case "reset-password":
      return <ResetPassword token={location.token} />;

    case "roster":
      return <Roster />;

    default:
      return <Home />;
  }
};
