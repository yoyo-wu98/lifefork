"use client";

import { useEffect } from "react";
import { applyAnalysisPreset } from "@/lib/analysis/methodRegistry";
import { useLifeforkStore } from "@/lib/stores/lifeforkStore";
import type { PublicRuntimeConfig } from "@/lib/runtimeConfig";

export function RuntimeConfigSync() {
  const setRuntimeConfig = useLifeforkStore((state) => state.setRuntimeConfig);
  const setAnalysisSettings = useLifeforkStore(
    (state) => state.setAnalysisSettings,
  );

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/public-config", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((body: { success?: boolean; data?: PublicRuntimeConfig } | null) => {
        if (body?.success && body.data) {
          setRuntimeConfig(body.data);
          if (!window.localStorage.getItem("lifefork.analysisSettings")) {
            setAnalysisSettings(
              applyAnalysisPreset(
                useLifeforkStore.getState().analysisSettings,
                body.data.defaults.analysisPreset,
              ),
            );
          }
        }
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [setAnalysisSettings, setRuntimeConfig]);

  return null;
}
