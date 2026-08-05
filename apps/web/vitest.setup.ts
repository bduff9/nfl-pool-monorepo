import { vi } from "vitest";

// "server-only" throws when imported outside Next's own build pipeline (which strips it); tests
// run through plain vitest/vite, so every test file that transitively imports a "use server"
// module needs this mocked away.
vi.mock("server-only", () => ({}));
