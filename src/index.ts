import { Client, GatewayIntentBits } from "discord.js";
import { Sern, single, makeDependencies } from "@sern/handler";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

await makeDependencies(({ add }) => {
  add(
    "@sern/client",
    single(() => client),
  );
});

Sern.init({
  defaultPrefix: ".",
  commands: "src/commands",
});

await client.login(process.env.DISCORD_TOKEN);
