"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { clsx } from "clsx";
import { IconCheck, IconCopy } from "./Icons";

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {}
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  } catch {
    return false;
  }
}

export function CopyButton({
  value,
  label = "copy",
  className,
  icon,
}: {
  value: string;
  label?: string;
  className?: string;
  icon?: ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return (
    <button
      type="button"
      className={clsx("btn btn-quiet", className)}
      onClick={async () => {
        await copyText(value);
        setCopied(true);
        timer.current = window.setTimeout(() => setCopied(false), 1600);
      }}
    >
      {copied ? <IconCheck /> : icon}
      {copied ? "copied" : label}
    </button>
  );
}

export function MiniCopy({ value, title = "Copy" }: { value: string; title?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="copy-mini"
      title={title}
      aria-label={title}
      onClick={async () => {
        if (await copyText(value)) {
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        }
      }}
    >
      {copied ? <IconCheck /> : <IconCopy />}
    </button>
  );
}
