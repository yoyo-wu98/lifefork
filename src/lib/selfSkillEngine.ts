import { Evidence, GenerateSelfSkillInput, SelfSkill, TimelineNode, ForkPath } from "@/lib/types";
import { buildStageVoices, buildVoiceProfile } from "@/lib/voiceEngine";

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const valueKeywords: Record<string, string[]> = {
  自由: ["自由", "离开", "逃", "换城市", "辞职", "困住", "被困住", "不想被安排", "空间", "另一部分", "不被使用"],
  创造: ["创作", "作品", "写作", "摄影", "音乐", "设计", "表达", "做东西", "项目", "内容", "内容项目"],
  安全感: ["稳定", "安全", "钱", "家庭", "房子", "确定", "风险"],
  亲密: ["关系", "分手", "亲密", "朋友", "家人", "被理解", "孤独", "陪伴"],
  成长: ["学习", "读博", "成长", "能力", "变强", "提升", "专业"],
  被看见: ["成功", "证明", "赢", "被看见", "价值", "意义", "不甘心"],
  探索: ["旅行", "世界", "未知", "冒险", "新生活", "新城市", "尝试"],
};

const motifs = [
  "不断逃离被定义，又不断寻找一个能安放自己的地方。",
  "在安全与自由之间反复折返，试图找到一种不背叛自己的生活。",
  "你像一条迟迟不肯汇入固定河道的河流，一边害怕漂泊，一边害怕停下。",
  "你的人生一直在等待一个足够诚实的开始。",
];

const desirePool = ["被自己承认", "更自由地表达", "稳定又不失热情", "被真正理解", "在现实里试出方向"];

function collectText(input: GenerateSelfSkillInput) {
  return [
    input.currentChoice,
    input.recurringEmotion,
    input.pastNode,
    input.hiddenSelf,
    input.futureSentence,
    input.extraText ?? "",
    input.wechatAnalysis?.suggestedSelfSkillText ?? "",
    input.wechatAnalysis?.topKeywords.join(" ") ?? "",
  ].join(" ");
}

function detectValues(text: string): string[] {
  const found = Object.entries(valueKeywords)
    .filter(([, keys]) => keys.some((k) => text.includes(k)))
    .map(([value]) => value);
  return found.length ? found : ["自由", "意义", "连接"];
}

function detectFears(text: string): string[] {
  const fears = new Set<string>();
  if (/(稳定|安全|工作|公司)/.test(text)) fears.add("害怕被稳定磨平");
  if (/(失败|创业|辞职|转型)/.test(text)) fears.add("害怕投入后仍然失败");
  if (/(关系|分手|亲密)/.test(text)) fears.add("害怕在亲密里失去自己");
  if (/(普通|平庸|没意义)/.test(text)) fears.add("害怕过完没有被自己承认的一生");
  if (!fears.size) {
    ["害怕浪费人生", "害怕被误解", "害怕选择错误"].forEach((f) => fears.add(f));
  }
  return [...fears];
}

function detectArchetype(values: string[]): string {
  if (values.includes("创造") && (values.includes("自由") || values.includes("被看见"))) return "延迟爆发型创作者";
  if (values.includes("自由") && values.includes("安全感")) return "自由边界探索者";
  if (values.includes("亲密") && values.includes("自由")) return "关系中的远行者";
  if (values.includes("成长") && values.includes("被看见")) return "现实主义梦想家";
  return "深海建造者";
}

function buildPatterns(values: string[]): string[] {
  const base = [
    "你渴望稳定带来的安全感，但又害怕它慢慢吞掉你的自由。",
    "你常常需要先确认一件事值得付出，行动力才会真正启动。",
    "你对人生的要求超过“过得还行”，还想在某种意义上被自己承认。",
    "你习惯把很多真实愿望延后，直到它们以焦虑或疲惫的形式回来。",
    "你在关系中渴望被理解，但当期待过重时，又会想要后退。",
  ];

  if (values.includes("探索")) {
    base.unshift("你会被新的可能性点燃，但也会为未知付出情绪成本。");
  }

  return base.slice(0, 4);
}

function buildTimeline(input: GenerateSelfSkillInput, stageVoices: ReturnType<typeof buildStageVoices>): TimelineNode[] {
  const nodes: TimelineNode[] = [
    {
      id: uid(),
      yearLabel: "过去",
      title: input.pastNode || "一个尚未被重新理解的节点",
      emotion: "复杂、迟疑、仍有回声",
      pattern: "这里可能藏着你后来很多选择的原型",
      voice: stageVoices.find((voice) => voice.stage === "past"),
    },
    {
      id: uid(),
      yearLabel: "暗线",
      title: input.hiddenSelf || "一个没有被充分表达的自己",
      emotion: "压抑、等待、想被看见",
      pattern: "你把某部分自己藏了起来，但它仍在影响你的选择",
      voice: stageVoices.find((voice) => voice.stage === "hidden"),
    },
    {
      id: uid(),
      yearLabel: "现在",
      title: input.currentChoice || "当前人生岔路",
      emotion: input.recurringEmotion || "混乱",
      pattern: "你正在安全与变化之间寻找新的平衡",
      voice: stageVoices.find((voice) => voice.stage === "present"),
    },
    {
      id: uid(),
      yearLabel: "未来",
      title: input.futureSentence || "未来的我想对现在说的话",
      emotion: "温柔、清醒、带着提醒",
      pattern: "你期待未来的自己证明：今天的犹豫没有白费",
      voice: stageVoices.find((voice) => voice.stage === "future"),
    },
  ];

  if (input.wechatAnalysis?.keyMoments.length) {
    nodes.splice(2, 0, {
      id: uid(),
      yearLabel: "聊天暗流",
      title: input.wechatAnalysis.recurringTopics.length ? `聊天中反复出现：${input.wechatAnalysis.recurringTopics.slice(0, 3).join("、")}` : "聊天记录里出现的反复主题",
      emotion: input.wechatAnalysis.emotionalSignals.join("、") || "复杂、流动、需要辨认",
      pattern: "这段聊天材料可以帮助你观察：哪些话题总是回来，哪些情绪一直没有被真正处理。",
      voice: stageVoices.find((voice) => voice.stage === "present"),
    });
  }

  return nodes;
}

