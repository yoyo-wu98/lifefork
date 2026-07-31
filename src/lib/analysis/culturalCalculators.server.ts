import "server-only";

import { Lunar, Solar } from "lunar-typescript";
import { astro } from "iztro";
import type { BirthProfile, MethodAnalysisResult } from "@/lib/types";

const CULTURAL_LIMITATION =
  "该结果来自传统文化规则，缺少可重复验证的个人预测证据。请将它作为叙事参考，不要作为医疗、财务、关系或职业决定的依据。";

function parseBirthParts(profile: BirthProfile) {
  const [year, month, day] = profile.date.split("-").map(Number);
  const [hour = 12, minute = 0] = profile.time.split(":").map(Number);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    !Number.isInteger(hour) ||
    !Number.isInteger(minute)
  ) {
    throw new Error("出生日期或时间格式无效");
  }

  return { year, month, day, hour, minute };
}

function chineseTimeIndex(hour: number): number {
  if (hour === 23) return 12;
  if (hour === 0) return 0;
  return Math.min(11, Math.floor((hour + 1) / 2));
}

function missingInputResult(
  methodId: "bazi" | "ziwei",
  label: string,
  message: string,
): MethodAnalysisResult {
  return {
    methodId,
    label,
    category: "cultural",
    status: "missing-input",
    summary: message,
    details: [],
    confidence: 0,
    inputQuality: 0,
    limitation: CULTURAL_LIMITATION,
  };
}

export function calculateBazi(profile?: BirthProfile): MethodAnalysisResult {
  if (!profile?.consentToProcess) {
    return missingInputResult("bazi", "八字文化解读", "需要用户主动同意处理出生信息。");
  }
  if (!profile.date || profile.timeAccuracy === "unknown") {
    return missingInputResult("bazi", "八字文化解读", "需要出生日期和至少两小时范围内的出生时间。");
  }

  try {
    const { year, month, day, hour, minute } = parseBirthParts(profile);
    const lunar =
      profile.calendar === "lunar"
        ? Lunar.fromYmdHms(year, month, day, hour, minute, 0)
        : Solar.fromYmdHms(year, month, day, hour, minute, 0).getLunar();
    const eightChar = lunar.getEightChar();
    const pillars = [
      eightChar.getYear(),
      eightChar.getMonth(),
      eightChar.getDay(),
      eightChar.getTime(),
    ];
    const fiveElements = [
      eightChar.getYearWuXing(),
      eightChar.getMonthWuXing(),
      eightChar.getDayWuXing(),
      eightChar.getTimeWuXing(),
    ];
    const tenGods = [
      eightChar.getYearShiShenGan(),
      eightChar.getMonthShiShenGan(),
      eightChar.getDayShiShenGan(),
      eightChar.getTimeShiShenGan(),
    ].filter(Boolean);
    const inputQuality = profile.timeAccuracy === "exact" ? 0.86 : 0.68;

    return {
      methodId: "bazi",
      label: "八字文化解读",
      category: "cultural",
      status: "complete",
      summary: `四柱为 ${pillars.join(" / ")}，日主为 ${eightChar.getDayGan()}。`,
      details: [
        `年柱 ${pillars[0]}，月柱 ${pillars[1]}，日柱 ${pillars[2]}，时柱 ${pillars[3]}`,
        `五行标记：${fiveElements.join("、")}`,
        tenGods.length ? `天干十神：${tenGods.join("、")}` : "十神信息不足",
        `命宫：${eightChar.getMingGong()}，身宫：${eightChar.getShenGong()}`,
      ],
      confidence: 0.32,
      inputQuality,
      limitation: CULTURAL_LIMITATION,
      references: [
        {
          id: "lunar-typescript",
          title: "lunar-typescript 排盘实现",
          url: "https://github.com/6tail/lunar-typescript",
          note: "用于计算四柱等传统历法字段，不证明个人预测有效性。",
        },
      ],
      calculatedData: {
        pillars,
        dayMaster: eightChar.getDayGan(),
        fiveElements,
        tenGods,
        mingGong: eightChar.getMingGong(),
        shenGong: eightChar.getShenGong(),
      },
    };
  } catch (error) {
    return {
      ...missingInputResult("bazi", "八字文化解读", "排盘失败，请检查出生信息。"),
      status: "limited",
      details: [error instanceof Error ? error.message : "未知排盘错误"],
    };
  }
}

export function calculateZiwei(profile?: BirthProfile): MethodAnalysisResult {
  if (!profile?.consentToProcess) {
    return missingInputResult("ziwei", "紫微斗数文化解读", "需要用户主动同意处理出生信息。");
  }
  if (!profile.date || profile.timeAccuracy === "unknown") {
    return missingInputResult("ziwei", "紫微斗数文化解读", "需要出生日期和至少两小时范围内的出生时间。");
  }
  if (profile.gender !== "female" && profile.gender !== "male") {
    return missingInputResult("ziwei", "紫微斗数文化解读", "当前排盘库需要选择男或女；该字段只用于传统排盘规则。");
  }

  try {
    const { year, month, day, hour } = parseBirthParts(profile);
    const birthday = `${year}-${month}-${day}`;
    const gender = profile.gender === "female" ? "女" : "男";
    const timeIndex = chineseTimeIndex(hour);
    const astrolabe =
      profile.calendar === "lunar"
        ? astro.byLunar(birthday, timeIndex, gender, false, true, "zh-CN")
        : astro.bySolar(birthday, timeIndex, gender, true, "zh-CN");
    const palaceNames = ["命宫", "官禄", "财帛", "夫妻", "迁移"] as const;
    const palaceSummaries = palaceNames.map((name) => {
      const palace = astrolabe.palace(name);
      const stars = palace?.majorStars?.map((star) => star.name).filter(Boolean) ?? [];
      return `${name}：${stars.length ? stars.join("、") : "无主星"}`;
    });
    const inputQuality = profile.timeAccuracy === "exact" ? 0.84 : 0.64;

    return {
      methodId: "ziwei",
      label: "紫微斗数文化解读",
      category: "cultural",
      status: "complete",
      summary: `命宫主星：${astrolabe.palace("命宫")?.majorStars?.map((star) => star.name).join("、") || "无主星"}。`,
      details: [
        `生肖：${astrolabe.zodiac}；星座：${astrolabe.sign}`,
        ...palaceSummaries,
      ],
      confidence: 0.3,
      inputQuality,
      limitation: CULTURAL_LIMITATION,
      references: [
        {
          id: "iztro",
          title: "iztro 紫微斗数排盘实现",
          url: "https://github.com/SylarLong/iztro",
          note: "用于生成传统排盘字段，不证明个人预测有效性。",
        },
      ],
      calculatedData: {
        solarDate: astrolabe.solarDate,
        lunarDate: astrolabe.lunarDate,
        timeRange: astrolabe.timeRange,
        zodiac: astrolabe.zodiac,
        sign: astrolabe.sign,
        palaces: palaceSummaries,
      },
    };
  } catch (error) {
    return {
      ...missingInputResult("ziwei", "紫微斗数文化解读", "排盘失败，请检查出生信息。"),
      status: "limited",
      details: [error instanceof Error ? error.message : "未知排盘错误"],
    };
  }
}

export function calculateCulturalMethods(profile?: BirthProfile): MethodAnalysisResult[] {
  return [calculateBazi(profile), calculateZiwei(profile)];
}
