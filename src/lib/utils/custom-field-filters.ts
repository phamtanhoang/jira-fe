/**
 * Apply the custom-field filter dictionary to a single issue. Issues whose
 * `customFieldValues` lack a matching entry for any active filter are
 * excluded. Filters with empty values are ignored.
 */
export function matchesCustomFieldFilters(
  issue: {
    customFieldValues?: Array<{
      fieldId: string;
      valueText: string | null;
      valueNumber: number | null;
      valueDate: string | null;
      valueSelect: string[];
    }>;
  },
  rules: Record<string, string | string[]> | undefined,
): boolean {
  if (!rules) return true;
  const entries = Object.entries(rules);
  if (entries.length === 0) return true;
  const byField = new Map(
    (issue.customFieldValues ?? []).map((v) => [v.fieldId, v]),
  );

  for (const [fieldId, raw] of entries) {
    if (Array.isArray(raw) ? raw.length === 0 : !raw) continue;
    const v = byField.get(fieldId);
    if (!v) return false;

    if (Array.isArray(raw)) {
      if (!raw.some((opt) => v.valueSelect.includes(opt))) return false;
      continue;
    }

    const r = raw.toString();
    if (v.valueText && v.valueText.toLowerCase().includes(r.toLowerCase())) {
      continue;
    }
    if (v.valueNumber !== null && Number(r) === v.valueNumber) continue;
    if (v.valueDate) {
      const day = new Date(v.valueDate).toISOString().slice(0, 10);
      if (day === r) continue;
    }
    if (v.valueSelect.includes(r)) continue;
    return false;
  }
  return true;
}
