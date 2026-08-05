import { emptyToNull } from "./strings.ts";

// ClickHouse renders an unset Date as this sentinel rather than NULL.
const ZERO_DATE = "0000-00-00";

export const toDateString = (
  value: string | null | undefined,
): string | null => {
  const text = emptyToNull(value);

  return text === ZERO_DATE ? null : text;
};

// Ages outside this range mean the stored date is wrong, not that the person is
// remarkable — a placeholder year or a future date. Both read as no value.
const MAX_AGE_YEARS = 120;

// Compared in UTC so the result does not shift with the server's timezone.
export const toAge = (
  dateOfBirth: string | null,
  today: Date,
): number | null => {
  if (dateOfBirth === null || dateOfBirth === "") return null;

  const birthDate = new Date(dateOfBirth);

  if (Number.isNaN(birthDate.getTime())) return null;

  const monthDelta = today.getUTCMonth() - birthDate.getUTCMonth();
  const hasHadBirthday =
    monthDelta > 0 ||
    (monthDelta === 0 && today.getUTCDate() >= birthDate.getUTCDate());
  const age =
    today.getUTCFullYear() -
    birthDate.getUTCFullYear() -
    (hasHadBirthday ? 0 : 1);

  return age < 0 || age > MAX_AGE_YEARS ? null : age;
};
