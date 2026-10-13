import plans from "../../content/command-curriculum.json";
import type { CommandPlan } from "./types";

// Loaded with command practice, not the application shell.
export const commandPlans = new Map((plans as CommandPlan[]).map(plan => [plan.chapterId, plan]));
