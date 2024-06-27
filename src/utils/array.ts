export const weightedRandom = <T>(arr: ReadonlyArray<readonly [T, number]>) => {
  const total = arr.reduce((t, [, w]) => t + w, 0);
  let random = Math.random() * total;

  return arr.find(([, w]) => (random -= w) < 0)?.[0] ?? arr.at(-1)![0];
};
