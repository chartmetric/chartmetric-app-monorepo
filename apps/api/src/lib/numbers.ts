// ClickHouse renders 64-bit integers as strings, so an `Int64` column arrives
// over JSON either way.
export type WarehouseNumber = number | string | null;

export const toNumber = (
  value: number | string | null | undefined,
): number | null => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || value === "") return null;

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
};

export const toPositiveCount = (
  value: number | string | null | undefined,
): number | null => {
  const parsed = toNumber(value);

  return parsed === null || parsed === 0 ? null : parsed;
};
