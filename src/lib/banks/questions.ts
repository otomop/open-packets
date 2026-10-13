import questions from "virtual:course/bank/questions";
export const questionBank = questions;
export const questionById = new Map(questions.map(q => [q.id, q]));
