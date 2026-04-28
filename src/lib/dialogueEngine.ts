import { ForkPath, SelfSkill } from "@/lib/types";
import { renderInUserVoice } from "@/lib/voiceEngine";

function forkStageVoice(selfSkill?: SelfSkill) {
  return selfSkill?.stageVoices.find((voice) => voice.stage === "fork") ?? selfSkill?.stageVoices.find((voice) => voice.stage === "future");
}

export function generateInitialInstanceMessage(selectedFork: ForkPath, selfSkill?: SelfSkill): string {
  const finish = (base: string) => (selfSkill ? renderInUserVoice(base, selfSkill.voice, forkStageVoice(selfSkill), selectedFork) : base);

  if (selectedFork.scale === "life") {
    return finish(`我现在站在一整条人生的尺度上看你。${selectedFork.title} 不是今天就能证明对错的事，它更像一种长期排序：你把什么放到前面，什么就会慢慢塑造你。`);
  }

  if (selectedFork.scale === "decade" || selectedFork.scale === "era") {
    return finish(`从 ${selectedFork.timeSpan?.durationLabel ?? "这个阶段"} 的尺度看，这条路真正改变的是你反复怎样安排生活。我们先看长期代价，再看它值不值得。`);
  }

  if (selectedFork.scale === "day" || selectedFork.scale === "hour") {
    return finish("这个节点已经很近了，近到可以听见你的犹豫、身体反应和一句话的重量。先别急着总结人生，我们只看这一刻暴露了什么。");
  }

  return finish("这个阶段负责把大问题缩小一点。你不必一次改写人生，先让现实给你一个样本。");
}

function pathHint(selectedFork: ForkPath): string {
  if (selectedFork.lane === "stability") return "在这条线上，先分清楚：你是在恢复判断力，还是又把自己往后放。";
  if (selectedFork.lane === "leap") return "在这条线上，让每一步都有现实承托，别只靠一口气冲过去。";
  if (selectedFork.lane === "relationship") return "在这条线上，把关系当作现实变量，而不是把所有压力都吞回自己身上。";
  return "在这条线上，把愿望压缩成一次能被现实检验的动作。";
}

export function generateInstanceReply(message: string, selfSkill: SelfSkill, selectedFork: ForkPath): string {
  const text = message.toLowerCase();
  const finish = (base: string) => renderInUserVoice(base, selfSkill.voice, forkStageVoice(selfSkill), selectedFork);

  if (/(后悔)/.test(text)) {
    return finish("我不能替你保证没有遗憾。每条路都会带走一些东西。\n但在这条路径里，我最庆幸的是：你终于停止把真实愿望无限延期。你给自己一次被现实检验的机会，这很重要。");
  }

  if (/(失去|代价)/.test(text)) {
    return finish(`这条路的代价要按 ${selectedFork.timeSpan?.durationLabel ?? "这个阶段"} 来看。短尺度里，它可能只是疲惫、解释成本或一次失约；长尺度里，它会变成身份、关系和后悔方式的变化。\n你要看的核心，是这种代价能不能被你的长期价值承认。`);
  }

  if (/(提醒|建议|一步开始|开始)/.test(text)) {
    return finish(`我最想提醒你的是：不要把“还没准备好”当成永远不开始的理由。\n${pathHint(selectedFork)}`);
  }

  if (/(成功|结果|未来|会不会|最难|难)/.test(text)) {
    return finish("我不能告诉你一定会成功。LifeFork 不做命运判决。\n但我可以帮你看见尺度差异：全人生尺度看价值排序，十年尺度看代价，一年尺度看结构，一天和一小时尺度看真实动作。你越能把它放到合适尺度里，就越接近真相。");
  }

  return finish("我听见你真正想问的，可能是：我这样想有问题吗？\n没有问题。你只是站在一条旧路和一种新可能之间。先别急着审判自己，我们可以把这个选择拆小一点。");
}
