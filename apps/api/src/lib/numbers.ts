/**
 * A numeric warehouse column as it arrives over JSON: ClickHouse renders 64-bit
 * integers as strings, so an `Int64` column can arrive either way. Read one
 * through `toNumber`, which treats unparseable input as no value.
 */
export type WarehouseNumber = number | string | null;

export const toNumber = (
  value: number | string | null | undefined,
): number | null => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || value === "") return null;

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
};

/**
 * Reads a count where the source treats 0 as "not backfilled yet" rather than a
 * real zero — true of the cached social columns. Only use this where a genuine
 * zero is impossible or indistinguishable from missing data; `toNumber` is the
 * right choice everywhere else.
 */
export const toPositiveCount = (
  value: number | string | null | undefined,
): number | null => {
  const parsed = toNumber(value);

  return parsed === null || parsed === 0 ? null : parsed;
};
