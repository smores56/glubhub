import React, { useState, useContext, useEffect, useCallback } from "react";
import {
  GlubEvent,
  EventAttendee,
  UpdatedCarpool,
  EventCarpool,
  Member
} from "state/models";
import {
  loading,
  RemoteData,
  loaded,
  errorLoading,
  notSentYet,
  sending,
  errorSending,
  isLoaded,
  isSending,
  failedToSend
} from "state/types";
import {
  Section,
  Container,
  Title,
  Columns,
  Column,
  Box
} from "components/Basics";
import {
  CarpoolPartialTable,
  EditCarpoolSelection,
  CarpoolRow
} from "./Carpools";
import ErrorBox from "components/ErrorBox";
import { collect3, get, post } from "utils/request";
import { GlubHubContext, useGlubRoute } from "utils/context";
import { routeEvents, eventCarpools } from "state/route";
import { LinkButton, Button } from "components/Buttons";
import { RemoteContent } from "components/Complex";
import { Table } from "components/Table";

interface CarpoolData {
  event: GlubEvent;
  attendance: EventAttendee[];
  carpools: UpdatedCarpool[];
}

export const EditCarpools: React.FC<{ eventId: number }> = ({ eventId }) => {
  const { members } = useContext(GlubHubContext);
  const { goToRoute } = useGlubRoute();

  const [data, setData] = useState<RemoteData<CarpoolData>>(loading);
  const [selected, setSelected] = useState<string[]>([]);
  const [updateState, setUpdateState] = useState(notSentYet);

  const getSelectedIfAllUnassigned = useCallback(():
    | [CarpoolData, Member[]]
    | null => {
    if (!isLoaded(data) || !selected.length) {
      return null;
    }

    const membersLeft = remainingMembers(members, data.data.carpools);
    const selectedMembers = selected.map(email =>
      membersLeft.find(member => member.email === email)
    );

    if (selectedMembers.every(m => !!m)) {
      return [data.data, selectedMembers as Member[]];
    } else {
      return null;
    }
  }, [data, selected, members]);

  const selectMember = useCallback(
    (email: string) => {
      if (selected.includes(email)) {
        setSelected(selected.filter(s => s !== email));
      } else {
        setSelected([...selected, email]);
      }
    },
    [selected, setSelected]
  );

  // const selectEmptyCarpool;

  const moveBackToUnassigned = useCallback(() => {
    if (!isLoaded(data) || !selected.length) return;

    setData(
      loaded({
        ...data.data,
        carpools: data.data.carpools
          .map(c => ({
            driver: c.driver,
            passengers: c.passengers.filter(p =>
              selected.every(s => s !== p.email)
            )
          }))
          .filter(c => selected.every(s => s !== c.driver.email))
      })
    );
    setSelected([]);
  }, [data, selected, setData, setSelected]);

  const addNewCarpool = useCallback(() => {
    const allUnassigned = getSelectedIfAllUnassigned();
    if (!allUnassigned) return;

    const [loadedData, selectedMembers] = allUnassigned;
    const driver = selectedMembers[0]!;
    const passengers = selectedMembers.slice(1) as Member[];

    setSelected([]);
    setData(
      loaded({
        ...loadedData,
        carpools: [...loadedData.carpools, { driver, passengers }]
      })
    );
  }, [setData, setSelected, getSelectedIfAllUnassigned]);

  const updateCarpools = useCallback(async () => {
    if (!isLoaded(data)) return;

    setUpdateState(sending);
    const body = data.data.carpools.map(c => ({
      driver: c.driver.email,
      passengers: c.passengers.map(p => p.email)
    }));
    const update = await post(`events/${eventId}/carpools`, body);

    if (update.successful) {
      goToRoute(routeEvents(eventId, eventCarpools));
    } else {
      setUpdateState(errorSending(update.error));
    }
  }, [data, setUpdateState, eventId, goToRoute]);

  useEffect(() => {
    const loadData = async () => {
      const eventUrl = `events/${eventId}`;
      const requests = await collect3(
        get<GlubEvent>(eventUrl),
        get<EventAttendee[]>(eventUrl + "/see_whos_attending"),
        get<EventCarpool[]>(eventUrl + "/carpools")
      );

      if (requests.successful) {
        const [event, attendance, carpools] = requests.data;
        setData(
          loaded({ event, attendance, carpools: cleanupCarpools(carpools) })
        );
      } else {
        setData(errorLoading(requests.error));
      }
    };

    loadData();
  }, [eventId, setData]);

  const selection: EditCarpoolSelection = {
    selected,
    select: selectMember,
    selectEmptyCarpool: () => {} // TODO
  };

  return (
    <Section>
      <Container>
        <RemoteContent
          data={data}
          render={data => (
            <>
              <Title>Carpools for {data.event.name}</Title>
              <Columns>
                <Column>
                  <Box>
                    <RemainingMemberTable
                      data={data}
                      selection={selection}
                      moveBackToUnassigned={moveBackToUnassigned}
                    />
                  </Box>
                </Column>
                <Column>
                  <Box>
                    <div style={{ width: "100%", paddingBottom: "10px" }}>
                      <LinkButton
                        route={routeEvents(eventId, eventCarpools)}
                        className="is-pulled-left"
                      >
                        Cancel
                      </LinkButton>
                      <Button
                        color="is-primary"
                        className="is-pulled-right"
                        loading={isSending(updateState)}
                        onClick={updateCarpools}
                      >
                        Update Carpools
                      </Button>
                      {failedToSend(updateState) && (
                        <ErrorBox error={updateState.error} />
                      )}
                    </div>
                    <Table style={{ width: "100%" }}>
                      {data.carpools.map(carpool => (
                        <CarpoolPartialTable
                          carpool={carpool}
                          event={data.event}
                          includeIcon={true}
                          selection={selection}
                        />
                      ))}
                    </Table>
                    <Button fullwidth onClick={addNewCarpool}>
                      Pick a driver and then click here to add new carpool
                    </Button>
                  </Box>
                </Column>
              </Columns>
            </>
          )}
        />
      </Container>
    </Section>
  );
};

