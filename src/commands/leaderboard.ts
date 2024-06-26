import { commandModule, CommandType } from "@sern/handler";
import { EmbedBuilder } from "discord.js";
import { db } from "~/utils/db";

export default commandModule({
  type: CommandType.Text,
  alias: ["lb", "top"],
  description: "View the top jumble players on the leaderboard",
  async execute(ctx) {
    const users = await db.user.findMany({
      orderBy: { wins: "desc" },
    });

    const fetchUser = async (userId: string) =>
      (await ctx.client.users.fetch(userId)).displayName;

    const formatPos = (pos: number) => {
      const posEmojis = ["🥇", "🥈", "🥉"];
      if (pos <= 3) return posEmojis[pos - 1];
    };

    const leaderboardData = await Promise.all(
      users.map(async (u, i) => ({
        position: formatPos(i + 1) ?? `**${i + 1}.**`,
        user: await fetchUser(u.userId),
        wins: u.wins,
      })),
    );

    const leaderboard = leaderboardData
      .map((u) => `${u.position} ${u.user} - **${u.wins} wins**`)
      .join("\n");

    await ctx.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("Leaderboard")
          .setColor("Gold")
          .setDescription(leaderboard),
      ],
    });
  },
});
