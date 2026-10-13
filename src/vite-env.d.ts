/// <reference types="vite/client" />

declare module "virtual:course" {
  import type { CourseCatalog } from "@/lib/types";
  const course: CourseCatalog;
  export default course;
}

declare module "virtual:course/loaders" {
  import type { ChapterContent } from "@/lib/types";
  const loaders: Record<string, () => Promise<ChapterContent>>;
  export default loaders;
}
declare module "virtual:course/bank/questions" { const bank: import("@/lib/types").BankQuestion[]; export default bank; }
declare module "virtual:course/bank/cards" { const bank: import("@/lib/types").BankCard[]; export default bank; }
declare module "virtual:course/bank/commands" { const bank: import("@/lib/types").BankDrill[]; export default bank; }
declare module "virtual:course/bank/tickets" { const bank: import("@/lib/types").BankTicket[]; export default bank; }
