"use client";

import { useEffect, useRef, useState } from "react";

type Playback = "playing" | "paused" | "unavailable";

export default function SpotifyButton() {
  const [state, setState] = useState<Playback>("unavailable");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const locked = useRef(false);
  const refresh = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    let mounted = true;
    let sequence = 0;
    const controller = new AbortController();
    const update = async () => {
      const request = ++sequence;
      try {
        const response = await fetch("api/spotify", { cache: "no-store", signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]) });
        if (!response.ok) throw new Error();
        const data = await response.json();
        if (mounted && request === sequence) setState(data.state === "playing" || data.state === "paused" ? data.state : "unavailable");
      } catch {
        if (mounted && request === sequence) setState("unavailable");
      }
    };
    refresh.current = update;
    const visible = () => { if (!document.hidden) void update(); };
    void update();
    const timer = window.setInterval(visible, 5000);
    window.addEventListener("focus", visible);
    document.addEventListener("visibilitychange", visible);
    return () => {
      mounted = false;
      controller.abort();
      window.clearInterval(timer);
      window.removeEventListener("focus", visible);
      document.removeEventListener("visibilitychange", visible);
    };
  }, []);

  async function toggle() {
    if (locked.current || state === "unavailable") return;
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("api/spotify", {
        method: "POST", headers: { "Content-Type": "application/json", "X-Carnet-Request": "1" },
        body: JSON.stringify({ action: state === "playing" ? "pause" : "play" }),
        signal: AbortSignal.timeout(40000),
      });
      if (!response.ok) throw new Error();
    } catch {
      setError("Kunde inte styra Spotify. Starta manuellt och försök igen.");
    } finally {
      await refresh.current();
      locked.current = false;
      setBusy(false);
    }
  }

  const label = state === "playing" ? "Pausa Spotify i köket" : state === "paused" ? "Spela Spotify i köket" : "Spotify är inte tillgängligt. Starta manuellt.";
  return <div className="spotifyControl">
    <button type="button" className="spotifyButton" onClick={toggle} disabled={busy || state === "unavailable"} aria-label={label} title={label} aria-busy={busy}>
      <span>Spotify</span><img src={`spotify-icons/${state === "playing" ? "pause" : state === "paused" ? "play" : "unavailable"}.png`} alt="" aria-hidden="true" />
    </button>
    {error && <span className="spotifyError" role="status">{error}</span>}
  </div>;
}
