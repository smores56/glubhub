import React, { useState, useEffect, useCallback } from "react";
import {
  RemoteData,
  loading,
  notSentYet,
  resultToRemote,
  sending,
  loaded,
  resultToSubmissionState,
  isLoaded
} from "state/types";
import { DocumentLink, emptyDocumentLink } from "state/models";
import { get, post, deleteRequest } from "utils/request";
import { Title, Box } from "components/Basics";
import { TextInput, stringType } from "components/Forms";
import { Button, DeleteButton } from "components/Buttons";
import { RemoteContent, SubmissionStateBox } from "components/Complex";

export const DocumentLinks: React.FC = () => {
  const [links, updateLinks] = useState<RemoteData<DocumentLink[]>>(loading);
  const [newLink, updateNewLink] = useState<DocumentLink>(emptyDocumentLink);
  const [state, setState] = useState(notSentYet);

  const updateLink = useCallback(
    async (index: number, link: DocumentLink) => {
      if (!isLoaded(links)) return;

      setState(sending);
      const update = await post(`google_docs/${links.data[index].name}`, link);

      setState(resultToSubmissionState(update));
      if (update.successful) {
        updateLinks(loaded(links.data.map((l, i) => (i === index ? link : l))));
      }
    },
    [links, setState, updateLinks]
  );

  const deleteLink = useCallback(
    async (index: number) => {
      if (!isLoaded(links)) return;

      const link = links.data[index];
      if (!link) return;

      setState(sending);
      const result = await deleteRequest(`google_docs/${link.name}`);

      setState(resultToSubmissionState(result));
      if (result.successful) {
        updateLinks(loaded(links.data.filter((_, i) => i !== index)));
      }
    },
    [links, setState, updateLinks]
  );

  const createLink = useCallback(async () => {
    if (!isLoaded(links) || !newLink.name || !newLink.url) return;

    setState(sending);
    const result = await post(`google_docs`, newLink);

    setState(resultToSubmissionState(result));
    if (result.successful) {
      updateLinks(loaded([...links.data, newLink]));
      updateNewLink(emptyDocumentLink);
    }
  }, [links, newLink, setState, updateLinks, updateNewLink]);

  useEffect(() => {
    const loadLinks = async () => {
      const links = await get<DocumentLink[]>(`google_docs`);
      updateLinks(resultToRemote(links));
    };

    loadLinks();
  }, [updateLinks]);

  return (
    <>
      <Title>Document Links</Title>
      <Box>
        <RemoteContent
          data={links}
          render={links => (
            <table style={{ borderSpacing: "5px", borderCollapse: "separate" }}>
              {links.map((link, index) => (
                <tr key={link.name}>
                  <td style={{ paddingRight: "10px" }}>
                    <span
                      style={{
                        display: "inline-block",
                        verticalAlign: "middle"
                      }}
                    >
                      {link.name}
                    </span>
                  </td>
                  <td>
                    <TextInput
                      type={stringType}
                      value={link.url}
                      onInput={url => updateLink(index, { ...link, url })}
                      placeholder="URL"
                    />
                  </td>
                  <td>
                    <span
                      style={{
                        display: "inline-block",
                        verticalAlign: "middle"
                      }}
                    >
                      <DeleteButton click={() => deleteLink(index)} />
                    </span>
                  </td>
                </tr>
              ))}
              <tr>
                <td>
                  <b>New</b>
                </td>
              </tr>
              <NewLinkRow
                newLink={newLink}
                update={updateNewLink}
                create={createLink}
              />
            </table>
          )}
        />
        <SubmissionStateBox state={state} />
      </Box>
    </>
  );
};

interface NewLinkRowProps {
  newLink: DocumentLink;
  create: () => void;
  update: (link: DocumentLink) => void;
}

const NewLinkRow: React.FC<NewLinkRowProps> = ({ newLink, update, create }) => (
  <tr>
    <td>
      <TextInput
        type={stringType}
        value={newLink.name}
        onInput={name => update({ ...newLink, name })}
        placeholder="Name"
      />
    </td>
    <td>
      <TextInput
        type={stringType}
        value={newLink.url}
        onInput={url => update({ ...newLink, url })}
        placeholder="URL"
      />
    </td>
    <td>
      <Button onClick={create}>sí</Button>
    </td>
  </tr>
);
