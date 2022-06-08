import React, { useState, useEffect, useContext, useCallback, FormEvent } from "react";
import {
  SemesterTab,
  semesterChange,
  semesterEdit,
  semesterCreate,
  routeAdmin,
  adminSemesters
} from "state/route";
import {
  RemoteData,
  loading,
  notSentYet,
  resultToRemote,
  isSending,
  failedToSend,
  sending,
  resultToSubmissionState,
  SubmissionState,
  loaded
} from "state/types";
import { Semester } from "state/models";
import { hyphenDateFormatter, parseFormDateString } from "utils/datetime";
import { get, post } from "utils/request";
import { Title, Box, Column } from "components/Basics";
import {
  ButtonGroup,
  Button,
  LinkButton,
  SubmitButton,
  BackButton
} from "components/Buttons";
import {
  SelectInput,
  semesterType,
  TextInput,
  stringType,
  dateType,
  numberType
} from "components/Forms";
import { GlubHubContext, useGlubRoute } from "utils/context";
import ErrorBox from "components/ErrorBox";
import { RemoteContent, Modal, Sidebar } from "components/Complex";

export const Semesters: React.FC<{ tab: SemesterTab | null }> = ({ tab }) => {
  const [semesters, updateSemesters] = useState<RemoteData<Semester[]>>(
    loading
  );

  useEffect(() => {
    const loadSemesters = async () => {
      const result = await get<Semester[]>("semesters");
      updateSemesters(resultToRemote(result));
    };

    loadSemesters();
  }, [updateSemesters]);

  return (
    <>
      <Title>Edit the Semester</Title>
      <RemoteContent
        data={semesters}
        render={(semesters) => (
          <>
            <EditSemesterPrelude />
            <ButtonGroup alignment="is-centered">
              {[semesterChange, semesterEdit, semesterCreate].map(option => (
                <LinkButton
                  color="is-primary"
                  route={routeAdmin(adminSemesters(option))}
                >
                  {option.name}
                </LinkButton>
              ))}
            </ButtonGroup>
            <br />
            <TabContent
              tab={tab}
              semesters={semesters}
              updateSemesters={s => updateSemesters(loaded(s))}
            />
          </>
        )}
      />
    </>
  );
};

interface SemesterForm {
  name: string;
  startDate: string;
  endDate: string;
  gigRequirement: number | null;
}

const emptySemesterForm: SemesterForm = {
  name: "",
  startDate: "",
  endDate: "",
  gigRequirement: null
};

const formFromSemester = (semester: Semester): SemesterForm => ({
  name: semester.name,
  startDate: hyphenDateFormatter(semester.startDate),
  endDate: hyphenDateFormatter(semester.endDate),
  gigRequirement: semester.gigRequirement
});

const semesterJson = (form: SemesterForm) => ({
  name: form.name,
  startDate: parseFormDateString(form.startDate) || new Date().getTime(),
  endDate: parseFormDateString(form.endDate) || new Date().getTime(),
  gigRequirement: form.gigRequirement || 5
});

const EditSemesterPrelude: React.FC = () => (
  <Box>
    <p>
      This is a form that will allow you to add and edit semesters in the
      database. It will also change the current semester.
    </p>
    <br />
    <p>
      Changing the current semester will change the entire face of the website.
      Only stuff from the current semester is shown on the main website. In new
      semesters, every member's status is by default 'inactive' until they log
      in and confirm themself.
    </p>
    <br />
    <p>
      With great power comes great potential to screw everyone over. Use this
      feature wisely.
    </p>
    <br />
    <p>Now, pick your poison:</p>
  </Box>
);

interface TabContentProps {
  tab: SemesterTab | null;
  semesters: Semester[];
  updateSemesters: (semesters: Semester[]) => void;
}

const TabContent: React.FC<TabContentProps> = ({
  tab,
  semesters,
  updateSemesters
}) => {
  switch (tab?.route) {
    case "change":
      return <ChangeSemesterModal semesters={semesters} />;

    case "edit":
      return (
        <EditSemesterSidebar
          semesters={semesters}
          updateSemesters={updateSemesters}
        />
      );

    case "create":
      return (
        <CreateSemesterSidebar
          semesters={semesters}
          updateSemesters={updateSemesters}
        />
      );

    default:
      return <></>;
  }
};

interface ChangeSemesterModalProps {
  semesters: Semester[];
}

const ChangeSemesterModal: React.FC<ChangeSemesterModalProps> = ({
  semesters
}) => {
  const { currentSemester, updateCurrentSemester } = useContext(GlubHubContext);
  const { replaceRoute } = useGlubRoute();

  const [selected, setSelected] = useState(currentSemester);
  const [state, setState] = useState(notSentYet);

  const closeModal = useCallback(
    () => replaceRoute(routeAdmin(adminSemesters(null))),
    [replaceRoute]
  );

  const changeSemester = useCallback(async () => {
    if (!selected || selected.name === currentSemester?.name) return;

    setState(sending);
    const result = await post(`semesters/${selected.name}/set_current`, {});
    setState(resultToSubmissionState(result));

    if (result.successful) {
      updateCurrentSemester(selected);
      window.location.reload(true);
      closeModal();
    }
  }, [selected, currentSemester, updateCurrentSemester, closeModal]);

  return (
    <Modal close={closeModal}>
      <Column>
        <h2 className="subtitle is-2">
          Which semester do you want to switch to?
        </h2>
        <p>
          This will change everything. You really only want to do this at the
          beginning of a new semester. If it's not a solstice, then don't.
        </p>
        <br />
        <div className="field is-grouped is-grouped-centered">
          <SelectInput<Semester | null>
            type={semesterType(semesters)}
            values={semesters}
            selected={selected}
            onInput={selected => selected && setSelected(selected)}
          />
        </div>
        <br />
        <Button
          element="a"
          color="is-primary"
          className="is-pulled-left"
          loading={isSending(state)}
          onClick={changeSemester}
        >
          The ol' Glub Hub switcharoo
        </Button>
        <Button element="a" className="is-pulled-right" onClick={closeModal}>
          ABORT! ABORT!
        </Button>
        <br />
        {failedToSend(state) && <ErrorBox error={state.error} />}
      </Column>
    </Modal>
  );
};

