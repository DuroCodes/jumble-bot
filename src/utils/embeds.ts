import {
  ColorResolvable,
  Colors,
  EmbedBuilder,
  EmbedFooterOptions,
} from "discord.js";

interface EmbedOptions {
  title?: string;
  color?: ColorResolvable;
  footer?: EmbedFooterOptions;
  description: string;
}

export const emoji = {
  correct: "<:icons_Correct:958708040163532870>",
  wrong: "<:icons_Wrong:958708043565113405>",
  bulb: "<:icons_bulb:1132397537807044618>",
  exclamation: "<:icons_exclamation:958708053832777809>",
};

export const embeds = {
  error: ({ title, description, color, footer }: EmbedOptions) => {
    const embed = new EmbedBuilder()
      .setTitle(`${emoji.wrong} ${title ?? "Error"}`)
      .setDescription(removeLeftPad(description))
      .setColor(color ?? Colors.Red);

    if (footer) embed.setFooter(footer);

    return embed;
  },

  success: ({ title, description, color, footer }: EmbedOptions) => {
    const embed = new EmbedBuilder()
      .setTitle(`${emoji.correct} ${title ?? "Success"}`)
      .setDescription(removeLeftPad(description))
      .setColor(color ?? Colors.Green);

    if (footer) embed.setFooter(footer);

    return embed;
  },

  jumble: ({ description, color, footer }: Omit<EmbedOptions, "title">) => {
    const embed = new EmbedBuilder()
      .setTitle(`${emoji.bulb} Jumble`)
      .setDescription(removeLeftPad(description))
      .setColor(color ?? Colors.Blue);

    if (footer) embed.setFooter(footer);

    return embed;
  },
};

export const formatNum = (num: string) =>
  num.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export const removeLeftPad = (str: string) =>
  str
    .split("\n")
    .map((s) => s.replace(/^\s+/, ""))
    .join("\n");
