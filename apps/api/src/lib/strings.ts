/**
 * ClickHouse `String` columns use `''` where other stores would use NULL, and a
 * projection that omits a column leaves the field absent, so both collapse to
 * null here.
 */
export const emptyToNull = (value: string | null | undefined): string | null =>
  typeof value !== "string" || value === "" ? null : value;
