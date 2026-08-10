# Product Requirements

Append-only log of feature entries, one `##` section per feature. Created
and extended by `/feature-intake`; read by `/harness` when it proposes
phases. Repository and tooling work does not appear here — that is
governed by `docs/ARCHITECTURE.md` and `docs/ADR.md`.

## Influencer list on the Influencers page

- **Date**: 2026-08-10
- **Status**: ready for `/harness`

### Ask

> We want to add a list of influencers on the Influencers Page, similar to
> this screenshot, but following the standard filter conventions of the
> other pages (artists, athletes). The screenshot is a mockup.
>
> Attached are queries that are suggested by the prototype — please use CH
> MCP to confirm if this is actually the correct ones, and if not, find the
> correct tables.

Follow-up answers from the requester: creators only; query-time join for
now; drop the videos column; expose only the age buckets the data
supports; use a library rather than hand-rolling country names; check CM
Score coverage before using it to sort; keep the filter-options endpoint
off the developer API.

### Goal

Replace the `InfluencersPage` placeholder with a paginated, filterable
list of the 155,785 creator profiles, matching the filter conventions the
athletes page established so the two pages behave consistently.

### Requirements

**Data source** (verified against live ClickHouse, 2026-08-10)

- Influencers are `new_vertical.profile` rows with
  `profile_type = 'creator'` and `deleted_at IS NULL`, joined to
  `new_vertical.creator_profile_cache` on
  `accurateCastOrNull(creator_profile_cache.profiles, 'UInt32') = profile.id`
  — the column is `UInt64` on one side and `UInt32` on the other. The
  join yields exactly **155,785** rows.
- Both tables are `SharedReplacingMergeTree` and both MUST be read
  through a CTE applying `.final()`; `creator_profile_cache` holds
  409,455 raw rows over 354,983 unique `profiles`, so omitting it
  duplicates ~54k rows. Each table's join key is a prefix of its sorting
  key (`profiles`, `id`), so `FINAL` is sufficient and no
  `GROUP BY`/`argMax` reduction is required.
- `new_vertical.profiles` (**plural**, 2 rows) is an abandoned stub. The
  prototype's name-lookup query referenced it and is wrong.

**API** — new module `apps/api/src/modules/influencers/`

- `GET /app/influencers` and `GET /v1/influencers` — the paginated list,
  with filters supplied as query parameters.
- `GET /app/influencers/filter-options` — filter vocabularies, `app`
  surface only. The developer API exposes the list and its filter
  parameters, not a discoverable vocabulary endpoint. This matches
  athletes, whose `/app/athletes/filter-options` is also `app`-only.
  Vocabulary routes nest under the collection; the route folder name
  (`athlete-filter-options`) is not the route path.
- Note that the six accepted age buckets still appear in
  `openapi.json` through the `/v1/influencers` request schema, since the
  route validates against them. Withholding the vocabulary endpoint keeps
  the list undiscoverable, not the accepted values unpublished.
- Folder layout, base filenames, and the `create<Route>Queries(database)`
  factory follow `apps/api/AGENTS.md`.
- No new permission: an entity list is an ordinary feature (ADR-001).

**Filters and sorting**

- Category — `creator_tags`, a **JSON-encoded `String`** such as
  `["Music", "News & Politics"]`, not a ClickHouse `Array`. Filter with
  `hasAny(JSONExtract(creator_tags, 'Array(String)'), [...])` composed
  through the builder's `predicate.fn` helpers, as the athletes name
  filter does. ~40 distinct values.
- Country — `creator_country`, a 2-letter ISO code.
- Gender — `creator_gender`, lowercase `male` / `female` / `non-binary`.
- Age group — `creator_age_group`, restricted to the six buckets the data
  supports: `18-`, `18-24`, `25-34`, `35-44`, `45-64`, `65+`. Six further
  overlapping values (`18-34`, `25-44`, `35-64`, `25-64`, `18-44`,
  `18-35`, 211 rows total) are a data-quality artifact and MUST NOT be
  offered as filters.
