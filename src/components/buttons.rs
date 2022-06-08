import React, { CSSProperties } from "react";
import { GlubRoute } from "state/route";
import { useGlubRoute } from "utils/context";

interface BackButtonProps {
  content: string;
  click: () => void;
}

const middleInlineStyle: CSSProperties = {
  display: "inline-block",
  verticalAlign: "middle"
};

export const BackButton: React.FC<BackButtonProps> = ({ content, click }) => (
  <span style={{ cursor: "pointer", ...middleInlineStyle }} onClick={click}>
    <i
      className="fas fa-arrow-left"
      style={{ fontSize: "16px", ...middleInlineStyle }}
    />{" "}
    <span style={middleInlineStyle}>{content}</span>
  </span>
);

export const DeleteButton: React.FC<{ click: () => void }> = ({ click }) => (
  <button className="delete" aria-label="close" onClick={click} />
);

interface ButtonGroupProps {
  connected?: boolean;
  alignment?: "is-centered" | "is-right";
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  connected,
  alignment,
  children
}) => (
  <div
    className={["buttons", alignment, connected ? "has-addons" : null]
      .filter(x => !!x)
      .join(" ")}
  >
    {children}
  </div>
);

interface ButtonAttributes {
  color?: ButtonColor;
  size?: ButtonSize;
  loading?: boolean;
  inverted?: boolean;
  outlined?: boolean;
  fullwidth?: boolean;
  className?: string;
  style?: CSSProperties;
}

export type BulmaColor = "is-primary" | "is-danger" | "is-info";

export const isBulmaColor = (color: string): color is BulmaColor =>
  ["is-primary", "is-danger", "is-info"].includes(color);

export type ButtonColor = BulmaColor | { rgb: string };

export type ButtonSize = "is-small" | "is-normal" | "is-medium" | "is-large";

const buttonClassAndStyle = (
  attrs: ButtonAttributes
): { className: string; style: CSSProperties } => {
  const colorStyle: CSSProperties | undefined =
    typeof attrs.color === "object" ? { color: attrs.color.rgb } : undefined;

  const classes = [
    "button",
    attrs.size,
    attrs.loading ? "is-loading" : undefined,
    attrs.fullwidth ? "is-fullwidth" : undefined,
    attrs.inverted ? "is-inverted" : undefined,
    attrs.outlined ? "is-outlined" : undefined,
    attrs.color && typeof attrs.color === "string" ? attrs.color : undefined,
    attrs.className
  ];

  return {
    className: classes.filter(c => c !== undefined).join(" "),
    style: { ...attrs.style, ...colorStyle }
  };
};

interface ButtonProps extends ButtonAttributes {
  onClick?: () => void;
  element?: "a";
}

export const Button: React.FC<ButtonProps> = props => {
  const attrs = {
    onClick: props.onClick,
    disabled: props.onClick === undefined,
    ...buttonClassAndStyle(props)
  };

  switch (props.element) {
    case "a":
      return <a {...attrs}>{props.children}</a>;

    default:
      return (
        <button type="button" {...attrs}>
          {props.children}
        </button>
      );
  }
};

interface LinkButtonProps extends ButtonAttributes {
  route: GlubRoute;
}

export const LinkButton: React.FC<LinkButtonProps> = props => {
  const { goToRoute } = useGlubRoute();

  return (
    <a
      type="button"
      {...buttonClassAndStyle(props)}
      onClick={() => goToRoute(props.route)}
    >
      {props.children}
    </a>
  );
};

export const SubmitButton: React.FC<ButtonAttributes> = props => (
  <button type="submit" {...buttonClassAndStyle(props)}>
    {props.children}
  </button>
);
