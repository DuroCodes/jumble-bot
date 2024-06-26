import { commandModule, CommandType } from "@sern/handler";
import { db } from "~/utils/db";
import { embeds } from "~/utils/embeds";

export default commandModule({
  type: CommandType.Text,
  description: "Unlink your last.fm account from your discord account",
  async execute(ctx) {
    const user = await db.user.findFirst({
      where: { userId: ctx.userId },
    });

    if (!user) {
      return ctx.reply({
        embeds: [
          embeds.error({
            description:
              "You need to link your last.fm account first with `.link`",
          }),
        ],
      });
    }

    await db.user.update({
      where: { userId: ctx.userId },
      data: { lastFmName: null },
    });

    return ctx.reply({
      embeds: [
        embeds.success({
          description: "Successfully unlinked your last.fm account",
        }),
      ],
    });
  },
});
