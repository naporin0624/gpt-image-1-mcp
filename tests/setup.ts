import { config } from "dotenv";
import { vi } from "vitest";

config({ path: ".env.test" });

global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};
