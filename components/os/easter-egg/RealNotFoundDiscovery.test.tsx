import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { RealNotFoundDiscovery } from "@/components/os/easter-egg/RealNotFoundDiscovery";
import { useEasterEggStore } from "@/lib/store/easterEggStore";

describe("RealNotFoundDiscovery", () => {
  it("counts the real-404 easter egg on mount and queues its toast for the desktop", () => {
    useEasterEggStore.getState().reset();
    render(<RealNotFoundDiscovery />);
    expect(useEasterEggStore.getState().found).toHaveProperty("real-404");
    expect(useEasterEggStore.getState().pending.length).toBeGreaterThan(0);
  });
});
