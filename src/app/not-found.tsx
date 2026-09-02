"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Unknown routes go home, as the reference does. */
export default function NotFound() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/");
  }, [router]);
  return (
    <main className="stage-main">
      <div className="pay-single">
        <p className="app-lede">Nothing lives at this address. Taking you home.</p>
      </div>
    </main>
  );
}
