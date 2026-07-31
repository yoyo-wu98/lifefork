import type { ForkPath } from "@/lib/types";
import { normalizeForkTree } from "@/lib/selfSkill/forkTreeRules";
import { timeRange, WEEK, YEAR } from "@/lib/selfSkill/timeRangeRules";
import { validateForkHierarchy } from "@/lib/selfSkill/containmentValidation";

type FixtureNodeInput = Omit<ForkPath, "gains" | "costs" | "futureSelfName" | "futureSelfVoice"> &
  Partial<Pick<ForkPath, "gains" | "costs" | "futureSelfName" | "futureSelfVoice">>;

const baseNode = (path: FixtureNodeInput): ForkPath => ({
  ...path,
  nodeType: path.nodeType ?? "life-map",
  gains: path.gains ?? ["可验证"],
  costs: path.costs ?? ["需要继续校准"],
  futureSelfName: path.futureSelfName ?? "未来的你",
  futureSelfVoice: path.futureSelfVoice ?? "清醒、具体",
});

export const lifeMapTeamFixture: ForkPath[] = normalizeForkTree([
  baseNode({
    id: "fixture-life-experiment",
    scale: "life",
    displayScale: "life",
    mapRole: "life-container",
    containmentRole: "root",
    lane: "experiment",
    timeSpan: { startLabel: "现在", endLabel: "晚年", durationLabel: "一整条人生", durationMonths: 840, range: timeRange(0, 70 * YEAR, "life") },
    title: "试验线",
    subtitle: "用可逆实验慢慢改写人生",
    summary: "稳定 fixture：Life Map Team 可用它验证 90 天容器包含第 1 周。",
    children: [
      baseNode({
        id: "fixture-experiment-90d",
        scale: "era",
        displayScale: "era",
        mapRole: "period",
        containmentRole: "container",
        lane: "experiment",
        timeSpan: { startLabel: "今天", endLabel: "90 天后", durationLabel: "90 天", durationMonths: 3, range: timeRange(0, 90, "era") },
        title: "90 天",
        subtitle: "把人生问题改成一个实验周期",
        summary: "90 天属于阶段容器，不属于十年层级。",
        children: [
          baseNode({
            id: "fixture-experiment-week-1",
            scale: "week",
            displayScale: "week",
            mapRole: "period",
            containmentRole: "period",
            lane: "experiment",
            timeSpan: { startLabel: "第 1 周", durationLabel: "一周", durationMonths: 0.23, range: timeRange(0, WEEK, "week") },
            title: "第 1 周",
            subtitle: "只做最小可见动作",
            summary: "示例路由：现在 -> 试验线 -> 90 天 -> 第 1 周。",
          }),
        ],
      }),
      baseNode({
        id: "fixture-experiment-10y",
        scale: "decade",
        displayScale: "decade",
        mapRole: "checkpoint",
        containmentRole: "checkpoint",
        lane: "experiment",
        timeSpan: { startLabel: "现在", endLabel: "10 年后", durationLabel: "10 年", durationMonths: 120, range: timeRange(0, 10 * YEAR, "decade") },
        title: "10 年后",
        subtitle: "长期校准后的生活",
        summary: "10 年后是 life 容器下的长期 checkpoint，不能挂到 90 天下面。",
      }),
    ],
  }),
]);

export const validForkContainmentExamples = [
  "3 年节点使用 durationMonths: 36 且 displayScale: era，不标记为 decade。",
  "第 1 周挂在 90 天下，timeSpan.range 0-7 落在父级 0-90 内。",
  "10 年后作为 life 容器的 checkpoint sibling，不属于 90 天的 child。",
];

export const invalidForkContainmentExamples: ForkPath[] = normalizeForkTree([
  baseNode({
    id: "invalid-life",
    scale: "life",
    displayScale: "life",
    mapRole: "life-container",
    lane: "experiment",
    timeSpan: { startLabel: "现在", durationLabel: "人生", durationMonths: 840, range: timeRange(0, 70 * YEAR, "life") },
    title: "非法根",
    subtitle: "用于 QA 断言",
    summary: "包含三类故意错误。",
    children: [
      baseNode({
        id: "invalid-week-direct",
        parentId: "wrong-parent-before-normalize",
        scale: "week",
        displayScale: "week",
        lane: "experiment",
        timeSpan: { startLabel: "第 1 周", durationLabel: "一周", durationMonths: 0.23, range: timeRange(0, WEEK, "week") },
        title: "第 1 周直接挂 life",
        subtitle: "非法 scale attachment",
        summary: "第 1 周不能直接挂 life。",
      }),
      baseNode({
        id: "invalid-90d",
        scale: "era",
        displayScale: "era",
        lane: "experiment",
        timeSpan: { startLabel: "今天", endLabel: "90 天后", durationLabel: "90 天", durationMonths: 3, range: timeRange(0, 90, "era") },
        title: "90 天",
        subtitle: "非法包含 10 年后",
        summary: "10 年后不能成为 90 天子节点。",
        children: [
          baseNode({
            id: "invalid-10y-under-90d",
            scale: "decade",
            displayScale: "decade",
            lane: "experiment",
            timeSpan: { startLabel: "现在", endLabel: "10 年后", durationLabel: "10 年", durationMonths: 120, range: timeRange(0, 10 * YEAR, "decade") },
            title: "10 年后",
            subtitle: "超出父级范围",
            summary: "这个节点故意超出 90 天父级范围。",
          }),
        ],
      }),
    ],
  }),
]);

invalidForkContainmentExamples[0].children![0].parentId = "wrong-parent";
invalidForkContainmentExamples[0].children![1].children![0].orderIndex = 9;

export const qaExpectedHierarchyViolations = validateForkHierarchy(invalidForkContainmentExamples).violations;
