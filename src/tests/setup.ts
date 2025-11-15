/* eslint-disable @typescript-eslint/no-empty-function */
import * as matchers from "@testing-library/jest-dom/matchers";
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, expect } from "vitest";

// Extend Vitest's expect method with methods from react-testing-library
expect.extend(matchers);

// Clean up after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});

// Mock ResizeObserver for shadcn/ui components (Popover, Command, etc.)

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock scrollIntoView for Command component (cmdk)
Element.prototype.scrollIntoView = function () {};
