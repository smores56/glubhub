import React, { useState, useContext, useCallback, FormEvent } from "react";
import { GlubHubContext, useGlubRoute } from "utils/context";
import {
  notSentYet,
  sending,
  resultToSubmissionState,
  failedToSend,
  SubmissionState,
  isSending
} from "state/types";
import { Enrollment, Member, Info } from "state/models";
import { Md5 } from "ts-md5";
import { post } from "utils/request";
import { routeProfile, routeLogin } from "state/route";
import { Section, Container, Title, Box, Title4 } from "components/Basics";
import ErrorBox from "components/ErrorBox";
import {
  InputWrapper,
  TextInput,
  stringType,
  emailType,
  phoneType,
  passwordType,
  CheckboxInput,
  numberType,
  Control,
  SelectInput,
  sectionType
} from "components/Forms";
import {
  ButtonGroup,
  LinkButton,
  SubmitButton,
  Button
} from "components/Buttons";

export const EditProfile: React.FC = () => {
  const { user, info } = useContext(GlubHubContext);
  const { goToRoute } = useGlubRoute();

  const [form, updateForm] = useState<ProfileForm>(
    user ? formForUser(user) : emptyProfileForm(info)
  );
  const [state, setState] = useState(notSentYet);

  const submit = useCallback(async (event: FormEvent) => {
    event.preventDefault();
    setState(sending);

    const enteredPassword = !!(form.password || form.confirmPassword);
    if (!enteredPassword && !user) {
      alert("You must enter a password.");
      return;
    } else if (form.password !== form.confirmPassword) {
      alert("Your passwords don't match.");
      return;
    } else if (!form.section) {
      alert("You need a section, bucko.");
      return;
    }

    const passHash = enteredPassword
      ? (Md5.hashStr(form.password) as string)
      : null;
    const body = buildProfileBody(form, passHash);
    const result = await post(user ? "members/profile" : "members", body);

    setState(resultToSubmissionState(result));
    if (result.successful) {
      if (user) {
        goToRoute(routeProfile(user.email, null));
      } else {
        goToRoute(routeLogin);
        alert(`You have successfully created an account with email ${body.email}!`);
      }
    }
  }, [setState, form, user, goToRoute]);

  return (
    <Section>
      <Container>
        <Title>{user ? "Edit Profile" : "Create Profile"}</Title>
        <Box>
          <HeaderText loggedIn={!!user} />
          <br />
          <FormFields
            form={form}
            update={updateForm}
            user={user}
            submit={submit}
            state={state}
          />
          {failedToSend(state) && <ErrorBox error={state.error} />}
        </Box>
      </Container>
    </Section>
  );
};

const HeaderText: React.FC<{ loggedIn: boolean }> = ({ loggedIn }) => {
  const strikethrough = (text: string) => (
    <span style={{ textDecoration: "line-through" }}>{text}</span>
  );

  if (loggedIn) {
    return (
      <p>
        You can make changes to your stats here. It's important we know as much
        about you as possible to {strikethrough("creep")}{" "}
        {strikethrough("better serve you")} make you drive carpools. It'll also
        help your new friends get to know you!
      </p>
    );
  } else {
    return (
      <p>
        Note that this registration is not mandatory. If you are unwilling to
        provide any of the required information, let an officer know and we will
        work out alternate means of registration.
      </p>
    );
  }
};

interface FormFieldsProps {
  form: ProfileForm;
  user: Member | null;
  state: SubmissionState;
  submit: (event: FormEvent) => void;
  update: (form: ProfileForm) => void;
}

