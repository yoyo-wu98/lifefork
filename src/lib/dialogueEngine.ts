import { ForkPath, SelfSkill } from "@/lib/types";

export function generateInstanceReply(message: string, _selfSkill: SelfSkill, _selectedFork: ForkPath): string {
  const text = message.toLowerCase();

  if (/(后悔)/.test(text)) {
    return "我不能替你保证没有遗憾。每条路都会带走一些东西。\n但在这条路径里，我最庆幸的是：你终于没有继续把真实愿望无限延期。你不是冲动地毁掉生活，而是给自己一次被现实检验的机会。";
  }

  if (/(失去|代价)/.test(text)) {
    return "这条路的代价不是戏剧性的，而是日常性的。你会失去一些轻松、一些确定、一些别人眼中的“正常进度”。\n但你也会得到一种更重要的东西：你开始知道自己到底是不是真的想要它。";
  }

  if (/(提醒|建议|一步开始|开始)/.test(text)) {
    return "我最想提醒你的是：不要把“还没准备好”当成永远不开始的理由。\n你不需要立刻变成另一个人。你只需要安排一个小到无法逃避的实验，让真实答案慢慢出现。";
  }

  if (/(成功|结果|未来|会不会)/.test(text)) {
    return "我不能告诉你一定会成功。LifeFork 不是命运机器。\n但我可以告诉你：如果你继续什么都不做，你得到的信息会很少；如果你设计一次低风险试验，你至少会更接近真相。";
  }

  return "我听见你真正想问的，也许不是“答案是什么”，而是“我这样想是不是有问题”。\n没有问题。你只是站在一条旧路和一种新可能之间。先不要急着审判自己，我们可以把这个选择拆小一点。";
}
