import { commandModule, CommandType } from "@sern/handler";
import { embeds } from "~/utils/embeds";
import { lastFm } from "~/utils/lastFm";
import { db } from "~/utils/db";

export default commandModule({
  type: CommandType.Text,
  description: "Link your last.fm account to your discord account",
  async execute(ctx, [, args]) {
    const name = args[0];

    if (!name) {
      return ctx.reply({
        embeds: [
          embeds.error({ description: "Please provide a last.fm username" }),
        ],
      });
    }

    const user = await lastFm.getUserFromName(name);

    if (!user.ok) {
      return ctx.reply({ embeds: [embeds.error({ description: user.error })] });
    }

    const existingUser = await db.user.findFirst({
      where: { userId: ctx.userId },
    });

    if (existingUser) {
      await db.user.update({
        where: { userId: ctx.userId },
        data: { lastFmName: name },
      });

      return ctx.reply({
        embeds: [
          embeds.success({
            description: `Successfully updated your last.fm account to \`${name}\``,
          }),
        ],
      });
    }

    await db.user.create({
      data: {
        userId: ctx.userId,
        lastFmName: name,
      },
    });

    return ctx.reply({
      embeds: [
        embeds.success({
          description: `Successfully linked your last.fm account to \`${ctx.user.username}\``,
        }),
      ],
    });
  },
});
