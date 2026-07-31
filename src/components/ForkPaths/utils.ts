import type { ForkPath, SelfSkill } from "@/lib/types";
import { createLifeMapContentAttribution } from "@/lib/content/lifeMapNarratives";
import {
  ROOT_NODE_ID, HISTORY_BIRTH_ID, HISTORY_EARLY_ID, HISTORY_PAST_ID, HISTORY_HIDDEN_ID,
} from "./constants";

// ── Path data creation ───────────────────────────────────────────────

export function createCurrentPath(selfSkill: SelfSkill): ForkPath {
  const path: ForkPath = {
    id: ROOT_NODE_ID,
    parentId: HISTORY_HIDDEN_ID,
    nodeType: "life-node",
    mapRole: "current",
    scale: "hour",
    timeSpan: { startLabel: "此刻", durationLabel: "现在", range: { startDay: 0, endDay: 1 / 24, granularity: "hour" } },
    title: "当前问题",
    subtitle: selfSkill.questions.currentChoice || "你现在需要比较和处理的问题",
    summary: "左侧节点说明哪些经历影响了当前判断，右侧节点展示可以比较的方案。选择任一方案可以继续查看长期影响和具体行动。",
    gains: ["集中查看当前问题", "可以比较不同时间尺度", "可以随时回到这里重新选择方案"],
    costs: ["系统不会替你决定", "分析准确度取决于输入材料", "结果需要根据新信息持续更新"],
    futureSelfName: "现在的你",
    futureSelfVoice: "直接说明当前问题、信息缺口和可比较方案",
    children: selfSkill.forks,
  };

  return {
    ...path,
    content: path.content ?? createLifeMapContentAttribution(path),
  };
}

export function createHistoryPaths(selfSkill: SelfSkill): ForkPath[] {
  const pastNode = selfSkill.timeline.find((node) => node.yearLabel === "过去") ?? selfSkill.timeline[0];
  const hiddenNode =
    selfSkill.timeline.find((node) => node.yearLabel === "隐藏特征" || node.yearLabel === "长期目标" || node.yearLabel === "暗线") ??
    selfSkill.timeline[1];

  const paths: ForkPath[] = [
    {
      id: HISTORY_BIRTH_ID,
      nodeType: "life-node",
      scale: "decade",
      timeSpan: { startLabel: "出生", durationLabel: "生命开始" },
      title: "出生与家庭环境",
      subtitle: "记录最早期的家庭、环境和生活条件。",
      summary: "这个节点是时间线起点。后续可以补充家庭结构、生活环境和重要早期经历。",
      gains: ["建立时间线起点", "为后续经历提供背景", "便于观察长期变化"],
      costs: ["当前信息较少", "早期内容可能依赖他人补充", "系统无法自动还原缺失记忆"],
      futureSelfName: "最早的你",
      futureSelfVoice: "信息有限，只描述已经确认的事实",
      stateVector: { autonomy: 10, stability: 48, intimacy: 60, creation: 18, energy: 55, regret: 0, uncertainty: 90 },
    },
    {
      id: HISTORY_EARLY_ID,
      parentId: HISTORY_BIRTH_ID,
      nodeType: "life-node",
      scale: "year",
      timeSpan: { startLabel: "早年", durationLabel: "成长阶段" },
      title: "早年经历",
      subtitle: "记录早期形成的习惯、表达方式和关系模式。",
      summary: "这一阶段可能影响你如何表达需求、处理冲突和评估安全感。",
      gains: ["识别早期影响", "理解当前表达方式的来源", "为关系模式提供背景"],
      costs: ["记忆可能不完整", "部分解释需要核对", "不能只靠早期经历解释当前选择"],
      futureSelfName: "早年的你",
      futureSelfVoice: "句子较短，判断犹豫，容易省略真实需求",
      stateVector: { autonomy: 24, stability: 56, intimacy: 66, creation: 30, energy: 62, regret: 8, uncertainty: 76 },
    },
    {
      id: HISTORY_PAST_ID,
      parentId: HISTORY_EARLY_ID,
      nodeType: "life-node",
      scale: "year",
      timeSpan: { startLabel: pastNode?.yearLabel ?? "过去", durationLabel: "关键过去节点" },
      title: pastNode?.title || "一段影响当前选择的经历",
      subtitle: pastNode?.emotion || "复杂、犹豫",
      summary: pastNode?.pattern || "这段经历可能影响你现在对风险和选择的判断。",
      gains: ["说明当前判断的背景", "可以继续补充证据", "便于检查是否存在重复模式"],
      costs: ["回顾可能带来情绪压力", "系统无法还原所有细节", "解释需要你确认和修改"],
      futureSelfName: "当时的你",
      futureSelfVoice: pastNode?.voice?.description ?? "使用当时的表达方式，只说明已经确认的内容",
      stateVector: { autonomy: 42, stability: 50, intimacy: 54, creation: 44, energy: 48, regret: 38, uncertainty: 66 },
    },
    {
      id: HISTORY_HIDDEN_ID,
      parentId: HISTORY_PAST_ID,
      nodeType: "life-node",
      scale: "month",
      timeSpan: { startLabel: "长期目标", durationLabel: "较少公开表达的特征" },
      title: hiddenNode?.title || "别人不容易看到的一面",
      subtitle: hiddenNode?.emotion || "克制、较少公开表达",
      summary: hiddenNode?.pattern || "这部分特征很少公开表达，但会影响你的实际选择。",
      gains: ["补充公开形象之外的信息", "解释部分决策冲突", "帮助生成更完整的方案"],
      costs: ["内容可能涉及隐私", "判断需要你确认", "不应据此给人格下结论"],
      futureSelfName: "这项隐藏特征对应的模拟版本",
      futureSelfVoice: hiddenNode?.voice?.description ?? "表达直接，但会担心别人如何评价",
      stateVector: { autonomy: 54, stability: 46, intimacy: 52, creation: 58, energy: 45, regret: 46, uncertainty: 58 },
    },
  ];

  return paths.map((path) => ({
    ...path,
    content: path.content ?? createLifeMapContentAttribution(path),
  }));
}

// ── Fork tree utilities ──────────────────────────────────────────────

export function getAncestry(active: ForkPath, all: ForkPath[]) {
  const byId = new Map(all.map((path) => [path.id, path]));
  const lineage: ForkPath[] = [];
  let cursor: ForkPath | undefined = active;

  while (cursor) {
    lineage.unshift(cursor);
    cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
  }

  return lineage;
}
