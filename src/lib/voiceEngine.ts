import { ForkPath, GenerateSelfSkillInput, StageVoice, VoiceProfile } from "@/lib/types";

function collectVoiceText(input: GenerateSelfSkillInput) {
  return [
    input.currentChoice,
    input.recurringEmotion,
    input.pastNode,
    input.hiddenSelf,
    input.futureSentence,
    input.extraText ?? "",
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
  if (/[，,].*[，,]/.test(text) || text.length > 80) traits.push("会把感受绕完整再落到判断");
  if (/(其实|但|总觉得|好像)/.test(text)) traits.push("会先绕开表面理由，再靠近真正原因");
  if (/(总觉得|好像|可能|有点)/.test(text)) traits.push("表达里保留不确定性和自我观察");
  if (/(不甘心|害怕|焦虑|普通)/.test(text)) traits.push("会把情绪和价值判断放在一起说");
  if (/(哈哈|笑死|救命|真的)/.test(text)) traits.push("有即时口语感，会用轻微自嘲缓冲沉重内容");
  return traits.length ? traits : ["克制、自省、带一点试探", "比起下结论，更习惯描述一种状态"];
}

function detectToneName(text: string) {
  if (/(哈哈|笑死|救命)/.test(text)) return "自嘲式清醒";
  if (/(不甘心|害怕普通|被看见)/.test(text)) return "压着火的坦白";
  if (/(可能|好像|总觉得|其实)/.test(text)) return "试探式自省";
  return "克制的内心独白";
}

function detectRhythm(text: string) {
  if (text.length > 160) return "长句偏多，常用转折把复杂感受慢慢摊开";
  if (/[。！？]/.test(text)) return "短句和中句交替，适合一层一层靠近真实想法";
  return "偏口语，节奏短，适合直接但不武断的表达";
}

function detectPunctuation(text: string) {
  if (/……|\.{3,}/.test(text)) return "会用省略号保留未说完的余地";
  if (/！/.test(text)) return "偶尔用感叹号表达情绪抬升";
  if (/？/.test(text)) return "会用问句承认不确定，给判断留一点缓冲";
  return "标点克制，更多依靠词语本身承载情绪";
}

function buildSample(input: GenerateSelfSkillInput, phrases: string[]) {
  const phrase = phrases[0] ?? "其实";
  const choice = input.currentChoice || "这件事";
  if (phrase.includes("其实")) return `其实我纠结“${choice}”时，最怕的是又把真正想要的东西往后放。`;
  return `我总觉得，${choice} 像是在问我到底还要不要继续承认自己。`;
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
    emotionalGesture: text.includes("其实") || text.includes("总觉得") ? "先剥开表面理由，再靠近真正愿望" : "先承认复杂，再给自己一个可行动出口",
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
      toneName: "还没说出口的试探",
      description: "更短、更犹豫，很多话停在半句；像是在保护一个还没被允许的愿望。",
      sampleLine: `我那时候可能说不清，只会觉得：${input.pastNode || "这件事"} 好像不只是过去了。`,
      traits: unique(["犹豫", "防御", "想解释又怕太认真", ...shared]),
    },
    {
      id: "voice-hidden",
      stage: "hidden",
      ageLabel: "暗线里的你",
      toneName: "压低声音的真实",
      description: "更直接，也更怕被看见；它不一定成熟，但很接近真实欲望。",
      sampleLine: input.hiddenSelf || "我其实没有那么无所谓，我只是一直没找到合适的出口。",
      traits: unique(["敏感", "真实", "有一点反叛", ...shared]),
    },
    {
      id: "voice-present",
      stage: "present",
      ageLabel: "现在的你",
      toneName: voice.toneName,
      description: "会先描述复杂感受，再试图把选择拆成可以承受的小块。",
      sampleLine: voice.sampleLine,
      traits: voice.traits.slice(0, 4),
    },
    {
      id: "voice-future",
      stage: "future",
      ageLabel: "未来的你",
      toneName: "更慢一点的清醒",
      description: "更稳、更少自责，但仍保留你说话里的转折和自我审问。",
      sampleLine: input.futureSentence || "你没有浪费人生，你只是终于开始用自己的方式验证它。",
      traits: unique(["温柔", "清醒", "不替现在的你下命令", ...shared]),
    },
    {
      id: "voice-fork",
      stage: "fork",
      ageLabel: "分支人生里的你",
      toneName: "带着代价感的回望",
      description: "每条岔路都要保留不同代价：留下更克制，转向更锋利，试验更平静。",
      sampleLine: "我不能说这条路一定对，但它至少让我更知道自己在为什么付出。",
      traits: unique(["反事实", "代价意识", "不绝对化", ...shared]),
    },
  ];
}

function applyCalibration(text: string, notes: string[]) {
  let result = text;
  if (notes.includes("更口语")) {
    result = result.replace(/我不能告诉你/g, "说白了，我不能告诉你").replace(/在这条路径里，关键/g, "这条路最关键的");
  }
  if (notes.includes("更克制")) {
    result = result.replace(/终于/g, "开始").replace(/燃烧后的/g, "").replace(/命运机器/g, "预测工具");
  }
  if (notes.includes("更锋利")) {
    result = `${result}\n更直白一点说：别再只分析自己了，你需要一个现实里的动作。`;
  }
  if (notes.includes("少一点AI味")) {
    result = result.replace(/基于你当前材料生成的可能性模拟/g, "一种可能的回声").replace(/LifeFork 不做/g, "这东西不做");
  }
  return result;
}

function stagePrefix(selectedFork: ForkPath, voice: VoiceProfile) {
  if (selectedFork.id.startsWith("node-still")) return voice.calibrationNotes.includes("更口语") ? "我先说句不那么漂亮的话：" : "我会说得慢一点：";
  if (selectedFork.id.startsWith("node-leave")) return voice.calibrationNotes.includes("更克制") ? "直接说：" : "我可能会更锋利一点说：";
  return voice.signaturePhrases.includes("其实") ? "其实，" : "";
}

export function renderInUserVoice(base: string, voice: VoiceProfile, stageVoice?: StageVoice, selectedFork?: ForkPath) {
  const prefix = selectedFork ? stagePrefix(selectedFork, voice) : "";
  const stageLine = stageVoice?.stage === "future" || stageVoice?.stage === "fork" ? "" : "";
  const softened = base.replace(/应该/g, "可以先");
  const withPrefix = prefix && !softened.startsWith(prefix) ? `${prefix}${softened}` : softened;
  return applyCalibration(`${withPrefix}${stageLine}`, voice.calibrationNotes);
}
