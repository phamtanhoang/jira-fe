/**
 * Unit tests for cn() — className helper with tailwind-merge.
 *
 * Example of twMerge: cn("p-2", "p-4") → "p-4" (later class overrides)
 */
import { cn } from "@/lib/utils/cn";

describe("cn", () => {
  it("joins multiple class strings", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("filters falsy values (false, null, undefined)", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });

  it("supports conditional object syntax from clsx", () => {
    expect(cn("base", { active: true, disabled: false })).toBe("base active");
  });

  it("merges conflicting Tailwind classes (later wins)", () => {
    // p-2 is overridden by p-4 thanks to tailwind-merge
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("returns empty string when no inputs", () => {
    expect(cn()).toBe("");
  });

  it("handles arrays", () => {
    expect(cn(["a", "b"], "c")).toBe("a b c");
  });
});
