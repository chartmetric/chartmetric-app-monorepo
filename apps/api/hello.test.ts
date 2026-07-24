import { describe, expect, it } from "vitest";

import { helloMessage } from "./hello.ts";

describe("helloMessage", () => {
  it("returns the hello world payload", () => {
    expect(helloMessage()).toEqual({ message: "Hello, world!" });
  });
});
