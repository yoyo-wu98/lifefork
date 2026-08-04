import type { ForkPath, GenerateSelfSkillInput, LifeScale, LifeStateVector, SelfSkill, TimelineNode } from "@/lib/types";
import { attachAssetOutlooks } from "@/lib/analysis/assetProjection";
import { buildDynamicTypeBranchSignal, buildDynamicTypeProfile } from "@/lib/selfSkill/dynamicTypeRules";
import { generateSelfSkill } from "@/lib/selfSkill/localGenerator";
import { DAY, MONTH, WEEK, YEAR, timeRange } from "@/lib/selfSkill/timeRangeRules";
import type {
  FullLifeScenarioFixture,
  CanonicalDemoPersona,
  RepresentativePathStep,
  ScenarioBoundaryCase,
  ScenarioChoiceSet,
  ScenarioChoiceSetQaChecklistItem,
  ScenarioChoiceOption,
  ScenarioEntryMode,
  ScenarioLifeStage,
  ScenarioLifeStageId,
  ScenarioReplayBranch,
  ScenarioReplayBranchId,
} from "@/lib/scenarios/types";

const SCENARIO_OWNER = "Life Scenario Lab Team" as const;
const SCENARIO_CREATED_AT = "2026-04-29T00:00:00.000Z";
const APP_HISTORY_AND_CURRENT_NODE_COUNT = 5;
const VISIBLE_NODE_BUDGET = 120;
const ALL_SCALES: readonly LifeScale[] = ["life", "decade", "era", "year", "month", "week", "day", "hour"];
const REQUIRED_LIFE_STAGE_IDS: readonly ScenarioLifeStageId[] = [
  "birth",
  "early-childhood",
  "adolescence",
  "university-or-early-adult",
  "first-career-identity",
  "relationship-pressure",
  "major-fork",
  "stabilization-or-leap",
  "illness-or-aging",
  "late-life-reflection",
  "death",
];
const REQUIRED_REPLAY_BRANCH_IDS: readonly ScenarioReplayBranchId[] = [
  "representative-complete",
  "stable",
  "leap",
  "experiment",
  "relationship",
];
const APP_SYNTHETIC_NODE_IDS = new Set([
  "lifefork-history-birth",
  "lifefork-history-early",
  "lifefork-history-past",
  "lifefork-history-hidden",
  "lifefork-life-root",
]);

const durationByScale: Record<LifeScale, number> = {
  life: 90 * YEAR,
  decade: 10 * YEAR,
  era: 3 * YEAR,
  year: YEAR,
  month: MONTH,
  week: WEEK,
  day: DAY,
  hour: 1 / 24,
};

const defaultState: LifeStateVector = {
  autonomy: 52,
  stability: 54,
  intimacy: 58,
  creation: 50,
  energy: 56,
  regret: 24,
  uncertainty: 48,
};

function state(overrides: Partial<LifeStateVector>): LifeStateVector {
  return { ...defaultState, ...overrides };
}

function consequences(vector: LifeStateVector) {
  return [
    { label: "自主感", delta: { autonomy: vector.autonomy - 50 } },
    { label: "稳定性", delta: { stability: vector.stability - 50 } },
    { label: "亲密连接", delta: { intimacy: vector.intimacy - 50 } },
    { label: "创造表达", delta: { creation: vector.creation - 50 } },
    { label: "遗憾风险", delta: { regret: vector.regret - 50 } },
  ];
}

function ageDay(age: number, offsetDays = 0) {
  return age * YEAR + offsetDays;
}

function ageSpan(
  startAge: number,
  endAge: number,
  granularity: LifeScale,
  startLabel: string,
  endLabel: string,
  durationLabel: string,
) {
  return {
    startLabel,
    endLabel,
    durationLabel,
    range: timeRange(ageDay(startAge), ageDay(endAge), granularity),
  };
}

function localSpan(
  startDay: number,
  endDay: number,
  granularity: LifeScale,
  startLabel: string,
  endLabel: string,
  durationLabel: string,
) {
  return {
    startLabel,
    endLabel,
    durationLabel,
    range: timeRange(startDay, endDay, granularity),
  };
}

function demoNode(path: ForkPath): ForkPath {
  const next = {
    nodeType: path.nodeType ?? (path.mapRole === "event" ? "life-node" : "life-map"),
    consequences: path.consequences ?? (path.stateVector ? consequences(path.stateVector) : undefined),
    ...path,
  };

  return {
    ...next,
    dynamicType: next.dynamicType ?? buildDynamicTypeBranchSignal(next),
  };
}

const hourBeforePresentationStart = ageDay(7, 8 * MONTH + 11 * DAY + 8 / 24);
const firstPresentationDayStart = ageDay(7, 8 * MONTH + 11 * DAY);
const firstClubWeekStart = ageDay(7, 8 * MONTH + 7 * DAY);
const careWeekStart = ageDay(36, 5 * MONTH + 14 * DAY);
const finalWeekStart = ageDay(86, 3 * MONTH + 14 * DAY);
const finalDayStart = ageDay(86, 3 * MONTH + 19 * DAY);
const lastMessageStart = ageDay(86, 3 * MONTH + 19 * DAY + 20 / 24);

