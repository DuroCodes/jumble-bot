import { commandModule, CommandType } from "@sern/handler";
import { EmbedBuilder } from "discord.js";
import { shuffleArtist } from "~/utils/string";

export default commandModule({
  type: CommandType.Button,
  async execute(ctx) {
    await ctx.deferUpdate();

    const embed = ctx.message.embeds[0];
    const description = embed.description!;
    const artist = description.split("```")[1];

    const shuffled = shuffleArtist(artist.trim());
    const newDesc = description.replace(artist, shuffled);

    await ctx.message.edit({
      embeds: [
        new EmbedBuilder().setDescription(newDesc).setColor(embed.color!),
      ],
    });
  },
});
