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

// The cached social columns write 0 for "not backfilled yet", not a real zero.
export const toPositiveCount = (
  value: number | string | null | undefined,
): number | null => {
  const parsed = toNumber(value);

  return parsed === null || parsed === 0 ? null : parsed;
};
