export type RecurringFrequency = "DAILY" | "WEEKLY" | "MONTHLY";

export type IssueType = "TASK" | "STORY" | "BUG" | "EPIC" | "SUBTASK";
export type IssuePriority = "LOWEST" | "LOW" | "MEDIUM" | "HIGH" | "HIGHEST";

/**
 * Template applied when the cron spawns a new issue from a rule. Mirrors
 * the BE `RecurringTemplateDto` — fields beyond `summary` are optional.
 */
export type RecurringTemplate = {
  summary: string;
  description?: string;
  type?: IssueType;
  priority?: IssuePriority;
  assigneeId?: string | null;
  labelIds?: string[];
};

export type RecurringRule = {
  id: string;
  projectId: string;
  name: string;
  frequency: RecurringFrequency;
  /** UTC hour-of-day (0-23) when the rule fires. */
  hour: number;
  enabled: boolean;
  template: RecurringTemplate;
  nextRunAt: string;
  lastRunAt: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateRecurringRulePayload = {
  projectId: string;
  name: string;
  frequency: RecurringFrequency;
  hour?: number;
  template: RecurringTemplate;
  enabled?: boolean;
};

export type UpdateRecurringRulePayload = Partial<{
  name: string;
  frequency: RecurringFrequency;
  hour: number;
  template: RecurringTemplate;
  enabled: boolean;
}>;
