import { describe, expect, it } from "vitest";
import { appFromHash, openHash } from "@/lib/apps/deepLink";

describe("home deep links", () => {
  it("reads a window app from #open=<id>", () => {
    expect(appFromHash("#open=contact")).toBe("contact");
    expect(appFromHash(openHash("paint"))).toBe("paint");
    expect(appFromHash("#open=how-i-work-with-ai")).toBe("how-i-work-with-ai");
  });

  it("ignores everything that isn't a window app", () => {
    for (const hash of ["", "#", "#contact", "#open=", "#open=resume", "#open=github", "#open=nope", "#open=%E0%A4%A"]) {
      expect(appFromHash(hash)).toBeNull();
    }
  });
});
