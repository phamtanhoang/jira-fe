"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrentUser } from "@/features/auth/hooks";
import { cn } from "@/lib/utils";
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
  const { user } = useCurrentUser();
  const [search, setSearch] = useState(filters.search ?? "");
  const [email, setEmail] = useState(filters.userEmail ?? "");

  const hideMine = filters.excludeUserId === user?.id;
  const errorsOnly = filters.errorsOnly === true;

  // Default "Hide my activity" ON once we know the admin's own ID — they
  // rarely want to see their own reads when investigating an incident.
  useEffect(() => {
    if (
      user?.id &&
      filters.excludeUserId === undefined &&
      filters.errorsOnly === undefined
    ) {
      onChange({ ...filters, excludeUserId: user.id, page: 1 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        placeholder={t("admin.logs.filters.searchPlaceholder")}
        className="h-8 w-60"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onBlur={() =>
          onChange({ ...filters, search: search || undefined, page: 1 })
        }
      />
      <Input
        placeholder={t("admin.logs.filters.emailPlaceholder")}
        className="h-8 w-48"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onBlur={() =>
          onChange({
            ...filters,
            userEmail: email || undefined,
            page: 1,
          })
        }
      />
      <Select
        value={filters.level ?? ""}
        onValueChange={(v) =>
          onChange({
            ...filters,
            level: (v || undefined) as LogLevel | undefined,
            page: 1,
          })
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
          onChange({ ...filters, method: v || undefined, page: 1 })
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
            page: 1,
          })
        }
      />
      <FilterPill
        active={hideMine}
        onToggle={() =>
          onChange({
            ...filters,
            excludeUserId: !hideMine && user?.id ? user.id : undefined,
            page: 1,
          })
        }
      >
        {t("admin.logs.filters.hideMine")}
      </FilterPill>
      <FilterPill
        active={errorsOnly}
        onToggle={() =>
          onChange({
            ...filters,
            errorsOnly: !errorsOnly ? true : undefined,
            page: 1,
          })
        }
      >
        {t("admin.logs.filters.errorsOnly")}
      </FilterPill>
    </div>
  );
}

function FilterPill({
  active,
  onToggle,
  children,
}: {
  active: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "h-8 rounded-full border px-3 text-[12px] font-medium transition-colors",
        active
          ? "border-primary/50 bg-primary/10 text-primary"
          : "border-border bg-muted/40 text-muted-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}
