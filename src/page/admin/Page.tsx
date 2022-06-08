import React, { useContext } from "react";
import { loaded } from "state/types";
import { SelectableList } from "components/List";
import { visibleAdminTabs } from "utils/helpers";
import { AdminRoute, routeAdmin } from "state/route";
import { GlubHubContext, useGlubRoute } from "utils/context";
import { Section, Container, Columns, Box } from "components/Basics";
import { AbsenceRequests } from "./AbsenceRequests";
import { CreateEvent } from "./create-event/Page";
import { DocumentLinks } from "./DocumentLinks";
import { GigRequests } from "./GigRequests";
import { Money } from "./Money";
import { OfficerPositions } from "./OfficerPositions";
import { Semesters } from "./Semesters";
import { SitePermissions } from "./SitePermissions";
import { Uniforms } from "./Uniforms";
import { WebmasterTools } from "./WebmasterTools";

export const Admin: React.FC<{ tab: AdminRoute | null }> = ({ tab }) => {
  const { goToRoute } = useGlubRoute();
  const { user } = useContext(GlubHubContext);

  return (
    <Section>
      <Container>
        <Columns>
          <SelectableList
            listItems={loaded(user ? visibleAdminTabs(user) : [])}
            isSelected={t => t.route === tab?.route}
            messageIfEmpty="You have no officer permissions. Perish."
            onSelect={t => goToRoute(routeAdmin(t))}
            render={t => <td>{t.name}</td>}
          />
          <div>
            {tab ? (
              <TabContent tab={tab} />
            ) : (
              <Box>Please select a menu item</Box>
            )}
          </div>
        </Columns>
      </Container>
    </Section>
  );
};

const TabContent: React.FC<{ tab: AdminRoute }> = ({ tab }) => {
  switch (tab.route) {
    case "absence-requests":
      return <AbsenceRequests />;

    case "create-event":
      return <CreateEvent gigRequestId={tab.gigRequestId} />;

    case "document-links":
      return <DocumentLinks />;

    case "gig-requests":
      return <GigRequests />;

    case "money":
      return <Money tab={tab.tab} />;

    case "officer-positions":
      return <OfficerPositions />;

    case "semesters":
      return <Semesters tab={tab.tab} />;

    case "site-permissions":
      return <SitePermissions />;

    case "uniforms":
      return <Uniforms />;

    case "webmaster-tools":
      return <WebmasterTools />;
  }
};
