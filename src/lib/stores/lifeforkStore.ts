"use client";

import { create } from "zustand";
import { createChatSlice } from "@/lib/stores/slices/chatSlice";
import { createForkSlice } from "@/lib/stores/slices/forkSlice";
import { createInputSlice } from "@/lib/stores/slices/inputSlice";
import { createNavigationSlice } from "@/lib/stores/slices/navigationSlice";
import { createSelfSkillSlice } from "@/lib/stores/slices/selfSkillSlice";
import { createUiSlice } from "@/lib/stores/slices/uiSlice";
import type { LifeforkState } from "@/lib/stores/types";

export type { Answers, LifeforkState } from "@/lib/stores/types";

export const useLifeforkStore = create<LifeforkState>()((...args) => ({
  ...createNavigationSlice(...args),
  ...createInputSlice(...args),
  ...createSelfSkillSlice(...args),
  ...createForkSlice(...args),
  ...createChatSlice(...args),
  ...createUiSlice(...args),
}));
