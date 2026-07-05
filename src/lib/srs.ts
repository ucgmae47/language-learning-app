export type SrsGrade = 0 | 1 | 2 | 3 | 4 | 5;
// 0=Blackout, 1=Incorrect, 2=Incorrect (easy), 3=Correct (hard), 4=Correct, 5=Perfect

export type SrsCard = {
  ease_factor: number;
  interval_days: number;
  repetitions: number;
};

export type SrsResult = SrsCard & { due_date: string };

export function applySM2(card: SrsCard, grade: SrsGrade): SrsResult {
  let { ease_factor, interval_days, repetitions } = card;

  if (grade < 3) {
    repetitions = 0;
    interval_days = 1;
  } else {
    if (repetitions === 0) {
      interval_days = 1;
    } else if (repetitions === 1) {
      interval_days = 6;
    } else {
      interval_days = Math.round(interval_days * ease_factor);
    }
    repetitions += 1;
  }

  ease_factor = ease_factor + 0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02);
  if (ease_factor < 1.3) ease_factor = 1.3;

  const due = new Date();
  due.setDate(due.getDate() + interval_days);
  const due_date = due.toISOString().split("T")[0] ?? due.toISOString().slice(0, 10);

  return { ease_factor, interval_days, repetitions, due_date };
}
