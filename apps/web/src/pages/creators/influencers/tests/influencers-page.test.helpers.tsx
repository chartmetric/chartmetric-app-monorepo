import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";

import type { Influencer, InfluencerListReply } from "../types";

import { InfluencersPage } from "../InfluencersPage";

export const renderInfluencersPage = (): void => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <I18nProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <MantineProvider>
          <InfluencersPage />
        </MantineProvider>
      </QueryClientProvider>
    </I18nProvider>,
  );
};

export const makeReply = (
  data: Influencer[],
  total = data.length,
): InfluencerListReply => ({
  data,
  meta: { limit: 25, offset: 0, total },
});
