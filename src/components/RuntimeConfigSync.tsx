"use client";

import { useEffect } from "react";
import { applyAnalysisPreset } from "@/lib/analysis/methodRegistry";
import { useLifeforkStore } from "@/lib/stores/lifeforkStore";
import type { PublicRuntimeConfig } from "@/lib/runtimeConfig";

const POLL_INTERVAL_MS = 60_000;

export function RuntimeConfigSync() {
  const setRuntimeConfig = useLifeforkStore((state) => state.setRuntimeConfig);
  const setAnalysisSettings = useLifeforkStore(
    (state) => state.setAnalysisSettings,
  );

  useEffect(() => {
    let mounted = true;

    const sync = () => {
      fetch("/api/public-config", { cache: "no-store" })
        .then((response) => (response.ok ? response.json() : null))
        .then((body: { success?: boolean; data?: PublicRuntimeConfig } | null) => {
          if (!mounted || !body?.success || !body.data) return;
          setRuntimeConfig(body.data);
          if (!window.localStorage.getItem("lifefork.analysisSettings")) {
            setAnalysisSettings(
              applyAnalysisPreset(
                useLifeforkStore.getState().analysisSettings,
                body.data.defaults.analysisPreset,
              ),
            );
          }
        })
        .catch(() => undefined);
    };

    sync();
    const interval = setInterval(sync, POLL_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") sync();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      mounted = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [setAnalysisSettings, setRuntimeConfig]);

  return null;
}
