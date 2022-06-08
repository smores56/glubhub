import React, { useState, useEffect, useCallback } from "react";
import {
  RemoteData,
  loading,
  notSentYet,
  resultToRemote,
  sending,
  resultToSubmissionState,
  loaded,
  SubmissionState,
  isLoaded
} from "state/types";
import { Uniform, emptyUniform } from "state/models";
import { get, post, deleteRequest, postReturning, NewId } from "utils/request";
import { Title, Box } from "components/Basics";
import { TextInput, stringType, TextareaInput } from "components/Forms";
import DeleteModal from "components/DeleteModal";
import { DeleteButton, Button } from "components/Buttons";
import { RemoteContent, SubmissionStateBox } from "components/Complex";

export const Uniforms: React.FC = () => {
  const [uniforms, setUniforms] = useState<RemoteData<Uniform[]>>(loading);
  const [newUniform, updateNewUniform] = useState<Uniform>(emptyUniform);
  const [state, setState] = useState(notSentYet);
  const [uniformToDelete, setUniformToDelete] = useState<Uniform | null>(null);

  const updateUniform = useCallback(
    async (uniform: Uniform) => {
      setState(sending);

      const body = { name: uniform.name, description: uniform.description };
      const update = await post(`uniforms/${uniform.id}`, body);

      setState(resultToSubmissionState(update));
      if (update.successful && isLoaded(uniforms)) {
        setUniforms(
          loaded(uniforms.data.map(u => (u.id === uniform.id ? uniform : u)))
        );
      }
    },
    [setState, uniforms, setUniforms]
  );

  const deleteUniform = useCallback(
    async (uniform: Uniform) => {
      setState(sending);

      const result = await deleteRequest(`uniforms/${uniform.id}`);

      setState(resultToSubmissionState(result));
      if (result.successful && isLoaded(uniforms)) {
        setUniforms(loaded(uniforms.data.filter(u => u.id !== uniform.id)));
      }
    },
    [setState, uniforms, setUniforms]
  );

  const createUniform = useCallback(async () => {
    setState(sending);

    const body = { name: newUniform.name, description: newUniform.description };
    const result = await postReturning<typeof body, NewId>(`uniforms`, body);

    setState(resultToSubmissionState(result));
    if (result.successful && isLoaded(uniforms)) {
      setUniforms(
        loaded([...uniforms.data, { ...newUniform, id: result.data.id }])
      );
      updateNewUniform(emptyUniform);
    }
  }, [setState, uniforms, setUniforms, newUniform, updateNewUniform]);

  useEffect(() => {
    const loadUniforms = async () => {
      const result = await get<Uniform[]>(`uniforms`);
      setUniforms(resultToRemote(result));
    };

    loadUniforms();
  }, [setUniforms]);

  return (
    <div style={{ width: "100%" }}>
      <Title>Uniforms</Title>
      <Box>
        <RemoteContent
          data={uniforms}
          render={uniforms => (
            <table
              style={{
                width: "100%",
                borderSpacing: "5px",
                borderCollapse: "separate"
              }}
            >
              <tr>
                <td>
                  <b>Name</b>
                </td>
                <td>
                  <b>Description</b>
                </td>
              </tr>
              {uniforms.map(uniform => (
                <UniformRow
                  uniform={uniform}
                  update={updateUniform}
                  tryToDelete={setUniformToDelete}
                />
              ))}
              <tr>
                <td>
                  <b>New</b>
                </td>
              </tr>
              <NewUniformRow
                uniform={newUniform}
                update={updateNewUniform}
                create={createUniform}
              />
            </table>
          )}
        />
        <SubmissionStateBox state={state} />
        {uniformToDelete && (
          <DeleteUniformModal
            uniform={uniformToDelete}
            state={state}
            cancel={() => setUniformToDelete(null)}
            confirm={() => deleteUniform(uniformToDelete)}
          />
        )}
      </Box>
    </div>
  );
};

interface UniformRowProps {
  uniform: Uniform;
  update: (uniform: Uniform) => void;
  tryToDelete: (uniform: Uniform) => void;
}

export const UniformRow: React.FC<UniformRowProps> = ({
  uniform,
  update,
  tryToDelete
}) => (
  <tr>
    <td>
      <TextInput
        type={stringType}
        value={uniform.name}
        onInput={name => update({ ...uniform, name })}
        placeholder="Name"
      />
    </td>
    <td>
      <TextareaInput
        value={uniform.description || ""}
        onInput={description => update({ ...uniform, description })}
        placeholder="Description"
      />
    </td>
    <td>
      <span
        style={{
          display: "inline-block",
          verticalAlign: "middle"
        }}
      >
        <DeleteButton click={() => tryToDelete(uniform)} />
      </span>
    </td>
  </tr>
);

interface NewUniformRowProps {
  uniform: Uniform;
  create: () => void;
  update: (uniform: Uniform) => void;
}

const NewUniformRow: React.FC<NewUniformRowProps> = ({
  uniform,
  update,
  create
}) => (
  <tr>
    <td>
      <TextInput
        type={stringType}
        value={uniform.name}
        onInput={name => update({ ...uniform, name })}
        placeholder="Name"
      />
    </td>
    <td>
      <TextareaInput
        value={uniform.description || ""}
        onInput={description => update({ ...uniform, description })}
        placeholder="Description"
      />
    </td>
    <td>
      <Button color="is-primary" onClick={create}>
        Suit up.
      </Button>
    </td>
  </tr>
);

interface DeleteUniformModalProps {
  uniform: Uniform;
  state: SubmissionState;
  cancel: () => void;
  confirm: () => void;
}

const DeleteUniformModal: React.FC<DeleteUniformModalProps> = ({
  uniform,
  state,
  cancel,
  confirm
}) => (
  <DeleteModal
    title={`Delete uniform ${uniform.name}?`}
    cancel={cancel}
    confirm={confirm}
    state={state}
  >
    <>
      <p>Are you sure you want to delete the {uniform.name} uniform?</p>
      <p>
        <i>
          Note: all events that have this uniform will no longer have a uniform.
        </i>
      </p>
    </>
  </DeleteModal>
);
