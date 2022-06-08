import React, { useState, useCallback, useRef } from "react";
import { MeetingMinutes } from "state/models";
import {
  notSentYet,
  SubmissionState,
  sending,
  resultToSubmissionState,
  isSending,
  failedToSend
} from "state/types";
import { post, deleteRequest } from "utils/request";
import { RequiresPermission } from "components/Complex";
import { editMinutes } from "state/permissions";
import ErrorBox from "components/ErrorBox";
import DeleteModal from "components/DeleteModal";
import { Editor } from "@tinymce/tinymce-react";
import { ButtonGroup, Button } from "components/Buttons";
import { TextInput, stringType, Control } from "components/Forms";

interface EditMinutesProps {
  minutes: MeetingMinutes;
  update: (minutes: MeetingMinutes) => void;
  saved: (minutes: MeetingMinutes) => void;
  deleted: (minutes: MeetingMinutes) => void;
}

export type Visibility = "public" | "private";

export const EditMinutes: React.FC<EditMinutesProps> = ({
  minutes,
  update,
  saved,
  deleted
}) => {
  const [saveState, setSaveState] = useState(notSentYet);
  const [deleteState, setDeleteState] = useState<SubmissionState | null>(null);
  const [visibility, setVisibility] = useState<Visibility>("private");

  const setContent = useRef((_content: string) => {});

  const updateVisibility = useCallback(
    (newVisibility: Visibility) => {
      setVisibility(newVisibility);
      setContent.current(
        (newVisibility === "public" ? minutes.public : minutes.private) || ""
      );
    },
    [setVisibility, setContent, minutes]
  );

  const updateMinutes = useCallback(async () => {
    setSaveState(sending);
    const result = await post(`meeting_minutes/${minutes.id}`, minutes);

    setSaveState(resultToSubmissionState(result));
    if (result.successful) {
      saved(minutes);
    }
  }, [setSaveState, saved, minutes]);

  const deleteMinutes = useCallback(async () => {
    setDeleteState(sending);
    const result = await deleteRequest(`meeting_minutes/${minutes.id}`);

    setDeleteState(resultToSubmissionState(result));
    if (result.successful) {
      deleted(minutes);
    }
  }, [setDeleteState, minutes, deleted]);

  return (
    <RequiresPermission permission={editMinutes}>
      <p>
        <EditHeader
          minutes={minutes}
          visibility={visibility}
          updateVisibility={updateVisibility}
          saveState={saveState}
          save={updateMinutes}
          tryToDelete={() => setDeleteState(notSentYet)}
          update={update}
        />
      </p>
      <br />
      <p>
        <MinutesEditor
          minutes={minutes}
          visibility={visibility}
          update={update}
          setContent={setContent}
        />
      </p>
      {deleteState && (
        <DeleteMinutesModal
          state={deleteState}
          cancel={() => setDeleteState(null)}
          confirm={deleteMinutes}
        />
      )}
    </RequiresPermission>
  );
};

interface DeleteMinutesModalProps {
  state: SubmissionState;
  cancel: () => void;
  confirm: () => void;
}

const DeleteMinutesModal: React.FC<DeleteMinutesModalProps> = ({
  state,
  cancel,
  confirm
}) => (
  <DeleteModal
    title="Delete this meeting?"
    cancel={cancel}
    confirm={confirm}
    state={state}
  >
    Are you sure you want to delete these meeting minutes? You can't undo that.
  </DeleteModal>
);

interface MinutesEditorProps {
  minutes: MeetingMinutes;
  visibility: Visibility;
  update: (minutes: MeetingMinutes) => void;
  setContent: React.MutableRefObject<(content: string) => void>;
}

const MinutesEditor: React.FC<MinutesEditorProps> = ({
  minutes,
  visibility,
  update,
  setContent
}) => (
  <Editor
    apiKey="4tzzx51fsqy1vtwhpvkhb3t9t4jwyotr28qjbogls2yclw26"
    initialValue={
      (visibility === "private" ? minutes.private : minutes.public) || ""
    }
    init={{
      height: 500,
      setupEditor: (editor: any) => {
        setContent.current = (content: string) => {
          editor.setContent(content);
        };
      }
    }}
    onEditorChange={content =>
      update(
        visibility === "private"
          ? { ...minutes, private: content }
          : { ...minutes, public: content }
      )
    }
  />
);

interface EditHeaderProps {
  minutes: MeetingMinutes;
  visibility: Visibility;
  saveState: SubmissionState;
  save: () => void;
  tryToDelete: () => void;
  update: (minutes: MeetingMinutes) => void;
  updateVisibility: (visibility: Visibility) => void;
}

const EditHeader: React.FC<EditHeaderProps> = ({
  minutes,
  visibility,
  updateVisibility,
  update,
  save,
  tryToDelete,
  saveState
}) => (
  <div className="field is-grouped is-grouped-centered is-fullwidth">
    <Control>
      <ButtonGroup connected>
        <Button
          onClick={() => updateVisibility("public")}
          color={visibility === "public" ? "is-primary" : undefined}
        >
          Public
        </Button>
        <Button
          onClick={() => updateVisibility("private")}
          color={visibility === "private" ? "is-primary" : undefined}
        >
          Private
        </Button>
      </ButtonGroup>
    </Control>

    <Control>
      <TextInput
        type={stringType}
        value={minutes.name}
        onInput={name => update({ ...minutes, name })}
        prefix="Title"
        placeholder="Secret Evil Meeting of Doom"
        required
        expanded
      />
    </Control>

    <Control>
      <ButtonGroup alignment="is-right">
        <Button
          onClick={save}
          color="is-primary"
          loading={isSending(saveState)}
        >
          Save
        </Button>
        <Button onClick={tryToDelete} color="is-danger">
          Delete
        </Button>
      </ButtonGroup>
    </Control>

    {failedToSend(saveState) && <ErrorBox error={saveState.error} />}
  </div>
);
