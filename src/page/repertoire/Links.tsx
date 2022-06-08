import React from "react";
import { SongLink } from "state/models";

interface SongLinkProps {
  link: SongLink;
  onDelete?: (link: SongLink) => void;
}

interface LinkButtonProps {
  url: string;
  name: string;
}

export const SongLinkButton: React.FC<SongLinkProps> = ({ link, onDelete }) => {
  let baseButton: JSX.Element;
  if (link.type === "Sheet Music") {
    baseButton = (
      <SheetMusicLink
        name={link.name}
        url={`https://gleeclub.gatech.edu/music/${link.target}`}
      />
    );
  } else if (link.type === "MIDIs") {
    baseButton = (
      <MidiLink
        name={link.name}
        url={`https://gleeclub.gatech.edu/music/${link.target}`}
      />
    );
  } else if (link.type === "Performances") {
    baseButton = (
      <VideoLink name={link.name} url={`https://youtu.be/${link.target}`} />
    );
  } else {
    baseButton = <DefaultLink name={link.name} url={link.target} />;
  }

  return onDelete ? (
    <span style={{ display: "inline" }}>
      <button
        className="delete"
        style={{ margin: "8px" }}
        onClick={() => onDelete(link)}
      />
      {baseButton}
    </span>
  ) : (
    baseButton
  );
};

const SheetMusicLink: React.FC<LinkButtonProps> = ({ url, name }) => (
  <a
    className="button is-outlined is-primary"
    href={url}
    target="_blank"
    rel="noopener noreferrer"
  >
    <span className="icon">
      <i className="fas fa-scroll" />
    </span>
    <span>{name}</span>
  </a>
);

const MidiLink: React.FC<LinkButtonProps> = ({ url, name }) => (
  <a
    className="button is-outlined is-primary"
    href={url}
    target="_blank"
    rel="noopener noreferrer"
  >
    <span className="icon">
      <i className="fas fa-volume-up" />
    </span>
    <span>{name}</span>
  </a>
);

const VideoLink: React.FC<LinkButtonProps> = ({ url, name }) => (
  <span style={{ display: "inline", alignItems: "center" }}>
    <span
      className="icon has-text-grey-lighter"
      style={{ marginRight: ".5rem" }}
    >
      <i className="fas fa-external-link-alt" />
    </span>
    <a className="button" href={url} target="_blank" rel="noopener noreferrer">
      <span className="icon has-text-danger">
        <i className="fab fa-youtube" />
      </span>
    </a>
    <span style={{ paddingLeft: "5px" }}>{name}</span>
  </span>
);

const DefaultLink: React.FC<LinkButtonProps> = ({ url, name }) => (
  <a className="button" target="_blank" href={url} rel="noopener noreferrer">
    {name}
  </a>
);
