import { read } from "@lumeland/core/utils/read.ts";

let aiRobots: string[] | undefined;

export async function getAiRobots(): Promise<string[]> {
  if (aiRobots) {
    return aiRobots;
  }

  const robotsJson = await read("https://cdn.jsdelivr.net/gh/ai-robots-txt/ai.robots.txt@2.0/robots.json");
  return aiRobots = Object.keys(JSON.parse(robotsJson));
}
