import React, { useState, useCallback, useEffect } from "react";
import {
  MinutesTab,
  renderRoute,
  routeMinutes,
  minutesPublic,
  minutesEdit,
  minutesPrivate
} from "state/route";
import {
  RemoteData,
  loading,
  notSentYet,
  notAsked,
  resultToRemote,
  sending,
  resultToSubmissionState,
  isLoaded,
  loaded,
  mapLoaded,
  SubmissionState,
  isSending,
  failedToSend
} from "state/types";
import { MeetingMinutes } from "state/models";
import { useGlubRoute } from "utils/context";
import { get, postReturning, NewId } from "utils/request";
import { Section, Container, Columns, Column, Box } from "components/Basics";
import { SelectableList } from "components/List";
import { editMinutes, viewCompleteMinutes } from "state/permissions";
import { ButtonGroup, Button } from "components/Buttons";
import { EditMinutes } from "./Edit";
import ErrorBox from "components/ErrorBox";
import { RemoteContent, RequiresPermission } from "components/Complex";

interface MinutesProps {
  minutesId: number | null;
  tab: MinutesTab | null;
}

export const Minutes: React.FC<MinutesProps> = ({ minutesId, tab }) => {
  const { replaceRoute } = useGlubRoute();

  const [minutes, updateMinutes] = useState<RemoteData<MeetingMinutes[]>>(
    loading
  );
  const [selected, updateSelected] = useState<RemoteData<MeetingMinutes>>(
    notAsked
  );
  const [showAllMinutes, setShowAllMinutes] = useState(false);
  const [createState, setCreateState] = useState(notSentYet);

  const createNewMinutes = useCallback(async () => {
    if (!isLoaded(minutes)) return;
    setCreateState(sending);

    const newMinutesTitle = "New Meeting";
    const body = { name: newMinutesTitle };
    const result = await postReturning<typeof body, NewId>(
      `meeting_minutes`,
      body
    );

    setCreateState(resultToSubmissionState(result));
    if (result.successful) {
      const newMinutes: MeetingMinutes = {
        id: result.data.id,
        name: newMinutesTitle,
        public: null,
        private: null,
        date: new Date().getTime()
      };
      updateMinutes(loaded([newMinutes, ...minutes.data]));
      updateSelected(loaded(newMinutes));
    }
  }, [minutes, setCreateState, updateMinutes, updateSelected]);

  const loadMinutes = useCallback(
    async (id: number) => {
      updateSelected(loading);

      const result = await get<MeetingMinutes>(`meeting_minutes/${id}`);
      updateSelected(resultToRemote(result));
    },
    [updateSelected]
  );

  const propagateUpdateMinutes = useCallback(
    (updated: MeetingMinutes) => {
      updateMinutes(
        mapLoaded(minutes, all =>
          all.map(m => (m.id === updated.id ? updated : m))
        )
      );
      updateSelected(loaded(updated));
    },
    [updateMinutes, minutes, updateSelected]
  );

  const savedMinutes = useCallback(
    (saved: MeetingMinutes) => {
      replaceRoute(routeMinutes(saved.id, minutesPublic));
    },
    [replaceRoute]
  );

  const deletedMinutes = useCallback(
    (deleted: MeetingMinutes) => {
      updateMinutes(
        mapLoaded(minutes, all => all.filter(m => m.id !== deleted.id))
      );
      updateSelected(notAsked);
      replaceRoute(routeMinutes(null, null));
    },
    [updateMinutes, minutes, updateSelected, replaceRoute]
  );

  useEffect(() => {
    const loadAllMinutes = async () => {
      const result = await get<MeetingMinutes[]>(`meeting_minutes`);
      updateMinutes(resultToRemote(result));
    };

    loadAllMinutes();
  }, [updateMinutes]);

  useEffect(() => {
    if (minutesId) {
      loadMinutes(minutesId);
    } else {
      updateSelected(notAsked);
    }
  }, [minutesId, loadMinutes, updateSelected]);

  return (
    <Section>
      <Container>
        <Columns>
          <MinutesList
            minutes={minutes}
            showAllMinutes={showAllMinutes}
            createState={createState}
            selectedId={isLoaded(selected) ? selected.data.id : null}
            createNewMinutes={createNewMinutes}
            toggleShowAllMinutes={() => setShowAllMinutes(!showAllMinutes)}
          />
          <Column>
            <Box>
              <RemoteContent
                data={selected}
                notAsked={<p>Select Minutes</p>}
                render={selected => (
                  <>
                    <MinutesTabList
                      minutes={selected}
                      tab={tab || minutesPublic}
                    />
                    <TabContent
                      minutes={selected}
                      tab={tab || minutesPublic}
                      updateMinutes={propagateUpdateMinutes}
                      savedMinutes={savedMinutes}
                      deletedMinutes={deletedMinutes}
                    />
                  </>
                )}
              />
            </Box>
          </Column>
        </Columns>
      </Container>
    </Section>
  );
};

