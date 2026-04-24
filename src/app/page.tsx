"use client";

import { useEffect, useMemo, useState } from "react";
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
import { proverbs } from "@/lib/copy";
import { generateSelfSkill } from "@/lib/selfSkillEngine";
import { containsCrisisSignal, safetyMessage } from "@/lib/safety";
import { loadChatMessages, loadSelectedFork, loadSelfSkill, loadStep, saveChatMessages, saveSelectedFork, saveSelfSkill, saveStep } from "@/lib/storage";
import { AppStep, ChatMessage, ForkPath, SelfSkill, SelfVersion } from "@/lib/types";

const initialAnswers = {
  currentChoice: "",
  recurringEmotion: "",
  pastNode: "",
  hiddenSelf: "",
  futureSentence: "",
};

export default function HomePage() {
  const [step, setStep] = useState<AppStep>("landing");
  const [selectedVersion, setSelectedVersion] = useState<SelfVersion | null>(null);
  const [answers, setAnswers] = useState(initialAnswers);
  const [extraText, setExtraText] = useState("");
  const [selfSkill, setSelfSkill] = useState<SelfSkill | null>(null);
  const [selectedFork, setSelectedFork] = useState<ForkPath | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [badge, setBadge] = useState<string | null>(null);
  const [proverb, setProverb] = useState(proverbs[0]);

  useEffect(() => {
    const loadedStep = loadStep();
    const loadedSkill = loadSelfSkill();
    const loadedFork = loadSelectedFork();
    const loadedMsgs = loadChatMessages();
    if (loadedStep) setStep(loadedStep);
    if (loadedSkill) setSelfSkill(loadedSkill);
    if (loadedFork) setSelectedFork(loadedFork);
    if (loadedMsgs.length) setMessages(loadedMsgs);
  }, []);

  useEffect(() => saveStep(step), [step]);
  useEffect(() => {
    if (selfSkill) saveSelfSkill(selfSkill);
  }, [selfSkill]);
  useEffect(() => {
    if (selectedFork) saveSelectedFork(selectedFork);
  }, [selectedFork]);
  useEffect(() => saveChatMessages(messages), [messages]);

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
      const skill = generateSelfSkill({ selectedVersion: selectedVersion ?? "future", ...answers, extraText });
      setSelfSkill(skill);
      setBadge("时间线解锁");
      setStep("self-skill");
    }, 1700);
  };

  return (
    <main className="mx-auto min-h-screen max-w-6xl space-y-6 p-6 md:p-10">
      <ProgressOrb progress={progress} />
      {step === "landing" && <Landing onStart={() => setStep("select-version")} onExample={() => setStep("select-version")} />}
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
          paths={selfSkill.forks}
          onSelect={(path) => {
            setSelectedFork(path);
            setMessages([
              {
                id: crypto.randomUUID(),
                role: "instance",
                content:
                  "我不是来告诉你一定会怎样的。我只是想告诉你：当你终于把问题从“我要不要彻底改变人生”改成“我能不能先认真试一次”，你身上的紧绷会松开一点。你真正需要的不是一个完美答案，而是一个不会背叛自己的实验。",
                createdAt: new Date().toISOString(),
              },
            ]);
            setBadge("未来来信");
            setStep("chat");
          }}
        />
      )}
      {step === "chat" && selfSkill && selectedFork && (
        <InstanceChat
          selfSkill={selfSkill}
          selectedFork={selectedFork}
          messages={messages}
          setMessages={setMessages}
          onNext={() => setStep("share")}
        />
      )}
      {step === "share" && selfSkill && selectedFork && (
        <ShareCard
          selfSkill={selfSkill}
          selectedFork={selectedFork}
          proverb={proverb}
          setProverb={setProverb}
          onRestart={() => {
            setAnswers(initialAnswers);
            setExtraText("");
            setSelfSkill(null);
            setSelectedFork(null);
            setMessages([]);
            setStep("landing");
          }}
        />
      )}
      <BadgeToast badge={badge} />
    </main>
  );
}
