import { api } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/constants";
import type {
  CreateThrottleOverridePayload,
  ThrottleOverride,
  UpdateThrottleOverridePayload,
} from "./types";

export async function fetchThrottleOverrides(): Promise<ThrottleOverride[]> {
  const res = await api.get<ThrottleOverride[]>(
    ENDPOINTS.admin.throttleOverrides,
  );
  return res.data;
}

export async function createThrottleOverride(
  payload: CreateThrottleOverridePayload,
): Promise<{ message: string; override: ThrottleOverride }> {
  const res = await api.post<{ message: string; override: ThrottleOverride }>(
    ENDPOINTS.admin.throttleOverrides,
    payload,
  );
  return res.data;
}

export async function updateThrottleOverride(
  id: string,
  payload: UpdateThrottleOverridePayload,
): Promise<{ message: string; override: ThrottleOverride }> {
  const res = await api.patch<{ message: string; override: ThrottleOverride }>(
    ENDPOINTS.admin.throttleOverrideById(id),
    payload,
  );
  return res.data;
}

export async function deleteThrottleOverride(
  id: string,
): Promise<{ message: string }> {
  const res = await api.delete<{ message: string }>(
    ENDPOINTS.admin.throttleOverrideById(id),
  );
  return res.data;
}
