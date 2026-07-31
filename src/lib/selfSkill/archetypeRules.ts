export function detectArchetype(values: string[]): string {
  if (values.includes("创造") && (values.includes("自由") || values.includes("被看见"))) return "创作驱动型";
  if (values.includes("自由") && values.includes("安全感")) return "自主与稳定平衡型";
  if (values.includes("亲密") && values.includes("自由")) return "关系与自主平衡型";
  if (values.includes("成长") && values.includes("被看见")) return "目标成长型";
  return "谨慎规划型";
}
