import React, { useState, useCallback, useEffect } from "react";
import { useGlubRoute } from "utils/context";
import { DocumentLink, Member, Info } from "state/models";
import { visibleAdminTabs, fullName } from "utils/helpers";
import {
  AdminRoute,
  routeEvents,
  GlubRoute,
  renderRoute,
  routeAdmin,
  routeRepertoire,
  routeRoster,
  routeMinutes,
  routeProfile,
  routeHome
} from "state/route";

interface NavbarProps {
  user: Member | null;
  info: Info | null;
}

export const Navbar: React.FC<NavbarProps> = ({ user, info }) => {
  const { location } = useGlubRoute();
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = useCallback(() => {
    setExpanded(!expanded);
  }, [expanded, setExpanded]);

  const collapseBurgerKey = location ? renderRoute(location) : "";
  useEffect(() => {
    setExpanded(false);
  }, [collapseBurgerKey]);

  const singleLink = (route: GlubRoute) => (
    <a
      className={
        "navbar-item" + (route.route === location?.route ? " is-active" : "")
      }
      href={renderRoute(route)}
    >
      {route.name}
    </a>
  );

  return (
    <nav
      className="navbar is-primary is-fixed-top"
      role="navigation"
      aria-label="main navigation"
    >
      <div className="navbar-brand">
        <HomeLogo />
        {user && (
          <BurgerButton expanded={expanded} toggleExpanded={toggleExpanded} />
        )}
      </div>
      <div className={"navbar-menu" + (expanded ? " is-active" : "")}>
        {user && (
          <div className="navbar-start">
            {singleLink(routeEvents(null, null))}
            {singleLink(routeRepertoire(null, null))}
            {singleLink(routeRoster)}
            {singleLink(routeMinutes(null, null))}
            <DocumentLinks documents={info?.documents || []} />
            <AdminLinks user={user} />
          </div>
        )}
        {user && (
          <div className="navbar-end">
            <a
              className={
                "navbar-item" +
                (location?.route === "profile" && location.email === user.email ? " is-active" : "")
              }
              href={renderRoute(routeProfile(user.email, null))}
            >
              {fullName(user)}
            </a>
          </div>
        )}
      </div>
    </nav>
  );
};

const AdminLinks: React.FC<{ user: Member | null }> = ({ user }) => {
  const adminTabs = user ? visibleAdminTabs(user) : [];

  if (!adminTabs.length) {
    return <></>;
  }

  const divider = <hr className="navbar-divider" />;
  const adminTab = (tab: AdminRoute) => (
    <a
      key={tab.route}
      className="navbar-item"
      href={renderRoute(routeAdmin(tab))}
    >
      {tab.name}
    </a>
  );

  return (
    <div className="navbar-item has-dropdown is-hoverable">
      <a className="navbar-link" href={renderRoute(routeAdmin(null))}>
        Admin
      </a>
      <div className="navbar-dropdown">
        {adminTabs.map((tabGroup, index) => [
          ...tabGroup.map(adminTab),
          ...(index === adminTabs.length - 1 ? [] : [divider])
        ])}
      </div>
    </div>
  );
};

const DocumentLinks: React.FC<{ documents: DocumentLink[] }> = ({
  documents
}) => (
    <div className="navbar-item has-dropdown is-hoverable">
      {/* eslint-disable-next-line */}
      <a className="navbar-link">Documents</a>
      <div className="navbar-dropdown">
        {documents.map(document => (
          <a
            key={document.name}
            className="navbar-item"
            target="_blank"
            rel="noopener noreferrer"
            href={document.url}
          >
            {document.name}
          </a>
        ))}
      </div>
    </div>
  );

const HomeLogo: React.FC = () => (
  <a href={renderRoute(routeHome)} className="navbar-item">
    <span className="icon is-small" style={{ width: "3vw" }}>
      <i className="fas fa-home"></i>
    </span>
  </a>
);

interface BurgerButtonProps {
  expanded: boolean;
  toggleExpanded: () => void;
}

const BurgerButton: React.FC<BurgerButtonProps> = ({
  expanded,
  toggleExpanded
}) => (
    // eslint-disable-next-line
    <a
      role="button"
      aria-label="menu"
      aria-expanded={expanded}
      className={"navbar-burger" + (expanded ? " is-active" : "")}
      onClick={toggleExpanded}
    >
      <span aria-hidden="true" />
      <span aria-hidden="true" />
      <span aria-hidden="true" />
    </a>
  );
