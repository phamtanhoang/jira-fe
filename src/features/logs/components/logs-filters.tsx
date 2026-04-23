"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/lib/stores/use-app-store";
import type { LogLevel, LogsFilters } from "../types";

const LEVELS: LogLevel[] = ["INFO", "WARN", "ERROR"];
const METHODS = ["GET", "POST", "PATCH", "PUT", "DELETE"];

export function LogsFiltersBar({
  filters,
  onChange,
}: {
  filters: LogsFilters;
  onChange: (next: LogsFilters) => void;
}) {
  const { t } = useAppStore();
  const [search, setSearch] = useState(filters.search ?? "");
  const [email, setEmail] = useState(filters.userEmail ?? "");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        placeholder={t("admin.logs.filters.searchPlaceholder")}
        className="h-8 w-60"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onBlur={() => onChange({ ...filters, search: search || undefined, cursor: undefined })}
      />
      <Input
        placeholder={t("admin.logs.filters.emailPlaceholder")}
        className="h-8 w-48"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onBlur={() => onChange({ ...filters, userEmail: email || undefined, cursor: undefined })}
      />
      <Select
        value={filters.level ?? ""}
        onValueChange={(v) =>
          onChange({ ...filters, level: (v || undefined) as LogLevel | undefined, cursor: undefined })
        }
      >
        <SelectTrigger className="h-8 w-28">
          <SelectValue placeholder={t("admin.logs.filters.level")} />
        </SelectTrigger>
        <SelectContent>
          {LEVELS.map((l) => (
            <SelectItem key={l} value={l}>
              {l}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={filters.method ?? ""}
        onValueChange={(v) =>
          onChange({ ...filters, method: v || undefined, cursor: undefined })
        }
      >
        <SelectTrigger className="h-8 w-28">
          <SelectValue placeholder={t("admin.logs.filters.method")} />
        </SelectTrigger>
        <SelectContent>
          {METHODS.map((m) => (
            <SelectItem key={m} value={m}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="number"
        placeholder={t("admin.logs.filters.statusCode")}
        className="h-8 w-28"
        value={filters.statusCode ?? ""}
        onChange={(e) =>
          onChange({
            ...filters,
            statusCode: e.target.value ? Number(e.target.value) : undefined,
            cursor: undefined,
          })
        }
      />
    </div>
  );
}
