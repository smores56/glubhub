import React, { PropsWithChildren } from "react";
import {
  Info,
  Enrollment,
  Uniform,
  Member,
  Semester,
  Pitch,
  SongMode
} from "state/models";
import { fullName, pitchToUnicode, pitchFromUnicode } from "utils/helpers";

export const Control: React.FC<{ expanded?: boolean }> = ({
  expanded,
  children
}) => (
  <p className={"control" + (expanded ? " is-expanded" : "")}>{children}</p>
);

export interface InputAttributes {
  title?: string;
  horizontal?: boolean;
  required?: boolean;
  helpText?: string;
  placeholder?: string;
  expanded?: boolean;
  loading?: boolean;
  prefix?: string;
  suffix?: string;
  autocomplete?: boolean;
}

export const InputWrapper: React.FC<InputAttributes> = props => (
  <div className={"field" + (props.horizontal ? " is-horizontal" : "")}>
    {props.title &&
      (props.horizontal ? (
        <div className="field-label is-normal">
          <label className="label">{props.title}</label>
        </div>
      ) : (
        <label className="label">{props.title}</label>
      ))}
    <div className="field-body">{props.children}</div>
    {props.helpText && <p className="help">{props.helpText}</p>}
  </div>
);

export const FieldWrapper: React.FC<InputAttributes> = props => {
  const classes = [
    "field",
    props.expanded ? "is-expanded" : null,
    props.loading ? "is-loading" : null,
    props.prefix || props.suffix ? "has-addons" : null
  ];

  return (
    <div className={classes.filter(c => !!c).join(" ")}>
      {props.prefix && (
        <Control>
          {/* eslint-disable-next-line */}
          <a className="button is-static">{props.prefix}</a>
        </Control>
      )}
      {props.children}
      {props.suffix && (
        <Control>
          {/* eslint-disable-next-line */}
          <a className="button is-static">{props.suffix}</a>
        </Control>
      )}
    </div>
  );
};

export interface TextInputProps<T> extends InputAttributes {
  value: T;
  type: FormInputType<T>;
  onInput: (t: T) => void;
}

export const TextInput = <T extends any>(
  props: PropsWithChildren<TextInputProps<T>>
) => (
  <InputWrapper {...props}>
    <FieldWrapper {...props}>
      <Control>
        <input
          className={"input" + (props.loading ? " is-loading" : "")}
          value={props.type.toString(props.value)}
          onChange={event =>
            props.onInput(props.type.fromString(event.target.value))
          }
          type={props.type.textType}
          placeholder={props.placeholder}
          required={props.required}
          autoComplete={props.autocomplete === false ? "off" : "on"}
        />
      </Control>
    </FieldWrapper>
  </InputWrapper>
);

export interface TextareaInputProps extends InputAttributes {
  value: string;
  onInput: (val: string) => void;
}

export const TextareaInput: React.FC<TextareaInputProps> = props => (
  <InputWrapper {...props}>
    <FieldWrapper {...props}>
      <Control>
        <textarea
          className={"textarea" + (props.loading ? " is-loading" : "")}
          value={props.value}
          onChange={event => props.onInput(event.target.value)}
          placeholder={props.placeholder}
          required={props.required}
          autoComplete={props.autocomplete === false ? "off" : "on"}
        />
      </Control>
    </FieldWrapper>
  </InputWrapper>
);

export interface SelectInputProps<T> extends InputAttributes {
  values: T[];
  selected: T;
  type: FormInputType<T>;
  onInput: (t: T) => void;
  leftAligned?: boolean;
}

export const SelectInput = <T extends any>(
  props: PropsWithChildren<SelectInputProps<T>>
) => (
  <InputWrapper {...props}>
    <FieldWrapper {...props}>
      <div className={"select control" + (props.loading ? " is-loading" : "") + (props.leftAligned ? " is-pulled-left" : "")}>
        <select
          onInput={event =>
            props.onInput(props.type.fromString(event.currentTarget.value))
          }
        >
          {props.values
            .map(val => props.type.toString(val))
            .map(value => (
              <option
                key={value}
                value={value}
                selected={value === props.type.toString(props.selected)}
              >
                {value}
              </option>
            ))}
        </select>
      </div>
    </FieldWrapper>
  </InputWrapper>
);

export interface RadioInputProps<T> extends InputAttributes {
  values: T[];
  selected: T;
  render: (t: T) => string;
  onInput: (t: T) => void;
}

