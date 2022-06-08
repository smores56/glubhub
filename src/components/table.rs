import React, { CSSProperties } from "react";

interface TableProps {
  fullwidth?: boolean;
  scrollable?: boolean;
  striped?: boolean;
  hoverable?: boolean;
  className?: string;
  style?: CSSProperties;
}

export const Table: React.FC<TableProps> = props => {
  const className = [
    "table",
    props.className,
    props.fullwidth && "is-fullwidth",
    props.striped && "is-striped",
    props.hoverable && "is-hoverable"
  ]
    .filter(c => !!c)
    .join(" ");

  const table = (
    <table className={className} style={props.style}>
      {props.children}
    </table>
  );

  return props.scrollable ? (
    <div className="table-container">{table}</div>
  ) : (
    table
  );
};
