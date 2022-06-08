import React, { useContext, useState, useCallback, FormEvent } from "react";
import { GlubHubContext } from "utils/context";
import { DeleteButton, Button, ButtonGroup, SubmitButton } from "./Buttons";
import { Enrollment } from "state/models";
import { Title4 } from "./Basics";
import {
  InputWrapper,
  TextInput,
  stringType,
  Control,
  SelectInput,
  sectionType
} from "./Forms";
import { post } from "utils/request";
import { Modal } from "./Complex";

export const ConfirmAccountHeader: React.FC = () => {
  const { user } = useContext(GlubHubContext);

  const [ignoreConfirm, setIgnoreConfirm] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const isActive = !!user?.enrollment;

  if (!user || isActive || ignoreConfirm) {
    return <> </>;
  }

  return (
    <section
      style={{ margin: "2em", marginBottom: "-1em", paddingTop: "40px" }}
    >
      <div className="notification is-info">
        <DeleteButton click={() => setIgnoreConfirm(true)} />
        <div style={{ width: "100%", display: "flex", alignItems: "center" }}>
          <div>
            Welcome! Feel free to browse the site, but if you're going to be
            active in Glee Club this semester, please confirm your account so we
            can get you into the system.
          </div>
          <div>
            <Button
              onClick={() => setConfirming(true)}
              color="is-info"
              inverted
              outlined
              style={{ margin: "0 2em" }}
            >
              Confirm
            </Button>
          </div>
        </div>
      </div>
      {confirming && <ConfirmAccountModal close={() => setConfirming(false)} />}
    </section>
  );
};

interface SemesterForm {
  location: string;
  onCampus: boolean;
  enrollment: Enrollment;
  section: string | null;
}

// TODO: add submission state to this modal

interface ConfirmAccountModalProps {
  close: () => void;
}

export const ConfirmAccountModal: React.FC<ConfirmAccountModalProps> = ({
  close
}) => {
  const { user, info, refreshAll } = useContext(GlubHubContext);

  const [form, updateForm] = useState<SemesterForm>({
    location: user?.location || "",
    onCampus: user ? !!user.onCampus : true,
    enrollment: "Class",
    section: info?.sections[0] || null
  });

  const confirmAccount = useCallback(async (event: FormEvent) => {
    event.preventDefault();

    const body = {
      ...form,
      section: form.section || "",
      conflicts: "",
      dietaryRestrictions: ""
    };

    const result = await post("members/confirm", body);
    if (result.successful) {
      close();
      refreshAll();
    }
  }, [form, close, refreshAll]);

  return (
    <Modal close={close}>
      <form onSubmit={confirmAccount}>
        <Title4>Confirm Your Account</Title4>
        <InputWrapper horizontal title="Location">
          <TextInput
            type={stringType}
            value={form.location}
            onInput={location => updateForm({ ...form, location })}
            placeholder="Glenn"
            required
          />
        </InputWrapper>
        <InputWrapper horizontal title=" ">
          <Control>
            <ButtonGroup connected>
              <Button
                element="a"
                color={form.onCampus ? "is-primary" : undefined}
                onClick={() => updateForm({ ...form, onCampus: true })}
              >
                On-campus
                </Button>
              <Button
                element="a"
                color={!form.onCampus ? "is-primary" : undefined}
                onClick={() => updateForm({ ...form, onCampus: false })}
              >
                Off-campus
                </Button>
            </ButtonGroup>
          </Control>
        </InputWrapper>
        <InputWrapper horizontal title="Voice Part">
          <SelectInput
            type={sectionType(info)}
            values={info?.sections || []}
            selected={form.section}
            onInput={section => updateForm({ ...form, section })}
            expanded
            leftAligned
          />
        </InputWrapper >
        <InputWrapper horizontal title="Enrollment">
          <Control>
            <ButtonGroup connected>
              <Button
                element="a"
                color={form.enrollment === "Class" ? "is-primary" : undefined}
                onClick={() => updateForm({ ...form, enrollment: "Class" })}
              >
                Class
                </Button>
              <Button
                element="a"
                color={form.enrollment === "Club" ? "is-primary" : undefined}
                onClick={() => updateForm({ ...form, enrollment: "Club" })}
              >
                Club
                </Button>
            </ButtonGroup>
          </Control>
        </InputWrapper>
        <ButtonGroup alignment="is-right">
          <SubmitButton color="is-primary">Confirm</SubmitButton>
        </ButtonGroup>
      </form>
    </Modal>
  );
};
