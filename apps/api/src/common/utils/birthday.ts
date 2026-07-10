/** Próxima ocurrencia del cumpleaños (en hora de Lima, UTC-5). */
export function nextBirthday(birthday: Date): {
  date: Date;
  daysUntil: number;
  turns: number | null;
} {
  const LIMA_OFFSET = 5 * 3600000;
  const nowLima = new Date(Date.now() - LIMA_OFFSET);
  const today = new Date(
    Date.UTC(nowLima.getUTCFullYear(), nowLima.getUTCMonth(), nowLima.getUTCDate()),
  );

  const month = birthday.getUTCMonth();
  const day = birthday.getUTCDate();
  let next = new Date(Date.UTC(today.getUTCFullYear(), month, day));
  if (next < today) next = new Date(Date.UTC(today.getUTCFullYear() + 1, month, day));

  const daysUntil = Math.round((next.getTime() - today.getTime()) / 86400000);
  const birthYear = birthday.getUTCFullYear();
  const turns = birthYear > 1900 ? next.getUTCFullYear() - birthYear : null;
  return { date: next, daysUntil, turns };
}
