import { describe, expect, it } from "vitest";

import { toCountryFlag } from "./country-flags";

describe("toCountryFlag", () => {
  it("builds a flag from the country's regional indicators", () => {
    expect(toCountryFlag("Argentina")).toBe("🇦🇷");
    expect(toCountryFlag("Japan")).toBe("🇯🇵");
  });

  it("ignores case and surrounding space", () => {
    expect(toCountryFlag("  argentina ")).toBe("🇦🇷");
    expect(toCountryFlag("SPAIN")).toBe("🇪🇸");
  });

  // The warehouse spells these several ways; each spelling is a real value.
  it("accepts every spelling the warehouse uses for one country", () => {
    expect(toCountryFlag("USA")).toBe(toCountryFlag("United States"));
    expect(toCountryFlag("Türkiye")).toBe(toCountryFlag("Turkey"));
    expect(toCountryFlag("Bosnia & Herzegovina")).toBe(
      toCountryFlag("Bosnia and Herzegovina"),
    );
    expect(toCountryFlag("Congo DR")).toBe(
      toCountryFlag("Democratic Republic of Congo"),
    );
  });

  // Congo-Brazzaville is a different country from Congo-Kinshasa.
  it("keeps the two Congos apart", () => {
    expect(toCountryFlag("Congo")).not.toBe(toCountryFlag("Congo DR"));
  });

  // The home nations compete separately and their flags are tag sequences.
  it("flags the home nations rather than falling back to the UK", () => {
    expect(toCountryFlag("England")).toBe("🏴󠁧󠁢󠁥󠁮󠁧󠁿");
    expect(toCountryFlag("Scotland")).toBe("🏴󠁧󠁢󠁳󠁣󠁴󠁿");
    expect(toCountryFlag("England")).not.toBe(toCountryFlag("United Kingdom"));
  });

  it("shows nothing rather than guessing at an unknown country", () => {
    expect(toCountryFlag("Atlantis")).toBeNull();
    expect(toCountryFlag("")).toBeNull();
    expect(toCountryFlag(null)).toBeNull();
  });
});
