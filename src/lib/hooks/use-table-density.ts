"use client";

import { useState, useEffect } from "react";

export type TableDensity = "compact" | "comfortable";

export function useTableDensity() {
  const [density, setDensityState] = useState<TableDensity>("comfortable");

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("table-density");
    if (stored === "compact" || stored === "comfortable") {
      setDensityState(stored);
    }
  }, []);

  // Save to localStorage when changed
  const setDensity = (value: TableDensity) => {
    setDensityState(value);
    localStorage.setItem("table-density", value);
  };

  const rowPadding = density === "compact" ? "py-1" : "py-2.5";

  return {
    density,
    setDensity,
    rowPadding,
  };
}
