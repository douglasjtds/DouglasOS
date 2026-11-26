import { describe, expect, it } from "vitest";
import { cycleWindow, taskButtonAction } from "@/lib/taskbar";

describe("taskButtonAction", () => {
  it("restores a minimized window", () => {
    expect(taskButtonAction({ minimized: true }, false)).toBe("restore");
    expect(taskButtonAction({ minimized: true }, true)).toBe("restore");
  });

  it("minimizes the focused window", () => {
    expect(taskButtonAction({ minimized: false }, true)).toBe("minimize");
  });

  it("focuses a background window", () => {
    expect(taskButtonAction({ minimized: false }, false)).toBe("focus");
  });
});

describe("cycleWindow", () => {
  const order = ["about", "projects", "contact"] as const;

  it("returns null when nothing is open", () => {
    expect(cycleWindow([], null, 1)).toBeNull();
  });

  it("moves forward and backward in opening order, wrapping", () => {
    expect(cycleWindow([...order], "about", 1)).toBe("projects");
    expect(cycleWindow([...order], "contact", 1)).toBe("about");
    expect(cycleWindow([...order], "about", -1)).toBe("contact");
  });

  it("starts at an end when no window is focused", () => {
    expect(cycleWindow([...order], null, 1)).toBe("about");
    expect(cycleWindow([...order], null, -1)).toBe("contact");
  });
});
