import { describe, expect, it } from "vitest";
import { camelKeys } from "@/lib/db/helpers";
import { displayVoteCount } from "@/lib/votes-display";

describe("camelKeys numeric columns", () => {
  it("keeps vote_count and number as numbers, not booleans", () => {
    const row = {
      id: "abc",
      name: "Test",
      vote_count: 1,
      number: 3,
      published: 1,
      status: "APPROVED",
    };

    const out = camelKeys<{
      voteCount: number;
      number: number;
      published: boolean;
    }>(row as never);

    expect(out!.voteCount).toBe(1);
    expect(out!.number).toBe(3);
    expect(typeof out!.voteCount).toBe("number");
    expect(typeof out!.number).toBe("number");
    expect(out!.published).toBe(true);
  });

  it("preserves zero vote_count", () => {
    const out = camelKeys<{ voteCount: number }>({
      vote_count: 0,
    } as never);
    expect(out!.voteCount).toBe(0);
    expect(typeof out!.voteCount).toBe("number");
  });
});

describe("displayVoteCount", () => {
  it("normalizes legacy boolean values", () => {
    expect(displayVoteCount(true)).toBe(1);
    expect(displayVoteCount(false)).toBe(0);
    expect(displayVoteCount(42)).toBe(42);
    expect(displayVoteCount("7")).toBe(7);
  });
});

describe("normalizeSocialUrl", () => {
  it("strips platform label prefix from pasted URLs", async () => {
    const { normalizeSocialUrl } = await import("@/lib/social");
    expect(normalizeSocialUrl("Instagram https://instagram.com/queen")).toBe(
      "https://instagram.com/queen"
    );
    expect(normalizeSocialUrl("YouTube https://www.youtube.com/@test")).toBe(
      "https://www.youtube.com/@test"
    );
  });
});
