import { ForkPath, GenerateSelfSkillInput, StageVoice, VoiceProfile } from "@/lib/types";

function collectVoiceText(input: GenerateSelfSkillInput) {
  return [
    input.currentChoice,
    input.recurringEmotion,
    input.pastNode,
    input.hiddenSelf,
    input.futureSentence,
    input.extraText ?? "",
    input.wechatAnalysis?.suggestedSelfSkillText ?? "",
    input.wechatAnalysis?.keyMoments.map((moment) => moment.content).join(" ") ?? "",
  ].join(" ");
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

function detectSignaturePhrases(text: string) {
  const candidates = ["其实", "总觉得", "另一部分", "被困住", "不甘心", "害怕普通", "先试试看", "不要背叛自己", "终于开始了"];
  const found = candidates.filter((phrase) => text.includes(phrase));
  return found.length ? found.slice(0, 5) : ["其实", "我总觉得", "先试试看"];
}

function detectTraits(text: string) {
  const traits = [];
  if (/[，,].*[，,]/.test(text) || text.length > 80) traits.push("习惯先描述背景，再给出判断");
  if (/(其实|但|总觉得|好像)/.test(text)) traits.push("常用转折说明真实原因");
  if (/(总觉得|好像|可能|有点)/.test(text)) traits.push("表达判断时会保留不确定性");
  if (/(不甘心|害怕|焦虑|普通)/.test(text)) traits.push("会同时说明情绪和价值判断");
  if (/(哈哈|笑死|救命|真的)/.test(text)) traits.push("口语化明显，会用自嘲降低表达压力");
  return traits.length ? traits : ["表达克制", "倾向先描述情况再下结论"];
}

function detectToneName(text: string) {
  if (/(哈哈|笑死|救命)/.test(text)) return "口语自嘲型";
  if (/(不甘心|害怕普通|被看见)/.test(text)) return "情绪直接型";
  if (/(可能|好像|总觉得|其实)/.test(text)) return "谨慎试探型";
  return "理性克制型";
}

function detectRhythm(text: string) {
  if (text.length > 160) return "长句较多，习惯补充背景和转折";
  if (/[。！？]/.test(text)) return "短句和中句交替，表达节奏清楚";
  return "口语化、短句较多，判断相对谨慎";
}

function detectPunctuation(text: string) {
  if (/……|\.{3,}/.test(text)) return "经常使用省略号，表达中保留未完成信息";
  if (/！/.test(text)) return "会用感叹号强调情绪";
  if (/？/.test(text)) return "经常使用问句表达不确定性";
  return "标点使用较少，表达相对克制";
}

function buildSample(input: GenerateSelfSkillInput, phrases: string[]) {
  const phrase = phrases[0] ?? "其实";
  const choice = input.currentChoice || "这件事";
  if (phrase.includes("其实")) return `其实我纠结“${choice}”时，最担心的是继续拖延，也担心行动后结果不理想。`;
  return `我总觉得，${choice} 需要先把收益、风险和时间成本列清楚。`;
}

export function buildVoiceProfile(input: GenerateSelfSkillInput): VoiceProfile {
  const text = collectVoiceText(input);
  const traits = detectTraits(text);
  const signaturePhrases = detectSignaturePhrases(text);
  const calibrationNotes = input.voiceCalibration ?? [];
  const closenessBoost = Math.min(18, calibrationNotes.length * 4);

  return {
    toneName: detectToneName(text),
    closenessScore: Math.min(88, 58 + signaturePhrases.length * 3 + traits.length * 2 + closenessBoost),
    traits,
    signaturePhrases,
    sentenceRhythm: detectRhythm(text),
    punctuationStyle: detectPunctuation(text),
    emotionalGesture: text.includes("其实") || text.includes("总觉得") ? "先描述表面问题，再说明真正顾虑" : "先说明复杂性，再提出可执行动作",
    sampleLine: buildSample(input, signaturePhrases),
    calibrationNotes,
  };
}

export function buildStageVoices(input: GenerateSelfSkillInput, voice: VoiceProfile): StageVoice[] {
  const shared = voice.signaturePhrases.slice(0, 2);
  return [
    {
      id: "voice-past",
      stage: "past",
      ageLabel: "过去的你",
      toneName: "犹豫试探型",
      description: "句子更短，判断更犹豫，常常省略真实顾虑。",
      sampleLine: `我那时候说不清楚，但「${input.pastNode || "这件事"}」确实影响了后来的选择。`,
      traits: unique(["犹豫", "防御", "避免直接下结论", ...shared]),
    },
    {
      id: "voice-hidden",
      stage: "hidden",
      ageLabel: "隐藏特征",
      toneName: "直接表达型",
      description: "表达更直接，但会担心别人如何评价。",
      sampleLine: input.hiddenSelf || "我其实很在意，只是一直没有找到合适的表达方式。",
      traits: unique(["敏感", "直接", "在意评价", ...shared]),
    },
    {
      id: "voice-present",
      stage: "present",
      ageLabel: "现在的你",
      toneName: voice.toneName,
      description: "会先说明复杂情况，再把选择拆成可以执行的步骤。",
      sampleLine: voice.sampleLine,
      traits: voice.traits.slice(0, 4),
    },
    {
      id: "voice-future",
      stage: "future",
      ageLabel: "未来的你",
      toneName: "长期复盘型",
      description: "语气更稳定，重点说明长期结果、代价和调整方式。",
      sampleLine: input.futureSentence || "你做过验证，也根据结果及时调整了方向。",
      traits: unique(["稳定", "具体", "保留不确定性", ...shared]),
    },
    {
      id: "voice-fork",
      stage: "fork",
      ageLabel: "方案模拟版本",
      toneName: "方案复盘型",
      description: "针对当前方案说明实际收益、成本和需要调整的地方。",
      sampleLine: "这个方案未必最优，但它提供了可以用于下一次判断的真实结果。",
      traits: unique(["比较方案", "说明代价", "不做绝对判断", ...shared]),
    },
  ];
}

function applyCalibration(text: string, notes: string[]) {
  let result = text;
  if (notes.includes("像我")) {
    result = result.replace(/你真正想问的，可能是/g, "你可能真正在问");
  }
  if (notes.includes("更口语")) {
    result = result.replace(/我不能告诉你/g, "说白了，我不能告诉你").replace(/在这条路径里，关键/g, "这条路最关键的");
  }
  if (notes.includes("更克制")) {
    result = result.replace(/终于/g, "开始").replace(/燃烧后的/g, "").replace(/命运机器/g, "预测工具");
  }
  if (notes.includes("更锋利") || notes.includes("更直接")) {
    result = `${result}\n更直接地说：停止继续补充假设，先完成一个现实动作。`;
  }
  if (notes.includes("少一点AI味")) {
    result = result.replace(/基于你当前材料生成的可能性模拟/g, "根据现有信息生成的模拟").replace(/LifeFork 不做/g, "这个工具不会");
  }
  return result;
}

export function selectStageVoiceForFork(stageVoices: StageVoice[], selectedFork?: ForkPath) {
  if (!stageVoices.length) return undefined;
  if (!selectedFork) return stageVoices.find((voice) => voice.stage === "present") ?? stageVoices[0];

  if (selectedFork.scale === "life" || selectedFork.scale === "decade") {
    return stageVoices.find((voice) => voice.stage === "future") ?? stageVoices[0];
  }

  if (selectedFork.scale === "day" || selectedFork.scale === "hour") {
    return stageVoices.find((voice) => voice.stage === "present") ?? stageVoices[0];
  }

  if (selectedFork.lane === "relationship") {
    return stageVoices.find((voice) => voice.stage === "hidden") ?? stageVoices[0];
  }

  if (selectedFork.lane === "leap" || selectedFork.lane === "creation") {
    return stageVoices.find((voice) => voice.stage === "fork") ?? stageVoices[0];
  }

  return stageVoices.find((voice) => voice.stage === "fork") ?? stageVoices[0];
}

function stagePrefix(selectedFork: ForkPath, voice: VoiceProfile, stageVoice?: StageVoice) {
  if (stageVoice?.stage === "hidden") return voice.calibrationNotes.includes("更口语") ? "说实话，" : "直接说明主要顾虑：";
  if (stageVoice?.stage === "future") return "从长期看，";
  if (selectedFork.scale === "life" || selectedFork.scale === "decade") return "按长期结果看：";
  if (selectedFork.lane === "stability") return "按维持现状的方案看：";
  if (selectedFork.lane === "leap") return "按立即转向的方案看：";
  return voice.signaturePhrases.includes("其实") ? "其实，" : "";
}

export function renderInUserVoice(base: string, voice: VoiceProfile, stageVoice?: StageVoice, selectedFork?: ForkPath) {
  const prefix = selectedFork ? stagePrefix(selectedFork, voice, stageVoice) : "";
  const stageLine =
    stageVoice?.stage === "past"
      ? "\n当时的信息和表达能力有限，需要结合现在的材料重新判断。"
      : "";
  const softened = base.replace(/应该/g, "可以先");
  const withPrefix = prefix && !softened.startsWith(prefix) ? `${prefix}${softened}` : softened;
  return applyCalibration(`${withPrefix}${stageLine}`, voice.calibrationNotes);
}