export const RadioInput = <T extends any>(
  props: PropsWithChildren<RadioInputProps<T>>
) => (
  <InputWrapper {...props}>
    <FieldWrapper {...props}>
      {props.values.map((val, index) => (
        <>
          <label key={props.render(val)} className="radio">
            <input
              type="radio"
              checked={`${val}` === `${props.selected}`}
              onClick={() => props.onInput(val)}
            />
            {" " + props.render(val)}
          </label>
          {index !== props.values.length - 1 && <br />}
        </>
      ))}
    </FieldWrapper>
  </InputWrapper>
);

export interface CheckboxInputProps {
  content: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const CheckboxInput: React.FC<CheckboxInputProps> = ({
  content,
  checked,
  onChange
}) => (
  <div className="control checkbox">
    <label className="checkbox">
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onChange(!checked)}
      />{" "}
      {content}
    </label>
  </div>
);

interface FileInputProps extends InputAttributes {
  file: File | null;
  selectFile: (file: File | null) => void;
}

export const FileInput: React.FC<FileInputProps> = props => (
  <InputWrapper {...props}>
    <div className="file has-name">
      <label className="file-label">
        <input
          className="file-input"
          type="file"
          onChange={event =>
            props.selectFile(event.target.files?.item(0) || null)
          }
        />
        <span className="file-cta">
          <span className="file-icon">
            <i className="fas fa-upload" />
          </span>
          <span className="file-label">Choose a file...</span>
        </span>
        {props.file && <span className="file-name">{props.file.name}</span>}
      </label>
    </div>
  </InputWrapper>
);

export interface FormInputType<T> {
  toString: (t: T) => string;
  fromString: (s: string) => T;
  textType: TextInputType;
}

export type TextInputType =
  | "text"
  | "number"
  | "tel"
  | "email"
  | "password"
  | "date"
  | "time";

export const stringType: FormInputType<string> = {
  toString: x => x,
  fromString: x => x,
  textType: "text"
};

export const dateType: FormInputType<string> = {
  toString: x => x,
  fromString: x => x,
  textType: "date"
};

export const timeType: FormInputType<string> = {
  toString: x => x,
  fromString: x => x,
  textType: "time"
};

export const emailType: FormInputType<string> = {
  toString: x => x,
  fromString: x => x,
  textType: "email"
};

export const passwordType: FormInputType<string> = {
  toString: x => x,
  fromString: x => x,
  textType: "password"
};

export const phoneType: FormInputType<string> = {
  toString: x => x,
  fromString: x => x,
  textType: "tel"
};

export const numberType: FormInputType<number | null> = {
  toString: x => (x ? `${x}` : ""),
  fromString: x => (isNaN(parseInt(x)) ? null : parseInt(x)),
  textType: "number"
};

export const sectionType = (
  info: Info | null
): FormInputType<string | null> => ({
  toString: x => x || "No Section",
  fromString: x => (info?.sections || []).find(s => s === x) || null,
  textType: "text"
});

export const uniformType = (
  info: Info | null
): FormInputType<Uniform | null> => ({
  toString: u => u?.name || "(no uniform)",
  fromString: u =>
    (info?.uniforms || []).find(uniform => uniform.name === u) || null,
  textType: "text"
});

export const memberType = (
  members: Member[]
): FormInputType<Member | null> => ({
  toString: member => (member ? fullName(member) : "(nobody)"),
  fromString: name => members.find(m => fullName(m) === name) || null,
  textType: "text"
});

export const enrollmentType: FormInputType<Enrollment | null> = {
  toString: x => x || "Inactive",
  fromString: x => (x === "Class" || x === "Club" ? x : null),
  textType: "text"
};

export const semesterType = (
  semesters: Semester[]
): FormInputType<Semester | null> => ({
  toString: x => x?.name || "(no semester)",
  fromString: x => semesters.find(s => s.name === x) || null,
  textType: "text"
});

export const pitchType: FormInputType<Pitch | null> = {
  toString: p => (p ? pitchToUnicode(p) : "?"),
  fromString: pitchFromUnicode,
  textType: "text"
};

export const songModeType: FormInputType<SongMode | null> = {
  toString: sm => sm || "(no mode)",
  fromString: sm => (["Major", "Minor"].includes(sm) ? (sm as SongMode) : null),
  textType: "text"
};
