import { screen, waitFor, within } from "@testing-library/react";
import { expect } from "vitest";

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

const getControlledListbox = (control: HTMLButtonElement): HTMLElement => {
  const listboxId = control.getAttribute("aria-controls");
  if (listboxId === null) throw new Error("Combobox has no controlled listbox");

  const listbox = document.querySelector<HTMLElement>(`#${listboxId}`);
  if (listbox === null) throw new Error("Controlled listbox was not rendered");

  return listbox;
};

export const getControlledOption = (
  control: HTMLButtonElement,
  name: RegExp,
): HTMLElement =>
  within(getControlledListbox(control)).getByRole("option", {
    hidden: true,
    name,
  });

export const getControlledRadio = (
  control: HTMLButtonElement,
  name: string,
): HTMLElement => {
  const dropdown = getControlledListbox(control).closest<HTMLElement>(
    '[role="presentation"]',
  );
  if (dropdown === null)
    throw new Error("Controlled dropdown was not rendered");

  return within(dropdown).getByRole("radio", { hidden: true, name });
};
