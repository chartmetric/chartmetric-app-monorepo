## TV & Movies actors list

### Ask

make an actors list table like we hacve for artist and have the following columns: index, artist name, known for, instagram, IG Followers (sortable - DESC default ), ROLES, Popularity . e.g of one row: name: [**Dwayne Johnson**](https://newverticals.chartmetric.com/tv/people/18918)
known for: [Moana as](https://newverticals.chartmetric.com/tv/titles/1108427) [Maui](https://newverticals.chartmetric.com/tv/titles/1108427), [Ballers HBO as](https://newverticals.chartmetric.com/tv/titles/62704) [Spencer Strassmore](https://newverticals.chartmetric.com/tv/titles/62704)
instagram: [@therock](https://instagram.com/therock)
IG Followers: 382.3M
Roles: 2
Popularity: 7.2

### Goal

Add TV & Movies as a fourth product vertical and provide a paginated actors list that follows the established artist and athlete list-table experience.

### Requirements

- Add a `tv` vertical to `apps/web`:
  - Display label: `for TV & Movies`.
  - Home and navigation destination: `/tv/actors`.
  - Navigation label: `Actors`.
  - Add the route to the application router.
  - Add a TV locale catalog and translate all new user-facing strings across the seven supported locales.
  - Keep the vertical configuration limited to identity, navigation, and terminology; do not add a feature inventory or entitlement flags.
- Add an actors-list page under `apps/web/src/pages/tv/actors/`.
  - Use the music artists list and sports athletes list as behavioral and visual precedents.
  - Reuse `@repo/ui/data-table` and `@repo/ui/table-pagination`.
  - Support loading, refreshing, empty, error, and pagination states.
  - Keep the table usable on mobile through contained horizontal scrolling.
  - Derive request and response types from `@repo/api-client`.
- Display these columns in order:
  1. Index.
  2. Actor name.
  3. Known for.
  4. Instagram.
  5. IG Followers.
  6. Roles.
  7. Popularity.
- Index:
  - Show the actor's one-based position in the complete paginated result, not merely the current page.
  - Calculate it from the page offset and row position.
- Actor name:
  - Display the actor's profile image when available.
  - Display the actor name as a link to `/tv/actors/:actorId`.
  - Use "Actor name" rather than the music-specific "Artist name" label.
- Known for:
  - Include only acting credits.
  - Display at most two credits.
  - Select credits by title popularity descending, with a deterministic tie-breaker.
  - Render each as `<title> as <character>`.
  - Link both the title and character text to `/tv/titles/:titleId`.
  - Include the network in the displayed title when available, matching the supplied "Ballers HBO" example.
  - Omit `as <character>` when the character is unavailable.
- Instagram:
  - Display the normalized handle with an `@` prefix.
  - Link to the stored Instagram URL.
  - Open external Instagram links safely in a new tab.
  - Display the standard empty value when no Instagram account exists.
- IG Followers:
  - Format large values using the existing abbreviated-number behavior, such as `382.3M`.
  - Make this column sortable.
  - Default the list to IG Followers descending.
  - Place actors without a follower count after actors with a count.
- Roles:
  - Count all distinct acting credits for the actor, not only the two shown under Known for.
  - Count a repeated credit only once according to its title, title kind, and character identity.
- Popularity:
  - Use the person popularity value.
  - Format it to one decimal place.
  - Display the standard empty value when unavailable.
- Add a Fastify `actors` module with `GET /actors` registered on both:
  - `/app`, for the first-party web application.
  - `/v1`, for developer API customers and generated API documentation.
  - Follow the existing authentication model for each surface.
  - Do not introduce a new permission solely for this ordinary list feature.
  - Enforce TV product access server-side if product access is required by the existing access model.
- Define the endpoint with TypeBox request and response schemas:
  - Paginated response with a total count.
  - Default sorting: `instagramFollowers`, descending.
  - Return normalized actor identity, profile image, Instagram account, Instagram follower count, popularity, total role count, and up to two known-for credits.
  - Regenerate the OpenAPI document and `@repo/api-client` in the same change.
- Build the ClickHouse query through hypequery using:
  - `new_vertical.test_tv_persons`.
  - `new_vertical.test_tv_person_socials`.
  - `new_vertical.test_tv_credits`.
  - `new_vertical.test_tv_titles`.
  - Restrict results and role counts to acting credits.
  - Apply the required `FINAL`/deduplication handling based on each table's engine and sorting key.
  - Add the TV tables to the generated ClickHouse schema through its generator.
  - Verify the generated SQL against a real ClickHouse schema with a smoke command.
- Add behavioral coverage for:
  - TV vertical selection and routing.
  - Both API surfaces.
  - Default follower sorting.
  - Null followers sorting last.
  - Absolute index values across pages.
  - Known-for selection and deterministic ordering.
  - Distinct role counting.
  - Actor, title, and Instagram link destinations.
  - Missing images, handles, follower counts, characters, networks, and popularity.
  - Loading, empty, error, pagination, desktop, and mobile behavior.

### Referenced ADRs

- ADR-001 — TV feature existence belongs in code; access comes from AuthService, and the API remains the enforcement boundary.
- ADR-002 — TypeBox defines the API contract, and OpenAPI plus the generated frontend client must be regenerated together.
- ADR-003 — Any newly exposed shared UI module must use a direct package subpath export rather than a barrel.
- ADR-005 — All ClickHouse query structure must use hypequery and must execute successfully in a smoke check.
- ADR-006 — TV-specific code remains with the actors page and endpoint; reusable mechanics use existing shared components and are promoted only with demonstrated reuse.

### Out of scope

- Actor detail-page implementation.
- Title detail-page implementation.
- Actor or title search and filtering.
- User-configurable columns.
- Additional social platforms.
- Follower-change metrics.
- New commercial permissions or Stripe entitlement logic.
- Redesigning the application's overall sidebar beyond adding the TV & Movies vertical entry.

### Open questions

- None.
