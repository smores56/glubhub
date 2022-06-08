import React, { useState, useCallback, FormEvent } from "react";
import { Song, SongMode, SongLink } from "state/models";
import {
  notSentYet,
  sending,
  resultToSubmissionState,
  isSending,
  failedToSend
} from "state/types";
import {
  TextInput,
  stringType,
  SelectInput,
  pitchType,
  songModeType,
  CheckboxInput,
  TextareaInput,
  FileInput
} from "components/Forms";
import { ALL_PITCHES } from "state/constants";
import { Divider } from "components/Basics";
import {
  post,
  deleteRequest,
  postReturning,
  NewId,
  chain,
  get,
  GlubResponseType
} from "utils/request";
import { SongLinkButton } from "./Links";
import { SubmitButton, BackButton } from "components/Buttons";
import ErrorBox from "components/ErrorBox";
import { fileToBase64 } from "utils/helpers";
import { useGlubRoute } from "utils/context";
import { routeRepertoire, repertoireDetails } from "state/route";
import { SubmissionStateBox } from "components/Complex";

interface EditProps {
  song: Song;
  propagateUpdate: (song: Song) => void;
}

interface NewFileLink {
  name: string;
  file: File | null;
}

interface NewUrlLink {
  name: string;
  url: string;
}

const emptyFileLink: NewFileLink = {
  name: "",
  file: null
};

const emptyUrlLink: NewUrlLink = {
  name: "",
  url: ""
};

export const Edit: React.FC<EditProps> = ({ song, propagateUpdate }) => {
  const { replaceRoute } = useGlubRoute();

  const [state, setState] = useState(notSentYet);

  const updateSong = useCallback(
    async (song: Song) => {
      propagateUpdate(song);

      setState(sending);
      const result = await post(`repertoire/${song.id}`, song);
      setState(resultToSubmissionState(result));
    },
    [setState, propagateUpdate]
  );

  const deleteLink = useCallback(
    async (link: SongLink) => {
      propagateUpdate({
        ...song,
        links: song.links?.map(section => ({
          ...section,
          links: section.links.filter(l => l.id !== link.id)
        }))
      });

      setState(sending);
      const result = await deleteRequest(`repertoire/links/${link.id}`);
      setState(resultToSubmissionState(result));
    },
    [setState, propagateUpdate, song]
  );

  return (
    <>
      <BackButton
        content="finish editing"
        click={() => replaceRoute(routeRepertoire(song.id, repertoireDetails))}
      />
      <h2 className="title is-4" style={{ textAlign: "center" }}>
        Edit
      </h2>
      <h3 className="subtitle is-6" style={{ textAlign: "center" }}>
        {song.title}
      </h3>

      <TextInput
        type={stringType}
        value={song.title}
        onInput={title => updateSong({ ...song, title })}
        title="Name of song"
        placeholder="Happy Birthday in 12/17"
        required
      />
      <SelectInput
        type={pitchType}
        values={[null, ...ALL_PITCHES]}
        selected={song.key}
        onInput={key => updateSong({ ...song, key })}
        title="Tonic"
      />
      <SelectInput<SongMode | null>
        type={songModeType}
        values={[null, "Major", "Minor"]}
        selected={song.mode}
        onInput={mode => updateSong({ ...song, mode })}
        title="Mode"
      />
      <SelectInput
        type={pitchType}
        values={[null, ...ALL_PITCHES]}
        selected={song.startingPitch}
        onInput={startingPitch => updateSong({ ...song, startingPitch })}
        title="Starting Pitch (if different)"
      />
      <CheckboxInput
        content="Current Repertoire"
        checked={song.current}
        onChange={current => updateSong({ ...song, current })}
      />
      <TextareaInput
        value={song.info || ""}
        onInput={info => updateSong({ ...song, info })}
        title="Comments"
        placeholder="There are no soloists, communism wins!"
      />
      <SubmissionStateBox state={state} />

      <ul style={{ listStyle: "none", paddingBottom: "10px" }}>
        <EditFileType
          typeName="Sheet Music"
          song={song}
          propagateUpdate={propagateUpdate}
          deleteLink={deleteLink}
        />
        <EditFileType
          typeName="MIDIs"
          song={song}
          propagateUpdate={propagateUpdate}
          deleteLink={deleteLink}
        />
        <NewPerformanceSection
          song={song}
          propagateUpdate={propagateUpdate}
          deleteLink={deleteLink}
        />
      </ul>
    </>
  );
};

