import { ForkPath, SelfSkill } from "@/lib/types";
import { renderInUserVoice } from "@/lib/voiceEngine";

function forkStageVoice(selfSkill?: SelfSkill) {
  return selfSkill?.stageVoices.find((voice) => voice.stage === "fork") ?? selfSkill?.stageVoices.find((voice) => voice.stage === "future");
}

export function generateInitialInstanceMessage(selectedFork: ForkPath, selfSkill?: SelfSkill): string {
  const finish = (base: string) => (selfSkill ? renderInUserVoice(base, selfSkill.voice, forkStageVoice(selfSkill), selectedFork) : base);

  if (selectedFork.id.startsWith("node-still")) {
    return finish("这一刻你先按住生活，问题没有被解决，只是被暂时放到桌面上。明天醒来，如果它还在，我们就继续读下一个节点。");
  }

  if (selectedFork.id.startsWith("node-leave")) {
    return finish("从这个节点开始，你把真实愿望放进计划里。下一步会更重，也会更像你自己。");
  }

  return finish("当你把问题从“我要不要彻底改变人生”改成“我能不能先认真试一次”，身上的紧绷会松开一点。这个节点负责取样，先让现实回一句话。");
}

function pathHint(selectedFork: ForkPath): string {
  if (selectedFork.id.startsWith("node-still")) return "在这个节点里，先分清楚：你是在恢复判断力，还是又把自己往后放。";
  if (selectedFork.id.startsWith("node-leave")) return "在这个节点里，让每一步都有现实承托，别只靠一口气冲过去。";
  return "在这个节点里，把愿望压缩成一次能被现实检验的动作。";
}

export function generateInstanceReply(message: string, selfSkill: SelfSkill, selectedFork: ForkPath): string {
  const text = message.toLowerCase();
  const finish = (base: string) => renderInUserVoice(base, selfSkill.voice, forkStageVoice(selfSkill), selectedFork);

  if (/(后悔)/.test(text)) {
    return finish("我不能替你保证没有遗憾。每条路都会带走一些东西。\n但在这条路径里，我最庆幸的是：你终于停止把真实愿望无限延期。你给自己一次被现实检验的机会，这很重要。");
  }

  if (/(失去|代价)/.test(text)) {
    return finish("这条路的代价通常藏在日常里：少一点轻松，少一点确定，少一点别人眼中的“正常进度”。\n同时，你会得到一种更硬的东西：你开始知道自己到底有没有那么想要它。");
  }

  if (/(提醒|建议|一步开始|开始)/.test(text)) {
    return finish(`我最想提醒你的是：不要把“还没准备好”当成永远不开始的理由。\n${pathHint(selectedFork)}`);
  }

  if (/(成功|结果|未来|会不会|最难|难)/.test(text)) {
    return finish("我不能告诉你一定会成功。LifeFork 不做命运判决。\n但我可以告诉你：继续什么都不做，信息会很少；设计一次低风险试验，至少会更接近真相。");
  }

  return finish("我听见你真正想问的，可能是：我这样想有问题吗？\n没有问题。你只是站在一条旧路和一种新可能之间。先别急着审判自己，我们可以把这个选择拆小一点。");
}