const FormFields: React.FC<FormFieldsProps> = ({
  form,
  user,
  state,
  submit,
  update
}) => (
    <form onSubmit={submit}>
      <Title4>Really Important Stuff</Title4>
      <InputWrapper horizontal title="Name">
        <TextInput
          type={stringType}
          value={form.firstName}
          onInput={firstName => update({ ...form, firstName })}
          required
          placeholder="First"
        />
        <TextInput
          type={stringType}
          value={form.preferredName}
          onInput={preferredName => update({ ...form, preferredName })}
          placeholder="Preferred (optional)"
        />
        <TextInput
          type={stringType}
          value={form.lastName}
          onInput={lastName => update({ ...form, lastName })}
          required
          placeholder="Last"
        />
      </InputWrapper>
      <TextInput
        type={emailType}
        value={form.email}
        onInput={email => update({ ...form, email })}
        horizontal
        required
        title="E-mail"
        placeholder="gburdell3@gatech.edu"
      />
      <TextInput
        type={phoneType}
        value={form.phoneNumber}
        onInput={phoneNumber => update({ ...form, phoneNumber })}
        horizontal
        required
        title="Phone Number"
        placeholder="6788675309"
      />
      <InputWrapper horizontal title="Password">
        <TextInput
          type={passwordType}
          value={form.password}
          onInput={password => update({ ...form, password })}
          required
          placeholder="Password"
        />
        <TextInput
          type={passwordType}
          value={form.confirmPassword}
          onInput={confirmPassword => update({ ...form, confirmPassword })}
          required
          placeholder="Confirm Password"
        />
      </InputWrapper>
      <InputWrapper horizontal title="Location">
        <LocationFieldBlock form={form} update={update} />
      </InputWrapper>
      <TextInput
        type={stringType}
        value={form.major}
        onInput={major => update({ ...form, major })}
        required
        horizontal
        title="Major"
        placeholder="Undecided Engineering"
      />
      <TextInput
        type={stringType}
        value={form.hometown}
        onInput={hometown => update({ ...form, hometown })}
        required
        horizontal
        title="Hometown"
        placeholder="Winslow, Arizona"
      />
      <InputWrapper horizontal title="Car">
        <CarFieldBlock form={form} update={update} />
      </InputWrapper>
      <InputWrapper horizontal title="Enrollment">
        <EnrollmentBlock form={form} update={update} user={user} />
      </InputWrapper>

      <Title4>Nice to Know</Title4>
      <TextInput
        type={stringType}
        value={form.about}
        onInput={about => update({ ...form, about })}
        horizontal
        title="About"
        placeholder="I like big butts and I cannot lie"
      />
      <TextInput
        type={stringType}
        value={form.picture}
        onInput={picture => update({ ...form, picture })}
        horizontal
        title="Picture URL"
        placeholder="https://create.mylittlepony.movie/images/ponyparticon_bodybig.png"
      />
      <TextInput
        type={numberType}
        value={form.arrivedAtTech}
        onInput={arrivedAtTech =>
          update({
            ...form,
            arrivedAtTech: arrivedAtTech || new Date().getFullYear()
          })
        }
        horizontal
        title="Arrived at Tech"
        placeholder="2099"
      />
      <ActionButtons user={user} state={state} />
    </form>
  );

interface ActionButtonsProps {
  user: Member | null;
  state: SubmissionState;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ user, state }) => (
  <ButtonGroup alignment="is-right">
    {user && (
      <LinkButton route={routeProfile(user.email, null)}>Back</LinkButton>
    )}
    <SubmitButton color="is-primary" loading={isSending(state)}>
      Save
    </SubmitButton>
  </ButtonGroup>
);

interface ProfileFormProps {
  form: ProfileForm;
  update: (form: ProfileForm) => void;
}

const CarFieldBlock: React.FC<ProfileFormProps> = ({ form, update }) => (
  <div className="field is-grouped">
    <CheckboxInput
      content="I have a car"
      checked={form.passengers > 0}
      onChange={hasCar => update({ ...form, passengers: hasCar ? 1 : 0 })}
    />
    {form.passengers > 0 ? (
      <TextInput
        type={numberType}
        value={form.passengers}
        onInput={passengers => update({ ...form, passengers: passengers || 0 })}
        placeholder="How many?"
        suffix="passengers"
      />
    ) : ""}
  </div>
);

