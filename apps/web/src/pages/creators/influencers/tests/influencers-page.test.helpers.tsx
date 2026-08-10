import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import { expect } from "vitest";

import type {
  Influencer,
  InfluencerFilterOptionsReply,
  InfluencerListReply,
} from "../types";

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

export const emptyFilterOptions: InfluencerFilterOptionsReply = {
  ageGroups: [],
  categories: [],
  countries: [],
  genders: [],
};

export const findEnabledControl = async (
  role: "button" | "combobox",
  name: string,
): Promise<HTMLButtonElement> => {
  const control = await screen.findByRole<HTMLButtonElement>(role, { name });

  await waitFor(() => {
    expect(control.disabled).toBe(false);
  });

  return control;
};

export const getControlledOption = (
  control: HTMLButtonElement,
  name: RegExp,
): HTMLElement => {
  const listboxId = control.getAttribute("aria-controls");
  if (listboxId === null) throw new Error("Combobox has no controlled listbox");

  const listbox = document.querySelector<HTMLElement>(`#${listboxId}`);
  if (listbox === null) throw new Error("Controlled listbox was not rendered");

  return within(listbox).getByRole("option", { hidden: true, name });
};
