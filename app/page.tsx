"use client";

import { useEffect } from "react";

import { createSlotGame } from "./game";

export default function Home() {
  useEffect(() => {
    const game = createSlotGame();

    return () => {
      game.destroy(true);
    };
  }, []);

  return (
    <main
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#111",
      }}
    >
      <div id="slot-game" />
    </main>
  );
}