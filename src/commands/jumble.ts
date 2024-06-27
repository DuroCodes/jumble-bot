import {
  ActionRowBuilder,
  bold,
  ButtonBuilder,
  ButtonStyle,
  codeBlock,
} from "discord.js";
import { commandModule, CommandType } from "@sern/handler";
import { normalize, shuffleArtist, mostlySame } from "~/utils/string";
import { embeds, emoji } from "~/utils/embeds";
import { lastFm } from "~/utils/lastFm";
import { db } from "~/utils/db";
import { activeCollectors } from "~/utils/activeCollectors";

export default commandModule({
  type: CommandType.Text,
  alias: ["j"],
  description: "Play a game of jumble using your last.fm artists",
  async execute(ctx) {
    if (activeCollectors.get(ctx.channelId)?.active) return;

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

    const topArtists = await lastFm.getTopArtists(user.lastFmName, 1000);

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
      : `No hints found for this artist`;

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
      .setEmoji(emoji.shuffle)
      .setStyle(ButtonStyle.Primary);

    const giveUpButton = new ButtonBuilder()
      .setCustomId("giveUp")
      .setLabel("Give Up")
      .setEmoji(emoji.delete)
      .setStyle(ButtonStyle.Danger);

    const jumbleMsg = await ctx.reply({
      embeds: [
        embeds.jumble({
          description,
        }),
      ],
      components: [
        new ActionRowBuilder<ButtonBuilder>({
          components: [reshuffleButton, giveUpButton],
        }),
      ],
    });

    const collector = ctx.channel!.createMessageCollector({
      time: 25_000,
      filter: (m) => !m.author.bot,
    });

    activeCollectors.set(ctx.channelId, {
      userId: ctx.userId,
      artist: randomArtist,
      startTime: Date.now(),
      guessedCorrectly: false,
      active: true,
    });

    collector.on("collect", async (msg) => {
      const correct = normalize(randomArtist) === normalize(msg.content);
      const errThreshold = Math.floor(randomArtist.length / 8);

      if (!correct && mostlySame(randomArtist, msg.content, errThreshold)) {
        return msg.react(emoji.exclamation);
      }

      if (!correct) {
        return msg.react(emoji.wrong);
      }

      await msg.react(emoji.correct);

      const timeTook = (
        (Date.now() - activeCollectors.get(ctx.channelId)!.startTime) /
        1000
      ).toFixed(2);

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
            description: jumbleMsg.embeds[0].description!.replace(
              "\nYou have 25 seconds to guess the artist!",
              "",
            ),
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
        where: { userId: msg.author.id },
        data: { wins: { increment: 1 } },
      });

      activeCollectors.set(ctx.channelId, {
        ...activeCollectors.get(ctx.channelId)!,
        guessedCorrectly: true,
      });

      collector.stop();
    });

    collector.on("end", async () => {
      const active = activeCollectors.get(ctx.channelId);

      activeCollectors.set(ctx.channelId, {
        ...activeCollectors.get(ctx.channelId)!,
        active: false,
      });

      if (active?.guessedCorrectly || !active?.active) return;

      await jumbleMsg.edit({
        embeds: [
          embeds.jumble({
            description: `No one guessed it!\nThe artist was **${randomArtist.trim()}**`,
            color: "Red",
          }),
        ],
        components: [],
      });
    });
  },
});
