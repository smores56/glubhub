import React, { useState, useCallback } from "react";
import {
  notSentYet,
  sending,
  errorSending,
  isSending,
  failedToSend
} from "state/types";
import { getToken } from "utils/helpers";
import { parseError, unknownError } from "state/error";
import { Column, Title, Box, Columns, Divider } from "components/Basics";
import { FileInput } from "components/Forms";
import { Button } from "components/Buttons";
import ErrorBox from "components/ErrorBox";
import CopyToClipboard from "react-copy-to-clipboard";

export const WebmasterTools: React.FC = () => {
  return (
    <>
      <Title>Webmaster Tools</Title>
      <Box>
        <Columns>
          <WebmasterFile
            title="API"
            uploadUrl="https://gleeclub.gatech.edu/cgi-bin/admin_tools/upload_api"
          />
          <Divider vertical />
          <WebmasterFile
            title="frontend"
            uploadUrl="https://gleeclub.gatech.edu/cgi-bin/api/upload_frontend"
          />
          <Divider vertical />
          <Column>
            <b>Copy your token:</b>
            <br />
            <br />
            <CopyToClipboard text={getToken() || ""}>
              <Button>Uno Tokeno</Button>
            </CopyToClipboard>
          </Column>
        </Columns>
      </Box>
    </>
  );
};

interface WebmasterFileProps {
  title: string;
  uploadUrl: string;
}

export const WebmasterFile: React.FC<WebmasterFileProps> = ({
  title,
  uploadUrl
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState(notSentYet);

  const upload = useCallback(async () => {
    if (!file) {
      alert("fam. upload a file.");
      return;
    }

    try {
      setState(sending);
      const resp = await fetch(uploadUrl, {
        method: "POST",
        headers: { token: getToken() || "" },
        body: file
      });

      if (resp.ok) {
        setState(notSentYet);
        setFile(null);
      } else {
        const error = await parseError(resp);
        setState(errorSending(error));
      }
    } catch {
      setState(errorSending(unknownError(0, "failed to make request")));
    }
  }, [file, uploadUrl, setState, setFile]);

  return (
    <Column>
      <FileInput
        file={file}
        selectFile={setFile}
        title={`Upload the ${title}:`}
      />
      <Button
        onClick={upload}
        loading={isSending(state)}
        style={{ marginTop: "10px" }}
      >
        Send it!
      </Button>
      {failedToSend(state) && <ErrorBox error={state.error} />}
    </Column>
  );
};