function buildForks(currentChoice: string): ForkPath[] {
  const choice = currentChoice || "当前选择";

  return [
    {
      id: "path-a",
      depth: 1,
      nodeType: "direction",
      title: "路径 A：留在熟悉的河道",
      subtitle: "先稳住，再观察。",
      summary: `你选择暂时维持现有结构，不做激烈改变。围绕「${choice}」先恢复能量，再等待更清晰的窗口。`,
      gains: ["短期安全感提升", "生活结构稳定", "能量恢复更可控"],
      costs: ["长期压抑感可能累积", "行动惯性增强", "对真实愿望继续延后"],
      futureSelfName: "一年后的你",
      futureSelfVoice: "平静、谨慎、带一点未完成",
      children: [
        {
          id: "path-a-guardrail",
          parentId: "path-a",
          depth: 2,
          nodeType: "strategy",
          title: "A1：给留下设置边界",
          subtitle: "不是继续忍，而是限期观察。",
          summary: "你给自己设定 60 到 90 天观察期：记录能量、作品冲动、工作消耗和现实安全感。留下不再是默认，而是一个有期限的实验。",
          gains: ["不立刻打碎现有生活", "能收集真实证据", "给焦虑一个容器"],
          costs: ["容易被日常惯性吞掉", "需要诚实记录", "可能延后真正行动"],
          futureSelfName: "90 天后更稳的你",
          futureSelfVoice: "克制、清醒、像是在给自己留退路",
          children: [
            {
              id: "path-a-guardrail-negotiate",
              parentId: "path-a-guardrail",
              depth: 3,
              nodeType: "consequence",
              title: "A1-a：向现实谈判出空间",
              subtitle: "保留稳定，但拿回一点时间。",
              summary: "你开始和工作、家人或自己谈判，争取固定创作时段、远程空间或任务边界。生活没有巨大转场，但开始出现可呼吸的缝。",
              gains: ["稳定与创造不再完全对立", "行动压力较低", "更容易持续"],
              costs: ["改变速度慢", "容易被别人认为不够决绝", "需要持续沟通"],
              futureSelfName: "半年后有边界的你",
              futureSelfVoice: "平静、有分寸，但比现在更硬一点",
              children: [
                {
                  id: "path-a-guardrail-negotiate-ending",
                  parentId: "path-a-guardrail-negotiate",
                  depth: 4,
                  nodeType: "ending",
                  title: "结局：温和转向",
                  subtitle: "生活没有断裂，但方向开始偏航。",
                  summary: "你没有立刻离开熟悉轨道，但你已经不再把稳定当作唯一答案。未来的转向更慢，却更少自毁。",
                  gains: ["风险可控", "自我信任恢复", "关系压力较小"],
                  costs: ["不够戏剧化", "需要长期耐心", "可能仍有遗憾感"],
                  futureSelfName: "温和转向后的你",
                  futureSelfVoice: "低声但坚定，像终于把门开了一条缝",
                },
              ],
            },
            {
              id: "path-a-guardrail-stall",
              parentId: "path-a-guardrail",
              depth: 3,
              nodeType: "consequence",
              title: "A1-b：观察期变成拖延期",
              subtitle: "看似稳住，实际又把自己往后放。",
              summary: "你设了期限，但没有执行记录。稳定继续保护你，也继续麻痹你。问题没有爆炸，只是变钝。",
              gains: ["短期冲突减少", "不用立刻解释自己", "外部秩序保持"],
              costs: ["自我厌倦增加", "创造冲动变成噪音", "下一次选择更难"],
              futureSelfName: "半年后更疲惫的你",
              futureSelfVoice: "安静、迟疑，带一点不愿承认的失望",
              children: [
                {
                  id: "path-a-guardrail-stall-ending",
                  parentId: "path-a-guardrail-stall",
                  depth: 4,
                  nodeType: "ending",
                  title: "结局：安全的钝痛",
                  subtitle: "没有坏掉，但也没有真正开始。",
                  summary: "这条结局不是失败，而是一种缓慢失真。你会获得安全，却越来越难解释为什么自己不快乐。",
                  gains: ["生活稳定", "外界评价安全", "损失不明显"],
                  costs: ["内在热情变弱", "自我叙事停滞", "更依赖未来某一天"],
                  futureSelfName: "安全但迟钝的你",
                  futureSelfVoice: "轻、慢，像把真正的话吞回去",
                },
              ],
            },
          ],
        },
        {
          id: "path-a-suppress",
          parentId: "path-a",
          depth: 2,
          nodeType: "strategy",
          title: "A2：彻底压下愿望",
          subtitle: "把现实优先级拉满。",
          summary: "你决定暂时不再讨论那个想做的方向，把重心放到钱、稳定、责任和外部秩序上。",
          gains: ["短期效率更高", "外界阻力更小", "安全感明确"],
          costs: ["真实愿望被继续推迟", "情绪可能转为麻木", "很难再听见自己"],
          futureSelfName: "一年后很稳的你",
          futureSelfVoice: "理性、压抑、像在证明自己没选错",
          children: [
            {
              id: "path-a-suppress-reward",
              parentId: "path-a-suppress",
              depth: 3,
              nodeType: "consequence",
              title: "A2-a：现实奖励变多",
              subtitle: "你获得认可，但问题变得更隐蔽。",
              summary: "收入、职位或外部评价改善了。你更像一个被现实认可的人，但内在那个想表达的部分并没有消失。",
              gains: ["外部确定性上升", "资源积累", "家人或环境更安心"],
              costs: ["内在冲突被包装得更漂亮", "转向成本变高", "更难承认不满足"],
              futureSelfName: "被现实认可的你",
              futureSelfVoice: "体面、克制，偶尔会突然沉默",
            },
            {
              id: "path-a-suppress-crack",
              parentId: "path-a-suppress",
              depth: 3,
              nodeType: "consequence",
              title: "A2-b：情绪从缝里回来",
              subtitle: "压下去的东西换一种方式出现。",
              summary: "你以为自己已经处理好了，但焦虑、疲惫或不甘心会在某个普通夜晚回来提醒你。",
              gains: ["终于看见问题不是一时冲动", "开始重新诚实", "有机会二次选择"],
              costs: ["情绪代价更高", "可能出现突然爆发", "需要补偿之前的拖延"],
              futureSelfName: "裂缝出现后的你",
              futureSelfVoice: "低哑、直接，像终于不想演了",
            },
          ],
        },
      ],
    },
    {
      id: "path-b",
      depth: 1,
      nodeType: "direction",
      title: "路径 B：直接推开那扇门",
      subtitle: "高风险，高一致性。",
      summary: "你做出更大转向，短期会经历不确定、压力和身份重组，但自我一致性与自由感会提升。",
      gains: ["自由感增强", "自我一致性提高", "快速获得真实反馈"],
      costs: ["财务与关系压力上升", "短期混乱明显", "需要更强心理韧性"],
      futureSelfName: "两年后的你",
      futureSelfVoice: "锋利、诚实、带着燃烧后的清醒",
      children: [
        {
          id: "path-b-leap",
          parentId: "path-b",
          depth: 2,
          nodeType: "strategy",
          title: "B1：裸身跃迁",
          subtitle: "先离开，再长出新结构。",
          summary: "你迅速切断旧轨道，把注意力全部押到新方向。这个选择会制造强烈生命感，也会制造强烈不确定。",
          gains: ["自我一致性强", "反馈速度极快", "不再消耗于伪装"],
          costs: ["现金流压力陡升", "容易过度燃烧", "关系解释成本高"],
          futureSelfName: "三个月后燃烧的你",
          futureSelfVoice: "急促、锋利，像刚从旧壳里出来",
          children: [
            {
              id: "path-b-leap-build",
              parentId: "path-b-leap",
              depth: 3,
              nodeType: "consequence",
              title: "B1-a：作品逼出新身份",
              subtitle: "你开始用产物，而不是想象证明自己。",
              summary: "混乱迫使你更快交付作品。你不一定马上成功，但会迅速知道自己能不能承受这条路。",
              gains: ["作品密度上升", "身份感变强", "获得真实市场反馈"],
              costs: ["自我评价波动大", "容易把结果等同于价值", "失败感更刺痛"],
              futureSelfName: "作品逼出来的你",
              futureSelfVoice: "亮、急、带一点终于活过来的喘息",
            },
            {
              id: "path-b-leap-burnout",
              parentId: "path-b-leap",
              depth: 3,
              nodeType: "consequence",
              title: "B1-b：自由变成过载",
              subtitle: "没有旧束缚，也没有新秩序。",
              summary: "你获得自由，但自由没有自动变成方向。没有节奏和现金流保护时，热情可能很快烧成焦虑。",
              gains: ["看清自己不是只需要离开", "逼迫建立系统", "减少幻想"],
              costs: ["压力高", "孤独感增强", "容易怀疑整个选择"],
              futureSelfName: "过载后的你",
              futureSelfVoice: "沙哑、坦白，不再浪漫化自由",
            },
          ],
        },
        {
          id: "path-b-buffer",
          parentId: "path-b",
          depth: 2,
          nodeType: "strategy",
          title: "B2：带缓冲离开",
          subtitle: "仍然转向，但提前准备降落伞。",
          summary: "你不否认自己要变，但先准备现金流、作品雏形、支持者和失败回撤路线。",
          gains: ["风险可管理", "行动更稳定", "更容易说服现实环境"],
          costs: ["启动更慢", "需要忍受过渡期", "可能被误解为不够勇敢"],
          futureSelfName: "半年后带地图的你",
          futureSelfVoice: "清醒、务实，锋利里有计算",
          children: [
            {
              id: "path-b-buffer-launch",
              parentId: "path-b-buffer",
              depth: 3,
              nodeType: "consequence",
              title: "B2-a：有准备地发布",
              subtitle: "离开时，你已经不是空手。",
              summary: "你带着作品、计划和资源离开。转向仍然难，但你不是用冲动对抗现实。",
              gains: ["成功概率更高", "心理稳定性更强", "外部信任更容易建立"],
              costs: ["前期准备很累", "延迟满足", "需要持续复盘"],
              futureSelfName: "准备充分后的你",
              futureSelfVoice: "稳定、直接，像终于拿到了自己的工具",
            },
            {
              id: "path-b-buffer-half",
              parentId: "path-b-buffer",
              depth: 3,
              nodeType: "consequence",
              title: "B2-b：准备期拉太长",
              subtitle: "缓冲区变成第二个笼子。",
              summary: "你不断准备，却迟迟不发布、不申请、不公开。安全策略开始变成新的拖延形式。",
              gains: ["能力累积", "资源更多", "风险暂时低"],
              costs: ["迟迟没有真实反馈", "自我怀疑增加", "勇气被消耗"],
              futureSelfName: "准备太久的你",
              futureSelfVoice: "克制、疲惫，像拿着地图却没出门",
            },
          ],
        },
      ],
    },
    {
      id: "path-c",
      depth: 1,
      nodeType: "direction",
      title: "路径 C：用 90 天试验一条新路",
      subtitle: "不是逃离，也不是忍耐，而是验证。",
      summary:
        "你暂时保留现有结构，但给真实愿望一个可被现实检验的出口。你用 90 天做一个小型项目、一次申请、一次谈话或一次作品试验。",
      gains: ["风险被拆小", "愿望被认真对待", "你会获得更真实的信息"],
      costs: ["需要持续自律", "短期会更忙", "可能发现自己其实没有那么想要"],
      futureSelfName: "90 天后的你",
      futureSelfVoice: "清醒、温柔、带一点终于开始行动后的平静",
      children: [
        {
          id: "path-c-project",
          parentId: "path-c",
          depth: 2,
          nodeType: "strategy",
          title: "C1：做一个 90 天作品实验",
          subtitle: "用产物回答，而不是用脑内争论回答。",
          summary: "你设定一个很小但真实的项目：连续发布、完成作品集、做一次申请或验证一个内容方向。",
          gains: ["愿望变成证据", "行动足够小", "能快速复盘"],
          costs: ["要面对真实反馈", "时间会变紧", "不能只停留在想象"],
          futureSelfName: "90 天后交付过的你",
          futureSelfVoice: "平静、具体，少一点空想",
          children: [
            {
              id: "path-c-project-signal",
              parentId: "path-c-project",
              depth: 3,
              nodeType: "consequence",
              title: "C1-a：实验出现正反馈",
              subtitle: "不是终点，但足够让你继续。",
              summary: "作品、反馈或内在能量出现了正信号。你开始相信这不是逃避，而是一条可以继续试的路径。",
              gains: ["自我信任上升", "方向感增强", "第三条路变清楚"],
              costs: ["新的责任开始出现", "需要下一阶段计划", "会面对更多期待"],
              futureSelfName: "收到信号后的你",
              futureSelfVoice: "轻一点、亮一点，但仍然谨慎",
              children: [
                {
                  id: "path-c-project-signal-ending",
                  parentId: "path-c-project-signal",
                  depth: 4,
                  nodeType: "ending",
                  title: "结局：小火苗被保护住",
                  subtitle: "你没有立刻改命，但保住了开始。",
                  summary: "这条结局的价值不在于立刻成功，而在于你第一次用现实保护那个真实愿望。",
                  gains: ["可持续", "真实", "风险低"],
                  costs: ["慢", "需要耐心", "需要持续选择"],
                  futureSelfName: "小火苗被保护住的你",
                  futureSelfVoice: "温柔、踏实，像终于不用再骗自己",
                },
              ],
            },
            {
              id: "path-c-project-noise",
              parentId: "path-c-project",
              depth: 3,
              nodeType: "consequence",
              title: "C1-b：实验没有立刻成立",
              subtitle: "这不是否定，而是信息。",
              summary: "项目没有得到预期结果。你会失望，但也会更清楚：自己想要的是这个方向，还是只是想逃离当下。",
              gains: ["减少幻想", "发现真实动机", "避免更大损失"],
              costs: ["会受挫", "需要重设实验", "短期自尊波动"],
              futureSelfName: "被现实校准后的你",
              futureSelfVoice: "诚实、冷静，不再把失败当审判",
              children: [
                {
                  id: "path-c-project-noise-ending",
                  parentId: "path-c-project-noise",
                  depth: 4,
                  nodeType: "ending",
                  title: "结局：方向被重新命名",
                  subtitle: "你没有得到答案，但得到了更好的问题。",
                  summary: "实验失败没有把你打回原点，它帮你区分：你想创造，还是想从旧生活里消失。",
                  gains: ["更清醒", "代价较小", "下一次实验更准"],
                  costs: ["需要承认误判", "会短暂沮丧", "还没有确定答案"],
                  futureSelfName: "重新命名方向的你",
                  futureSelfVoice: "慢、准，像把失望也变成材料",
                },
              ],
            },
          ],
        },
        {
          id: "path-c-alliance",
          parentId: "path-c",
          depth: 2,
          nodeType: "strategy",
          title: "C2：找一个现实盟友",
          subtitle: "不单独扛着全部选择。",
          summary: "你把这个岔路讲给一个可信的人、导师或同行，不是为了被批准，而是为了让选择进入现实关系。",
          gains: ["孤独感下降", "获得外部镜子", "更容易坚持"],
          costs: ["需要暴露真实愿望", "可能收到不舒服的反馈", "要筛选谁值得听"],
          futureSelfName: "有人见证后的你",
          futureSelfVoice: "柔软但更有边界",
          children: [
            {
              id: "path-c-alliance-support",
              parentId: "path-c-alliance",
              depth: 3,
              nodeType: "consequence",
              title: "C2-a：被正确的人接住",
              subtitle: "你不再只在脑内循环。",
              summary: "对方没有替你决定，但帮你看见你一直在重复的说法。你开始更清楚自己真正害怕的是什么。",
              gains: ["自我理解加深", "情绪被承接", "行动更可持续"],
              costs: ["需要持续沟通", "不能再用沉默逃避", "关系里会出现新期待"],
              futureSelfName: "被看见后的你",
              futureSelfVoice: "更松一点，但仍有边界",
            },
            {
              id: "path-c-alliance-misread",
              parentId: "path-c-alliance",
              depth: 3,
              nodeType: "consequence",
              title: "C2-b：被误读后收回去",
              subtitle: "一次不好的反馈让你想退回壳里。",
              summary: "你尝试表达，但对方用现实、评价或恐惧把你挡回来。这会让你更想沉默，也会提醒你筛选见证者的重要性。",
              gains: ["看清谁不能承接你", "边界意识变强", "减少错误期待"],
              costs: ["受伤", "表达欲短期下降", "更难再次开口"],
              futureSelfName: "收回去又重新出来的你",
              futureSelfVoice: "敏感、谨慎，但更知道保护自己",
            },
          ],
        },
      ],
    },
  ];
}

