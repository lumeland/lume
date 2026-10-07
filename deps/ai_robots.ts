import data from "https://cdn.jsdelivr.net/gh/ai-robots-txt/ai.robots.txt@2.0/robots.json" with {
  type: "json",
};
export const aiRobots = Object.keys(data);
