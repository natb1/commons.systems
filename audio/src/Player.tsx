import React, { useEffect, useRef } from "react";
import { initPlayer } from "./player.js";
import type { PlayerHandle } from "./player.js";

interface PlayerProps {
  onReady: (handle: PlayerHandle | null) => void;
}

export const Player = React.memo(function Player({ onReady }: PlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const playlistRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = initPlayer(audioRef.current!, playlistRef.current!);
    onReady(handle);
    return () => {
      onReady(null);
      handle.destroy();
    };
  }, [onReady]);

  return (
    <>
      {/* #now-playing is owned by the imperative engine (innerHTML). It MUST have
          NO JSX children, so React never reconciles the engine's subtree. */}
      <div id="now-playing" ref={playlistRef} />
      <audio id="audio-player" controls ref={audioRef} />
    </>
  );
});