- Handle search across `instagram_handle`, `tiktok_handle`,
  `youtube_handle`.
- Default sort is `name` ascending. **`cm_scores` contains no creator
  rows at all** (brand 5,969, athlete 1,887, musician 1,098), so the
  athletes default of `cmScore desc` is unavailable.
- `''` means "no value" in these columns; normalize to `null` in the
  mapper, never in the query.

**Web** — `apps/web/src/pages/creators/influencers/`

- Replace the placeholder `InfluencersPage.tsx`. Structure mirrors the
  **artists** page — `types.ts`, an `api/` module per endpoint,
  `components/` with a nested `filters/`, `utils/` for filter state, and
  `tests/` with shared helpers. Athletes is flat only because it has two
  query modules and one filter component; `apps/web/AGENTS.md` groups by
  concern once more than a couple of files share one, and five filters
  plus search starts at artists' scale.
- Request and response types derive from `paths` in `@repo/api-client`.
- Country codes render through `Intl.DisplayNames` keyed on the active
  Lingui locale (ADR-008), in one module owned by this page until a
  second consumer appears (ADR-006). No dependency is added.
- Columns: name, category, subtags, handles, country + city, gender, age.
- Before implementing, audit `@repo/ui` and the athletes page for
  reusable filter and table mechanics, per the
  `frontend-feature-workflow` skill. Athletes would be the second
  consumer of anything extracted, which makes extraction legitimate
  under ADR-006 rather than premature.

**Verification**

- Any phase touching the query carries a `smoke_cmd` that executes it
  against real ClickHouse — asserted SQL strings prove nothing (ADR-005).
- Re-run `pnpm --filter api generate:ch-schema` (the generator discovers
  `creator_profile_cache` by scanning `.table()` calls) and
  `pnpm generate:api-client`, committing both in the same change.

### Referenced ADRs

- **ADR-001** — an entity list is an ordinary feature, so it introduces
  no permission.
- **ADR-002** — the route's TypeBox schemas generate the OpenAPI document
  and the client; both artifacts land in the same commit.
- **ADR-003** — new `@repo/ui` exports, if any extraction happens, are
  declared as `package.json` subpaths, not a barrel.
- **ADR-005** — the join is composed with hypequery builders; no raw SQL,
  and `rawAs` only for scalar expressions.
- **ADR-006** — page-specific code stays in the page folder; the country
  formatter is promoted only on a second consumer.
- **ADR-007** — the request-time join, rather than waiting for an
  `influencers_cache`.
- **ADR-008** — country names via `Intl.DisplayNames`; ClickHouse
  category labels are data values and are not translated.

### Out of scope

- **The `VIDEOS` column.** No thumbnail data exists anywhere in
  `new_vertical`: `social_posts` (16.06M rows) has `post_url`, `caption`,
  `media_type` and engagement counts but no thumbnail or cover column,
  and neither do `tiktok_posts_cache`, `instagram_posts_cache`,
  `youtube_shorts_cache`, or `profile_youtube_videos`. The mockup's tiles
  are gradient placeholders.
- **Flag icons.** Not in the mockup; no dependency added.
- **Follower-based sorting.** `profile_snapshots_v4` has `followers` and
  `engagement_rate` but covers only ~10% of creators (15,332 TikTok,
  12,204 Instagram, 3,319 YouTube), so it would reduce the list to a 15k
  list when sorted.
- **CM Score for creators.** Requires upstream work on `cm_scores`.
- **An `influencers_cache` table.** Deferred per ADR-007.
- **Translating category names.** Data values, per ADR-008.
- **Avatars.** `profile.image_url` is NULL for these creators, so the
  table falls back to initials, as the mockup does.

### Open questions

- Whether the athletes and influencers filter panels and table shells
  should be extracted into `@repo/ui` as part of this work or in a
  follow-up. Two consumers now exist, so ADR-006 permits it; phase
  planning decides whether it belongs in the same PR.
- Follower and engagement sorting become worth revisiting if
  `profile_snapshots_v4` creator coverage rises materially above 10%.
