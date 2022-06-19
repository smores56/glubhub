use crate::route::EventTab;
use crate::query::use_query;
use crate::types::RemoteData;
use dioxus::core::{Element, Scope};
use dioxus::prelude::{Props, rsx, inline_props};

#[inline_props]
pub fn Events(cx: Scope, event_id: Option<i32>, tab: Option<EventTab>) -> Element {
    let (events, get_events) = use_query::<EventsQuery>(&cx, ());
    let (selected_event, get_selected_event) = use_query::<FullEventQuery>(&cx, cx.props.event_id);

    cx.render(rsx!(
        Section {
            EventColumns {
                events: upcoming_events,
                selected_id: cx.props.event_id,
            }
            Divider {
                content: "Past"
            }
            EventColumns {
                events: past_events,
                selected_id: cx.props.event_id,
            }
        }
        Sidebar {
            data: selected_event,
            close: unselect_event,
            render: |event| rsx!(
                TabContent {
                    tab: tab,
                    event: event,
                    change_tab: change_tab,
                    unselect_event: unselect_event,
                    update_event: propagate_event_update,
                    deleted_event: deleted_event,
                }
            )
        }
    ))
}

#[inline_props]
pub fn EventColumns(cx: Scope, events: RemoteData<&Vec<Event>>, selected_id: Option<i32>) -> Element {
    let column = |title: &'static str, allowed_event_types: &[EventType]| rsx!(
        div {
            class: "column is-one-quarter is-centered"
            SelectableList {
                title: title,
                items: events
                    .map_loaded(|es| es
                        .into_iter()
                        .filter(|e| allowed_event_types.contains(e.r#type).collect())),
                is_selected: |event| Some(event.id) == selected_id,
                on_select: |event| replace_route(Route::Events { id: Some(event.id), tab: None }),
                render: |event| rsx!(
                    EventRow {
                        event: event,
                    }
                ),
                message_if_empty: "No events here, misster."
            }
        }
    );
  
    cx.render(rsx!(
        Columns {
            {column("Volunteer", &["Volunteer Gig"])}
            {column("Rehearsal", &["Rehearsal", "Sectional"])}
            {column("Tutti", &["Tutti Gig"])}
            {column("Ombuds", &["Ombuds", "Other"])}
        }
    ))
}

#[inline_props]
pub fn EventRow(cx: Scope, event: &Event) -> Element {
    cx.render(rsx!{
        td {
            style: "text-align: center"
            AttendanceIcon {
                event: event
            }
        }
        td {
            {simple_date_formatted(event.call_time)}
        }
        td {
            {event.name}
        }
    })
}

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
