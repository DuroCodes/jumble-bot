import { Snowflake } from 'discord.js';

export interface CollectorItem {
  guessedCorrectly: boolean;
  active: boolean;
  userId: Snowflake;
  startTime: number;
  artist: string;
}

export const activeCollectors = new Map<Snowflake, CollectorItem>();
