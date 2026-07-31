import type { ForkPath } from "@/lib/types";

export function flattenForks(paths: ForkPath[]): ForkPath[] {
  return paths.flatMap((path) => [path, ...flattenForks(path.children ?? [])]);
}

export function normalizeForkHierarchy(paths: ForkPath[]): ForkPath[] {
  const ordered = flattenForks(paths);
  const byId = new Map<string, ForkPath>();

  ordered.forEach((path) => {
    byId.set(path.id, { ...path, children: [] });
  });

  const roots: ForkPath[] = [];
  ordered.forEach((path) => {
    const clone = byId.get(path.id);
    if (!clone) return;

    const parent = path.parentId ? byId.get(path.parentId) : undefined;
    if (parent && parent.id !== clone.id) {
      parent.children = [...(parent.children ?? []), clone];
    } else if (!roots.some((root) => root.id === clone.id)) {
      roots.push(clone);
    }
  });

  return roots;
}
