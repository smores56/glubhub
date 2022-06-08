import React, { useContext, useState, useCallback, FormEvent } from "react";
import { GlubHubContext } from "utils/context";
import {
  notSentYet,
  SubmissionState,
  sending,
  resultToSubmissionState,
  isSending,
  failedToSend
} from "state/types";
import { Member, Enrollment } from "state/models";
import { chain, get, post } from "utils/request";
import { Column } from "components/Basics";
import {
  TextInput,
  stringType,
  emailType,
  phoneType,
  RadioInput,
  SelectInput,
  enrollmentType,
  sectionType,
  numberType
} from "components/Forms";
import { ButtonGroup, Button, SubmitButton } from "components/Buttons";
import ErrorBox from "components/ErrorBox";
import { Table } from "components/Table";

interface DetailsProps {
  member: Member;
  update: (member: Member) => void;
}

export const Details: React.FC<DetailsProps> = ({ member, update }) => {
  const [form, updateForm] = useState<ProfileForm | null>(null);
  const [state, setState] = useState(notSentYet);

  const updateMember = useCallback(async (event: FormEvent) => {
    event.preventDefault();

    if (!form) return;

    setState(sending);
    const updatedMember = await chain(
      post(`members/${member.email}`, form),
      () => get<Member>(`members/${form.email}`)
    );

    setState(resultToSubmissionState(updatedMember));
    if (updatedMember.successful) {
      update(updatedMember.data);
      updateForm(null);
    }
  }, [form, member.email, setState, update]);

  if (form) {
    return (
      <EditProfileForm
        form={form}
        state={state}
        cancel={() => updateForm(null)}
        submit={updateMember}
        update={updateForm}
      />
    );
  } else {
    return (
      <ReadOnlyDetails
        member={member}
        startEditing={() => updateForm(formForMember(member))}
      />
    );
  }
};

interface ReadOnlyDetailsProps {
  member: Member;
  startEditing: () => void;
}

const ReadOnlyDetails: React.FC<ReadOnlyDetailsProps> = ({
  member,
  startEditing
}) => {
  const rows: [String, String][] = [
    ["First Name", member.firstName],
    ["Preferred Name", member.preferredName || ""],
    ["Last Name", member.lastName],
    ["Email", member.email],
    ["Phone Number", member.phoneNumber],
    ["Location", member.location],
    ["On Campus", `${!!member.onCampus}`],
    ["Enrollment", member.enrollment || "Inactive"],
    ["Section", member.section || "Homeless"],
    ["About", member.about || ""],
    ["Picture", member.picture || ""],
    ["Arrived At Tech", member.arrivedAtTech ? `${member.arrivedAtTech}` : ""],
    ["Gateway Drug", member.gatewayDrug || ""],
    ["Conflicts", member.conflicts || ""],
    ["Dietary Restrictions", member.dietaryRestrictions || ""]
  ];

  return (
    <Column>
      <Table>
        <tbody>
          {rows.map(([name, value]) => (
            <tr className="no-bottom-border">
              <td style={{ textAlign: "right" }}>
                <b>{name}</b>
              </td>
              <td>{value}</td>
            </tr>
          ))}
        </tbody>
      </Table>
      <ButtonGroup alignment="is-right">
        <Button onClick={startEditing}>Edit</Button>
      </ButtonGroup>
    </Column>
  );
};

interface EditProfileFormProps {
  form: ProfileForm;
  state: SubmissionState;
  cancel: () => void;
  submit: (event: FormEvent) => void;
  update: (form: ProfileForm) => void;
}

