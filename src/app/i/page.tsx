import type { Metadata } from "next";
import { PayView } from "@/components/PayView";

export const metadata: Metadata = {
  title: "Payment request",
  robots: { index: false },
};

export default function PayPage() {
  return (
    <main className="stage-main">
      <PayView />
    </main>
  );
}
