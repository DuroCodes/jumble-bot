export const shuffleArtist = (artist: string): string => {
  const shuffled = artist
    .split(" ")
    .map((s) => [...s].sort(() => Math.random() - 0.5).join(""))
    .join(" ");

  return shuffled === artist ? shuffleArtist(artist) : shuffled;
};

export const levenshtein = (a: string, b: string) => {
  const memo = new Map<string, number>();

  const dist = (i: number, j: number): number => {
    if (i === 0) return j;
    if (j === 0) return i;

    const key = `${i},${j}`;

    if (memo.has(key)) return memo.get(key)!;

    const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;

    const result = Math.min(
      dist(i - 1, j) + 1,
      dist(i, j - 1) + 1,
      dist(i - 1, j - 1) + substitutionCost,
    );

    memo.set(key, result);
    return result;
  };

  return dist(a.length, b.length);
};

export const stripAccents = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[$]/g, "s");

export const normalize = (s: string) => stripAccents(s).toLowerCase();

export const mostlySame = (a: string, b: string, numErrors: number) =>
  levenshtein(normalize(a), normalize(b)) <= numErrors;
