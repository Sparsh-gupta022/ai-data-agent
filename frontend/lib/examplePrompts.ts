import { AgentMode } from "./types";

export interface ExamplePrompt {
  text: string;
  mode: AgentMode;
}

export const EXAMPLE_PROMPTS: ExamplePrompt[] = [
  {
    text: "Which payment method has the highest average transaction value, and how does it compare with the others?",
    mode: "sql",
  },
  {
    text: "Identify the top 10 users by total ride spending and show their average rating.",
    mode: "sql",
  },
  {
    text: "Which vehicle types generate the most revenue per ride?",
    mode: "sql",
  },
  {
    text: "Show the monthly ride trend and identify any significant changes.",
    mode: "sql",
  },
  {
    text: "Find users whose spending is significantly above the average.",
    mode: "sql",
  },
  {
    text: "Analyze the relationship between ride ratings and payment values.",
    mode: "sql",
  },
  {
    text: "Find possible anomalies in ride payments and explain why they are unusual.",
    mode: "sql",
  },
  {
    text: "Extract this API data, clean it, transform it into a useful dataset, and summarize the result.",
    mode: "etl",
  },
];
