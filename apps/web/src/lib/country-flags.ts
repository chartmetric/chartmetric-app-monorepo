/**
 * `nationality` arrives as free text rather than an ISO code, and the warehouse
 * spells several countries more than one way — "Turkey" and "Türkiye", three
 * spellings of Congo, "USA" rather than "United States". Names are matched
 * case-insensitively and an unrecognised one renders no flag, never a guess.
 */
const COUNTRY_CODES: Readonly<Record<string, string>> = {
  albania: "AL",
  algeria: "DZ",
  andorra: "AD",
  argentina: "AR",
  australia: "AU",
  austria: "AT",
  bahamas: "BS",
  belgium: "BE",
  bolivia: "BO",
  "bosnia & herzegovina": "BA",
  "bosnia and herzegovina": "BA",
  brazil: "BR",
  bulgaria: "BG",
  cameroon: "CM",
  canada: "CA",
  chile: "CL",
  china: "CN",
  colombia: "CO",
  congo: "CG",
  "congo dr": "CD",
  "costa rica": "CR",
  "cote d'ivoire": "CI",
  "côte d'ivoire": "CI",
  croatia: "HR",
  czechia: "CZ",
  "czech republic": "CZ",
  "democratic republic of congo": "CD",
  denmark: "DK",
  "dominican republic": "DO",
  ecuador: "EC",
  egypt: "EG",
  estonia: "EE",
  finland: "FI",
  france: "FR",
  georgia: "GE",
  germany: "DE",
  ghana: "GH",
  greece: "GR",
  guinea: "GN",
  "hong kong": "HK",
  hungary: "HU",
  indonesia: "ID",
  iran: "IR",
  israel: "IL",
  italy: "IT",
  jamaica: "JM",
  japan: "JP",
  kazakhstan: "KZ",
  kenya: "KE",
  latvia: "LV",
  lithuania: "LT",
  luxembourg: "LU",
  mali: "ML",
  mexico: "MX",
  monaco: "MC",
  morocco: "MA",
  netherlands: "NL",
  "new zealand": "NZ",
  nicaragua: "NI",
  nigeria: "NG",
  norway: "NO",
  panama: "PA",
  paraguay: "PY",
  peru: "PE",
  philippines: "PH",
  poland: "PL",
  portugal: "PT",
  qatar: "QA",
  romania: "RO",
  russia: "RU",
  "saudi arabia": "SA",
  senegal: "SN",
  serbia: "RS",
  slovakia: "SK",
  slovenia: "SI",
  "south africa": "ZA",
  "south korea": "KR",
  "south sudan": "SS",
  spain: "ES",
  sweden: "SE",
  switzerland: "CH",
  taiwan: "TW",
  thailand: "TH",
  "trinidad & tobago": "TT",
  "trinidad and tobago": "TT",
  tunisia: "TN",
  turkey: "TR",
  turkiye: "TR",
  türkiye: "TR",
  ukraine: "UA",
  "united kingdom": "GB",
  "united states": "US",
  usa: "US",
  uruguay: "UY",
  uzbekistan: "UZ",
  venezuela: "VE",
  "virgin islands": "VI",
  zambia: "ZM",
};

// The home nations compete separately but are not ISO countries, so their flags
// are tag sequences rather than a pair of regional indicator letters.
const SUBDIVISION_FLAGS: Readonly<Record<string, string>> = {
  england: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  scotland: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  wales: "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
};

const REGIONAL_INDICATOR_A = 0x1_f1_e6;
const LETTER_A = 0x41;

// A flag emoji is the country's two letters written as regional indicators.
const toRegionalIndicators = (code: string): string =>
  Array.from(code, (letter) =>
    String.fromCodePoint(
      REGIONAL_INDICATOR_A + (letter.codePointAt(0) ?? LETTER_A) - LETTER_A,
    ),
  ).join("");

/**
 * The flag emoji for a country name, or null when the name is absent or not one
 * this map knows. Windows has no flag glyphs, so a country renders there as its
 * two-letter code rather than a picture.
 */
export const toCountryFlag = (nationality: string | null): string | null => {
  if (nationality === null) return null;

  const name = nationality.trim().toLocaleLowerCase("en");
  const subdivision = SUBDIVISION_FLAGS[name];

  if (subdivision !== undefined) return subdivision;

  const code = COUNTRY_CODES[name];

  return code === undefined ? null : toRegionalIndicators(code);
};
