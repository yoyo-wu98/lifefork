"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";
import { useLifeforkStore } from "@/lib/stores/lifeforkStore";

export function ConfirmationDialog() {
  const dialogRef = useRef<HTMLElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const dialog = useLifeforkStore((state) => state.confirmationDialog);
  const dismiss = useLifeforkStore((state) => state.dismissConfirmation);
  const confirm = useLifeforkStore((state) => state.confirmPendingAction);

  useEffect(() => {
    if (!dialog) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
      if (event.key !== "Tab") return;

      const focusable = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          "button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])",
        ) ?? [],
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable.at(-1) ?? first;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [dialog, dismiss]);

  if (!dialog) return null;
  const isDanger = dialog.tone === "danger";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-night/45 px-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) dismiss();
      }}
    >
      <section
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmation-title"
        aria-describedby="confirmation-message"
        className="w-full max-w-md rounded-lg border border-night/15 bg-[var(--lf-paper-raised)] p-5 shadow-xl"
      >
        <div className="flex items-start gap-3">
          <span
            className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
              isDanger ? "bg-red-50 text-red-700" : "bg-blue/10 text-blue"
            }`}
          >
            <AlertTriangle className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 id="confirmation-title" className="text-lg font-semibold text-ink">
              {dialog.title}
            </h2>
            <p id="confirmation-message" className="mt-2 text-sm leading-6 text-mist">
              {dialog.message}
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          {!dialog.dismissOnly && (
            <button
              type="button"
              autoFocus
              className="rounded-lg border border-night/15 px-4 py-2 text-sm text-ink hover:bg-deep"
              onClick={dismiss}
            >
              {dialog.cancelLabel ?? "取消"}
            </button>
          )}
          <button
            type="button"
            autoFocus={dialog.dismissOnly}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
              isDanger ? "bg-red-700 hover:bg-red-800" : "bg-night hover:bg-ink"
            }`}
            onClick={dialog.dismissOnly ? dismiss : confirm}
          >
            {dialog.confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
