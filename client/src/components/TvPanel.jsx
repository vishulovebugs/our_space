import { useEffect, useRef, useState } from "react";

import { currentPosition } from "@pixel-hall/shared/tvSync.js";

/** Only seek when the picture is further than this from the server clock. */
const DRIFT_LIMIT_SECONDS = 2;

/** One shared loader: the IFrame API only needs to arrive once per page. */
let apiPromise = null;

function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);

  if (!apiPromise) {
    apiPromise = new Promise((resolve) => {
      window.onYouTubeIframeAPIReady = () => resolve(window.YT);

      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(script);
    });
  }

  return apiPromise;
}

/**
 * The TV side panel. It only embeds through the official IFrame Player API -
 * nothing is downloaded, proxied or restreamed - and it follows the server's
 * {videoId, startedAt, position, playing}, seeking only when it drifts.
 */
export default function TvPanel({ tv, isHost, error, onPlay, onPause, onResume, onStop, onClose }) {
  const [url, setUrl] = useState("");
  const [muted, setMuted] = useState(true);
  const [ready, setReady] = useState(false);
  const containerRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    loadYouTubeApi().then((YT) => {
      if (cancelled || !containerRef.current) return;

      playerRef.current = new YT.Player(containerRef.current, {
        width: "100%",
        height: "100%",
        playerVars: { autoplay: 0, controls: 0, disablekb: 1, playsinline: 1, rel: 0 },
        events: {
          onReady: (event) => {
            // Browsers block sound before a gesture, so the TV starts muted.
            event.target.mute();
            setReady(true);
          },
        },
      });
    });

    return () => {
      cancelled = true;
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const player = playerRef.current;
    if (!ready || !player || !tv?.videoId) return;

    const target = currentPosition(tv, Date.now());
    const loadedId = player.getVideoData?.().video_id ?? "";

    if (loadedId !== tv.videoId) {
      player.loadVideoById({ videoId: tv.videoId, startSeconds: target });
    } else if (Math.abs((player.getCurrentTime?.() ?? 0) - target) > DRIFT_LIMIT_SECONDS) {
      player.seekTo(target, true);
    }

    if (tv.playing) player.playVideo();
    else player.pauseVideo();
  }, [tv, ready]);

  function handleSubmit(event) {
    event.preventDefault();
    onPlay(url);
    setUrl("");
  }

  function unmute() {
    playerRef.current?.unMute?.();
    setMuted(false);
  }

  return (
    <aside className="tv-panel">
      <div className="tv-frame">
        <div ref={containerRef} />
      </div>

      <form className="tv-form" onSubmit={handleSubmit}>
        <input
          aria-label="YouTube link"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="youtube.com/watch?v=..."
          autoComplete="off"
          spellCheck={false}
        />
        <button type="submit">Play</button>
      </form>

      <div className="tv-controls">
        {tv?.videoId ? (
          <>
            {tv.playing ? (
              <button type="button" onClick={onPause} disabled={!isHost}>
                Pause
              </button>
            ) : (
              <button type="button" onClick={onResume} disabled={!isHost}>
                Resume
              </button>
            )}
            <button type="button" onClick={onStop} disabled={!isHost}>
              Stop
            </button>
          </>
        ) : (
          <span className="hint">Nothing playing</span>
        )}
        {muted && (
          <button type="button" onClick={unmute}>
            Unmute
          </button>
        )}
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>

      {!isHost && tv?.videoId && <p className="hint">Only the host can control playback.</p>}
      {error && <p className="error">{error}</p>}
    </aside>
  );
}
