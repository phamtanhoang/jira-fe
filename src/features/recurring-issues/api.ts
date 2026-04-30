import { api } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/constants";
import type {
  CreateRecurringRulePayload,
  RecurringRule,
  UpdateRecurringRulePayload,
} from "./types";

type CreateResponse = { message: string; rule: RecurringRule };
type UpdateResponse = { message: string; rule: RecurringRule };
type DeleteResponse = { message: string };

export async function fetchRecurringRules(
  projectId: string,
): Promise<RecurringRule[]> {
  const res = await api.get<RecurringRule[]>(ENDPOINTS.recurringIssues.base, {
    params: { projectId },
  });
  return res.data;
}

export async function createRecurringRule(
  payload: CreateRecurringRulePayload,
): Promise<CreateResponse> {
  const res = await api.post<CreateResponse>(
    ENDPOINTS.recurringIssues.base,
    payload,
  );
  return res.data;
}

export async function updateRecurringRule(
  id: string,
  payload: UpdateRecurringRulePayload,
): Promise<UpdateResponse> {
  const res = await api.patch<UpdateResponse>(
    ENDPOINTS.recurringIssues.byId(id),
    payload,
  );
  return res.data;
}

export async function deleteRecurringRule(
  id: string,
): Promise<DeleteResponse> {
  const res = await api.delete<DeleteResponse>(
    ENDPOINTS.recurringIssues.byId(id),
  );
  return res.data;
}