interface EditFileTypeProps {
  song: Song;
  typeName: string;
  deleteLink: (link: SongLink) => void;
  propagateUpdate: (song: Song) => void;
}

const EditFileType: React.FC<EditFileTypeProps> = ({
  song,
  typeName,
  deleteLink,
  propagateUpdate
}) => {
  const [newFile, updateNewFile] = useState(emptyFileLink);
  const [state, setState] = useState(notSentYet);

  const addLinkToSong = useCallback(async (event: FormEvent) => {
    event.preventDefault();

    if (!newFile.name || !newFile.file) return;
    setState(sending);

    const content = await fileToBase64(newFile.file);
    const body = {
      type: typeName,
      name: newFile.name,
      target: {
        path: newFile.file.name,
        content
      }
    };
    const result = await createAndGetNewLink(body, song.id);

    setState(resultToSubmissionState(result));
    if (result.successful) {
      propagateUpdate({
        ...song,
        links: song.links?.map(section =>
          section.name === typeName
            ? { ...section, links: [...section.links, result.data] }
            : section
        )
      });
      updateNewFile(emptyFileLink);
    }
  }, [newFile, propagateUpdate, song, typeName]);

  return (
    <>
      <Divider content={typeName} />
      {song.links
        ?.find(section => section.name === typeName)
        ?.links.map(link => (
          <>
            <SongLinkButton link={link} onDelete={link => deleteLink(link)} />
            <br />
          </>
        )) || <br />}
      <form onSubmit={addLinkToSong}>
        <TextInput
          type={stringType}
          value={newFile.name}
          onInput={name => updateNewFile({ ...newFile, name })}
          title={`${typeName} Name`}
          placeholder="Happy Birthday - TTBB"
          required
        />
        <FileInput
          file={newFile.file}
          selectFile={file => updateNewFile({ ...newFile, file })}
          title={`${typeName} File`}
        />
        <SubmitButton loading={isSending(state)}>Add {typeName}</SubmitButton>
        {failedToSend(state) && <ErrorBox error={state.error} />}
      </form>
    </>
  );
};

interface NewPerformanceSectionProps {
  song: Song;
  deleteLink: (link: SongLink) => void;
  propagateUpdate: (song: Song) => void;
}

const NewPerformanceSection: React.FC<NewPerformanceSectionProps> = ({
  song,
  deleteLink,
  propagateUpdate
}) => {
  const [newPerformance, updateNewPerformance] = useState(emptyUrlLink);
  const [state, setState] = useState(notSentYet);

  const addPerformanceToSong = useCallback(async (event: FormEvent) => {
    event.preventDefault();
    setState(sending);

    const body = {
      type: "Performances",
      name: newPerformance.name,
      target: newPerformance.url
    };
    const result = await createAndGetNewLink(body, song.id);

    setState(resultToSubmissionState(result));
    if (result.successful) {
      propagateUpdate({
        ...song,
        links: song.links?.map(section =>
          section.name === "Performances"
            ? { ...section, links: [...section.links, result.data] }
            : section
        )
      });
      updateNewPerformance(emptyUrlLink);
    }
  }, [song, setState, propagateUpdate, updateNewPerformance, newPerformance]);

  return (
    <>
      <Divider content="Performances" />
      {song.links
        ?.find(section => section.name === "Performances")
        ?.links.map(link => (
          <>
            <SongLinkButton link={link} onDelete={deleteLink} />
          </>
        )) || <br />}

      <form onSubmit={addPerformanceToSong}>
        <TextInput
          type={stringType}
          value={newPerformance.name}
          onInput={name => updateNewPerformance({ ...newPerformance, name })}
          title="Performance name"
          placeholder="Happy Birthday, live from New York!"
          required
        />
        <TextInput
          type={stringType}
          value={newPerformance.url}
          onInput={url => updateNewPerformance({ ...newPerformance, url })}
          title="Performance URL"
          prefix="https://youtu.be/"
          placeholder="dtER80sOjX4"
          required
        />
        <SubmitButton loading={isSending(state)}>Add performance</SubmitButton>
        {failedToSend(state) && <ErrorBox error={state.error} />}
      </form>
    </>
  );
};

const createAndGetNewLink = <T extends any>(
  body: T,
  songId: number
): Promise<GlubResponseType<SongLink>> =>
  chain(
    postReturning<typeof body, NewId>(`repertoire/${songId}/links`, body),
    ({ id }) => get<SongLink>(`repertoire/links/${id}`)
  );
