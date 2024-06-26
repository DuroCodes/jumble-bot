import { commandModule, CommandType } from "@sern/handler";
import {
  ActionRowBuilder,
  bold,
  ButtonBuilder,
  ButtonStyle,
  codeBlock,
} from "discord.js";
import { embeds, emoji } from "~/utils/embeds";
import { lastFm } from "~/utils/lastFm";
import { db } from "~/utils/db";
import { shuffleArtist } from "~/utils/shuffle";

export default commandModule({
  type: CommandType.Text,
  alias: ["j"],
  description: "Play a game of jumble using your last.fm artists",
  async execute(ctx) {
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

    const collector = ctx.channel!.createMessageCollector({
      time: 25_000,
    });

    collector.on("collect", async (msg) => {
      if (msg.content.toLowerCase() !== randomArtist.toLowerCase()) {
        return msg.react(emoji.wrong);
      }

      collector.stop();
      msg.react(emoji.correct);

      await jumbleMsg.edit({
        embeds: [
          embeds.jumble({
            description: `**${msg.author.username}** guessed the artist!\nThe artist was **${randomArtist}**`,
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
