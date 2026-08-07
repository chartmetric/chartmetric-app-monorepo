import type { ClickHouseDatabase } from "../../../../db/clickhouse/client.ts";
import type { JoinableChain } from "../../../../lib/database.ts";

import {
  CACHE_PROFILE_ID,
  CTE_FACTORIES,
  ENRICHMENT_JOINS,
  type EnrichmentSource,
} from "./constants.ts";

export const withEnrichment = <Builder>(
  builder: Builder,
  database: ClickHouseDatabase,
  sources: readonly EnrichmentSource[] = ENRICHMENT_JOINS,
): Builder => {
  let next = builder as unknown as JoinableChain;

  for (const source of sources) {
    const buildCte = CTE_FACTORIES.get(source);

    if (buildCte !== undefined) next = next.withCTE(source, buildCte(database));
  }
  for (const source of sources) {
    next = next.leftAnyJoin(source, CACHE_PROFILE_ID, `${source}.profile_id`);
  }

  return next as unknown as Builder;
};
