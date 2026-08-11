import type { ClickHouseDatabase } from "../../../../db/clickhouse/client.ts";
import type { JoinableChain } from "../../../../lib/database.ts";
import type { CteAlias } from "./types.ts";

import {
  CACHE_PROFILE_ID,
  CTE_FACTORIES,
  CTE_PREREQUISITES,
  ENRICHMENT_JOINS,
} from "./constants.ts";

// ClickHouse resolves a CTE only against the ones declared before it, so a
// prerequisite is emitted ahead of the source that reads it.
const declarationOrder = (sources: readonly CteAlias[]): CteAlias[] => {
  const ordered: CteAlias[] = [];

  for (const source of sources) {
    const prerequisites = CTE_PREREQUISITES.get(source) ?? [];

    for (const prerequisite of prerequisites) {
      if (!ordered.includes(prerequisite)) ordered.push(prerequisite);
    }
    if (!ordered.includes(source)) ordered.push(source);
  }

  return ordered;
};

export const withEnrichment = <Builder>(
  builder: Builder,
  database: ClickHouseDatabase,
  sources: readonly CteAlias[] = ENRICHMENT_JOINS,
): Builder => {
  let next = builder as unknown as JoinableChain;

  for (const alias of declarationOrder(sources)) {
    const buildCte = CTE_FACTORIES.get(alias);

    if (buildCte !== undefined) next = next.withCTE(alias, buildCte(database));
  }
  for (const source of sources) {
    next = next.leftAnyJoin(source, CACHE_PROFILE_ID, `${source}.profile_id`);
  }

  return next as unknown as Builder;
};
