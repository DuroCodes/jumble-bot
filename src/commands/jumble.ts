import { commandModule, CommandType } from "@sern/handler";
import {
  ActionRowBuilder,
  bold,
  ButtonBuilder,
  ButtonStyle,
  codeBlock,
  Snowflake,
} from "discord.js";
import { normalize, shuffleArtist, mostlySame } from "~/utils/string";
import { embeds, emoji } from "~/utils/embeds";
import { lastFm } from "~/utils/lastFm";
import { db } from "~/utils/db";

const activeCollectors = new Map<Snowflake, boolean>();

export default commandModule({
  type: CommandType.Text,
  alias: ["j"],
  description: "Play a game of jumble using your last.fm artists",
  async execute(ctx) {
    if (activeCollectors.get(ctx.channelId)) return;

    const user = await db.user.findFirst({
      where: { userId: ctx.userId },
    });

    if (!user || !user.lastFmName) {
      return ctx.reply({
        embeds: [
          embeds.error({
            description:
              "You need to link your last.fm account first with `.link`",
          }),
        ],
      });
    }

    const topArtists = await lastFm.getTopArtists(user.lastFmName);

    if (!topArtists.ok) {
      return ctx.reply({
        embeds: [embeds.error({ description: topArtists.error })],
      });
    }

    const artistNames = topArtists.value.artist.map((a) => a.name);

    const randomArtist =
      artistNames[Math.floor(Math.random() * artistNames.length)];

    const hints = await lastFm.getHintsForArtist(user.lastFmName, randomArtist);
    const hintsDesc = hints.ok
      ? hints.value.map((h) => `- ${h}`).join("\n")
      : `No hints for **${randomArtist}**`;

    const description = [
      bold(codeBlock(shuffleArtist(randomArtist.toUpperCase()))),
      "**Hints**",
      hintsDesc,
      "",
      "You have 25 seconds to guess the artist!",
    ].join("\n");

    const reshuffleButton = new ButtonBuilder()
      .setCustomId("reshuffle")
      .setLabel("Reshuffle")
      .setEmoji("🔀")
      .setStyle(ButtonStyle.Primary);

    const jumbleMsg = await ctx.channel!.send({
      embeds: [
        embeds.jumble({
          description,
        }),
      ],
      components: [
        new ActionRowBuilder<ButtonBuilder>({ components: [reshuffleButton] }),
      ],
    });

    const collectorTimeStart = Date.now();
    const collector = ctx.channel!.createMessageCollector({
      time: 25_000,
    });

    activeCollectors.set(ctx.channelId, true);
    let guessedCorrectly = false;

    collector.on("collect", async (msg) => {
      const correct = normalize(randomArtist) === normalize(msg.content);

      if (!correct && mostlySame(randomArtist, msg.content, 1)) {
        return msg.react(emoji.exclamation);
      }

      if (!correct) {
        return msg.react(emoji.wrong);
      }

      guessedCorrectly = true;
      collector.stop();

      msg.react(emoji.correct);

      const timeTook = ((Date.now() - collectorTimeStart) / 1000).toFixed(2);

      await msg.channel.send({
        embeds: [
          embeds.jumble({
            description: `**${msg.author.displayName}** guessed the artist!\nThe artist was **${randomArtist}**`,
            color: "Green",
            footer: {
              text: `Guessed in ${timeTook}s by ${msg.author.displayName}`,
              iconURL: msg.author.displayAvatarURL(),
            },
          }),
        ],
      });

      await jumbleMsg.edit({
        embeds: [
          embeds.jumble({
            description: jumbleMsg.embeds[0]
              .description!.split("\n")
              .slice(0, -2)
              .join("\n"),
            color: "Green",
            footer: {
              text: `Guessed in ${timeTook}s by ${msg.author.displayName}`,
              iconURL: msg.author.displayAvatarURL(),
            },
          }),
        ],
        components: [],
      });

      await db.user.update({
        where: { userId: ctx.userId },
        data: { wins: { increment: 1 } },
      });
    });

    collector.on("end", async () => {
      activeCollectors.delete(ctx.channelId);

      if (guessedCorrectly) return;

      await jumbleMsg.edit({
        embeds: [
          embeds.jumble({
            description: `No one guessed it!\nThe artist was **${randomArtist}**`,
          }),
        ],
        components: [],
      });
    });
  },
});
