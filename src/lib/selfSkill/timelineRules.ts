import type { GenerateSelfSkillInput, StageVoice, TimelineNode } from "@/lib/types";

type IdFactory = () => string;

export function buildTimeline(input: GenerateSelfSkillInput, stageVoices: StageVoice[], nextId: IdFactory): TimelineNode[] {
  const nodes: TimelineNode[] = [
    {
      id: nextId(),
      yearLabel: "过去",
      title: input.pastNode || "一段影响当前选择的经历",
      emotion: "复杂、犹豫",
      pattern: "这段经历可能影响你现在对风险和选择的判断",
      voice: stageVoices.find((voice) => voice.stage === "past"),
    },
    {
      id: nextId(),
      yearLabel: "隐藏特征",
      title: input.hiddenSelf || "别人不容易看到的一面",
      emotion: "压抑、克制",
      pattern: "这部分特征很少公开表达，但会影响你的实际选择",
      voice: stageVoices.find((voice) => voice.stage === "hidden"),
    },
    {
      id: nextId(),
      yearLabel: "现在",
      title: input.currentChoice || "当前选择",
      emotion: input.recurringEmotion || "混乱",
      pattern: "你正在比较维持现状和做出改变的收益与风险",
      voice: stageVoices.find((voice) => voice.stage === "present"),
    },
    {
      id: nextId(),
      yearLabel: "未来",
      title: input.futureSentence || "你希望这个选择带来的长期结果",
      emotion: "明确、谨慎",
      pattern: "这个结果可以作为比较不同方案的长期目标",
      voice: stageVoices.find((voice) => voice.stage === "future"),
    },
  ];

  if (input.wechatAnalysis?.keyMoments.length) {
    nodes.splice(2, 0, {
      id: nextId(),
      yearLabel: "聊天记录",
      title: input.wechatAnalysis.recurringTopics.length ? `聊天中反复出现：${input.wechatAnalysis.recurringTopics.slice(0, 3).join("、")}` : "聊天记录里出现的反复主题",
      emotion: input.wechatAnalysis.emotionalSignals.join("、") || "复杂，需要进一步确认",
      pattern: "这段聊天材料可以帮助你确认反复出现的话题，以及长期没有解决的情绪和问题。",
      voice: stageVoices.find((voice) => voice.stage === "present"),
    });
  }

  return repairTimeline(nodes);
}

export function repairTimeline(nodes: TimelineNode[]): TimelineNode[] {
  return nodes.map((node, index) => ({
    ...node,
    id: node.id || `timeline-${index + 1}`,
    title: node.title || "待补充的时间节点",
    emotion: node.emotion || "复杂",
    pattern: node.pattern || "这个节点需要更多材料才能判断。",
  }));
}
