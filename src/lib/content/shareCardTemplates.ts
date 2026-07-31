import { SHARE_CARD_TEMPLATE_COPY } from "@/lib/content/copyRegistry";

export { SHARE_CARD_TEMPLATE_COPY } from "@/lib/content/copyRegistry";

export function buildShareCardClipboardText(params: {
  archetype: string;
  innerConflict: string;
  currentChoice: string;
  timePoint: string;
  futureSelfLine: string;
  dynamicType?: {
    currentTypeTendency: string;
    typeDrift: string;
    confidence: string;
    evidenceHint: string;
  };
}): string {
  const labels = SHARE_CARD_TEMPLATE_COPY.value.clipboardLabels;
  const dynamicTypeLines = params.dynamicType
    ? [
        `${labels.currentTypeTendency}：${params.dynamicType.currentTypeTendency}`,
        `${labels.typeDrift}：${params.dynamicType.typeDrift}`,
        `${labels.confidence}：${params.dynamicType.confidence}`,
        `${labels.evidenceHint}：${params.dynamicType.evidenceHint}`,
      ]
    : [];

  return [
    labels.intro,
    `${labels.archetype}：${params.archetype}`,
    `${labels.innerConflict}：${params.innerConflict}`,
    `${labels.currentChoice}：${params.currentChoice}`,
    `${labels.timePoint}：${params.timePoint}`,
    ...dynamicTypeLines,
    `${labels.futureSelfLine}：${params.futureSelfLine}`,
  ].join("\n");
}
