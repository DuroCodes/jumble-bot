import { commandModule, CommandType } from "@sern/handler";
import { activeCollectors } from "~/utils/activeCollectors";
import { embeds } from "~/utils/embeds";

export default commandModule({
  name: "giveUp",
  type: CommandType.Button,
  async execute(ctx) {
    await ctx.deferUpdate();

    const collector = activeCollectors.get(ctx.channelId);
    if (!collector) return;

    if (collector.userId !== ctx.user.id) {
      return ctx.followUp({
        embeds: [
          embeds.error({
            description: "You can't give up for someone else!",
          }),
        ],
        ephemeral: true,
      });
    }

    activeCollectors.set(ctx.channelId, {
      ...collector,
      active: false,
    });

    await ctx.message.edit({
      embeds: [
        embeds.jumble({
          description: `**${
            ctx.user.displayName
          }** gave up!\nThe artist was **${collector.artist.trim()}**`,
          color: "Red",
        }),
      ],
      components: [],
    });
  },
});