interface RemainingMemberTableProps {
  data: CarpoolData;
  selection: EditCarpoolSelection;
  moveBackToUnassigned: () => void;
}

const RemainingMemberTable: React.FC<RemainingMemberTableProps> = ({
  data,
  selection,
  moveBackToUnassigned
}) => {
  const { members } = useContext(GlubHubContext);
  const membersLeft = remainingMembers(members, data.carpools);

  if (!membersLeft.length) {
    return (
      <div onClick={moveBackToUnassigned}>
        <i>That's everyone!</i>
      </div>
    );
  }

  return (
    <Table>
      <tbody>
        {membersLeft.map(member => (
          <CarpoolRow
            member={member}
            event={{ ...data.event, attendance: null }}
            selection={selection}
          />
        ))}
      </tbody>
    </Table>
  );
};

const remainingMembers = (
  members: Member[],
  carpools: UpdatedCarpool[]
): Member[] =>
  members.filter(
    member => !carpools.some(c => memberInCarpool(member.email, c))
  );

const cleanupCarpools = (carpools: EventCarpool[]): UpdatedCarpool[] =>
  carpools.map(c => ({
    driver: c.driver,
    passengers: c.passengers.filter(p => p.email !== c.driver.email)
  }));

const memberInCarpool = (email: string, carpool: UpdatedCarpool) =>
  carpool.driver.email === email ||
  carpool.passengers.some(p => p.email === email);

// type Msg
//     | ClickUnassignedMember Member
//     | ClickEmptyUnassignedMemberList
//     | ClickDriver UpdatedCarpool
//     | ClickPassenger UpdatedCarpool Member
//     | ClickEmptyPassengerList UpdatedCarpool
//     | AddNewCarpool
//     | SaveCarpools
//     | OnSaveCarpools (GreaseResult ())

//         ClickUnassignedMember member ->
//             case model.selection of
//                 Driver carpool ->
//                     ( unassignCarpoolDriver model carpool, Cmd.none )

//                 Passengers carpool passengers ->
//                     ( unassignCarpoolPassengers model carpool passengers, Cmd.none )

//                 UnassignedMembers members ->
//                     if members |> List.any (\m -> m.email == member.email) then
//                         ( { model | selection = UnassignedMembers (members |> List.filter (\m -> m.email /= member.email)) }, Cmd.none )

//                     else
//                         ( { model | selection = UnassignedMembers (members ++ [ member ]) }, Cmd.none )

//         ClickEmptyUnassignedMemberList ->
//             case model.selection of
//                 Driver carpool ->
//                     ( unassignCarpoolDriver model carpool, Cmd.none )

//                 Passengers carpool passengers ->
//                     ( unassignCarpoolPassengers model carpool passengers, Cmd.none )

//                 UnassignedMembers _ ->
//                     ( model, Cmd.none )

//         ClickDriver carpool ->
//             case model.selection of
//                 Driver otherCarpool ->
//                     let
//                         carpoolMapper c =
//                             if c.driver.email == carpool.driver.email then
//                                 { c | driver = otherCarpool.driver }

//                             else if c.driver.email == otherCarpool.driver.email then
//                                 { c | driver = carpool.driver }

