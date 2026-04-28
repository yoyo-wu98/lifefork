import { WeChatAnalysis, WeChatMessageSample } from "@/lib/types";

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

interface ParsedLine {
  timeLabel?: string;
  speaker: string;
  content: string;
}

const topicLexicon: Record<string, string[]> = {
  工作与职业: ["工作", "公司", "老板", "同事", "项目", "加班", "辞职", "面试", "offer", "职业", "收入"],
  关系与边界: ["关系", "分手", "喜欢", "爱", "亲密", "朋友", "家人", "陪伴", "理解", "边界", "失望"],
  自我表达: ["创作", "内容", "作品", "写", "拍", "表达", "账号", "视频", "文章", "设计", "音乐"],
  选择与转折: ["选择", "决定", "纠结", "离开", "换城市", "读博", "创业", "转行", "开始", "放弃"],
  情绪与压力: ["焦虑", "累", "疲惫", "崩溃", "压力", "不甘心", "害怕", "孤独", "空心", "难过"],
  现实约束: ["钱", "房", "稳定", "风险", "父母", "家庭", "时间", "成本", "安全", "现实"],
};

const emotionLexicon: Record<string, string[]> = {
  焦虑: ["焦虑", "慌", "担心", "压力", "紧张", "怕"],
  疲惫: ["累", "疲惫", "撑不住", "麻木", "困", "烦"],
  不甘: ["不甘心", "不甘", "凭什么", "想赢", "证明"],
  孤独: ["孤独", "没人懂", "一个人", "被误解", "冷"],
  愤怒: ["生气", "愤怒", "受不了", "恶心"],
  希望: ["想试", "开始", "期待", "开心", "喜欢", "希望"],
};

const keyMomentPattern = /(辞职|分手|离开|失败|开始|决定|后悔|害怕|不甘心|崩溃|喜欢|讨厌|换城市|读博|创业|转行|放弃|被困住|想试)/;

