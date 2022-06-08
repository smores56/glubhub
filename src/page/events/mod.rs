use crate::route::EventTab;
use crate::query::use_query;
use yew::Properties;

pub struct EventsProps {
    pub event_id: Option<i32>,
    pub tab: Option<EventTab>,
}

#[function_component(Events)]
pub fn events(props: &EventsProps) -> Html {
    let events = use_query(EventsQuery);
    let selected_id = use_state::<Option<i32>>(None);

    async (eventId: number) => {
      setSelected(loading);
      const result = await get<GlubEvent>(`events/${eventId}`);
      setSelected(resultToRemote(result));
    },
    [setSelected]
  );

  const selectEvent = useCallback(
    (eventId: number) => {
      if (isLoaded(events)) {
        const event = events.data.find(e => e.id === eventId);
        if (event) {
          setSelected(loaded(event));
          return;
        }
      }

      loadEvent(eventId);
    },
    [setSelected, events, loadEvent]
  );

  const unselectEvent = useCallback(() => {
    setSelected(notAsked);
    replaceRoute(routeEvents(null, null));
  }, [setSelected, replaceRoute]);

  const changeTab = useCallback(
    (tab: EventTab) => {
      if (isLoaded(selected)) {
        replaceRoute(routeEvents(selected.data.id, tab));
      }
    },
    [selected, replaceRoute]
  );

  const propagateEventUpdate = useCallback(
    (event: GlubEvent) => {
      setSelected(loaded(event));
      setEvents(
        mapLoaded(events, x => x.map(e => (e.id === event.id ? event : e)))
      );
    },
    [events, setEvents, setSelected]
  );

  const deletedEvent = useCallback(
    (event: GlubEvent) => {
      setSelected(notAsked);
      setEvents(mapLoaded(events, x => x.filter(e => e.id !== event.id)));
    },
    [setSelected, setEvents, events]
  );

  useEffect(() => {
    const loadEvents = async () => {
      const result = await get<GlubEvent[]>("events?attendance=true");
      setEvents(resultToRemote(result));
    };

    loadEvents();
  }, []);

  useEffect(() => {
    if (eventId !== null) {
      selectEvent(eventId);
    } else {
      setSelected(notAsked);
    }
  }, [eventId, selectEvent, setSelected]);

  const selectedId = isLoaded(selected) ? selected.data.id : null;
  const upcomingEvents = mapLoaded(events, x =>
    x.filter(event => !eventIsOver(event))
  );
  const pastEvents = mapLoaded(events, x => x.filter(eventIsOver));

  return (
    <>
      <Section>
        <EventColumns events={upcomingEvents} selectedId={selectedId} />
        <Divider content="Past" />
        <EventColumns events={pastEvents} selectedId={selectedId} />
      </Section>
      <Sidebar
        data={selected}
        close={unselectEvent}
        render={event => (
          <TabContent
            tab={tab}
            event={event}
            changeTab={changeTab}
            unselectEvent={unselectEvent}
            updateEvent={propagateEventUpdate}
            deletedEvent={deletedEvent}
          />
        )}
      />
    </>
  );
};

interface EventColumnsProps {
  events: RemoteData<GlubEvent[]>;
  selectedId: number | null;
}

const EventColumns: React.FC<EventColumnsProps> = ({ events, selectedId }) => {
  const { replaceRoute } = useGlubRoute();

  const column = (title: string, allowedEventTypes: GlubEventType[]) => (
    <div className="column is-one-quarter is-centered">
      <SelectableList
        title={title}
        listItems={mapLoaded(events, all => [
          all.filter(event => allowedEventTypes.includes(event.type))
        ])}
        isSelected={event => event.id === selectedId}
        onSelect={event => replaceRoute(routeEvents(event.id, null))}
        render={event => <EventRow event={event} />}
        messageIfEmpty="No events here, misster."
      />
    </div>
  );

  return (
    <Columns>
      {column("Volunteer", ["Volunteer Gig"])}
      {column("Rehearsal", ["Rehearsal", "Sectional"])}
      {column("Tutti", ["Tutti Gig"])}
      {column("Ombuds", ["Ombuds", "Other"])}
    </Columns>
  );
};

const EventRow: React.FC<{ event: GlubEvent }> = ({ event }) => (
  <>
    <td style={{ textAlign: "center" }}>
      <AttendanceIcon event={event} />
    </td>
    <td>{simpleDateFormatter(event.callTime)}</td>
    <td>{event.name}</td>
  </>
);

interface EventTabsProps {
  event: GlubEvent;
  currentTab: EventTab | null;
}

const EventTabs: React.FC<EventTabsProps> = props => (
  <div className="tabs">
    <ul>
      <TabLink tab={eventDetails} {...props} />
      <TabLink tab={eventAttendees} {...props} />
      <TabLink tab={eventSetlist} {...props} />
      <TabLink tab={eventCarpools} {...props} />
      <RequiresPermission permission={editAttendance}>
        <TabLink tab={eventAttendance} {...props} />
      </RequiresPermission>
    </ul>
  </div>
);

interface TabLinkProps {
  tab: EventTab;
  currentTab: EventTab | null;
  event: GlubEvent;
}

const TabLink: React.FC<TabLinkProps> = ({ tab, currentTab, event }) => (
  <li className={tab.route === currentTab?.route ? "is-active" : undefined}>
    <a href={renderRoute(routeEvents(event.id, tab))}>{tab.name}</a>
  </li>
);

interface TabContentProps {
  event: GlubEvent;
  tab: EventTab | null;
  unselectEvent: () => void;
  changeTab: (tab: EventTab) => void;
  updateEvent: (event: GlubEvent) => void;
  deletedEvent: (event: GlubEvent) => void;
}

const TabContent: React.FC<TabContentProps> = props => {
  const header = (
    <>
      <BackButton content="all events" click={props.unselectEvent} />
      <Title centered>{props.event.name}</Title>
      <EventTabs event={props.event} currentTab={props.tab} />
    </>
  );

  switch (props.tab?.route) {
    case "attendance":
      return (
        <>
          {header}
          <Attendance eventId={props.event.id} />
        </>
      );

    case "attendees":
      return (
        <>
          {header}
          <Attendees eventId={props.event.id} />
        </>
      );

    case "setlist":
      return (
        <>
          {header}
          <Setlist eventId={props.event.id} />
        </>
      );

    case "carpools":
      return (
        <>
          {header}
          <Carpools event={props.event} />
        </>
      );

    case "request-absence":
      return (
        <RequestAbsence
          event={props.event}
          cancel={() => props.changeTab(eventDetails)}
          success={absenceRequest =>
            props.updateEvent({ ...props.event, absenceRequest })
          }
        />
      );

    case "edit":
      return (
        <>
          <BackButton
            content="cancel editing"
            click={() => props.changeTab(eventDetails)}
          />
          <EditEvent event={props.event} updateEvent={props.updateEvent} />
        </>
      );

    default:
      return (
        <>
          {header}
          <Details
            event={props.event}
            updateEvent={props.updateEvent}
            deletedEvent={() => props.deletedEvent(props.event)}
          />
        </>
      );
  }
};