export const fullLifeDemoForks: ForkPath[] = [
  demoNode({
    id: "demo-life-complete",
    depth: 1,
    mapRole: "life-container",
    scale: "life",
    lane: "experiment",
    timeSpan: ageSpan(0, 90, "life", "出生", "90 岁", "完整人生"),
    title: "完整人生示例：从出生到晚年",
    subtitle: "按时间查看重要经历、选择和结果。",
    summary:
      "这是一份演示数据。你可以从完整人生逐步放大到十年、阶段、一年、一个月、一周、一天和一小时，查看每个节点发生了什么以及产生了哪些影响。",
    gains: ["可以查看完整时间线", "每个时间尺度都能进入", "重点选择保持清楚"],
    costs: ["内容来自演示数据", "部分分支按需显示", "不能用于判断你的真实情况"],
    futureSelfName: "这份示例中的你",
    futureSelfVoice: "具体、清楚，按时间说明经历和结果",
    stateVector: state({ autonomy: 70, stability: 68, intimacy: 72, creation: 74, energy: 60, regret: 18, uncertainty: 30 }),
    zoomHint: "放大地图，可以依次查看童年、成年、家庭责任和晚年节点。",
    children: [
      demoNode({
        id: "demo-decade-childhood",
        parentId: "demo-life-complete",
        depth: 2,
        mapRole: "period",
        scale: "decade",
        lane: "stability",
        timeSpan: ageSpan(0, 10, "decade", "0 岁", "10 岁", "第一个十年"),
        title: "0-10 岁：安全感和表达方式开始成形",
        subtitle: "家庭回应和早期经历会影响你的表达习惯。",
        summary: "这十年包含家庭互动、学校经历和第一次公开表达。放大后可以查看更具体的年份、月份和事件。",
        gains: ["可以追溯早期经历", "能看到表达习惯的来源", "可以进入具体事件"],
        costs: ["早期记忆可能不完整", "单个事件不能解释全部性格", "需要结合后续经历判断"],
        futureSelfName: "童年阶段的你",
        futureSelfVoice: "简单、谨慎，会使用当时年龄能理解的表达",
        stateVector: state({ autonomy: 22, stability: 64, intimacy: 72, creation: 42, energy: 76, regret: 4, uncertainty: 68 }),
        children: [
          demoNode({
            id: "demo-era-age-6-9",
            parentId: "demo-decade-childhood",
            depth: 3,
            mapRole: "period",
            scale: "era",
            lane: "stability",
            timeSpan: ageSpan(6, 9, "era", "6 岁", "9 岁", "三年成长阶段"),
            title: "6-9 岁：第一次发现表达会改变关系",
            subtitle: "他人的回应会影响你是否愿意继续表达。",
            summary: "6 到 9 岁期间，你开始注意到表达会改变老师、同学和家人的反应，并据此调整自己的说话方式。",
            gains: ["更愿意尝试表达", "开始观察他人反应", "形成早期沟通经验"],
            costs: ["容易依赖他人评价", "一次负面反馈可能让你退缩", "仍缺少稳定判断"],
            futureSelfName: "刚开始表达的你",
            futureSelfVoice: "小心、简短，会先确认大人的反应",
            stateVector: state({ autonomy: 30, stability: 68, intimacy: 74, creation: 52, energy: 72, regret: 6, uncertainty: 58 }),
            children: [
              demoNode({
                id: "demo-year-age-7",
                parentId: "demo-era-age-6-9",
                depth: 4,
                mapRole: "period",
                scale: "year",
                lane: "creation",
                timeSpan: ageSpan(7, 8, "year", "7 岁", "8 岁", "一年"),
                title: "7 岁：第一次参加公开展示",
                subtitle: "一次具体经历让你开始练习公开表达。",
                summary: "这一年，你参加了一次公开展示。准备和完成过程让你第一次获得关于表达能力的直接反馈。",
                gains: ["获得公开表达经验", "了解紧张时的反应", "开始建立完成信心"],
                costs: ["仍依赖外界反馈", "准备过程会焦虑", "负面评价可能影响后续尝试"],
                futureSelfName: "7 岁那年的你",
                futureSelfVoice: "简单、紧张，但愿意说明自己的感受",
                stateVector: state({ autonomy: 34, stability: 66, intimacy: 70, creation: 58, energy: 74, regret: 5, uncertainty: 54 }),
                children: [
                  demoNode({
                    id: "demo-month-age-7-september",
                    parentId: "demo-year-age-7",
                    depth: 5,
                    mapRole: "period",
                    scale: "month",
                    lane: "creation",
                    timeSpan: localSpan(ageDay(7, 8 * MONTH), ageDay(7, 9 * MONTH), "month", "7 岁 9 月", "7 岁 10 月", "一个月"),
                    title: "7 岁 9 月：你开始准备一次小展示",
                    subtitle: "这个月的主要任务是准备和练习。",
                    summary: "你在这个月经历紧张、练习、逃避和重新尝试。放大后可以查看展示前一周和展示当天。",
                    gains: ["练习次数增加", "任务更具体", "可以观察紧张变化"],
                    costs: ["容易临时放弃", "会在意同学评价", "需要家长或老师支持"],
                    futureSelfName: "7 岁 9 月的你",
                    futureSelfVoice: "简短、犹豫，会说明练习和担心",
                    stateVector: state({ autonomy: 36, stability: 62, intimacy: 68, creation: 62, energy: 70, regret: 8, uncertainty: 50 }),
                    children: [
                      demoNode({
                        id: "demo-week-first-club",
                        parentId: "demo-month-age-7-september",
                        depth: 6,
                        mapRole: "period",
                        scale: "week",
                        lane: "creation",
                        timeSpan: localSpan(firstClubWeekStart, firstClubWeekStart + WEEK, "week", "展示前一周", "展示日", "一周"),
                        title: "展示前一周：你每天都想退出",
                        subtitle: "一周内反复出现练习和退出的想法。",
                        summary: "展示前一周，你每天都会练习，也多次想退出。这个阶段可以用来观察紧张、支持和完成意愿的变化。",
                        gains: ["练习形成节奏", "可以识别紧张触发点", "得到老师或家人的支持"],
                        costs: ["情绪波动频繁", "睡眠可能受影响", "容易因一次失误放弃"],
                        futureSelfName: "展示前一周的你",
                        futureSelfVoice: "急促、简单，会同时说出想退出和想完成",
                        stateVector: state({ autonomy: 38, stability: 58, intimacy: 66, creation: 66, energy: 64, regret: 12, uncertainty: 54 }),
                        children: [
                          demoNode({
                            id: "demo-day-first-presentation",
                            parentId: "demo-week-first-club",
                            depth: 7,
                            mapRole: "event",
                            scale: "day",
                            lane: "creation",
                            timeSpan: localSpan(firstPresentationDayStart, firstPresentationDayStart + DAY, "day", "展示当天", "当晚", "一天"),
                            title: "展示当天：完成第一次公开表达",
                            subtitle: "一个可以明确记录结果的具体事件。",
                            summary: "你在紧张中完成了展示。这个结果证明你能够在准备后完成公开表达，但不能据此判断所有未来表现。",
                            gains: ["完成一次公开表达", "获得实际反馈", "对下次准备更有经验"],
                            costs: ["当天压力较高", "仍可能在意评价", "一次成功不能代表长期稳定"],
                            futureSelfName: "展示当天的你",
                            futureSelfVoice: "紧张、短句，会描述刚刚发生的事情",
                            stateVector: state({ autonomy: 44, stability: 56, intimacy: 68, creation: 74, energy: 66, regret: 8, uncertainty: 46 }),
                            children: [
                              demoNode({
                                id: "demo-hour-before-presentation",
                                parentId: "demo-day-first-presentation",
                                depth: 8,
                                mapRole: "event",
                                scale: "hour",
                                lane: "creation",
                                timeSpan: localSpan(
                                  hourBeforePresentationStart,
                                  hourBeforePresentationStart + 1 / 24,
                                  "hour",
                                  "上台前 1 小时",
                                  "上台前",
                                  "一小时",
                                ),
                                title: "上台前 1 小时：你决定先说第一句",
                                subtitle: "把任务缩小为说出准备好的第一句话。",
                                summary: "上台前一小时，你只专注于记住并说出第一句话。这个小目标可以降低启动压力。",
                                gains: ["目标具体", "更容易开始", "可以降低临场混乱"],
                                costs: ["仍然会紧张", "后续内容还需完成", "需要现场支持"],
                                futureSelfName: "上台前一小时的你",
                                futureSelfVoice: "很轻、很短，会重复准备好的第一句话",
                                stateVector: state({ autonomy: 46, stability: 52, intimacy: 66, creation: 78, energy: 58, regret: 6, uncertainty: 48 }),
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      demoNode({
        id: "demo-decade-adolescence",
        parentId: "demo-life-complete",
        depth: 2,
        mapRole: "period",
        scale: "decade",
        lane: "relationship",
        timeSpan: ageSpan(10, 20, "decade", "10 岁", "20 岁", "第二个十年"),
        title: "10-20 岁：第一次独立选择城市和学校",
        subtitle: "选择会同时影响学习、家庭关系和生活环境。",
        summary: "这个十年包含升学、离家和留在本地等选择。地图先显示主要路径，进入节点后可以查看其他方案。",
        gains: ["自主选择增加", "接触新的环境", "开始形成独立判断"],
        costs: ["家庭沟通成本增加", "适应压力上升", "信息不足时容易过度判断"],
        futureSelfName: "18 岁前后的你",
        futureSelfVoice: "敏感、直接，会同时说明期待和担心",
        stateVector: state({ autonomy: 50, stability: 50, intimacy: 66, creation: 58, energy: 68, regret: 18, uncertainty: 62 }),
        children: [
          demoNode({
            id: "demo-era-age-17-19",
            parentId: "demo-decade-adolescence",
            depth: 3,
            mapRole: "period",
            scale: "era",
            lane: "relationship",
            timeSpan: ageSpan(17, 19, "era", "17 岁", "19 岁", "升学与离家阶段"),
            title: "17-19 岁：比较离开、留下和延期三种方案",
            subtitle: "需要同时考虑学校、城市、费用和家庭关系。",
            summary: "这个阶段有三种主要方案：去更远的城市、留在附近，或者延期一年再决定。示例主路径选择离开，其他方案仍可进入查看。",
            gains: ["方案可以直接比较", "现实条件更清楚", "可以提前准备适应问题"],
            costs: ["每种方案都有损失", "家庭意见可能冲突", "结果仍有不确定性"],
            futureSelfName: "想去远方的你",
            futureSelfVoice: "直接、犹豫，会说明离开和留下的原因",
            stateVector: state({ autonomy: 58, stability: 44, intimacy: 62, creation: 60, energy: 70, regret: 22, uncertainty: 68 }),
            children: [
              demoNode({
                id: "demo-year-age-18",
                parentId: "demo-era-age-17-19",
                depth: 4,
                mapRole: "period",
                scale: "year",
                lane: "relationship",
                timeSpan: ageSpan(18, 19, "year", "18 岁", "19 岁", "一年"),
                title: "18 岁：决定去外地还是留在本地",
                subtitle: "这是影响学习、家庭关系和独立生活的重要选择。",
                summary: "这一年，你需要比较学校机会、城市距离、生活成本和家庭关系。地图显示当前选择，同时保留其他可进入的方案。",
                gains: ["强分岔清晰", "可以进入聊天", "能测试回退和重新选择"],
                costs: ["家庭沟通成本高", "不确定性上升", "容易把选择与个人价值绑定"],
                futureSelfName: "18 岁做选择的你",
                futureSelfVoice: "简短、直接，会承认对家庭的不舍",
                stateVector: state({ autonomy: 62, stability: 42, intimacy: 58, creation: 62, energy: 72, regret: 24, uncertainty: 72 }),
                children: [
                  demoNode({
                    id: "demo-age-18-leave-city",
                    parentId: "demo-year-age-18",
                    depth: 5,
                    mapRole: "checkpoint",
                    scale: "month",
                    lane: "leap",
                    timeSpan: localSpan(ageDay(18, 2 * MONTH), ageDay(18, 3 * MONTH), "month", "18 岁初秋", "离开前", "一个月"),
                    title: "18 岁初秋：你选择去更远的城市",
                    subtitle: "选择更多机会，同时承担更高适应成本。",
                    summary: "你选择去更远的城市。新环境会带来更多学习和独立机会，也会增加生活成本、孤独和家庭沟通压力。",
                    gains: ["自主感上升", "新环境反馈更快", "身份开始松动"],
                    costs: ["亲密关系被拉远", "稳定性下降", "孤独感短期上升"],
                    futureSelfName: "离开城市的你",
                    futureSelfVoice: "克制、兴奋，会说明适应情况和实际成本",
                    stateVector: state({ autonomy: 72, stability: 36, intimacy: 48, creation: 68, energy: 76, regret: 20, uncertainty: 78 }),
                  }),
                  demoNode({
                    id: "demo-age-18-stay-close",
                    parentId: "demo-year-age-18",
                    depth: 5,
                    mapRole: "checkpoint",
                    scale: "month",
                    lane: "stability",
                    timeSpan: localSpan(ageDay(18, 2 * MONTH), ageDay(18, 3 * MONTH), "month", "18 岁初秋", "开学前", "一个月"),
                    title: "18 岁初秋：你选择留在更近的地方",
                    subtitle: "降低适应和关系成本，保留熟悉支持。",
                    summary: "你选择更靠近家庭和熟悉关系的地方。生活适应更容易，但需要另外安排独立成长和探索机会。",
                    gains: ["关系连续性更强", "适应成本较低", "安全感保留"],
                    costs: ["可能反复考虑外地机会", "需要主动争取独立空间", "可能把稳妥误解为退让"],
                    futureSelfName: "留在近处的你",
                    futureSelfVoice: "温和、谨慎，会说明留下后的收益和遗憾",
                    stateVector: state({ autonomy: 52, stability: 68, intimacy: 74, creation: 54, energy: 62, regret: 34, uncertainty: 44 }),
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      demoNode({
        id: "demo-decade-twenties",
        parentId: "demo-life-complete",
        depth: 2,
        mapRole: "period",
        scale: "decade",
        lane: "experiment",
        timeSpan: ageSpan(20, 30, "decade", "20 岁", "30 岁", "第三个十年"),
        title: "20-30 岁：协调工作、城市和个人项目",
        subtitle: "稳定收入和个人发展开始争夺时间。",
        summary: "这个十年包含第一份工作、第一次独居和个人项目。你需要持续调整工作收入、休息和长期目标之间的比例。",
        gains: ["工作经验增加", "独立生活能力提高", "可以测试个人方向"],
        costs: ["时间容易被工作占满", "精力分配困难", "长期目标可能反复推迟"],
        futureSelfName: "二十多岁的你",
        futureSelfVoice: "语速较快，会直接说明工作压力和个人目标",
        stateVector: state({ autonomy: 68, stability: 48, intimacy: 54, creation: 72, energy: 70, regret: 20, uncertainty: 64 }),
        children: [
          demoNode({
            id: "demo-era-age-23-27",
            parentId: "demo-decade-twenties",
            depth: 3,
            mapRole: "period",
            scale: "era",
            lane: "experiment",
            timeSpan: ageSpan(23, 27, "era", "23 岁", "27 岁", "第一份工作阶段"),
            title: "23-27 岁：你把能力放进现实系统",
            subtitle: "个人目标需要接受绩效、房租和精力限制。",
            summary: "23 到 27 岁期间，你需要同时处理工作、租房和个人项目。这个阶段重点比较时间、收入和精力的实际分配。",
            gains: ["更了解现实约束", "工作能力提升", "个人方向开始获得实际测试"],
            costs: ["信息和任务较多", "精力容易不足", "个人项目进度不稳定"],
            futureSelfName: "刚进入现实系统的你",
            futureSelfVoice: "清醒、紧张，会按工作、收入和精力说明情况",
            stateVector: state({ autonomy: 66, stability: 52, intimacy: 50, creation: 74, energy: 66, regret: 22, uncertainty: 60 }),
            children: [
              demoNode({
                id: "demo-year-age-24",
                parentId: "demo-era-age-23-27",
                depth: 4,
                mapRole: "period",
                scale: "year",
                lane: "experiment",
                timeSpan: ageSpan(24, 25, "year", "24 岁", "25 岁", "一年"),
                title: "24 岁：你开始认真安排工作之外的表达",
                subtitle: "需要为工作、休息和个人项目分配固定时间。",
                summary: "这一年，你确认稳定收入和个人项目都很重要，并开始用月度计划检查两者是否可以同时维持。",
                gains: ["价值冲突明确", "可承接月度节点", "适合分享卡展示"],
                costs: ["时间被切碎", "自我要求升高", "容易把休息视为失败"],
                futureSelfName: "24 岁谈判时间的你",
                futureSelfVoice: "具体、焦虑，会说明工作之外还能投入多少时间",
                stateVector: state({ autonomy: 70, stability: 54, intimacy: 48, creation: 78, energy: 62, regret: 18, uncertainty: 58 }),
                children: [
                  demoNode({
                    id: "demo-month-first-apartment",
                    parentId: "demo-year-age-24",
                    depth: 5,
                    mapRole: "period",
                    scale: "month",
                    lane: "experiment",
                    timeSpan: localSpan(ageDay(24, 4 * MONTH), ageDay(24, 5 * MONTH), "month", "24 岁 5 月", "24 岁 6 月", "一个月"),
                    title: "24 岁 5 月：调整住处和下班后的时间安排",
                    subtitle: "用一个月测试个人项目能否稳定执行。",
                    summary: "这个月你重新安排工作区、睡眠和下班后的两小时，记录完成率和精力变化。",
                    gains: ["执行信心增加", "项目节奏可观察", "生活安排开始可调整"],
                    costs: ["社交变少", "睡眠容易被压缩", "如果中断会自责"],
                    futureSelfName: "调整生活安排后的你",
                    futureSelfVoice: "专注、具体，会说明时间使用和完成情况",
                    stateVector: state({ autonomy: 74, stability: 58, intimacy: 44, creation: 82, energy: 58, regret: 16, uncertainty: 50 }),
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      demoNode({
        id: "demo-decade-thirties",
        parentId: "demo-life-complete",
        depth: 2,
        mapRole: "period",
        scale: "decade",
        lane: "relationship",
        timeSpan: ageSpan(30, 40, "decade", "30 岁", "40 岁", "第四个十年"),
        title: "30-40 岁：家庭责任开始影响时间安排",
        subtitle: "关系、照护、工作和个人目标需要重新分配精力。",
        summary: "三十多岁时，家庭照护和关系责任增加。你需要明确任务分工、可承担上限和个人时间。",
        gains: ["责任分工更清楚", "可以提前安排支持", "长期计划更接近现实"],
        costs: ["沟通压力增加", "可支配时间减少", "内疚可能影响边界"],
        futureSelfName: "三十多岁的你",
        futureSelfVoice: "缓慢、诚实，会明确说明责任和承受上限",
        stateVector: state({ autonomy: 62, stability: 64, intimacy: 78, creation: 64, energy: 52, regret: 24, uncertainty: 42 }),
        children: [
          demoNode({
            id: "demo-era-age-34-38",
            parentId: "demo-decade-thirties",
            depth: 3,
            mapRole: "period",
            scale: "era",
            lane: "relationship",
            timeSpan: ageSpan(34, 38, "era", "34 岁", "38 岁", "照护与边界阶段"),
            title: "34-38 岁：把照护任务纳入长期安排",
            subtitle: "把临时帮助改成可持续的分工。",
            summary: "这个阶段需要继续承担照护责任，同时重新设置时间、金钱和替代人员安排，避免长期透支。",
            gains: ["任务更可持续", "可以获得他人协助", "个人边界更清楚"],
            costs: ["相关人员可能不适应", "需要反复协调", "突发情况仍会打乱计划"],
            futureSelfName: "重新安排照护任务的你",
            futureSelfVoice: "疲惫但清楚，会说明能做什么和不能做什么",
            stateVector: state({ autonomy: 58, stability: 66, intimacy: 82, creation: 58, energy: 46, regret: 28, uncertainty: 44 }),
            children: [
              demoNode({
                id: "demo-year-age-36",
                parentId: "demo-era-age-34-38",
                depth: 4,
                mapRole: "period",
                scale: "year",
                lane: "relationship",
                timeSpan: ageSpan(36, 37, "year", "36 岁", "37 岁", "一年"),
                title: "36 岁：把照护边界写成具体安排",
                subtitle: "用任务、时间和替代人员减少临时冲突。",
                summary: "这一年，你重新安排关系、照护、工作、个人项目和休息时间，并设置每月复盘。",
                gains: ["责任更可执行", "沟通更透明", "减少长期透支"],
                costs: ["谈判会有阻力", "内疚感短期上升", "计划需要复盘"],
                futureSelfName: "36 岁重新排程的你",
                futureSelfVoice: "平和但坚定，会说明具体安排和边界",
                stateVector: state({ autonomy: 64, stability: 68, intimacy: 80, creation: 60, energy: 50, regret: 22, uncertainty: 38 }),
                children: [
                  demoNode({
                    id: "demo-month-care-season",
                    parentId: "demo-year-age-36",
                    depth: 5,
                    mapRole: "period",
                    scale: "month",
                    lane: "relationship",
                    timeSpan: localSpan(ageDay(36, 5 * MONTH), ageDay(36, 6 * MONTH), "month", "36 岁 6 月", "36 岁 7 月", "一个月"),
                    title: "36 岁 6 月：你把照护任务排进共享日历",
                    subtitle: "把口头承诺改成可查看、可替换的任务。",
                    summary: "这个月你把照护安排写入共享日历，标明负责人、时间和替代方案。",
                    gains: ["任务压力可见", "协作更容易", "边界有明确记录"],
                    costs: ["有人会不适应", "沟通成本上升", "仍需处理突发情况"],
                    futureSelfName: "共享日历里的你",
                    futureSelfVoice: "平实、疲惫，会说明任务分配和未解决问题",
                    stateVector: state({ autonomy: 66, stability: 72, intimacy: 82, creation: 58, energy: 48, regret: 20, uncertainty: 34 }),
                    children: [
                      demoNode({
                        id: "demo-week-care-review",
                        parentId: "demo-month-care-season",
                        depth: 6,
                        mapRole: "period",
                        scale: "week",
                        lane: "relationship",
                        timeSpan: localSpan(careWeekStart, careWeekStart + WEEK, "week", "复盘周", "周末", "一周"),
                        title: "复盘周：调整超出承受范围的任务",
                        subtitle: "检查本周投入，并重新分配下周任务。",
                        summary: "这一周你说明了过去的透支情况，并提出下一周的任务调整和替代人员安排。",
                        gains: ["边界更清楚", "关系有机会重新分工", "能量损耗下降"],
                        costs: ["内疚感仍在", "别人可能失望", "需要持续执行"],
                        futureSelfName: "复盘周的你",
                        futureSelfVoice: "低沉、坚定，会明确说明无法继续承担的部分",
                        stateVector: state({ autonomy: 68, stability: 70, intimacy: 78, creation: 56, energy: 46, regret: 18, uncertainty: 36 }),
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      demoNode({
        id: "demo-decade-fifties",
        parentId: "demo-life-complete",
        depth: 2,
        mapRole: "period",
        scale: "decade",
        lane: "creation",
        timeSpan: ageSpan(50, 60, "decade", "50 岁", "60 岁", "第六个十年"),
        title: "50-60 岁：把经验整理成他人可以使用的方法",
        subtitle: "工作重点从个人完成转向整理、教学和交接。",
        summary: "五十多岁时，你开始把长期经验整理为作品、课程或方法，并修复部分重要关系。",
        gains: ["经验可以复用", "帮助他人解决问题", "长期成果更完整"],
        costs: ["需要投入整理时间", "需要接受他人修改", "身体精力可能下降"],
        futureSelfName: "五十多岁的你",
        futureSelfVoice: "沉稳、清楚，会区分重要经验和可省略内容",
        stateVector: state({ autonomy: 76, stability: 72, intimacy: 70, creation: 84, energy: 62, regret: 14, uncertainty: 28 }),
        children: [
          demoNode({
            id: "demo-era-age-52-55",
            parentId: "demo-decade-fifties",
            depth: 3,
            mapRole: "period",
            scale: "era",
            lane: "creation",
            timeSpan: ageSpan(52, 55, "era", "52 岁", "55 岁", "整理与传递阶段"),
            title: "52-55 岁：你把经验做成一套可交给别人的方法",
            subtitle: "让经验可以在你不在场时继续被使用。",
            summary: "这个阶段可以选择整理作品、开展教学或建立交接流程，并根据体力和时间选择投入方式。",
            gains: ["经验可传递", "亲密和创造重新连接", "长期回报可见"],
            costs: ["会面对身体限制", "需要放下控制", "作品不再只属于自己"],
            futureSelfName: "整理经验的你",
            futureSelfVoice: "缓慢、准确，会说明哪些方法已经验证有效",
            stateVector: state({ autonomy: 78, stability: 74, intimacy: 72, creation: 86, energy: 60, regret: 12, uncertainty: 24 }),
            children: [
              demoNode({
                id: "demo-year-age-53",
                parentId: "demo-era-age-52-55",
                depth: 4,
                mapRole: "period",
                scale: "year",
                lane: "creation",
                timeSpan: ageSpan(53, 54, "year", "53 岁", "54 岁", "一年"),
                title: "53 岁：第一次让他人独立使用你的方法",
                subtitle: "检查方法是否清楚、可复制。",
                summary: "这一年，你让自己的经验离开个人叙事，变成他人可以使用的方法。",
                gains: ["影响力变具体", "自我价值更稳定", "作品开始服务别人"],
                costs: ["要接受他人改写", "控制感下降", "体力安排更重要"],
                futureSelfName: "53 岁放手传递的你",
                futureSelfVoice: "平和、清楚，会根据使用结果调整方法",
                stateVector: state({ autonomy: 80, stability: 76, intimacy: 74, creation: 88, energy: 58, regret: 10, uncertainty: 22 }),
                children: [
                  demoNode({
                    id: "demo-month-age-53-mentor",
                    parentId: "demo-year-age-53",
                    depth: 5,
                    mapRole: "checkpoint",
                    scale: "month",
                    lane: "creation",
                    timeSpan: localSpan(ageDay(53, 9 * MONTH), ageDay(53, 10 * MONTH), "month", "53 岁 10 月", "53 岁 11 月", "一个月"),
                    title: "53 岁 10 月：帮助一位年轻人拆解问题",
                    subtitle: "提供方法、错误案例和适用边界。",
                    summary: "这个月你先说明分析方法、常见错误和适用条件，让对方独立判断。",
                    gains: ["经验得到使用", "形成互相学习", "方法价值获得验证"],
                    costs: ["会想过度负责", "要处理投射", "需要保留对方空间"],
                    futureSelfName: "53 岁 10 月的你",
                    futureSelfVoice: "稳定、简洁，会提供方法但不替对方决定",
                    stateVector: state({ autonomy: 80, stability: 76, intimacy: 78, creation: 86, energy: 56, regret: 10, uncertainty: 20 }),
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      demoNode({
        id: "demo-decade-final",
        parentId: "demo-life-complete",
        depth: 2,
        mapRole: "period",
        scale: "decade",
        lane: "stability",
        timeSpan: ageSpan(80, 90, "decade", "80 岁", "90 岁", "晚年十年"),
        title: "80-90 岁：整理个人记录和重要交代",
        subtitle: "决定保留哪些照片、录音、文件和说明。",
        summary: "晚年阶段重点处理个人材料、授权和重要说明。地图只显示代表节点，避免一次展示过多内容。",
        gains: ["重要材料得到整理", "家人更容易理解", "个人意愿有明确记录"],
        costs: ["整理需要精力", "会涉及失去和死亡话题", "内容需要设置访问权限"],
        futureSelfName: "整理个人记录的你",
        futureSelfVoice: "安静、清楚，会说明材料用途和访问范围",
        stateVector: state({ autonomy: 72, stability: 78, intimacy: 82, creation: 78, energy: 36, regret: 12, uncertainty: 18 }),
        children: [
          demoNode({
            id: "demo-era-age-84-88",
            parentId: "demo-decade-final",
            depth: 3,
            mapRole: "period",
            scale: "era",
            lane: "stability",
            timeSpan: ageSpan(84, 88, "era", "84 岁", "88 岁", "告别整理阶段"),
            title: "84-88 岁：选择需要保留的个人材料",
            subtitle: "按主题、对象和访问权限整理。",
            summary: "这个阶段把重要经历整理为照片、录音、文字和说明，并决定哪些内容可以回放、对话或分享。",
            gains: ["个人材料得到整理", "家人可以了解重要经历", "未完成事项有明确说明"],
            costs: ["可能触发悲伤", "部分内容需要保持私密", "每个人的处理方式不同"],
            futureSelfName: "整理重要材料的你",
            futureSelfVoice: "缓慢、稳定，会按主题说明内容",
            stateVector: state({ autonomy: 70, stability: 80, intimacy: 84, creation: 78, energy: 34, regret: 10, uncertainty: 16 }),
            children: [
              demoNode({
                id: "demo-year-age-86",
                parentId: "demo-era-age-84-88",
                depth: 4,
                mapRole: "period",
                scale: "year",
                lane: "stability",
                timeSpan: ageSpan(86, 87, "year", "86 岁", "87 岁", "一年"),
                title: "86 岁：录制一段重要说明",
                subtitle: "说明个人意愿、感谢和材料使用方式。",
                summary: "这一年，你录制一段可以回放的说明，内容包括重要意愿、想感谢的人和材料访问方式。",
                gains: ["个人意愿更清楚", "家人可以反复查看", "关键内容有稳定记录"],
                costs: ["可能触发悲伤", "需要确认隐私设置", "内容可能需要多次修改"],
                futureSelfName: "86 岁录制说明的你",
                futureSelfVoice: "缓慢、清楚，每句话都尽量具体",
                stateVector: state({ autonomy: 68, stability: 80, intimacy: 86, creation: 76, energy: 32, regret: 8, uncertainty: 14 }),
                children: [
                  demoNode({
                    id: "demo-month-final-spring",
                    parentId: "demo-year-age-86",
                    depth: 5,
                    mapRole: "period",
                    scale: "month",
                    lane: "stability",
                    timeSpan: localSpan(ageDay(86, 3 * MONTH), ageDay(86, 4 * MONTH), "month", "86 岁春天", "晚春", "一个月"),
                    title: "86 岁春天：你把旧照片按故事排序",
                    subtitle: "按时间和主题整理照片、信件和录音。",
                    summary: "这个月你为照片、信件和录音补充日期、人物和背景说明，方便之后查看。",
                    gains: ["材料信息更完整", "家人更容易理解", "重要经历有明确背景"],
                    costs: ["整理很耗体力", "会遇见失去", "需要允许中断"],
                    futureSelfName: "整理旧照片的你",
                    futureSelfVoice: "缓慢、简短，会说明每份材料的日期和背景",
                    stateVector: state({ autonomy: 66, stability: 82, intimacy: 88, creation: 74, energy: 30, regret: 8, uncertainty: 12 }),
                    children: [
                      demoNode({
                        id: "demo-week-replay-archive",
                        parentId: "demo-month-final-spring",
                        depth: 6,
                        mapRole: "period",
                        scale: "week",
                        lane: "stability",
                        timeSpan: localSpan(finalWeekStart, finalWeekStart + WEEK, "week", "整理周", "周末", "一周"),
                        title: "整理周：检查重要录音和文字",
                        subtitle: "确认内容是否准确、完整并适合保留。",
                        summary: "这一周你检查童年、离家、家庭照护和工作经验等阶段的录音，删除重复内容并补充必要说明。",
                        gains: ["重要经历形成连续记录", "内容可以检查", "缺失信息被发现"],
                        costs: ["回看会疲惫", "可能想删掉某些段落", "需要尊重沉默"],
                        futureSelfName: "整理周的你",
                        futureSelfVoice: "安静、清楚，会主动补充容易误解的背景",
                        stateVector: state({ autonomy: 66, stability: 82, intimacy: 88, creation: 72, energy: 28, regret: 8, uncertainty: 12 }),
                        children: [
                          demoNode({
                            id: "demo-day-farewell-recording",
                            parentId: "demo-week-replay-archive",
                            depth: 7,
                            mapRole: "event",
                            scale: "day",
                            lane: "stability",
                            timeSpan: localSpan(finalDayStart, finalDayStart + DAY, "day", "录音那天", "夜里", "一天"),
                            title: "录音当天：完成简短的重要说明",
                            subtitle: "只保留最需要说明的内容。",
                            summary: "这一天你没有总结所有经历，只录下几句希望家人在需要时可以听到的话。",
                            gains: ["重要说明完成", "分享范围可以设置", "内容有明确上下文"],
                            costs: ["情绪压力较大", "内容需要克制", "需要确认授权和隐私"],
                            futureSelfName: "录音那天的你",
                            futureSelfVoice: "很慢、很清楚，会在每句话之间停顿",
                            stateVector: state({ autonomy: 64, stability: 82, intimacy: 90, creation: 70, energy: 24, regret: 6, uncertainty: 10 }),
                            children: [
                              demoNode({
                                id: "demo-hour-last-message",
                                parentId: "demo-day-farewell-recording",
                                depth: 8,
                                mapRole: "event",
                                scale: "hour",
                                lane: "stability",
                                timeSpan: localSpan(lastMessageStart, lastMessageStart + 1 / 24, "hour", "20:00", "21:00", "最后一段录音"),
                                title: "20:00：保存最后一段授权分享的录音",
                                subtitle: "明确内容、接收人和访问条件。",
                                summary: "这一小时，你完成最后一段授权分享的录音，并检查接收人、访问条件和删除方式。",
                                gains: ["个人记录完整", "授权范围明确", "家人可以按条件查看"],
                                costs: ["涉及死亡和失去", "需要避免造成压力", "授权设置必须准确"],
                                futureSelfName: "留下最后一段话的你",
                                futureSelfVoice: "很轻、很慢，会直接说明授权和想表达的内容",
                                stateVector: state({ autonomy: 62, stability: 82, intimacy: 90, creation: 68, energy: 20, regret: 6, uncertainty: 8 }),
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  }),
];

const fullLifeDemoInput: GenerateSelfSkillInput = {
  selectedVersion: "future",
  currentChoice: "怎样同时处理个人项目、重要关系和现实责任",
  recurringEmotion: "紧张、疲惫，但仍然想推进个人项目",
  pastNode: "7 岁时第一次完成公开表达",
  hiddenSelf: "一直想把经验整理成作品，又担心影响关系",
  futureSentence: "先把长期问题拆成可以检查和调整的阶段任务。",
  extraText:
    "这是一份完整人生演示数据，包含出生、成长、离家、工作、家庭照护、经验传递和晚年整理。高频选择只在进入相关节点后显示。",
};

const generatedSelfSkill = generateSelfSkill(fullLifeDemoInput, {
  now: SCENARIO_CREATED_AT,
  seed: "life-scenario-lab-full-life-demo-v0.5",
});
// 演示数据同样经过资产情景启发式生成，保证示例里每个节点都有可交互趋势图
const fullLifeDemoForksWithAssets = attachAssetOutlooks(fullLifeDemoForks);
const fullLifeDemoDynamicTypeProfile = buildDynamicTypeProfile(fullLifeDemoInput, generatedSelfSkill.evidence, fullLifeDemoForks);

function stageVoice(stage: "past" | "hidden" | "present" | "future" | "fork") {
  return generatedSelfSkill.stageVoices.find((voice) => voice.stage === stage);
}

const fullLifeDemoTimeline: TimelineNode[] = [
  {
    id: "scenario-timeline-birth",
    yearLabel: "出生",
    title: "出生：记录家庭和环境的初始条件",
    emotion: "依赖照顾、无法自主表达",
    pattern: "后续发展会受到身体、家庭和成长环境影响。",
    voice: stageVoice("past"),
  },
  {
    id: "scenario-timeline-childhood",
    yearLabel: "早年",
    title: "早年：形成初步的安全感和表达习惯",
    emotion: "敏感、试探、在意他人回应",
    pattern: "你逐渐根据家人和老师的回应调整表达方式。",
    voice: stageVoice("past"),
  },
  {
    id: "scenario-timeline-past",
    yearLabel: "过去",
    title: "7 岁时第一次完成公开表达",
    emotion: "紧张、兴奋、仍然担心评价",
    pattern: "这次经历让你学会先完成第一步，再根据回应调整。",
    voice: stageVoice("past"),
  },
  {
    id: "scenario-timeline-hidden",
    yearLabel: "长期目标",
    title: "一直想把经验整理成作品，又担心影响关系",
    emotion: "克制、投入、担心增加他人负担",
    pattern: "个人项目长期排在工作和关系之后，需要固定时间才能持续推进。",
    voice: stageVoice("hidden"),
  },
  {
    id: "scenario-timeline-now",
    yearLabel: "现在",
    title: "怎样同时处理个人项目、重要关系和现实责任",
    emotion: "紧张、疲惫，但仍想继续推进",
    pattern: "你需要把长期目标拆成可验证的任务，并明确时间和责任边界。",
    voice: stageVoice("present"),
  },
  {
    id: "scenario-timeline-future",
    yearLabel: "未来",
    title: "把长期问题拆成可以检查和调整的阶段任务",
    emotion: "平静、稳定、能够接受调整",
    pattern: "未来的你会根据记录和新证据定期更新计划。",
    voice: stageVoice("future"),
  },
];

export const fullLifeDemoSelfSkill: SelfSkill = {
  ...generatedSelfSkill,
  id: "scenario-full-life-demo-self-skill",
  version: "v0.3",
  createdAt: SCENARIO_CREATED_AT,
  identity: {
    ...generatedSelfSkill.identity,
    displayName: "完整人生示例",
    emotionalTone: "谨慎、具体、重视事实",
    selfNarrative: "在个人项目、重要关系和现实责任之间持续调整安排。",
    archetype: "谨慎规划型",
  },
  timeline: fullLifeDemoTimeline,
  dynamicTypeProfile: fullLifeDemoDynamicTypeProfile,
  forks: fullLifeDemoForksWithAssets,
};

export const fullLifeDemoPersona = {
  id: "persona-lin-an",
  displayName: "林安",
  premise: "一个重视表达和关系的人，长期需要协调个人项目、亲密关系和现实责任。",
  ageRangeLabel: "出生到 86 岁",
  coreValues: ["表达", "坦诚关系", "自主安排", "经验传递"],
  corePressures: ["安全感", "离家距离", "照护责任", "身体和衰老", "作品是否能被别人使用"],
  narrativeVoice: "克制、具体，优先说明事件、选择、收益和成本。",
  demoBoundaries: [
    "不把演示样本包装成用户命运预测。",
    "不把死亡节点写成恐吓或煽情终点。",
    "不把照护责任归咎给单个用户。",
    "所有高频年/月分岔都通过 choice set 表达。",
  ],
} satisfies CanonicalDemoPersona;

export const fullLifeDemoStages = [
  {
    id: "birth",
    label: "Birth",
    ageRangeLabel: "出生",
    primaryNodeId: "lifefork-history-birth",
    purpose: "提供从出生开始的 replay 起点，并让 Timeline 与 Life Map 拥有共同起点。",
    entryModes: ["timeline", "map"],
  },
  {
    id: "early-childhood",
    label: "Early childhood",
    ageRangeLabel: "0-10 岁",
    primaryNodeId: "demo-decade-childhood",
    supportingNodeIds: ["demo-era-age-6-9", "demo-year-age-7", "demo-hour-before-presentation"],
    purpose: "验证早年安全感、表达方式和最小尺度下钻。",
    entryModes: ["map", "chat"],
  },
  {
    id: "adolescence",
    label: "Adolescence",
    ageRangeLabel: "10-20 岁",
    primaryNodeId: "demo-decade-adolescence",
    supportingNodeIds: ["demo-era-age-17-19", "demo-year-age-18"],
    purpose: "验证离家、关系距离和自我证明的青春期分岔。",
    entryModes: ["map", "chat"],
  },
  {
    id: "university-or-early-adult",
    label: "University or early adult stage",
    ageRangeLabel: "18-24 岁",
    primaryNodeId: "demo-age-18-leave-city",
    supportingNodeIds: ["demo-age-18-stay-close", "demo-decade-twenties"],
    purpose: "覆盖进入新城市、大学或早期成人环境后的身份重组。",
    entryModes: ["map", "chat"],
  },
  {
    id: "first-career-identity",
    label: "First career identity",
    ageRangeLabel: "23-27 岁",
    primaryNodeId: "demo-era-age-23-27",
    supportingNodeIds: ["demo-year-age-24", "demo-month-first-apartment"],
    purpose: "验证第一份职业身份如何与表达、租金和身体互相拉扯。",
    entryModes: ["map", "chat", "share"],
  },
  {
    id: "relationship-pressure",
    label: "Relationship pressure",
    ageRangeLabel: "34-38 岁",
    primaryNodeId: "demo-era-age-34-38",
    supportingNodeIds: ["demo-year-age-36", "demo-week-care-review"],
    purpose: "验证亲密关系、照护责任和边界谈判。",
    entryModes: ["map", "chat"],
  },
  {
    id: "major-fork",
    label: "Major fork",
    ageRangeLabel: "18 岁",
    primaryNodeId: "demo-year-age-18",
    supportingNodeIds: ["demo-age-18-leave-city", "demo-age-18-stay-close"],
    purpose: "提供稳定分支和跃迁分支的共同入口。",
    entryModes: ["map", "chat"],
  },
  {
    id: "stabilization-or-leap",
    label: "Stabilization or leap",
    ageRangeLabel: "18 岁初秋",
    primaryNodeId: "demo-age-18-leave-city",
    supportingNodeIds: ["demo-age-18-stay-close"],
    purpose: "同时保留 stable 与 leap 的可选择节点，供 QA 验证分支进入。",
    entryModes: ["map", "chat"],
  },
  {
    id: "illness-or-aging",
    label: "Illness or aging",
    ageRangeLabel: "80-90 岁",
    primaryNodeId: "demo-decade-final",
    supportingNodeIds: ["demo-era-age-84-88"],
    purpose: "以 aging 场景覆盖晚年身体、精力和整理压力。",
    entryModes: ["map", "chat"],
  },
  {
    id: "late-life-reflection",
    label: "Late-life reflection",
    ageRangeLabel: "86 岁春天",
    primaryNodeId: "demo-year-age-86",
    supportingNodeIds: ["demo-month-final-spring", "demo-week-replay-archive"],
    purpose: "验证晚年回放、故事整理和分享素材。",
    entryModes: ["map", "chat", "share"],
  },
  {
    id: "death",
    label: "Death",
    ageRangeLabel: "86 岁最后一小时",
    primaryNodeId: "demo-hour-last-message",
    supportingNodeIds: ["demo-day-farewell-recording"],
    purpose: "提供完整人生 replay 的终点，并验证死亡节点仍可进入对话和分享。",
    entryModes: ["map", "chat", "share"],
  },
] satisfies ScenarioLifeStage[];

export function collectScenarioForkNodes(paths: readonly ForkPath[]): ForkPath[] {
  return paths.flatMap((path) => [path, ...collectScenarioForkNodes(path.children ?? [])]);
}

const renderedForkNodeCount = collectScenarioForkNodes(fullLifeDemoForksWithAssets).length;
const renderedAppNodeCount = renderedForkNodeCount + APP_HISTORY_AND_CURRENT_NODE_COUNT;

export const fullLifeDemoChoiceSets = [
  {
    id: "choice-yearly-default",
    owner: SCENARIO_OWNER,
    sourceNodeId: "demo-life-complete",
    scale: "year",
    timeAnchor: "7-86 岁每一年",
    question: "这一年你要把哪类选择放到前面？",
    recurrence: {
      cadence: "yearly",
      startAge: 7,
      endAge: 86,
      minOptionsPerPeriod: 2,
      materialization: "lazy",
      note: "每年保留两个以上可进入选项，由 lazy node 在当前路径附近生成。",
    },
    options: [
      {
        id: "choice-yearly-keep-structure",
        label: "先稳住结构",
        intent: "优先维持关系、健康和现金流稳定。",
        summary: "适合需要先恢复精力、补充信息的一年。",
        entry: {
          mode: "lazy-node",
          templateId: "template-yearly-structure",
          scale: "year",
          lane: "stability",
          title: "这一年：先稳住结构",
          summary: "减少新增变化，先恢复精力并补充判断信息。",
          requiredEntryModes: ["map", "chat"],
        },
        qaTags: ["recurring-year", "lazy-expansion"],
      },
      {
        id: "choice-yearly-test-direction",
        label: "验证一个方向",
        intent: "把长期目标拆成一年内可检查的测试。",
        summary: "适合需要获得实际反馈的一年。",
        entry: {
          mode: "lazy-node",
          templateId: "template-yearly-experiment",
          scale: "year",
          lane: "experiment",
          title: "这一年：验证一个方向",
          summary: "通过多次小测试判断长期方向是否可行。",
          requiredEntryModes: ["map", "chat", "share"],
        },
        qaTags: ["recurring-year", "lazy-expansion"],
      },
    ],
    qaTags: ["acceptance-choice-min-2", "yearly-choice-set"],
  },
  {
    id: "choice-monthly-default",
    owner: SCENARIO_OWNER,
    sourceNodeId: "demo-life-complete",
    scale: "month",
    timeAnchor: "18-70 岁每个月",
    question: "这个月你要如何处理能量和承诺？",
    recurrence: {
      cadence: "monthly",
      startAge: 18,
      endAge: 70,
      minOptionsPerPeriod: 2,
      materialization: "lazy",
      note: "月度高频分岔用模板表达，地图只展开当前尺度与当前路径附近节点。",
    },
    options: [
      {
        id: "choice-monthly-recover",
        label: "恢复能量",
        intent: "减少承诺密度，先让身体和关系回到可承载状态。",
        summary: "减少本月任务，优先恢复睡眠、精力和关系。",
        entry: {
          mode: "lazy-node",
          templateId: "template-monthly-recover",
          scale: "month",
          lane: "stability",
          title: "这个月：恢复能量",
          summary: "先减少消耗，再决定下一步。",
          requiredEntryModes: ["map", "chat"],
        },
        qaTags: ["recurring-month", "energy"],
      },
      {
        id: "choice-monthly-commit",
        label: "推进承诺",
        intent: "选择一个可交付任务并收集实际反馈。",
        summary: "本月完成一个有明确标准的任务。",
        entry: {
          mode: "lazy-node",
          templateId: "template-monthly-commit",
          scale: "month",
          lane: "creation",
          title: "这个月：推进承诺",
          summary: "完成一个任务，并记录结果和反馈。",
          requiredEntryModes: ["map", "chat", "share"],
        },
        qaTags: ["recurring-month", "commitment"],
      },
    ],
    qaTags: ["acceptance-choice-min-2", "monthly-choice-set"],
  },
  {
    id: "choice-age-18-city",
    owner: SCENARIO_OWNER,
    sourceNodeId: "demo-year-age-18",
    scale: "year",
    timeAnchor: "18 岁",
    question: "你更重视外地机会，还是本地支持？",
    options: [
      {
        id: "choice-age-18-leave-city",
        label: "去更远的城市",
        intent: "用环境变化换取更强的自主感。",
        summary: "获得更多外地机会，同时承担更高适应和关系成本。",
        entry: { mode: "rendered-node", nodeId: "demo-age-18-leave-city", requiredEntryModes: ["map", "chat"] },
        qaTags: ["representative-path"],
      },
      {
        id: "choice-age-18-stay-close",
        label: "留在更近的地方",
        intent: "保留家庭和熟悉关系支持，同时寻找独立发展机会。",
        summary: "降低适应成本，但需要主动争取独立空间。",
        entry: { mode: "rendered-node", nodeId: "demo-age-18-stay-close", requiredEntryModes: ["map", "chat"] },
        qaTags: ["alternate-path"],
      },
    ],
    qaTags: ["rendered-options", "adolescence"],
  },
  {
    id: "choice-age-24-work-creation",
    owner: SCENARIO_OWNER,
    sourceNodeId: "demo-year-age-24",
    scale: "year",
    timeAnchor: "24 岁",
    question: "工作之外的表达要占据什么位置？",
    options: [
      {
        id: "choice-age-24-room",
        label: "重排生活空间",
        intent: "调整工作区和日程，为个人项目保留固定时间。",
        summary: "用一个月检查新的时间安排能否持续。",
        entry: { mode: "rendered-node", nodeId: "demo-month-first-apartment", requiredEntryModes: ["map", "chat", "share"] },
        qaTags: ["representative-path"],
      },
      {
        id: "choice-age-24-public-portfolio",
        label: "公开一个作品集",
        intent: "更快获得外部反馈。",
        summary: "通过公开作品集更快获得外部反馈。",
        entry: {
          mode: "lazy-node",
          templateId: "template-age-24-portfolio",
          scale: "month",
          lane: "creation",
          title: "24 岁：公开一个作品集",
          summary: "把分散练习整理成可公开查看的作品集。",
          requiredEntryModes: ["map", "chat", "share"],
        },
        qaTags: ["lazy-expansion"],
      },
    ],
    qaTags: ["work-creation"],
  },
  {
    id: "choice-age-36-care-boundary",
    owner: SCENARIO_OWNER,
    sourceNodeId: "demo-year-age-36",
    scale: "year",
    timeAnchor: "36 岁",
    question: "你要怎样重新分配照护任务？",
    options: [
      {
        id: "choice-age-36-shared-calendar",
        label: "建立共享安排",
        intent: "把照护拆成可以协作的任务。",
        summary: "把负责人、时间和替代方案写入共享日历。",
        entry: { mode: "rendered-node", nodeId: "demo-month-care-season", requiredEntryModes: ["map", "chat"] },
        qaTags: ["representative-path"],
      },
      {
        id: "choice-age-36-boundary-talk",
        label: "先谈边界",
        intent: "明确自己能承担和无法长期承担的任务。",
        summary: "先沟通承受上限，再重新分配任务。",
        entry: {
          mode: "lazy-node",
          templateId: "template-age-36-boundary-talk",
          scale: "week",
          lane: "relationship",
          title: "36 岁：先谈边界",
          summary: "你把不能长期承担的部分说出来，让关系重新分工。",
          requiredEntryModes: ["map", "chat"],
        },
        qaTags: ["lazy-expansion", "boundary"],
      },
    ],
    qaTags: ["care", "relationship"],
  },
  {
    id: "choice-age-53-transfer",
    owner: SCENARIO_OWNER,
    sourceNodeId: "demo-year-age-53",
    scale: "year",
    timeAnchor: "53 岁",
    question: "你要把经验传给谁，以什么形式传递？",
    options: [
      {
        id: "choice-age-53-mentor",
        label: "帮助一个年轻人拆解问题",
        intent: "用方法和案例帮助对方独立判断。",
        summary: "通过一次实际指导检查经验是否可传递。",
        entry: { mode: "rendered-node", nodeId: "demo-month-age-53-mentor", requiredEntryModes: ["map", "chat", "share"] },
        qaTags: ["representative-path"],
      },
      {
        id: "choice-age-53-open-method",
        label: "公开一套方法",
        intent: "把经验整理成可复用材料。",
        summary: "把经验整理成公开、可复用的材料。",
        entry: {
          mode: "lazy-node",
          templateId: "template-age-53-open-method",
          scale: "month",
          lane: "creation",
          title: "53 岁：公开一套方法",
          summary: "你把经验整理成别人能独立使用的材料。",
          requiredEntryModes: ["map", "chat", "share"],
        },
        qaTags: ["lazy-expansion", "legacy"],
      },
    ],
    qaTags: ["creation", "legacy"],
  },
  {
    id: "choice-age-86-legacy",
    owner: SCENARIO_OWNER,
    sourceNodeId: "demo-year-age-86",
    scale: "year",
    timeAnchor: "86 岁",
    question: "晚年最后一段材料要如何留下？",
    options: [
      {
        id: "choice-age-86-recording",
        label: "留下录音",
        intent: "录制重要说明，并设置接收人和访问条件。",
        summary: "整理材料并完成一段授权分享的录音。",
        entry: { mode: "rendered-node", nodeId: "demo-month-final-spring", requiredEntryModes: ["map", "chat", "share"] },
        qaTags: ["representative-path", "death-replay"],
      },
      {
        id: "choice-age-86-quiet-archive",
        label: "保留私密档案",
        intent: "按主题保存材料，并设置访问权限。",
        summary: "保留部分私密材料，由指定人员按条件查看。",
        entry: {
          mode: "lazy-node",
          templateId: "template-age-86-quiet-archive",
          scale: "month",
          lane: "stability",
          title: "86 岁：保留私密档案",
          summary: "按主题整理材料，并为每类内容设置访问权限。",
          requiredEntryModes: ["map", "chat", "share"],
        },
        qaTags: ["lazy-expansion", "death-replay"],
      },
    ],
    qaTags: ["legacy", "death-replay"],
  },
] satisfies ScenarioChoiceSet[];

export const fullLifeRepresentativePath = [
  {
    order: 1,
    nodeId: "lifefork-history-birth",
    source: "history",
    scale: "decade",
    ageLabel: "出生",
    title: "出生：记录初始家庭和环境条件",
    entryModes: ["timeline", "map"],
    replayNote: "从 App 合成出生节点开始回放。",
  },
  {
    order: 2,
    nodeId: "demo-decade-childhood",
    source: "fork",
    scale: "decade",
    ageLabel: "0-10 岁",
    title: "童年安全感和表达方式",
    entryModes: ["map", "chat"],
    replayNote: "验证十年尺度进入。",
  },
  {
    order: 3,
    nodeId: "demo-year-age-7",
    source: "fork",
    scale: "year",
    ageLabel: "7 岁",
    title: "第一次公开表达",
    entryModes: ["map", "chat"],
    replayNote: "验证年度节点和 yearly choice set 代表样本。",
  },
  {
    order: 4,
    nodeId: "demo-hour-before-presentation",
    source: "fork",
    scale: "hour",
    ageLabel: "7 岁",
    title: "上台前 1 小时",
    entryModes: ["map", "chat"],
    replayNote: "验证最小尺度节点能进入对话。",
  },
  {
    order: 5,
    nodeId: "demo-age-18-leave-city",
    source: "choice-set",
    scale: "month",
    ageLabel: "18 岁",
    title: "去更远的城市",
    entryModes: ["map", "chat"],
    replayNote: "通过 18 岁 choice set 进入代表路径。",
  },
  {
    order: 6,
    nodeId: "demo-month-first-apartment",
    source: "choice-set",
    scale: "month",
    ageLabel: "24 岁",
    title: "调整住处和个人项目时间",
    entryModes: ["map", "chat", "share"],
    replayNote: "验证成年月度节点、对话和分享。",
  },
  {
    order: 7,
    nodeId: "demo-week-care-review",
    source: "fork",
    scale: "week",
    ageLabel: "36 岁",
    title: "照护复盘周",
    entryModes: ["map", "chat"],
    replayNote: "验证关系照护线的周尺度。",
  },
  {
    order: 8,
    nodeId: "demo-month-age-53-mentor",
    source: "choice-set",
    scale: "month",
    ageLabel: "53 岁",
    title: "把经验交给别人使用",
    entryModes: ["map", "chat", "share"],
    replayNote: "验证中后期传递节点。",
  },
  {
    order: 9,
    nodeId: "demo-hour-last-message",
    source: "fork",
    scale: "hour",
    ageLabel: "86 岁",
    title: "保存最后一段授权分享的录音",
    entryModes: ["map", "chat", "share"],
    replayNote: "代表路径终点，验证死亡回放、对话和分享。",
  },
] satisfies RepresentativePathStep[];

export const fullLifeDemoReplayBranches = [
  {
    id: "representative-complete",
    label: "Representative complete path",
    description: "从出生、童年表达、离家、职业身份、照护、传递，一路回放到死亡终点。",
    pathNodeIds: fullLifeRepresentativePath.map((step) => step.nodeId),
    relatedChoiceSetIds: ["choice-age-18-city", "choice-age-24-work-creation", "choice-age-36-care-boundary", "choice-age-53-transfer", "choice-age-86-legacy"],
    requiredEntryModes: ["timeline", "map", "chat", "share"],
    qaFocus: ["birth-to-death replay", "chat entry on hour nodes", "share entry on late-life endpoint"],
  },
  {
    id: "stable",
    label: "Stable branch",
    description: "保留关系和现实结构，选择离家较近、风险较低的方案。",
    pathNodeIds: [
      "lifefork-history-birth",
      "demo-decade-childhood",
      "demo-decade-adolescence",
      "demo-year-age-18",
      "demo-age-18-stay-close",
      "demo-decade-thirties",
      "demo-month-care-season",
      "demo-decade-final",
      "demo-hour-last-message",
    ],
    relatedChoiceSetIds: ["choice-age-18-city", "choice-age-36-care-boundary", "choice-age-86-legacy"],
    requiredEntryModes: ["map", "chat", "share"],
    qaFocus: ["stable option remains selectable", "relationship continuity is visible", "death endpoint remains reachable"],
  },
  {
    id: "leap",
    label: "Leap branch",
    description: "18 岁选择更远城市，优先验证自主感和身份重组。",
    pathNodeIds: [
      "lifefork-history-birth",
      "demo-decade-adolescence",
      "demo-year-age-18",
      "demo-age-18-leave-city",
      "demo-decade-twenties",
      "demo-year-age-24",
      "demo-decade-final",
      "demo-hour-last-message",
    ],
    relatedChoiceSetIds: ["choice-age-18-city", "choice-age-24-work-creation"],
    requiredEntryModes: ["map", "chat"],
    qaFocus: ["major fork enters leap node", "new city path can enter dialogue", "branch remains within visible budget"],
  },
  {
    id: "experiment",
    label: "Experiment branch",
    description: "把表达和职业身份拆成可逆实验，通过房间、日程、作品和传递逐步校准。",
    pathNodeIds: [
      "lifefork-history-birth",
      "demo-year-age-7",
      "demo-hour-before-presentation",
      "demo-decade-twenties",
      "demo-month-first-apartment",
      "demo-decade-fifties",
      "demo-month-age-53-mentor",
      "demo-hour-last-message",
    ],
    relatedChoiceSetIds: ["choice-yearly-default", "choice-monthly-default", "choice-age-24-work-creation", "choice-age-53-transfer"],
    requiredEntryModes: ["map", "chat", "share"],
    qaFocus: ["yearly and monthly choice sets stay lazy", "experiment path enters share", "mentor node remains selectable"],
  },
  {
    id: "relationship",
    label: "Relationship branch",
    description: "把亲密关系和照护压力纳入人生设计，验证关系线的节点进入和边界表达。",
    pathNodeIds: [
      "lifefork-history-birth",
      "demo-decade-adolescence",
      "demo-decade-thirties",
      "demo-era-age-34-38",
      "demo-year-age-36",
      "demo-month-care-season",
      "demo-week-care-review",
      "demo-decade-final",
      "demo-hour-last-message",
    ],
    relatedChoiceSetIds: ["choice-age-36-care-boundary", "choice-age-86-legacy"],
    requiredEntryModes: ["map", "chat", "share"],
    qaFocus: ["care boundary choice set is selectable", "relationship lane reaches late-life reflection", "share remains available after pressure path"],
  },
] satisfies ScenarioReplayBranch[];

export const fullLifeChoiceSetQaChecklist = [
  {
    id: "qa-choice-yearly-default",
    choiceSetId: "choice-yearly-default",
    sourceNodeId: "demo-life-complete",
    expectedMinimumOptions: 2,
    selectableOptionIds: ["choice-yearly-keep-structure", "choice-yearly-test-direction"],
    requiredChecks: [
      "Confirm yearly recurrence covers age 7 through age 86.",
      "Confirm both options create selectable lazy nodes.",
      "Confirm yearly options do not increase default rendered node count.",
    ],
  },
  {
    id: "qa-choice-monthly-default",
    choiceSetId: "choice-monthly-default",
    sourceNodeId: "demo-life-complete",
    expectedMinimumOptions: 2,
    selectableOptionIds: ["choice-monthly-recover", "choice-monthly-commit"],
    requiredChecks: [
      "Confirm focused monthly window covers age 18 through age 70.",
      "Confirm both options create selectable lazy nodes.",
      "Confirm monthly options stay inside current path context.",
    ],
  },
  {
    id: "qa-choice-age-18-city",
    choiceSetId: "choice-age-18-city",
    sourceNodeId: "demo-year-age-18",
    expectedMinimumOptions: 2,
    selectableOptionIds: ["choice-age-18-leave-city", "choice-age-18-stay-close"],
    requiredChecks: [
      "Select leave-city and verify chat opens on demo-age-18-leave-city.",
      "Select stay-close and verify chat opens on demo-age-18-stay-close.",
      "Confirm this choice set feeds both stable and leap replay branches.",
    ],
  },
  {
    id: "qa-choice-age-24-work-creation",
    choiceSetId: "choice-age-24-work-creation",
    sourceNodeId: "demo-year-age-24",
    expectedMinimumOptions: 2,
    selectableOptionIds: ["choice-age-24-room", "choice-age-24-public-portfolio"],
    requiredChecks: [
      "Select room option and verify rendered node demo-month-first-apartment is used.",
      "Select portfolio option and verify a lazy node opens chat.",
      "Confirm share remains available from the rendered experiment node.",
    ],
  },
  {
    id: "qa-choice-age-36-care-boundary",
    choiceSetId: "choice-age-36-care-boundary",
    sourceNodeId: "demo-year-age-36",
    expectedMinimumOptions: 2,
    selectableOptionIds: ["choice-age-36-shared-calendar", "choice-age-36-boundary-talk"],
    requiredChecks: [
      "Select shared-calendar and verify demo-month-care-season is used.",
      "Select boundary-talk and verify a relationship lazy node opens chat.",
      "Confirm relationship branch reaches demo-week-care-review.",
    ],
  },
  {
    id: "qa-choice-age-53-transfer",
    choiceSetId: "choice-age-53-transfer",
    sourceNodeId: "demo-year-age-53",
    expectedMinimumOptions: 2,
    selectableOptionIds: ["choice-age-53-mentor", "choice-age-53-open-method"],
    requiredChecks: [
      "Select mentor and verify demo-month-age-53-mentor is used.",
      "Select open-method and verify a creation lazy node opens chat.",
      "Confirm share remains available on the transfer path.",
    ],
  },
  {
    id: "qa-choice-age-86-legacy",
    choiceSetId: "choice-age-86-legacy",
    sourceNodeId: "demo-year-age-86",
    expectedMinimumOptions: 2,
    selectableOptionIds: ["choice-age-86-recording", "choice-age-86-quiet-archive"],
    requiredChecks: [
      "Select recording and verify demo-month-final-spring is used.",
      "Select quiet-archive and verify a late-life lazy node opens chat.",
      "Confirm death endpoint demo-hour-last-message remains reachable and shareable.",
    ],
  },
] satisfies ScenarioChoiceSetQaChecklistItem[];

export const fullLifeDemoBoundaryCases = [
  {
    id: "boundary-choice-set-minimum-options",
    title: "任意 choice set 至少 2 个选项",
    risk: "新场景只给单选项，会让分岔体验退化。",
    expectedBehavior: "验证函数返回通过；少于 2 个选项时必须报告失败。",
    sourceChoiceSetId: "choice-yearly-default",
  },
  {
    id: "boundary-visible-node-budget",
    title: "可见节点预算保持在 120 个以内",
    risk: "每年每月节点被硬展开后，Life Map 变得不可读。",
    expectedBehavior: "fixture 的 App 渲染节点数小于等于 120；高频节点保留为 lazy choice set。",
    sourceNodeId: "demo-life-complete",
  },
  {
    id: "boundary-death-node-chat-share",
    title: "死亡终点仍可进入对话和分享",
    risk: "晚年或死亡节点被当作普通文本终点，无法继续 QA 主流程。",
    expectedBehavior: "demo-hour-last-message 出现在代表路径，并声明 chat/share entry modes。",
    sourceNodeId: "demo-hour-last-message",
  },
  {
    id: "boundary-all-scale-coverage",
    title: "每个 LifeScale 至少一个可进入节点",
    risk: "某个尺度没有样本，Life Map semantic zoom 无法验收。",
    expectedBehavior: "qaAcceptance.scaleCoverage 覆盖 life、decade、era、year、month、week、day、hour。",
    sourceNodeId: "demo-life-complete",
  },
] satisfies ScenarioBoundaryCase[];

export const fullLifeDemoFixture: FullLifeScenarioFixture = {
  id: "scenario-full-life-demo-v0-5",
  version: "0.5.0",
  title: "V0.5 Full-Life Demo Fixture",
  owner: SCENARIO_OWNER,
  status: "ready",
  createdAt: SCENARIO_CREATED_AT,
  description:
    "Life Scenario Lab 的完整人生测试资产：用可见代表路径演示出生到死亡，用 choice set 管理每年每月两个以上分岔，并为 Life Map、Self Skill、QA 提供稳定数据。",
  canonicalPersona: fullLifeDemoPersona,
  lifeStages: fullLifeDemoStages,
  selfSkill: fullLifeDemoSelfSkill,
  renderedForks: fullLifeDemoForksWithAssets,
  choiceSets: fullLifeDemoChoiceSets,
  representativePath: fullLifeRepresentativePath,
  replayBranches: fullLifeDemoReplayBranches,
  choiceSetQaChecklist: fullLifeChoiceSetQaChecklist,
  boundaryCases: fullLifeDemoBoundaryCases,
  qaAcceptance: {
    visibleNodeBudget: VISIBLE_NODE_BUDGET,
    renderedNodeCount: renderedAppNodeCount,
    scaleCoverage: {
      life: "demo-life-complete",
      decade: "demo-decade-childhood",
      era: "demo-era-age-6-9",
      year: "demo-year-age-7",
      month: "demo-month-age-7-september",
      week: "demo-week-first-club",
      day: "demo-day-first-presentation",
      hour: "demo-hour-before-presentation",
    },
    requiredLifeStageIds: REQUIRED_LIFE_STAGE_IDS,
    replayBranchIds: REQUIRED_REPLAY_BRANCH_IDS,
    representativePathNodeIds: fullLifeRepresentativePath.map((step) => step.nodeId),
    requiredEntryModes: ["map", "timeline", "chat", "share"],
    boundaryCaseIds: fullLifeDemoBoundaryCases.map((item) => item.id),
    choiceSetMinOptions: 2,
  },
};

function findRenderedForkPath(nodeId: string): ForkPath | undefined {
  return collectScenarioForkNodes(fullLifeDemoForksWithAssets).find((node) => node.id === nodeId);
}

function mapRoleForScale(scale: LifeScale): ForkPath["mapRole"] {
  if (scale === "life") return "life-container";
  if (scale === "day" || scale === "hour") return "event";
  return "checkpoint";
}

export function getFullLifeDemoChoiceSetsForNode(nodeId: string): readonly ScenarioChoiceSet[] {
  return fullLifeDemoChoiceSets.filter((choiceSet) => choiceSet.sourceNodeId === nodeId);
}

export function resolveFullLifeDemoChoiceOptionPath(
  choiceSet: ScenarioChoiceSet,
  option: ScenarioChoiceOption,
  parentPath: ForkPath,
): ForkPath | null {
  if (option.entry.mode === "rendered-node") {
    return findRenderedForkPath(option.entry.nodeId) ?? null;
  }

  const sourceRange = parentPath.timeSpan?.range;
  const startDay = sourceRange?.startDay ?? 0;
  const endDay = Math.min(sourceRange?.endDay ?? startDay + durationByScale[option.entry.scale], startDay + durationByScale[option.entry.scale]);
  const vector = parentPath.stateVector ?? state({});

  return demoNode({
    id: `scenario-lazy-${choiceSet.id}-${option.id}`,
    parentId: parentPath.id,
    depth: (parentPath.depth ?? 1) + 1,
    mapRole: mapRoleForScale(option.entry.scale),
    scale: option.entry.scale,
    lane: option.entry.lane ?? parentPath.lane,
    timeSpan: {
      startLabel: choiceSet.timeAnchor,
      durationLabel: choiceSet.timeAnchor,
      range: timeRange(startDay, Math.max(startDay + 1 / 24, endDay), option.entry.scale),
    },
    title: option.entry.title,
    subtitle: option.label,
    summary: option.entry.summary,
    gains: [`可以查看「${option.label}」的结果`, "保留当前查看路径", "可以继续进入对话"],
    costs: ["该方案来自演示数据", "刷新后需要重新进入", "实际判断需要补充个人材料"],
    futureSelfName: `${option.label}方案的模拟版本`,
    futureSelfVoice: "具体说明该方案的收益、成本和下一步",
    stateVector: vector,
  });
}

type FullLifeDemoValidationResult = {
  valid: boolean;
  failures: string[];
  renderedNodeCount: number;
  choiceSetCount: number;
  renderedForkNodeCount: number;
  lifeStageCount: number;
  replayBranchCount: number;
  choiceSetQaChecklistCount: number;
};

function hasRequiredEntryMode(steps: readonly RepresentativePathStep[], mode: ScenarioEntryMode) {
  return steps.some((step) => step.entryModes.includes(mode));
}

export function validateFullLifeDemoFixture(fixture: FullLifeScenarioFixture = fullLifeDemoFixture): FullLifeDemoValidationResult {
  const failures: string[] = [];
  const forkNodes = collectScenarioForkNodes(fixture.renderedForks);
  const renderedIds = new Set(forkNodes.map((node) => node.id));
  const duplicateIds = forkNodes
    .map((node) => node.id)
    .filter((id, index, ids) => ids.indexOf(id) !== index);

  if (fixture.owner !== SCENARIO_OWNER) {
    failures.push(`owner must be ${SCENARIO_OWNER}`);
  }

  if (duplicateIds.length) {
    failures.push(`duplicate rendered node ids: ${Array.from(new Set(duplicateIds)).join(", ")}`);
  }

  if (fixture.qaAcceptance.renderedNodeCount > fixture.qaAcceptance.visibleNodeBudget) {
    failures.push(`rendered node count ${fixture.qaAcceptance.renderedNodeCount} exceeds ${fixture.qaAcceptance.visibleNodeBudget}`);
  }

  if (!fixture.canonicalPersona.id || !fixture.canonicalPersona.displayName) {
    failures.push("canonical persona must define id and displayName");
  }

  const stageIds = new Set(fixture.lifeStages.map((stage) => stage.id));
  fixture.qaAcceptance.requiredLifeStageIds.forEach((stageId) => {
    if (!stageIds.has(stageId)) failures.push(`missing life stage: ${stageId}`);
  });

  fixture.lifeStages.forEach((stage) => {
    if (!renderedIds.has(stage.primaryNodeId) && !APP_SYNTHETIC_NODE_IDS.has(stage.primaryNodeId)) {
      failures.push(`${stage.id} primary node is not rendered: ${stage.primaryNodeId}`);
    }

    stage.supportingNodeIds?.forEach((nodeId) => {
      if (!renderedIds.has(nodeId) && !APP_SYNTHETIC_NODE_IDS.has(nodeId)) {
        failures.push(`${stage.id} supporting node is not rendered: ${nodeId}`);
      }
    });
  });

  fixture.choiceSets.forEach((choiceSet) => {
    if (choiceSet.options.length < fixture.qaAcceptance.choiceSetMinOptions) {
      failures.push(`${choiceSet.id} has fewer than ${fixture.qaAcceptance.choiceSetMinOptions} options`);
    }

    if (!renderedIds.has(choiceSet.sourceNodeId) && !APP_SYNTHETIC_NODE_IDS.has(choiceSet.sourceNodeId)) {
      failures.push(`${choiceSet.id} source node is not rendered: ${choiceSet.sourceNodeId}`);
    }

    choiceSet.options.forEach((option) => {
      if (option.entry.mode === "rendered-node" && !renderedIds.has(option.entry.nodeId) && !APP_SYNTHETIC_NODE_IDS.has(option.entry.nodeId)) {
        failures.push(`${choiceSet.id}/${option.id} target node is not rendered: ${option.entry.nodeId}`);
      }
    });
  });

  const yearlyChoiceSet = fixture.choiceSets.find((choiceSet) => choiceSet.recurrence?.cadence === "yearly");
  if (!yearlyChoiceSet || (yearlyChoiceSet.recurrence?.minOptionsPerPeriod ?? 0) < fixture.qaAcceptance.choiceSetMinOptions) {
    failures.push("yearly choice set must define at least two options per year");
  }

  const monthlyChoiceSet = fixture.choiceSets.find((choiceSet) => choiceSet.recurrence?.cadence === "monthly");
  if (!monthlyChoiceSet || (monthlyChoiceSet.recurrence?.minOptionsPerPeriod ?? 0) < fixture.qaAcceptance.choiceSetMinOptions) {
    failures.push("monthly focused-window choice set must define at least two options per month");
  }

  const checklistByChoiceSetId = new Map(fixture.choiceSetQaChecklist.map((item) => [item.choiceSetId, item]));
  fixture.choiceSets.forEach((choiceSet) => {
    const checklistItem = checklistByChoiceSetId.get(choiceSet.id);
    if (!checklistItem) {
      failures.push(`missing QA checklist item for ${choiceSet.id}`);
      return;
    }

    const optionIds = new Set(choiceSet.options.map((option) => option.id));
    if (checklistItem.expectedMinimumOptions < fixture.qaAcceptance.choiceSetMinOptions) {
      failures.push(`${checklistItem.id} expects fewer than ${fixture.qaAcceptance.choiceSetMinOptions} options`);
    }

    checklistItem.selectableOptionIds.forEach((optionId) => {
      if (!optionIds.has(optionId)) failures.push(`${checklistItem.id} references missing option: ${optionId}`);
    });
  });

  ALL_SCALES.forEach((scale) => {
    const coveredNodeId = fixture.qaAcceptance.scaleCoverage[scale];
    if (!coveredNodeId) {
      failures.push(`missing scale coverage: ${scale}`);
      return;
    }

    if (!renderedIds.has(coveredNodeId) && !APP_SYNTHETIC_NODE_IDS.has(coveredNodeId)) {
      failures.push(`scale ${scale} points to a missing node: ${coveredNodeId}`);
    }
  });

  fixture.representativePath.forEach((step) => {
    if (!renderedIds.has(step.nodeId) && !APP_SYNTHETIC_NODE_IDS.has(step.nodeId)) {
      failures.push(`representative path step ${step.order} points to a missing node: ${step.nodeId}`);
    }
  });

  fixture.qaAcceptance.requiredEntryModes.forEach((mode) => {
    if (!hasRequiredEntryMode(fixture.representativePath, mode)) {
      failures.push(`representative path is missing entry mode: ${mode}`);
    }
  });

  const replayBranchesById = new Map(fixture.replayBranches.map((branch) => [branch.id, branch]));
  fixture.qaAcceptance.replayBranchIds.forEach((branchId) => {
    if (!replayBranchesById.has(branchId)) failures.push(`missing replay branch: ${branchId}`);
  });

  fixture.replayBranches.forEach((branch) => {
    branch.pathNodeIds.forEach((nodeId) => {
      if (!renderedIds.has(nodeId) && !APP_SYNTHETIC_NODE_IDS.has(nodeId)) {
        failures.push(`${branch.id} branch points to a missing node: ${nodeId}`);
      }
    });

    branch.relatedChoiceSetIds.forEach((choiceSetId) => {
      if (!fixture.choiceSets.some((choiceSet) => choiceSet.id === choiceSetId)) {
        failures.push(`${branch.id} branch references missing choice set: ${choiceSetId}`);
      }
    });
  });

  const representativeBranch = replayBranchesById.get("representative-complete");
  if (!representativeBranch?.pathNodeIds[0]?.includes("birth")) {
    failures.push("representative-complete branch must start at birth");
  }

  if (representativeBranch?.pathNodeIds[representativeBranch.pathNodeIds.length - 1] !== "demo-hour-last-message") {
    failures.push("representative-complete branch must end at demo-hour-last-message");
  }

  return {
    valid: failures.length === 0,
    failures,
    renderedNodeCount: fixture.qaAcceptance.renderedNodeCount,
    choiceSetCount: fixture.choiceSets.length,
    renderedForkNodeCount: forkNodes.length,
    lifeStageCount: fixture.lifeStages.length,
    replayBranchCount: fixture.replayBranches.length,
    choiceSetQaChecklistCount: fixture.choiceSetQaChecklist.length,
  };
}