interface MinutesListProps {
  minutes: RemoteData<MeetingMinutes[]>;
  showAllMinutes: boolean;
  createState: SubmissionState;
  selectedId: number | null;
  createNewMinutes: () => void;
  toggleShowAllMinutes: () => void;
}

const MinutesList: React.FC<MinutesListProps> = ({
  minutes,
  showAllMinutes,
  createNewMinutes,
  createState,
  selectedId,
  toggleShowAllMinutes
}) => {
  const { replaceRoute } = useGlubRoute();

  return (
    <SelectableList
      listItems={
        showAllMinutes
          ? mapLoaded(minutes, m => [m])
          : mapLoaded(minutes, m => [m.slice(0, 10)])
      }
      isSelected={m => m.id === selectedId}
      onSelect={m => replaceRoute(routeMinutes(m.id, null))}
      messageIfEmpty="No minutes"
      render={m => <td>{m.name}</td>}
      contentAtTop={
        <RequiresPermission permission={editMinutes}>
          <div style={{ paddingBottom: "5px" }}>
            <ButtonGroup alignment="is-centered">
              <Button
                color="is-primary"
                onClick={createNewMinutes}
                loading={isSending(createState)}
              >
                + Add New Minutes
              </Button>
              {failedToSend(createState) && (
                <ErrorBox error={createState.error} />
              )}
            </ButtonGroup>
          </div>
        </RequiresPermission>
      }
      contentAtBottom={
        <>
          {isLoaded(minutes) && minutes.data.length > 10 && (
            <div style={{ paddingBottom: "5px" }}>
              <ButtonGroup alignment="is-centered">
                <Button onClick={toggleShowAllMinutes}>
                  {showAllMinutes ? "Hide" : "Show"} old minutes...
                </Button>
              </ButtonGroup>
            </div>
          )}
        </>
      }
    />
  );
};

interface MinutesTabListProps {
  minutes: MeetingMinutes;
  tab: MinutesTab;
}

const MinutesTabList: React.FC<MinutesTabListProps> = ({ minutes, tab }) => (
  <RequiresPermission permission={viewCompleteMinutes}>
    <div className="tabs">
      <ul>
        <SingleTab minutes={minutes} currentTab={tab} tab={minutesPublic} />
        <SingleTab minutes={minutes} currentTab={tab} tab={minutesPrivate} />
        <RequiresPermission permission={editMinutes}>
          <SingleTab minutes={minutes} currentTab={tab} tab={minutesEdit} />
        </RequiresPermission>
      </ul>
    </div>
  </RequiresPermission>
);

interface SingleTabProps {
  minutes: MeetingMinutes;
  tab: MinutesTab;
  currentTab: MinutesTab;
}

const SingleTab: React.FC<SingleTabProps> = ({ minutes, tab, currentTab }) => (
  <li className={tab.route === currentTab.route ? "is-active" : undefined}>
    <a href={renderRoute(routeMinutes(minutes.id, tab))}>{tab.name}</a>
  </li>
);

interface TabContentProps {
  minutes: MeetingMinutes;
  tab: MinutesTab;
  updateMinutes: (minutes: MeetingMinutes) => void;
  savedMinutes: (minutes: MeetingMinutes) => void;
  deletedMinutes: (minutes: MeetingMinutes) => void;
}

const TabContent: React.FC<TabContentProps> = ({
  minutes,
  tab,
  updateMinutes,
  savedMinutes,
  deletedMinutes
}) => {
  switch (tab.route) {
    case "public":
      return <div dangerouslySetInnerHTML={{ __html: minutes.public || "" }} />;

    case "private":
      return (
        <RequiresPermission permission={viewCompleteMinutes}>
          <div dangerouslySetInnerHTML={{ __html: minutes.private || "" }} />
        </RequiresPermission>
      );

    default:
      return (
        <EditMinutes
          minutes={minutes}
          update={updateMinutes}
          saved={savedMinutes}
          deleted={deletedMinutes}
        />
      );
  }
};
