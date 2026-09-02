"use client";

import { useState } from "react";
import { Landing } from "./Landing";
import { CreateView } from "./CreateView";
import { ClaimView } from "./ClaimView";

type View = "home" | "create" | "claim";

/** The front page holds its three views in state, so the URL never changes. */
export function Home() {
  const [view, setView] = useState<View>("home");
  if (view === "create") return <CreateView key="create" onBack={() => setView("home")} />;
  if (view === "claim") return <ClaimView key="claim" onBack={() => setView("home")} />;
  return <Landing key="home" onPick={setView} />;
}