export function buildLifeForks(currentChoice: string): ForkPath[] {
  const choice = currentChoice || "当前这个选择";
  const node = (path: ForkPath): ForkPath => ({ nodeType: "life-node", ...path });

  return [
    node({
      id: "node-still-tonight",
      depth: 1,
      title: "第 1 个夜晚：你决定先不动",
      subtitle: "今晚先把生活按住，答案明天再看。",
      summary: `围绕「${choice}」，你没有立刻改变任何事。你把问题暂时放回身体里，想看看明天醒来它会不会还在那里。`,
      gains: ["没有立刻制造现实震荡", "情绪有一点缓冲", "能观察冲动是否会退去"],
      costs: ["真正的问题可能继续被推迟", "容易把缓冲误认为解决", "内在声音会更小一点"],
      futureSelfName: "明天早上的你",
      futureSelfVoice: "短、慢，像刚把话吞回去",
      children: [
        node({
          id: "node-still-note",
          parentId: "node-still-tonight",
          depth: 2,
          title: "第 2 天：你把不舒服写下来",
          subtitle: "你没有行动，但开始留下证据。",
          summary: "你记录什么时候最想离开、什么时候又觉得稳定很重要。问题第一次从雾里变成几行可查看的字。",
          gains: ["模糊感下降", "开始看见触发点", "不再全靠情绪判断"],
          costs: ["记录会让真实愿望更难装作不存在", "需要诚实", "可能越写越难受"],
          futureSelfName: "写下第一页后的你",
          futureSelfVoice: "克制、自省，像在试探自己",
          children: [
            node({
              id: "node-still-note-talk",
              parentId: "node-still-note",
              depth: 3,
              title: "第 1 次开口：你把这件事告诉一个人",
              subtitle: "这次开口，是让它进入现实。",
              summary: "你对一个可信的人说出这件事。说出口之后，它不再只是脑内循环，而变成一个会被回应的现实问题。",
              gains: ["孤独感下降", "能听见自己的措辞", "获得外部镜子"],
              costs: ["可能被误解", "会暴露真实愿望", "不能继续假装没事"],
              futureSelfName: "说出口后的你",
              futureSelfVoice: "有点紧，但比沉默更真实",
              children: [
                node({
                  id: "node-still-note-talk-seen",
                  parentId: "node-still-note-talk",
                  depth: 4,
                  title: "第 1 次被接住：对方没有替你决定",
                  subtitle: "你第一次被允许复杂。",
                  summary: "对方没有替你下判断，只是帮你听见：你真正想要的也许是让某部分自己被使用。",
                  gains: ["自我理解变清楚", "不再只有 A/B", "情绪压力下降"],
                  costs: ["会更难回到原来的麻木", "需要下一步动作", "关系里多了一层真实"],
                  futureSelfName: "被看见后的你",
                  futureSelfVoice: "松一点，但仍然谨慎",
                  children: [
                    node({
                      id: "node-still-note-talk-seen-small",
                      parentId: "node-still-note-talk-seen",
                      depth: 5,
                      title: "第 1 个小承诺：你预约两小时给自己",
                      subtitle: "人生没有改写，但日历先动了。",
                      summary: "你没有宣布宏大的改变，只是在日历里留出两个小时做自己的东西。这个节点小到不浪漫，却大到会改变证据。",
                      gains: ["行动足够低风险", "真实愿望得到出口", "能积累自我信任"],
                      costs: ["看起来太小", "容易被临时事务挤掉", "需要守住边界"],
                      futureSelfName: "守住两小时后的你",
                      futureSelfVoice: "轻一点，像终于给自己留了位置",
                      children: [
                        node({
                          id: "node-still-note-talk-seen-small-repeat",
                          parentId: "node-still-note-talk-seen-small",
                          depth: 6,
                          title: "第 4 周：你发现自己还会回来",
                          subtitle: "重复，开始比激情更重要。",
                          summary: "你并非每次都做得很好，但你发现自己愿意回到这件事上。它从幻想变成了反复出现的生活动作。",
                          gains: ["方向可信度上升", "行动开始稳定", "不再只靠情绪高峰"],
                          costs: ["节奏慢", "需要长期维护", "仍然没有最终答案"],
                          futureSelfName: "四周后还在继续的你",
                          futureSelfVoice: "平静、具体，有一点自己都没想到的笃定",
                        }),
                      ],
                    }),
                  ],
                }),
                node({
                  id: "node-still-note-talk-misread",
                  parentId: "node-still-note-talk",
                  depth: 4,
                  title: "第 1 次被误读：你又想收回去了",
                  subtitle: "一个错误回应，让你退回壳里。",
                  summary: "对方把你的复杂简化成不稳定、想太多或不现实。你短暂后悔开口，也开始明白：有些人暂时承接不了这部分你。",
                  gains: ["筛选出不适合的听众", "边界意识变强", "看见自己为何沉默"],
                  costs: ["表达欲下降", "更想独自承担", "会怀疑自己是否太矫情"],
                  futureSelfName: "收回去后的你",
                  futureSelfVoice: "敏感、防御，但开始学会保护自己",
                }),
              ],
            }),
            node({
              id: "node-still-note-hide",
              parentId: "node-still-note",
              depth: 3,
              title: "第 1 次隐藏：你删掉了那段记录",
              subtitle: "你没有忘，只是还不敢看。",
              summary: "你写下了一些东西，又觉得太真实，于是删掉或合上。问题没有消失，只是换成更安静的形式留下来。",
              gains: ["短期轻松一点", "不用立刻面对", "外表秩序不变"],
              costs: ["证据消失", "下一次更难开口", "不甘心会以别的方式回来"],
              futureSelfName: "删掉记录后的你",
              futureSelfVoice: "轻、短，像一直在绕开重点",
            }),
          ],
        }),
        node({
          id: "node-still-numb",
          parentId: "node-still-tonight",
          depth: 2,
          title: "第 7 天：你适应了那种钝感",
          subtitle: "生活继续，问题变小，也变深。",
          summary: "你没有再强烈纠结，因为日常把你重新裹住了。表面上舒服一些，底下却多了一层不想承认的疲惫。",
          gains: ["短期稳定", "不用解释", "冲突降低"],
          costs: ["热情变弱", "更依赖以后再说", "自我叙事停滞"],
          futureSelfName: "一周后变钝的你",
          futureSelfVoice: "安静、合理化，像在说服自己还好",
        }),
      ],
    }),
    node({
      id: "node-leave-first",
      depth: 1,
      title: "第 1 个决定：你开始认真准备离开",
      subtitle: "先承认旧路有裂缝，再决定怎么走。",
      summary: `你把「${choice}」从情绪变成计划：钱、时间、作品、关系沟通和失败回撤都被摊开。`,
      gains: ["自我一致性增强", "问题变成计划", "现实开始被纳入"],
      costs: ["压力上升", "需要面对资源限制", "会触发关系里的担心"],
      futureSelfName: "开始准备离开的你",
      futureSelfVoice: "锋利、清醒，像终于不再只想",
      children: [
        node({
          id: "node-leave-money",
          parentId: "node-leave-first",
          depth: 2,
          title: "第 1 张表：你算了一遍钱",
          subtitle: "理想第一次撞到数字。",
          summary: "你开始计算能撑几个月、最低成本是多少、最坏情况下怎么回来。自由没有消失，但它开始有了重量。",
          gains: ["幻想减少", "风险更清楚", "能决定是否需要缓冲"],
          costs: ["焦虑变具体", "可能被现实吓退", "浪漫感下降"],
          futureSelfName: "看完数字后的你",
          futureSelfVoice: "务实、紧绷，但更像成年人",
          children: [
            node({
              id: "node-leave-money-buffer",
              parentId: "node-leave-money",
              depth: 3,
              title: "第 2 个决定：你给离开加缓冲",
              subtitle: "你想离开，也想尽量不把自己摔碎。",
              summary: "你决定先攒出现金流、作品雏形或客户线索，再真正离开。改变被延后，但没有被取消。",
              gains: ["风险下降", "成功概率上升", "能保护自尊和生活"],
              costs: ["需要忍受过渡期", "容易拖太久", "别人可能看不见你在变"],
              futureSelfName: "带缓冲的你",
              futureSelfVoice: "稳、硬，像把冲动磨成工具",
              children: [
                node({
                  id: "node-leave-money-buffer-launch",
                  parentId: "node-leave-money-buffer",
                  depth: 4,
                  title: "第 1 次公开：你发布了第一个作品/申请",
                  subtitle: "世界终于开始回应你。",
                  summary: "你把东西放出去。反馈不完美，但它是真实的。你第一次不用只靠想象判断这条路。",
                  gains: ["获得真实反馈", "身份感增强", "下一步更具体"],
                  costs: ["害怕被评价", "结果波动影响心情", "需要持续产出"],
                  futureSelfName: "第一次公开后的你",
                  futureSelfVoice: "紧张但亮，像终于把门推开一点",
                  children: [
                    node({
                      id: "node-leave-money-buffer-launch-continue",
                      parentId: "node-leave-money-buffer-launch",
                      depth: 5,
                      title: "第 2 次反馈：有人真的看见了",
                      subtitle: "这还称不上成功，却足够让你相信。",
                      summary: "某个人、某个数字或某次对话给了你正反馈。你开始害怕：如果这真的可行，你就不能再假装自己不想要。",
                      gains: ["信心上升", "方向变真", "行动开始自驱"],
                      costs: ["期待上升", "不能退回纯幻想", "需要更系统的计划"],
                      futureSelfName: "被反馈点亮的你",
                      futureSelfVoice: "亮、快，但仍然小心翼翼",
                    }),
                  ],
                }),
                node({
                  id: "node-leave-money-buffer-endless",
                  parentId: "node-leave-money-buffer",
                  depth: 4,
                  title: "第 3 个月：准备变成新的拖延",
                  subtitle: "你一直在磨刀，但没有出门。",
                  summary: "你做了很多准备，却迟迟没有发布、申请或谈判。缓冲开始从保护变成新的笼子。",
                  gains: ["能力累积", "资源更多", "风险暂时低"],
                  costs: ["没有真实反馈", "勇气被消耗", "自我怀疑变强"],
                  futureSelfName: "准备太久的你",
                  futureSelfVoice: "克制、疲惫，像拿着地图却没出发",
                }),
              ],
            }),
            node({
              id: "node-leave-money-leap",
              parentId: "node-leave-money",
              depth: 3,
              title: "第 2 个决定：你还是直接跳了",
              subtitle: "数字没有安抚你，反而让你更想活一次。",
              summary: "你知道风险，但仍然决定离开。这个节点会带来强烈生命感，也会立刻要求你长出新结构。",
              gains: ["自我一致性极强", "旧消耗停止", "反馈速度加快"],
              costs: ["现金流压力陡升", "孤独感增加", "容易燃烧过度"],
              futureSelfName: "跳出去后的你",
              futureSelfVoice: "急促、锋利，像刚从旧壳里出来",
              children: [
                node({
                  id: "node-leave-money-leap-chaos",
                  parentId: "node-leave-money-leap",
                  depth: 4,
                  title: "第 14 天：自由变成混乱",
                  subtitle: "没有旧束缚，也还没有新秩序。",
                  summary: "你突然拥有很多时间，也突然失去外部结构。你开始发现：自由需要节奏来承载。",
                  gains: ["看清真实需求", "逼迫建立系统", "减少幻想"],
                  costs: ["压力高", "作息崩坏风险", "容易怀疑选择"],
                  futureSelfName: "混乱里的你",
                  futureSelfVoice: "沙哑、坦白，不再浪漫化自由",
                }),
              ],
            }),
          ],
        }),
        node({
          id: "node-leave-talk",
          parentId: "node-leave-first",
          depth: 2,
          title: "第 1 次谈判：你向重要的人解释",
          subtitle: "选择不只是你的，也会震动关系。",
          summary: "你尝试告诉别人你为什么想换路。你没有求许可，但你会第一次看见这条路对关系的影响。",
          gains: ["关系进入真实", "支持者可能出现", "你练习表达愿望"],
          costs: ["可能被反对", "会感到内疚", "解释成本很高"],
          futureSelfName: "解释之后的你",
          futureSelfVoice: "紧、诚实，带着一点不想再退的劲",
        }),
      ],
    }),
    node({
      id: "node-test-first",
      depth: 1,
      title: "第 1 个小实验：你先试一次",
      subtitle: "人生不立刻改写，但你开始取样。",
      summary: `你暂时不回答「${choice}」的终局，只设计一个足够小、足够真实、能在现实里反馈你的动作。`,
      gains: ["风险被拆小", "愿望被认真对待", "能获得真实信息"],
      costs: ["需要自律", "会面对反馈", "可能发现自己没那么想要"],
      futureSelfName: "90 天后的你",
      futureSelfVoice: "清醒、温柔，带一点终于开始后的平静",
      children: [
        node({
          id: "node-test-calendar",
          parentId: "node-test-first",
          depth: 2,
          title: "第 1 次排期：你把实验写进日历",
          subtitle: "愿望第一次有了时间坐标。",
          summary: "你给它一个具体日期、具体时长和具体产物。这个节点很小，但它会改变你和自己的关系。",
          gains: ["开始变得可执行", "逃避空间变小", "更容易复盘"],
          costs: ["会挤压休息", "需要守约", "可能暴露真实行动力"],
          futureSelfName: "排好日历后的你",
          futureSelfVoice: "具体、平静，像终于开始动手",
          children: [
            node({
              id: "node-test-first-output",
              parentId: "node-test-calendar",
              depth: 3,
              title: "第 1 个产物：它不完美，但存在了",
              subtitle: "现实开始有东西可看。",
              summary: "你交出一个很小的作品、申请、草稿或谈话结果。它不够好，但它让你第一次不再只凭想象爱或怕这条路。",
              gains: ["从幻想进入证据", "自我信任上升", "下一步更清楚"],
              costs: ["会被自己的不完美刺痛", "需要继续", "反馈不可控"],
              futureSelfName: "交付第一个产物的你",
              futureSelfVoice: "紧张、亮，像终于把东西放到桌上",
              children: [
                node({
                  id: "node-test-first-output-good",
                  parentId: "node-test-first-output",
                  depth: 4,
                  title: "第 1 个正反馈：有人回应了",
                  subtitle: "先别叫胜利，先把它当信号。",
                  summary: "有人看见、认可、追问或被你的东西触动。你开始意识到，这条路也许真的能长出来。",
                  gains: ["方向感增强", "继续的理由变多", "第三条路成形"],
                  costs: ["期待上升", "需要承担更多", "害怕失去这个信号"],
                  futureSelfName: "收到信号后的你",
                  futureSelfVoice: "轻一点、亮一点，但仍然谨慎",
                  children: [
                    node({
                      id: "node-test-first-output-good-next",
                      parentId: "node-test-first-output-good",
                      depth: 5,
                      title: "第 2 个实验：你开始重复它",
                      subtitle: "重复让偶然变成路线。",
                      summary: "你没有把第一次反馈当奇迹，而是设计第二次、第三次。人生没有马上换轨，但你已经开始铺轨。",
                      gains: ["路线逐渐稳定", "能力开始复利", "选择不再只靠焦虑驱动"],
                      costs: ["新责任出现", "需要系统", "会失去纯粹幻想的轻松"],
                      futureSelfName: "开始铺轨的你",
                      futureSelfVoice: "稳、亮，像终于在自己的路上走了几步",
                      children: [
                        node({
                          id: "node-test-first-output-good-next-identity",
                          parentId: "node-test-first-output-good-next",
                          depth: 6,
                          title: "第 90 天：你开始换一种方式介绍自己",
                          subtitle: "身份靠重复长出来。",
                          summary: "你还没有彻底成为另一个人，但你已经不能再只用旧身份解释自己。这是一个很小、但很真实的转折。",
                          gains: ["新身份发芽", "旧问题变小", "未来路径变多"],
                          costs: ["需要继续选择", "会面对别人不理解", "不能再躲在纯粹可能性里"],
                          futureSelfName: "90 天后开始改名的你",
                          futureSelfVoice: "温柔、具体，有一点自己都没想到的笃定",
                        }),
                      ],
                    }),
                  ],
                }),
                node({
                  id: "node-test-first-output-silent",
                  parentId: "node-test-first-output",
                  depth: 4,
                  title: "第 1 次沉默反馈：世界没有立刻回应",
                  subtitle: "没有掌声，但这也是信息。",
                  summary: "你做了东西，却没有得到想象中的反馈。失望出现，但它也帮你区分：你想要的是表达本身，还是被看见的结果。",
                  gains: ["动机被校准", "减少幻想", "下一次实验更准"],
                  costs: ["自尊波动", "会想退回去", "需要重设指标"],
                  futureSelfName: "被沉默校准后的你",
                  futureSelfVoice: "慢、准，像把失望也变成材料",
                }),
              ],
            }),
            node({
              id: "node-test-calendar-miss",
              parentId: "node-test-calendar",
              depth: 3,
              title: "第 1 次失约：你没有去做",
              subtitle: "这个节点也很重要。",
              summary: "你错过了自己定下的时间。它也在提示你：阻力可能来自害怕真实反馈。",
              gains: ["看见阻力位置", "能重新设计更小动作", "避免假装自己只是忙"],
              costs: ["自责", "节奏中断", "容易放弃整个实验"],
              futureSelfName: "第一次失约后的你",
              futureSelfVoice: "低、诚实，像终于看见真正卡住的地方",
              children: [
                node({
                  id: "node-test-calendar-miss-smaller",
                  parentId: "node-test-calendar-miss",
                  depth: 4,
                  title: "第 2 次设计：你把动作再缩小",
                  subtitle: "理想还在，只是先降低启动阻力。",
                  summary: "你把两小时改成二十分钟，把完整作品改成一页草稿。你开始学习如何让真实愿望穿过现实。",
                  gains: ["重新启动", "减少自责", "更懂自己的阻力"],
                  costs: ["看起来不够雄心", "进度更慢", "需要接受小步"],
                  futureSelfName: "重新启动的你",
                  futureSelfVoice: "温和、务实，不再用宏大压垮自己",
                }),
              ],
            }),
          ],
        }),
        node({
          id: "node-test-message",
          parentId: "node-test-first",
          depth: 2,
          title: "第 1 条消息：你约了一个懂这件事的人",
          subtitle: "把脑内循环推向现实对话。",
          summary: "你发出一条消息，约一个同行、朋友或前辈聊这条可能性。这个节点会让愿望离开脑内，进入关系和反馈。",
          gains: ["获得镜子", "减少孤独", "更快知道下一步"],
          costs: ["会暴露不确定", "可能被敷衍", "需要承受外界节奏"],
          futureSelfName: "发出消息后的你",
          futureSelfVoice: "有点紧，但比沉默更勇敢",
          children: [
            node({
              id: "node-test-message-meet",
              parentId: "node-test-message",
              depth: 3,
              title: "第 1 次见面：对话改变了问题",
              subtitle: "你得到的也许是一组更好的问题。",
              summary: "对话让你看见自己之前一直把问题想成 A/B，但现实里还有行业、技能、节奏、关系和身份的组合方式。",
              gains: ["选择空间扩大", "信息质量上升", "焦虑更具体"],
              costs: ["复杂度上升", "不能再靠单一答案", "需要整理信息"],
              futureSelfName: "对话之后的你",
              futureSelfVoice: "清醒、兴奋，带一点被打开后的混乱",
            }),
          ],
        }),
      ],
    }),
  ];
}

