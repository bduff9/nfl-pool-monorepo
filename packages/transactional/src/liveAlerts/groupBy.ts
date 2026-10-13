/** Groups items by key, keeping their order. (Map.groupBy is not in every consumer's TypeScript lib.) */
export const groupBy = <T, K>(items: T[], getKey: (item: T) => K): Map<K, T[]> => {
  const groups = new Map<K, T[]>();

  for (const item of items) {
    const key = getKey(item);

    groups.set(key, [...(groups.get(key) ?? []), item]);
  }

  return groups;
};
