import { ColorResolvable, Colors, EmbedBuilder } from "discord.js";

interface EmbedOptions {
  title?: string;
  color?: ColorResolvable;
  description: string;
}

export const emoji = {
  correct: "<:icons_Correct:958708040163532870>",
  wrong: "<:icons_Wrong:958708043565113405>",
  bulb: "<:icons_bulb:1132397537807044618>",
};

export const embeds = {
  error: ({ title, description, color }: EmbedOptions) =>
    new EmbedBuilder()
      .setTitle(`${emoji.wrong} ${title ?? "Error"}`)
      .setDescription(description)
      .setColor(color ?? Colors.Red),

  success: ({ title, description, color }: EmbedOptions) =>
    new EmbedBuilder()
      .setTitle(`${emoji.correct} ${title ?? "Success"}`)
      .setDescription(removeLeftPad(description))
      .setColor(color ?? Colors.Green),

  jumble: ({ description, color }: Omit<EmbedOptions, "title">) =>
    new EmbedBuilder()
      .setTitle(`${emoji.bulb} Jumble`)
      .setDescription(removeLeftPad(description))
      .setColor(color ?? Colors.Blue),
};

export const formatNum = (num: string) =>
  num.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export const removeLeftPad = (str: string) =>
  str
    .split("\n")
    .map((s) => s.replace(/^\s+/, ""))
    .join("\n");
