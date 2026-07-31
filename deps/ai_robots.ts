import data from "https://cdn.jsdelivr.net/gh/ai-robots-txt/ai.robots.txt@1.49/robots.json" with {
  type: "json",
};
export const aiRobots = Object.keys(data);
