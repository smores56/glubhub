import React, { PropsWithChildren } from "react";
import { RemoteData } from "state/types";
import { Box, Title, Column } from "./Basics";
import { GOLD_COLOR } from "../state/constants";
import { RemoteContent } from "./Complex";
import { Table } from "./Table";

interface SelectableListProps<T> {
  listItems: RemoteData<T[][]>;
  render: (data: T) => JSX.Element;
  onSelect: (data: T) => void;
  isSelected: (data: T) => boolean;
  messageIfEmpty: string;
  title?: string;
  contentAtTop?: JSX.Element;
  contentAtBottom?: JSX.Element;
}

export const SelectableList = <T extends any>(
  props: PropsWithChildren<SelectableListProps<T>>
) => (
  <Column narrow>
    {props.title && <Title>{props.title}</Title>}
    <Box>
      {props.contentAtTop}
      <RemoteContent
        data={props.listItems}
        render={groups => {
          const nonEmptyGroups = groups.filter(group => group.length);

          if (!nonEmptyGroups.length) {
            return <p>{props.messageIfEmpty}</p>;
          }

          return (
            <Table fullwidth hoverable className="no-bottom-border">
              <thead />
              <tbody>
                {nonEmptyGroups
                  .map((group, index) => [
                    ...group.map(item => singleRow(item, props)),
                    index === nonEmptyGroups.length - 1 ? <></> : <DividerRow />
                  ])
                  .flatMap(group => group)}
              </tbody>
            </Table>
          );
        }}
      />
      {props.contentAtBottom}
    </Box>
  </Column>
);

const singleRow = <T extends any>(
  item: T,
  props: PropsWithChildren<SelectableListProps<T>>
) => (
  <tr
    style={{
      backgroundColor: props.isSelected(item) ? GOLD_COLOR : ""
    }}
    onClick={() => props.onSelect(item)}
  >
    {props.render(item)}
  </tr>
);

const DividerRow: React.FC = () => (
  <tr className="not-hoverable">
    <div className="is-divider" style={{ margin: "1rem" }} />
  </tr>
);