function sanitizeText(text: string, maxLength = 72) {
  return text
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .replace(/1[3-9]\d{9}/g, "[phone]")
    .replace(/https?:\/\/\S+/g, "[link]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function parseLine(line: string, index: number): ParsedLine | null {
  const clean = line.trim();
  if (!clean || /^(撤回了一条消息|以下为新消息|消息记录|微信聊天记录)/.test(clean)) return null;

  const bracketed = clean.match(/^\[?(\d{4}[/-]\d{1,2}[/-]\d{1,2}\s+\d{1,2}:\d{2}(?::\d{2})?)\]?\s*(?:-|—|:|：)?\s*(.*)$/);
  if (bracketed) {
    const rest = bracketed[2].trim();
    const speakerMessage = rest.match(/^([^:：]{1,28})[:：]\s*(.+)$/);
    if (speakerMessage) {
      return { timeLabel: bracketed[1], speaker: sanitizeText(speakerMessage[1], 24) || "未知对象", content: sanitizeText(speakerMessage[2], 180) };
    }
    return { timeLabel: bracketed[1], speaker: "未知对象", content: sanitizeText(rest, 180) };
  }

  const speakerMessage = clean.match(/^([^:：]{1,28})[:：]\s*(.+)$/);
  if (speakerMessage) {
    return { speaker: sanitizeText(speakerMessage[1], 24) || "未知对象", content: sanitizeText(speakerMessage[2], 180) };
  }

  return { speaker: `片段 ${Math.min(index + 1, 999)}`, content: sanitizeText(clean, 180) };
}

function countMatches(text: string, lexicon: Record<string, string[]>) {
  return Object.entries(lexicon)
    .map(([label, words]) => ({
      label,
      score: words.reduce((sum, word) => sum + (text.match(new RegExp(word, "g"))?.length ?? 0), 0),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);
}

function collectKeywords(text: string) {
  const words = Object.values(topicLexicon).flat();
  return words
    .map((word) => ({ word, score: text.match(new RegExp(word, "g"))?.length ?? 0 }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map((item) => item.word);
}

function buildDateRange(messages: ParsedLine[]) {
  const dates = messages.map((message) => message.timeLabel).filter(Boolean) as string[];
  if (!dates.length) return undefined;
  return dates.length === 1 ? dates[0] : `${dates[0]} - ${dates[dates.length - 1]}`;
}

function buildKeyMoments(messages: ParsedLine[]): WeChatMessageSample[] {
  const moments = messages
    .filter((message) => keyMomentPattern.test(message.content))
    .slice(0, 6)
    .map((message) => ({
      id: uid(),
      timeLabel: message.timeLabel,
      speaker: message.speaker,
      content: message.content,
    }));

  return moments.length
    ? moments
    : messages.slice(0, 3).map((message) => ({
        id: uid(),
        timeLabel: message.timeLabel,
        speaker: message.speaker,
        content: message.content,
      }));
}

export function analyzeWeChatExport(raw: string, sourceName = "粘贴的微信记录"): WeChatAnalysis {
  const normalized = raw.replace(/\r/g, "\n");
  const lines = normalized.split("\n").slice(0, 8000);
  const messages = lines.map(parseLine).filter(Boolean) as ParsedLine[];
  const compactText = messages.map((message) => message.content).join(" ") || normalized.slice(0, 12000);
  const participants = Array.from(new Set(messages.map((message) => message.speaker).filter((speaker) => !speaker.startsWith("片段")))).slice(0, 8);
  const topics = countMatches(compactText, topicLexicon);
  const emotions = countMatches(compactText, emotionLexicon);
  const recurringTopics = topics.slice(0, 5).map((topic) => topic.label);
  const emotionalSignals = emotions.slice(0, 5).map((emotion) => emotion.label);
  const topKeywords = collectKeywords(compactText);
  const keyMoments = buildKeyMoments(messages);

  const summary = [
    `本地读取到 ${messages.length || lines.filter(Boolean).length} 条可分析片段`,
    participants.length ? `主要出现 ${participants.length} 个对话对象` : "未稳定识别出说话人",
    recurringTopics.length ? `高频主题集中在：${recurringTopics.join("、")}` : "暂未识别出稳定主题",
    emotionalSignals.length ? `情绪线索包括：${emotionalSignals.join("、")}` : "情绪线索较弱",
  ].join("；");

  const selfSkillSignals = [
    recurringTopics.includes("选择与转折") ? "聊天中反复出现选择、离开、开始或放弃，说明这段关系材料能帮助识别人生转折。" : "",
    recurringTopics.includes("关系与边界") ? "聊天中存在关系与边界主题，可以用于观察亲密、期待、后退和被理解的模式。" : "",
    recurringTopics.includes("工作与职业") ? "聊天中出现工作与职业压力，可以补充当前选择背后的现实约束。" : "",
    recurringTopics.includes("自我表达") ? "聊天中出现表达、作品或内容线索，可以强化创造性愿望的证据。" : "",
    emotionalSignals.length ? `情绪层面最明显的是 ${emotionalSignals.slice(0, 3).join("、")}。` : "",
  ].filter(Boolean);

  return {
    id: uid(),
    createdAt: new Date().toISOString(),
    sourceName,
    rawLength: raw.length,
    parsedMessageCount: messages.length || lines.filter(Boolean).length,
    participantCount: participants.length,
    participants,
    dateRange: buildDateRange(messages),
    topKeywords,
    recurringTopics,
    emotionalSignals,
    keyMoments,
    privacyNotes: ["原始聊天文本不会写入 Self Skill", "证据片段已做基础邮箱/手机号/链接脱敏", "请只导入你有权分析的聊天材料"],
    summary,
    selfSkillSignals: selfSkillSignals.length ? selfSkillSignals : ["这段材料会作为表达风格和反复主题的辅助证据。"],
    suggestedSelfSkillText: `${summary}。关键线索：${selfSkillSignals.join(" ") || "可用于补充语言风格、关系模式和情绪线索。"}`,
  };
}
