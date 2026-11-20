import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

(globalThis as { __DEV__?: boolean }).__DEV__ = true;

afterEach(() => {
  cleanup();
});
