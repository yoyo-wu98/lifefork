import { ForkPath, SelfSkill } from "@/lib/types";
import { containsCrisisSignal, safetyMessage } from "@/lib/safety";
import { getDialoguePathHint, getDialogueStageHint } from "@/lib/content/lifeMapNarratives";
import { renderInUserVoice, selectStageVoiceForFork } from "@/lib/voiceEngine";

function forkStageVoice(selfSkill?: SelfSkill, selectedFork?: ForkPath) {
  return selfSkill ? selectStageVoiceForFork(selfSkill.stageVoices, selectedFork) : undefined;
}

export function generateInitialInstanceMessage(selectedFork: ForkPath, selfSkill?: SelfSkill): string {
  const finish = (base: string) => (selfSkill ? renderInUserVoice(base, selfSkill.voice, forkStageVoice(selfSkill, selectedFork), selectedFork) : base);

  if (selectedFork.scale === "life") {
    return finish(`下面按长期方案分析「${selectedFork.title}」。重点比较它对收入、关系、自主性、健康和长期后悔的影响。`);
  }

  if (selectedFork.scale === "decade" || selectedFork.scale === "era") {
    return finish(`这个节点覆盖 ${selectedFork.timeSpan?.durationLabel ?? "一个较长阶段"}。可以先比较长期收益和成本，再判断是否值得继续。`);
  }

  if (selectedFork.scale === "day" || selectedFork.scale === "hour") {
    return finish("这个节点对应一次具体事件。先确认当时发生了什么、你做了什么，以及结果是否支持当前判断。");
  }

  return finish("这个阶段把大问题拆成可以执行的步骤。先完成一个小规模测试，再根据结果调整方案。");
}

export function generateInstanceReply(message: string, selfSkill: SelfSkill, selectedFork: ForkPath): string {
  const text = message.toLowerCase();
  const finish = (base: string) => renderInUserVoice(base, selfSkill.voice, forkStageVoice(selfSkill, selectedFork), selectedFork);

  if (containsCrisisSignal(message)) {
    return safetyMessage;
  }

  if (/(后悔)/.test(text)) {
    return finish("这个方案仍然可能带来遗憾。判断重点是：它造成的损失是否可承受，以及你是否获得了足够信息来更新下一步。");
  }

  if (/(失去|代价|成本)/.test(text)) {
    return finish(`按 ${selectedFork.timeSpan?.durationLabel ?? "当前阶段"} 来看，主要成本包括：${selectedFork.costs.slice(0, 3).join("、")}。建议再确认这些成本的上限和应对措施。`);
  }

  if (/(提醒|建议|注意|确认|一步开始|第一步|开始)/.test(text)) {
    return finish(`建议先做一个有明确期限和完成标准的动作。${getDialoguePathHint(selectedFork)}`);
  }

  if (/(成功|结果|未来|会不会|最难|难)/.test(text)) {
    return finish(`现有信息无法保证结果。可以先检查成功条件、主要风险和退出条件。${getDialogueStageHint(selectedFork)}`);
  }

  return finish(`这个问题还需要更多具体信息。先写清楚你要比较的两个选项、最重要的判断标准和可接受的风险。${getDialogueStageHint(selectedFork)}`);
}
