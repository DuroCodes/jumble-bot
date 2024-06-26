export const shuffleArtist = (artist: string): string => {
  const shuffled = artist
    .split(" ")
    .map((s) =>
      s
        .split("")
        .sort(() => Math.random() - 0.5)
        .join(""),
    )
    .join(" ");

  return shuffled === artist ? shuffleArtist(artist) : shuffled;
};
