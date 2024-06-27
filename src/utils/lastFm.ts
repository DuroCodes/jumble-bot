import { z } from "zod";
import { zodFetch } from "./zodFetch";
import { Err, Ok } from "./result";
import { formatNum } from "./embeds";

const LASTFM_BASE_URL = "https://ws.audioscrobbler.com/2.0/";

export const UserSchema = z.object({
  user: z.object({
    name: z.string(),
    realname: z.string().nullable(),
    url: z.string(),
    image: z.array(
      z.object({
        "#text": z.string(),
        size: z.string(),
      }),
    ),
  }),
});

export const TopArtistsSchema = z.object({
  topartists: z.object({
    artist: z.array(
      z.object({
        name: z.string(),
        playcount: z.string(),
        image: z.array(
          z.object({
            "#text": z.string(),
            size: z.string(),
          }),
        ),
      }),
    ),
  }),
});

export const ArtistSchema = z.object({
  artist: z.object({
    name: z.string(),
    url: z.string(),
    image: z.array(
      z.object({
        "#text": z.string(),
        size: z.string(),
      }),
    ),
    stats: z.object({
      listeners: z.string(),
      playcount: z.string(),
    }),
    bio: z.object({
      summary: z.string(),
    }),
  }),
});

export const lastFm = {
  getUserFromName: async (user: string) => {
    const res = await zodFetch(
      UserSchema,
      "Failed to fetch user",
      `${LASTFM_BASE_URL}?method=user.getinfo&user=${user}&api_key=${process.env.LASTFM_API_KEY}&format=json`,
    );

    return res.ok
      ? Ok(res.value.user)
      : Err("Failed to fetch user, please try with an existing username.");
  },

  getTopArtists: async (user: string, limit = 100) => {
    const res = await zodFetch(
      TopArtistsSchema,
      "Failed to fetch top artists",
      `${LASTFM_BASE_URL}?method=user.gettopartists&user=${user}&api_key=${process.env.LASTFM_API_KEY}&format=json&limit=${limit}`,
    );

    return res.ok
      ? Ok(res.value.topartists)
      : Err(
          "Failed to fetch top artists, please try with an existing username.",
        );
  },

  getArtistFromName: async (artist: string) => {
    const res = await zodFetch(
      ArtistSchema,
      "Failed to fetch artist",
      `${LASTFM_BASE_URL}?method=artist.getinfo&artist=${artist}&api_key=${process.env.LASTFM_API_KEY}&format=json`,
    );

    return res.ok
      ? Ok(res.value.artist)
      : Err("Failed to fetch artist, please try with an existing artist.");
  },

  getHintsForArtist: async (user: string, artist: string) => {
    const topArtists = await lastFm.getTopArtists(user, 1000);
    const userArtist = topArtists.ok
      ? Ok(topArtists.value.artist.find((a) => a.name === artist))
      : Err("Artist not found");

    if (!userArtist.ok) return Err(userArtist.error);
    if (!userArtist.value) return Err("Artist not found in top artists");

    const artistData = await lastFm.getArtistFromName(userArtist.value.name);

    if (!artistData.ok) return Err(artistData.error);

    return Ok([
      `You've played them **${formatNum(userArtist.value.playcount)}** times`,
      `They have **${formatNum(artistData.value.stats.listeners)}** listeners`,
      `They have **${formatNum(artistData.value.stats.playcount)}** plays`,
    ]);
  },
};
