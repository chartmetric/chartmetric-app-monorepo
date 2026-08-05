import { QueryClient } from "@tanstack/react-query";

// gcTime keeps results warm across navigation so returning to a screen renders
// from cache immediately, while the short staleTime makes that cache hit kick
// off a background refresh (with the table's busy overlay) shortly after,
// keeping filter interactions visibly live.
export const createQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 30 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
        staleTime: 60 * 1000,
      },
    },
  });