export function generateSelfSkill(input: GenerateSelfSkillInput): SelfSkill {
  const text = collectText(input);
  const values = detectValues(text);
  const fears = detectFears(text);
  const recurringPatterns = buildPatterns(values);
  const archetype = detectArchetype(values);
  const lifeMotif = motifs[Math.floor(Math.random() * motifs.length)];
  const voice = buildVoiceProfile(input);
  const stageVoices = buildStageVoices(input, voice);

  const evidence: Evidence[] = [
    { id: uid(), source: "question" as const, quote: `来自你的回答：「${input.currentChoice.slice(0, 48)}」` },
    { id: uid(), source: "question" as const, quote: `来自你的回答：「${input.hiddenSelf.slice(0, 48)}」` },
    {
      id: uid(),
      source: input.extraText ? ("extra_text" as const) : ("generated" as const),
      quote: input.extraText
        ? `来自你粘贴的文字：「${input.extraText.slice(0, 48)}」`
        : "系统推断：你正在尝试把犹豫转化为可行动的路径。",
    },
  ];

  if (input.wechatAnalysis) {
    evidence.push({
      id: uid(),
      source: "wechat" as const,
      quote: `来自微信记录分析：「${input.wechatAnalysis.summary.slice(0, 80)}」`,
    });
  }

  const claims = [
    {
      id: uid(),
      text: `你目前的核心冲突更接近 ${values[0]} 与 ${values[1] ?? "安全感"} 之间的拉扯。`,
      confidence: 0.78,
      evidenceIds: evidence.slice(0, 2).map((e) => e.id),
    },
    {
      id: uid(),
      text: "你现在更需要一个不会背叛自己的试验结构，先别急着定终局。",
      confidence: 0.84,
      evidenceIds: evidence.map((e) => e.id),
    },
  ];

  if (input.wechatAnalysis) {
    claims.push({
      id: uid(),
      text: `微信聊天记录补充显示，你的反复主题包含 ${input.wechatAnalysis.recurringTopics.slice(0, 3).join("、") || "关系、情绪与选择"}。`,
      confidence: 0.72,
      evidenceIds: evidence.filter((item) => item.source === "wechat").map((item) => item.id),
    });
  }

  return {
    id: uid(),
    version: "v0.2",
    createdAt: new Date().toISOString(),
    selectedVersion: input.selectedVersion,
    questions: {
      currentChoice: input.currentChoice,
      recurringEmotion: input.recurringEmotion,
      pastNode: input.pastNode,
      hiddenSelf: input.hiddenSelf,
      futureSentence: input.futureSentence,
    },
    extraText: input.extraText,
    wechatAnalysis: input.wechatAnalysis,
    identity: {
      displayName: "正在分岔的你",
      languageStyle: input.wechatAnalysis
        ? "对话型、关系感强，能在反复表达中显露真实主题"
        : input.extraText
          ? "叙事型、带自省和隐喻"
          : "简洁直接，带一点克制",
      emotionalTone: input.recurringEmotion || "复杂但清醒",
      selfNarrative: lifeMotif,
      archetype,
    },
    voice,
    stageVoices,
    semantic: {
      values,
      fears,
      desires: desirePool.slice(0, 3),
      recurringPatterns,
      innerConflict: `${values[0] ?? "自由"} vs ${values.includes("安全感") ? "安全感" : values[1] ?? "确定性"}`,
      lifeMotif,
    },
    decision: {
      riskPreference: /害怕|稳定|安全/.test(text) ? "谨慎试探型" : "机会驱动型",
      workStyle: /项目|作品|创作/.test(text) ? "项目冲刺型" : "结构迭代型",
      conflictStyle: /关系|分手|亲密/.test(text) ? "先退后谈型" : "延迟处理型",
      changeTolerance: /换|辞|转/.test(text) ? "中高，需缓冲" : "中等，需证据",
      attachmentPattern: /被理解|孤独/.test(text) ? "渴望连接但保留边界" : "独立自持型",
    },
    timeline: buildTimeline(input, stageVoices),
    evidence,
    claims,
    forks: buildLifeForks(input.currentChoice),
  };
}
