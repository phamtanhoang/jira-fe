import { api } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/constants";
import type {
  CreateFlagInput,
  EvaluatedFlags,
  FeatureFlag,
  UpdateFlagInput,
} from "./types";

export async function listFlags(): Promise<FeatureFlag[]> {
  const res = await api.get<FeatureFlag[]>(ENDPOINTS.featureFlags.base);
  return res.data;
}

export async function createFlag(
  input: CreateFlagInput,
): Promise<{ message: string; flag: FeatureFlag }> {
  const res = await api.post<{ message: string; flag: FeatureFlag }>(
    ENDPOINTS.featureFlags.base,
    input,
  );
  return res.data;
}

export async function updateFlag(
  id: string,
  input: UpdateFlagInput,
): Promise<{ message: string; flag: FeatureFlag }> {
  const res = await api.patch<{ message: string; flag: FeatureFlag }>(
    ENDPOINTS.featureFlags.byId(id),
    input,
  );
  return res.data;
}

export async function deleteFlag(id: string): Promise<{ message: string }> {
  const res = await api.delete<{ message: string }>(
    ENDPOINTS.featureFlags.byId(id),
  );
  return res.data;
}

export async function fetchMyFlags(): Promise<EvaluatedFlags> {
  const res = await api.get<EvaluatedFlags>(ENDPOINTS.featureFlags.me);
  return res.data;
}