interface CreateSemesterSidebarProps {
  semesters: Semester[];
  updateSemesters: (semesters: Semester[]) => void;
}

const CreateSemesterSidebar: React.FC<CreateSemesterSidebarProps> = ({
  semesters,
  updateSemesters
}) => {
  const { replaceRoute } = useGlubRoute();

  const [form, updateForm] = useState(emptySemesterForm);
  const [state, setState] = useState(notSentYet);

  const closeSidebar = useCallback(
    () => replaceRoute(routeAdmin(adminSemesters(null))),
    [replaceRoute]
  );

  const createSemester = useCallback(async (event: FormEvent) => {
    event.preventDefault();

    setState(sending);
    const newSemester = semesterJson(form);
    const result = await post(`semesters`, newSemester);

    setState(resultToSubmissionState(result));
    if (result.successful) {
      updateSemesters(
        [...semesters, { ...newSemester, current: false }].sort(
          (s1, s2) => s1.startDate - s2.startDate
        )
      );
      closeSidebar();
    }
  }, [setState, form, updateSemesters, semesters, closeSidebar]);

  return (
    <Sidebar
      data={loaded({})}
      close={closeSidebar}
      render={() => (
        <>
          <BackButton content="cancel" click={closeSidebar} />
          <div className="column" style={{ textAlign: "center" }}>
            <h2 className="subtitle is-2">Time marches on</h2>
            <p>
              Another day, another dollar. And also another semester. Make a new
              semester baby now, and switch over to it whenever you want to
              later, but before it turns 18.
            </p>
            <br />
            <EditSemesterForm
              form={form}
              update={updateForm}
              state={state}
              submit={createSemester}
              submitMessage="Break your water"
            />
          </div>
        </>
      )}
    />
  );
};

interface EditSemesterSidebarProps {
  semesters: Semester[];
  updateSemesters: (semesters: Semester[]) => void;
}

const EditSemesterSidebar: React.FC<EditSemesterSidebarProps> = ({
  semesters,
  updateSemesters
}) => {
  const { currentSemester } = useContext(GlubHubContext);
  const { replaceRoute } = useGlubRoute();

  const [form, updateForm] = useState(formFromSemester(currentSemester!));
  const [state, setState] = useState(notSentYet);

  const closeSidebar = useCallback(
    () => replaceRoute(routeAdmin(adminSemesters(null))),
    [replaceRoute]
  );

  const editSemester = useCallback(async (event: FormEvent) => {
    event.preventDefault();

    setState(sending);
    const editedSemester = semesterJson(form);
    const result = await post(`semesters`, editedSemester);

    setState(resultToSubmissionState(result));
    if (result.successful) {
      updateSemesters(
        semesters.map(s =>
          s.name === currentSemester?.name
            ? { ...editedSemester, current: true }
            : s
        )
      );
      closeSidebar();
    }
  }, [
    setState,
    form,
    currentSemester,
    updateSemesters,
    semesters,
    closeSidebar
  ]);

  return (
    <Sidebar
      data={loaded({})}
      close={closeSidebar}
      render={() => (
        <>
          <BackButton content="cancel" click={closeSidebar} />
          <div className="column" style={{ textAlign: "center" }}>
            <h2 className="subtitle is-2">Do it in pencil, not pen</h2>
            <p>
              Select the semester you want to make changes to, and then make the
              changes. You cannot edit the past, sorry.
            </p>
            <br />
            <EditSemesterForm
              form={form}
              update={updateForm}
              state={state}
              submit={editSemester}
              submitMessage="Do this please"
            />
          </div>
        </>
      )}
    />
  );
};

interface EditSemesterFormProps {
  form: SemesterForm;
  state: SubmissionState;
  submitMessage: string;
  submit: (event: FormEvent) => void;
  update: (form: SemesterForm) => void;
}

const EditSemesterForm: React.FC<EditSemesterFormProps> = ({
  form,
  state,
  submitMessage,
  submit,
  update
}) => (
    <form onSubmit={submit}>
      <Column narrow>
        <TextInput
          type={stringType}
          value={form.name}
          onInput={name => update({ ...form, name })}
          title="Semester Name"
          placeholder="Fall 20XX"
          required
        />
        <TextInput
          type={dateType}
          value={form.startDate}
          onInput={startDate => update({ ...form, startDate })}
          title="The first day of the rest of your life"
          required
        />
        <TextInput
          type={dateType}
          value={form.endDate}
          onInput={endDate => update({ ...form, endDate })}
          title="The last day of the rest of your life"
          required
        />
        <TextInput
          type={numberType}
          value={form.gigRequirement}
          onInput={gigRequirement => update({ ...form, gigRequirement })}
          title="Number of required volunteer gigs"
          placeholder="5"
          required
        />
        <br />
        <SubmitButton color="is-primary" loading={isSending(state)}>
          {submitMessage}
        </SubmitButton>
        <br />
        {failedToSend(state) && <ErrorBox error={state.error} />}
      </Column>
    </form>
  );
