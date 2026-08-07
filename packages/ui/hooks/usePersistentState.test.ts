import { act, renderHook, type RenderHookResult } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { usePersistentState } from "./usePersistentState";

const isStringList = (candidate: unknown): candidate is string[] =>
  Array.isArray(candidate) &&
  candidate.every((item) => typeof item === "string");

const renderStored = (
  key: string,
): RenderHookResult<readonly [string[], (next: string[]) => void], unknown> =>
  renderHook(() =>
    usePersistentState<string[]>(key, ["fallback"], isStringList),
  );

describe("usePersistentState", () => {
  it("uses the fallback when nothing is stored", () => {
    const { result } = renderStored("columns");

    expect(result.current[0]).toEqual(["fallback"]);
  });

  it("reads a stored value on the first render", () => {
    localStorage.setItem("columns", JSON.stringify(["name", "rank"]));

    const { result } = renderStored("columns");

    // Not deferred to an effect: a fallback on first render would flash the
    // default columns before the reader's own selection.
    expect(result.current[0]).toEqual(["name", "rank"]);
  });

  it("persists what the caller sets", () => {
    const { result } = renderStored("columns");

    act(() => {
      result.current[1](["sport"]);
    });

    expect(result.current[0]).toEqual(["sport"]);
    expect(localStorage.getItem("columns")).toBe(JSON.stringify(["sport"]));
  });

  // A value written by an earlier shape of the setting must not come back as
  // the wrong type.
  it("falls back when the stored value fails validation", () => {
    localStorage.setItem("columns", JSON.stringify([1, 2, 3]));

    expect(renderStored("columns").result.current[0]).toEqual(["fallback"]);
  });

  it("falls back when the stored value is not JSON", () => {
    localStorage.setItem("columns", "not json at all");

    expect(renderStored("columns").result.current[0]).toEqual(["fallback"]);
  });

  it("falls back when the stored value is valid JSON of the wrong shape", () => {
    localStorage.setItem("columns", JSON.stringify({ keys: ["name"] }));

    expect(renderStored("columns").result.current[0]).toEqual(["fallback"]);
  });

  it("reads the new key when the key changes", () => {
    localStorage.setItem("first", JSON.stringify(["one"]));
    localStorage.setItem("second", JSON.stringify(["two"]));

    const { rerender, result } = renderHook(
      ({ key }) =>
        usePersistentState<string[]>(key, ["fallback"], isStringList),
      { initialProps: { key: "first" } },
    );

    expect(result.current[0]).toEqual(["one"]);

    rerender({ key: "second" });

    expect(result.current[0]).toEqual(["two"]);
  });
});
