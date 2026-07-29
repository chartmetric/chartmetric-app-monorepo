import type { PaginationQuery } from "../../lib/pagination.ts";

export interface ArtistRow {
  code2: string;
  id: number;
  image_url: string;
  name: string;
  record_label: string;
}

export interface ProfileRow {
  id: number;
  image_url: string | null;
  name: string;
  // hypequery types UInt64 as string, but output_format_json_quote_64bit_integers: 0
  // makes it a number at runtime — accept both, normalize in the service.
  source_id: number | string | null;
}

export interface Query<Row> {
  execute: () => Promise<Row[]>;
  toSQL: () => string;
}

export interface ArtistQueries {
  listArtists: (pagination: PaginationQuery) => Query<ArtistRow>;
  profilesBySourceIds: (sourceIds: number[]) => Query<ProfileRow>;
}