const EditProfileForm: React.FC<EditProfileFormProps> = ({
  form,
  state,
  cancel,
  submit,
  update
}) => {
  const { info } = useContext(GlubHubContext);

  return (
    <form onSubmit={submit}>
      <TextInput
        horizontal
        type={stringType}
        value={form.firstName}
        onInput={firstName => update({ ...form, firstName })}
        title="First Name"
        required
      />
      <TextInput
        horizontal
        type={stringType}
        value={form.preferredName}
        onInput={preferredName => update({ ...form, preferredName })}
        title="Preferred Name"
      />
      <TextInput
        horizontal
        type={stringType}
        value={form.lastName}
        onInput={lastName => update({ ...form, lastName })}
        title="Last Name"
        required
      />
      <TextInput
        horizontal
        type={emailType}
        value={form.email}
        onInput={email => update({ ...form, email })}
        title="Email"
        required
      />
      <TextInput
        horizontal
        type={phoneType}
        value={form.phoneNumber}
        onInput={phoneNumber => update({ ...form, phoneNumber })}
        title="Phone Number"
        required
      />
      <TextInput
        horizontal
        type={stringType}
        value={form.location}
        onInput={location => update({ ...form, location })}
        title="Location"
      />
      <RadioInput
        horizontal
        values={[true, false]}
        selected={form.onCampus}
        render={onCampus => (onCampus ? "Yes" : "No")}
        onInput={onCampus => update({ ...form, onCampus })}
        title="On Campus?"
      />
      <SelectInput
        horizontal
        type={enrollmentType}
        values={["Class", "Club", null] as (Enrollment | null)[]}
        selected={form.enrollment}
        onInput={enrollment => update({ ...form, enrollment })}
        title="Enrollment"
      />
      <SelectInput
        horizontal
        type={sectionType(info)}
        values={[null, ...(info?.sections || [])]}
        selected={form.section}
        onInput={section => update({ ...form, section })}
        title="Section"
      />
      <TextInput
        horizontal
        type={stringType}
        value={form.about}
        onInput={about => update({ ...form, about })}
        title="About"
      />
      <TextInput
        horizontal
        type={stringType}
        value={form.picture}
        onInput={picture => update({ ...form, picture })}
        title="Picture"
      />
      <TextInput
        horizontal
        type={numberType}
        value={form.arrivedAtTech}
        onInput={arrivedAtTech => update({ ...form, arrivedAtTech })}
        title="Arrived At Tech"
      />
      <TextInput
        horizontal
        type={stringType}
        value={form.gatewayDrug}
        onInput={gatewayDrug => update({ ...form, gatewayDrug })}
        title="Gateway Drug"
      />
      <TextInput
        horizontal
        type={stringType}
        value={form.conflicts}
        onInput={conflicts => update({ ...form, conflicts })}
        title="Conflicts"
      />
      <TextInput
        horizontal
        type={stringType}
        value={form.dietaryRestrictions}
        onInput={dietaryRestrictions =>
          update({ ...form, dietaryRestrictions })
        }
        title="Dietary Restrictions"
      />
      <ButtonGroup alignment="is-right">
        <Button onClick={cancel}>Cancel</Button>
        <SubmitButton color="is-primary" loading={isSending(state)}>
          Save
        </SubmitButton>
      </ButtonGroup>
      {failedToSend(state) && <ErrorBox error={state.error} />}
    </form>
  );
};

interface ProfileForm {
  firstName: string;
  preferredName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  location: string;
  onCampus: boolean;
  major: string;
  hometown: string;
  passengers: number;
  enrollment: Enrollment | null;
  section: string | null;
  about: string;
  picture: string;
  arrivedAtTech: number | null;
  gatewayDrug: string;
  conflicts: string;
  dietaryRestrictions: string;
}

const formForMember = (member: Member): ProfileForm => ({
  firstName: member.firstName,
  preferredName: member.preferredName || "",
  lastName: member.lastName,
  email: member.email,
  phoneNumber: member.phoneNumber,
  location: member.location,
  onCampus: !!member.onCampus,
  major: member.major || "",
  hometown: member.hometown || "",
  passengers: member.passengers,
  enrollment: member.enrollment,
  section: member.section,
  about: member.about || "",
  picture: member.picture || "",
  arrivedAtTech: member.arrivedAtTech,
  gatewayDrug: member.gatewayDrug || "",
  conflicts: member.conflicts || "",
  dietaryRestrictions: member.dietaryRestrictions || ""
});
