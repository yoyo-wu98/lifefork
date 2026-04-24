"use client";

import { useEffect, useMemo, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { BadgeToast } from "@/components/BadgeToast";
import { ExtraTextStep } from "@/components/ExtraTextStep";
import { ForkPaths } from "@/components/ForkPaths";
import { GeneratingScreen } from "@/components/GeneratingScreen";
import { InstanceChat } from "@/components/InstanceChat";
import { Landing } from "@/components/Landing";
import { ProgressOrb } from "@/components/ProgressOrb";
import { QuestionFlow } from "@/components/QuestionFlow";
import { SelfSkillPanel } from "@/components/SelfSkillPanel";
import { ShareCard } from "@/components/ShareCard";
import { TimelineView } from "@/components/TimelineView";
import { VersionSelector } from "@/components/VersionSelector";
import { WeChatImportStep } from "@/components/WeChatImportStep";
import { proverbs } from "@/lib/copy";
import { generateInitialInstanceMessage } from "@/lib/dialogueEngine";
import { buildLifeForks, generateSelfSkill } from "@/lib/selfSkillEngine";
import { containsCrisisSignal, safetyMessage } from "@/lib/safety";
import {
  clearAll,
  loadChatMessages,
  loadSelectedFork,
  loadSelfSkill,
  loadStep,
  loadWeChatAnalysis,
  saveChatMessages,
  saveSelectedFork,
  saveSelfSkill,
  saveStep,
  saveWeChatAnalysis,
} from "@/lib/storage";
import { AppStep, ChatMessage, ForkPath, SelfSkill, SelfVersion, WeChatAnalysis } from "@/lib/types";

const initialAnswers = {
  currentChoice: "",
  recurringEmotion: "",
  pastNode: "",
  hiddenSelf: "",
  futureSentence: "",
};

function flattenForks(paths: ForkPath[]): ForkPath[] {
  return paths.flatMap((path) => [path, ...flattenForks(path.children ?? [])]);
}

function refreshLegacyForkTree(skill: SelfSkill): SelfSkill {
  const hasLegacyCopy = flattenForks(skill.forks).some((path) => /不是答案|不是求批准|不是立刻跳|不是胜利|不是降低理想|不是独自想通|不是得到答案/.test(`${path.title} ${path.subtitle} ${path.summary}`));

  if (skill.version === "v0.2" && !hasLegacyCopy) return skill;

  return {
    ...skill,
    version: "v0.2",
    forks: buildLifeForks(skill.questions.currentChoice),
  };
}

export default function HomePage() {
  const [step, setStep] = useState<AppStep>("landing");
  const [selectedVersion, setSelectedVersion] = useState<SelfVersion | null>(null);
  const [answers, setAnswers] = useState(initialAnswers);
  const [wechatRaw, setWechatRaw] = useState("");
  const [wechatAnalysis, setWechatAnalysis] = useState<WeChatAnalysis | null>(null);
  const [extraText, setExtraText] = useState("");
  const [selfSkill, setSelfSkill] = useState<SelfSkill | null>(null);
  const [selectedFork, setSelectedFork] = useState<ForkPath | null>(null);
  const [previewForkId, setPreviewForkId] = useState<string>("node-test-first");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [badge, setBadge] = useState<string | null>(null);
  const [proverb, setProverb] = useState(proverbs[0]);

  useEffect(() => {
    const loadedStep = loadStep();
    const loadedSkill = loadSelfSkill();
    const loadedFork = loadSelectedFork();
    const loadedMsgs = loadChatMessages();
    const loadedWeChatAnalysis = loadWeChatAnalysis();
    const refreshedSkill = loadedSkill ? refreshLegacyForkTree(loadedSkill) : null;
    if (loadedStep) setStep(loadedStep);
    if (refreshedSkill) setSelfSkill(refreshedSkill);
    if (loadedWeChatAnalysis) setWechatAnalysis(loadedWeChatAnalysis);
    if (loadedFork) {
      const refreshedFork = refreshedSkill ? flattenForks(refreshedSkill.forks).find((path) => path.id === loadedFork.id) : undefined;
      const nextFork = refreshedFork ?? loadedFork;
      setSelectedFork(nextFork);
      setPreviewForkId(nextFork.id);
    }
    if (loadedMsgs.length) setMessages(loadedMsgs);
  }, []);

  useEffect(() => saveStep(step), [step]);
  useEffect(() => {
    if (selfSkill) saveSelfSkill(selfSkill);
  }, [selfSkill]);
  useEffect(() => saveSelectedFork(selectedFork), [selectedFork]);
  useEffect(() => saveChatMessages(messages), [messages]);
  useEffect(() => saveWeChatAnalysis(wechatAnalysis), [wechatAnalysis]);

  useEffect(() => {
    if (!badge) return;
    const timer = setTimeout(() => setBadge(null), 2400);
    return () => clearTimeout(timer);
  }, [badge]);

  const progress = useMemo(() => {
    const map: Record<AppStep, number> = {
      landing: 0,
      "select-version": 10,
      questions: 30,
      "wechat-import": 40,
      "extra-text": 45,
      generating: 60,
      "self-skill": 75,
      timeline: 82,
      forks: 90,
      chat: 96,
      share: 100,
    };
    return map[step];
  }, [step]);

  const createSkill = () => {
    const merged = `${Object.values(answers).join(" ")} ${extraText}`;
    if (containsCrisisSignal(merged)) {
      alert(safetyMessage);
      return;
    }

    setStep("generating");
    setTimeout(() => {
      const skill = generateSelfSkill({ selectedVersion: selectedVersion ?? "future", ...answers, extraText, wechatAnalysis: wechatAnalysis ?? undefined });
      setSelfSkill(skill);
      setSelectedFork(null);
      setMessages([]);
      setPreviewForkId("node-test-first");
      setBadge("时间线解锁");
      setStep("self-skill");
    }, 1700);
  };

  const startNewExperience = () => {
    if (selfSkill && !window.confirm("开始新体验会覆盖浏览器里当前保存的 LifeFork 进度，要继续吗？")) return;
    clearAll();
    setAnswers(initialAnswers);
    setSelectedVersion(null);
    setWechatRaw("");
    setWechatAnalysis(null);
    setExtraText("");
    setSelfSkill(null);
    setSelectedFork(null);
    setPreviewForkId("node-test-first");
    setMessages([]);
    setProverb(proverbs[0]);
    setStep("select-version");
  };

  const resetExperience = () => {
    if (!window.confirm("这会清空浏览器里保存的 LifeFork 数据，要继续吗？")) return;
    clearAll();
    setAnswers(initialAnswers);
    setSelectedVersion(null);
    setWechatRaw("");
    setWechatAnalysis(null);
    setExtraText("");
    setSelfSkill(null);
    setSelectedFork(null);
    setPreviewForkId("node-test-first");
    setMessages([]);
    setStep("landing");
  };

  const openFork = (path: ForkPath) => {
    setPreviewForkId(path.id);
    setSelectedFork(path);
    setMessages([
      {
        id: crypto.randomUUID(),
        role: "instance",
        content: generateInitialInstanceMessage(path, selfSkill ?? undefined),
        createdAt: new Date().toISOString(),
      },
    ]);
    setBadge("未来来信");
    setStep("chat");
  };

  const tuneVoice = (note: string) => {
    if (!selfSkill) return;
    const nextNotes = note === "像我" ? selfSkill.voice.calibrationNotes : Array.from(new Set([...selfSkill.voice.calibrationNotes, note]));
    setSelfSkill({
      ...selfSkill,
      voice: {
        ...selfSkill.voice,
        calibrationNotes: nextNotes,
        closenessScore: Math.min(96, selfSkill.voice.closenessScore + (note === "像我" ? 3 : 5)),
      },
    });
    setBadge(note === "像我" ? "语气更接近了" : `语气校准：${note}`);
  };

  return (
    <main className="mx-auto min-h-screen max-w-6xl space-y-6 p-6 md:p-10">
      <AppNav
        step={step}
        hasSelfSkill={Boolean(selfSkill)}
        hasSelectedFork={Boolean(selectedFork)}
        onHome={() => setStep("landing")}
        onSelfSkill={() => selfSkill && setStep("self-skill")}
        onTimeline={() => selfSkill && setStep("timeline")}
        onForks={() => selfSkill && setStep("forks")}
        onChat={() => selectedFork && setStep("chat")}
        onShare={() => selectedFork && setStep("share")}
        onReset={resetExperience}
      />
      <ProgressOrb progress={progress} />
      {step === "landing" && <Landing onStart={startNewExperience} onExample={startNewExperience} />}
      {step === "select-version" && (
        <VersionSelector
          selected={selectedVersion}
          onSelect={(v) => setSelectedVersion(v)}
          onNext={() => {
            setBadge("第一声回音");
            setStep("questions");
          }}
        />
      )}
      {step === "questions" && (
        <QuestionFlow
          answers={answers}
          setAnswer={(k, v) => setAnswers((prev) => ({ ...prev, [k]: v }))}
          onNext={() => setStep("wechat-import")}
        />
      )}
      {step === "wechat-import" && (
        <WeChatImportStep
          rawValue={wechatRaw}
          analysis={wechatAnalysis}
          onRawChange={setWechatRaw}
          onAnalysisChange={setWechatAnalysis}
          onSkip={() => setStep("extra-text")}
          onNext={() => setStep("extra-text")}
        />
      )}
      {step === "extra-text" && <ExtraTextStep value={extraText} onChange={setExtraText} onSkip={createSkill} onNext={createSkill} />}
      {step === "generating" && <GeneratingScreen />}
      {step === "self-skill" && selfSkill && <SelfSkillPanel selfSkill={selfSkill} onNext={() => setStep("timeline")} />}
      {step === "timeline" && selfSkill && (
        <TimelineView
          nodes={selfSkill.timeline}
          setNodes={(nodes) => setSelfSkill({ ...selfSkill, timeline: nodes })}
          onNext={() => {
            setBadge("第三条路发现者");
            setStep("forks");
          }}
        />
      )}
      {step === "forks" && selfSkill && (
        <ForkPaths
          selfSkill={selfSkill}
          activePathId={previewForkId}
          onPreview={(path) => setPreviewForkId(path.id)}
          onSelect={openFork}
        />
      )}
      {step === "chat" && selfSkill && selectedFork && (
        <InstanceChat
          selfSkill={selfSkill}
          selectedFork={selectedFork}
          messages={messages}
          setMessages={setMessages}
          onVoiceFeedback={tuneVoice}
          onBackToForks={() => setStep("forks")}
          onNext={() => setStep("share")}
        />
      )}
      {step === "share" && selfSkill && selectedFork && (
        <ShareCard
          selfSkill={selfSkill}
          selectedFork={selectedFork}
          proverb={proverb}
          setProverb={setProverb}
          onBackToForks={() => setStep("forks")}
          onRestart={() => {
            setAnswers(initialAnswers);
            setSelectedVersion(null);
            setWechatRaw("");
            setWechatAnalysis(null);
            setExtraText("");
            setSelfSkill(null);
            setSelectedFork(null);
            setPreviewForkId("node-test-first");
            setMessages([]);
            setStep("landing");
          }}
        />
      )}
      <BadgeToast badge={badge} />
    </main>
  );
}