//                             else
//                                 c
//                     in
//                     ( updateCarpoolsAndClearSelection model (List.map carpoolMapper), Cmd.none )

//                 Passengers otherCarpool passengers ->
//                     if otherCarpool.driver.email == carpool.driver.email then
//                         ( model, Cmd.none )

//                     else
//                         case passengers |> uncons of
//                             Just ( firstPassenger, [] ) ->
//                                 let
//                                     carpoolMapper c =
//                                         if c.driver.email == carpool.driver.email then
//                                             { c
//                                                 | driver = firstPassenger
//                                                 , passengers =
//                                                     c.passengers
//                                                         |> List.filter (\p -> p.email /= firstPassenger.email)
//                                             }

//                                         else
//                                             c
//                                 in
//                                 ( updateCarpoolsAndClearSelection model (List.map carpoolMapper), Cmd.none )

//                             _ ->
//                                 ( model, Cmd.none )

//                 UnassignedMembers members ->
//                     if List.isEmpty members then
//                         ( { model | selection = Driver carpool }, Cmd.none )

//                     else
//                         case members |> uncons of
//                             Just ( firstMember, [] ) ->
//                                 let
//                                     carpoolMapper c =
//                                         if c.driver.email == carpool.driver.email then
//                                             { c | driver = firstMember }

//                                         else
//                                             c
//                                 in
//                                 ( updateCarpoolsAndClearSelection model (List.map carpoolMapper), Cmd.none )

//                             _ ->
//                                 ( model, Cmd.none )

//         ClickPassenger carpool passenger ->
//             case model.selection of
//                 Driver otherCarpool ->
//                     if List.isEmpty otherCarpool.passengers then
//                         ( updateCarpoolsAndClearSelection model
//                             (List.concatMap
//                                 (\c ->
//                                     if c.driver.email == otherCarpool.driver.email then
//                                         []

//                                     else if c.driver.email == carpool.driver.email then
//                                         [ { c | passengers = c.passengers ++ [ otherCarpool.driver ] } ]

//                                     else
//                                         [ c ]
//                                 )
//                             )
//                         , Cmd.none
//                         )

//                     else
//                         ( model, Cmd.none )

//                 Passengers otherCarpool passengers ->
//                     if otherCarpool.driver.email == carpool.driver.email then
//                         if passengers |> List.any (\p -> p.email == passenger.email) then
//                             ( { model | selection = Passengers otherCarpool (passengers |> List.filter (\p -> p.email /= passenger.email)) }, Cmd.none )

//                         else
//                             ( { model | selection = Passengers otherCarpool (passengers ++ [ passenger ]) }, Cmd.none )

//                     else
//                         ( updateCarpoolsAndClearSelection model
//                             (List.map
//                                 (\c ->
//                                     if c.driver.email == carpool.driver.email then
//                                         { c | passengers = c.passengers ++ passengers }

//                                     else if c.driver.email == otherCarpool.driver.email then
//                                         { c | passengers = c.passengers |> List.filter (\p -> passengers |> List.all (\cp -> cp.email /= p.email)) }

//                                     else
//                                         c
//                                 )
//                             )
//                         , Cmd.none
//                         )

//                 UnassignedMembers members ->
//                     if List.isEmpty members then
//                         ( { model | selection = Passengers carpool [ passenger ] }, Cmd.none )

//                     else
//                         ( updateCarpoolsAndClearSelection model
//                             (List.map
//                                 (\c ->
//                                     if c.driver.email == carpool.driver.email then
//                                         { c | passengers = c.passengers ++ members }

//                                     else
//                                         c
//                                 )
//                             )
//                         , Cmd.none
//                         )

//         ClickEmptyPassengerList carpool ->
//             case model.selection of
//                 Driver otherCarpool ->
//                     if List.isEmpty otherCarpool.passengers then
//                         ( updateCarpoolsAndClearSelection model
//                             (List.concatMap
//                                 (\c ->
//                                     if c.driver.email == otherCarpool.driver.email then
//                                         []

//                                     else if c.driver.email == carpool.driver.email then
//                                         [ { c | passengers = c.passengers ++ [ otherCarpool.driver ] } ]

//                                     else
//                                         [ c ]
//                                 )
//                             )
//                         , Cmd.none
//                         )

//                     else
//                         ( model, Cmd.none )

//                 Passengers otherCarpool passengers ->
//                     ( updateCarpoolsAndClearSelection model
//                         (List.map
//                             (\c ->
//                                 if c.driver.email == carpool.driver.email then
//                                     { c | passengers = c.passengers ++ passengers }

//                                 else if c.driver.email == otherCarpool.driver.email then
//                                     { c | passengers = c.passengers |> List.filter (\p -> passengers |> List.all (\cp -> cp.email /= p.email)) }