const LocationFieldBlock: React.FC<ProfileFormProps> = ({ form, update }) => (
  <>
    <TextInput
      type={stringType}
      value={form.location}
      onInput={location => update({ ...form, location })}
      placeholder="Glenn"
    />
    <Control>
      <ButtonGroup connected>
        <Button
          color={form.onCampus ? "is-primary" : undefined}
          onClick={() => update({ ...form, onCampus: true })}
        >
          On-campus
        </Button>
        <Button
          color={!form.onCampus ? "is-primary" : undefined}
          onClick={() => update({ ...form, onCampus: false })}
        >
          Off-campus
        </Button>
      </ButtonGroup>
    </Control>
  </>
);

interface EnrollmentBlockProps extends ProfileFormProps {
  user: Member | null;
}

const EnrollmentBlock: React.FC<EnrollmentBlockProps> = ({
  form,
  update,
  user
}) => {
  const { info } = useContext(GlubHubContext);

  return (
    <InputWrapper horizontal>
      <Control>
        <ButtonGroup connected>
          {user && (
            <EnrollmentOption form={form} update={update} enrollment={null} />
          )}
          <EnrollmentOption form={form} update={update} enrollment={"Class"} />
          <EnrollmentOption form={form} update={update} enrollment={"Club"} />
        </ButtonGroup>
      </Control>
      <span style={{ width: "15px" }} />
      <SelectInput
        type={sectionType(info)}
        values={info?.sections || []}
        selected={form.section}
        onInput={section => update({ ...form, section })}
      />
    </InputWrapper>
  );
};

interface EnrollmentOptionProps extends ProfileFormProps {
  enrollment: Enrollment | null;
}

const EnrollmentOption: React.FC<EnrollmentOptionProps> = ({
  form,
  update,
  enrollment
}) => (
    <Button
      color={form.enrollment === enrollment ? "is-primary" : undefined}
      onClick={() => update({ ...form, enrollment })}
    >
      {enrollment || "Inactive"}
    </Button>
  );

interface ProfileForm {
  firstName: string;
  preferredName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
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

const formForUser = (user: Member): ProfileForm => ({
  firstName: user.firstName,
  preferredName: user.preferredName || "",
  lastName: user.lastName,
  email: user.email,
  password: "",
  confirmPassword: "",
  phoneNumber: user.phoneNumber,
  location: user.location,
  onCampus: user.onCampus || false,
  major: user.major || "",
  hometown: user.hometown || "",
  passengers: user.passengers,
  enrollment: user.enrollment,
  section: user.section,
  about: user.about || "",
  picture: user.picture || "",
  arrivedAtTech: user.arrivedAtTech,
  gatewayDrug: user.gatewayDrug || "",
  conflicts: user.conflicts || "",
  dietaryRestrictions: user.dietaryRestrictions || ""
});

const emptyProfileForm = (info: Info | null): ProfileForm => ({
  firstName: "",
  preferredName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  phoneNumber: "",
  location: "",
  onCampus: true,
  major: "",
  hometown: "",
  passengers: 0,
  enrollment: "Class",
  section: info?.sections[0] || null,
  about: "",
  picture: "",
  arrivedAtTech: new Date().getFullYear(),
  gatewayDrug: "",
  conflicts: "",
  dietaryRestrictions: ""
});

const buildProfileBody = (form: ProfileForm, passHash: string | null) => ({
  email: form.email,
  firstName: form.firstName,
  preferredName: form.preferredName,
  lastName: form.lastName,
  passHash,
  phoneNumber: form.phoneNumber,
  picture: form.picture,
  passengers: form.passengers,
  location: form.location,
  onCampus: form.onCampus,
  about: form.about,
  major: form.major,
  hometown: form.hometown,
  arrivedAtTech: form.arrivedAtTech,
  gatewayDrug: form.gatewayDrug,
  conflicts: form.conflicts,
  dietaryRestrictions: form.dietaryRestrictions,
  section: form.section,
  enrollment: form.enrollment
});
