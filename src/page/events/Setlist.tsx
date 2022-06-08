import React, { useState, useEffect } from "react";
import { Song } from "state/models";
import { get } from "utils/request";
import { pitchToUnicode } from "utils/helpers";
import { RemoteContent } from "components/Complex";
import { renderRoute, routeRepertoire } from "state/route";
import { RemoteData, loading, resultToRemote } from "state/types";
import { Table } from "components/Table";

export const Setlist: React.FC<{ eventId: number }> = ({ eventId }) => {
  const [songs, setSongs] = useState<RemoteData<Song[]>>(loading);

  useEffect(() => {
    const loadSongs = async () => {
      const result = await get(`events/${eventId}/setlist`);
      setSongs(resultToRemote(result));
    };

    loadSongs();
  }, [setSongs, eventId]);

  return (
    <RemoteContent
      data={songs}
      render={songs =>
        songs.length === 0 ? (
          <div>No set list for this event.</div>
        ) : (
          <Table striped>
            <tbody>
              {songs.map((song, index) => (
                <SongRow song={song} index={index + 1} />
              ))}
            </tbody>
          </Table>
        )
      }
    />
  );
};

interface SongRowProps {
  song: Song;
  index: number;
}

const SongRow: React.FC<SongRowProps> = ({ song, index }) => (
  <tr key={index}>
    <td>{index}</td>
    <td>
      <a href={renderRoute(routeRepertoire(song.id, null))}>{song.title}</a>
    </td>
    <td>{song.key ? pitchToUnicode(song.key) : "No key"}</td>
    <td>
      {song.startingPitch
        ? pitchToUnicode(song.startingPitch)
        : "No starting pitch"}
    </td>
  </tr>
);