//                                 else
//                                     c
//                             )
//                         )
//                     , Cmd.none
//                     )

//                 UnassignedMembers members ->
//                     ( updateCarpoolsAndClearSelection model
//                         (List.map
//                             (\c ->
//                                 if c.driver.email == carpool.driver.email then
//                                     { c | passengers = c.passengers ++ members }

//                                 else
//                                     c
//                             )
//                         )
//                     , Cmd.none
//                     )

//         AddNewCarpool ->
//             ( addNewCarpool model, Cmd.none )

// unassignCarpoolPassengers : Model -> UpdatedCarpool -> List Member -> Model
// unassignCarpoolPassengers model carpool passengers =
//     let
//         mapCarpool givenCarpool =
//             if givenCarpool.driver.email == carpool.driver.email then
//                 { givenCarpool | passengers = givenCarpool.passengers |> filterPassengers }

//             else
//                 givenCarpool

//         filterPassengers =
//             List.filter (\p -> passengers |> List.all (\cp -> cp.email /= p.email))
//     in
//     updateCarpoolsAndClearSelection model (List.map mapCarpool)

// unassignCarpoolDriver : Model -> UpdatedCarpool -> Model
// unassignCarpoolDriver model carpool =
//     if List.isEmpty carpool.passengers then
//         let
//             mapCarpools =
//                 List.filter (\c -> c.driver.email /= carpool.driver.email)
//         in
//         updateCarpoolsAndClearSelection model mapCarpools

//     else
//         model

// updateCarpoolsAndClearSelection : Model -> (List UpdatedCarpool -> List UpdatedCarpool) -> Model
// updateCarpoolsAndClearSelection model carpoolsMapper =
//     let
//         mapData =
//             mapLoaded
//                 (\data ->
//                     { data
//                         | carpools = data.carpools |> carpoolsMapper
//                     }
//                 )
//     in
//     { model
//         | selection = UnassignedMembers []
//         , data = model.data |> mapData
//     }

// addNewCarpool : Model -> Model
// addNewCarpool model =
//     case model.selection of
//         UnassignedMembers members ->
//             case members |> uncons of
//                 Just ( firstMember, [] ) ->
//                     updateCarpoolsAndClearSelection model
//                         (\carpools ->
//                             carpools
//                                 ++ [ { id = Nothing
//                                      , driver = firstMember
//                                      , passengers = []
//                                      }
//                                    ]
//                         )

//                 _ ->
//                     model

//         Passengers carpool passengers ->
//             case passengers |> uncons of
//                 Just ( firstPassenger, [] ) ->
//                     updateCarpoolsAndClearSelection model
//                         (\carpools ->
//                             (carpools
//                                 |> List.map
//                                     (\c ->
//                                         if c.driver.email == carpool.driver.email then
//                                             { c | passengers = c.passengers |> List.filter (\p -> p.email /= firstPassenger.email) }

//                                         else
//                                             c
//                                     )
//                             )
//                                 ++ [ { id = Nothing
//                                      , driver = firstPassenger
//                                      , passengers = []
//                                      }
//                                    ]
//                         )

//                 _ ->
//                     model

//         Driver carpool ->
//             model

// collectSelectedMembers : List Member -> List String -> List Member
// collectSelectedMembers members emails =
//     emails
//         |> List.map (\email -> members |> List.Extra.find (\member -> email == member.email))
//         |> List.concatMap (\maybeMember -> maybeMember |> Maybe.map List.singleton |> Maybe.withDefault [])

// allMembersAreNotInCarpools : CarpoolData -> List String -> Bool
// allMembersAreNotInCarpools data selection =
//     not
//         (selection
//             |> List.any
//                 (\email -> data.carpools |> List.any (memberInCarpool email))
//         )

// memberInCarpool : String -> UpdatedCarpool -> Bool
// memberInCarpool email carpool =
//     (carpool.driver.email == email)
//         || (carpool.passengers |> List.any (\passenger -> passenger.email == email))

// remainingMembers : List UpdatedCarpool -> List Member -> List Member
// remainingMembers carpools members =
//     let
//         carpoolEmails =
//             carpools
//                 |> List.concatMap
//                     (\carpool ->
//                         carpool.driver.email :: (carpool.passengers |> List.map .email)
//                     )
//     in
//     members |> List.filter (\member -> carpoolEmails |> List.all ((/=) member.email))

// findAttendance : CarpoolData -> String -> Maybe SimpleAttendance
// findAttendance data email =
//     data.attendance |> find (\attendance -> attendance.member.email == email) |> Maybe.map .attendance
