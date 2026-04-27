import { api } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/constants";
import type {
  CreateCustomFieldPayload,
  CustomFieldDef,
  UpdateCustomFieldPayload,
} from "./types";

export async function fetchCustomFields(
  projectId: string,
): Promise<CustomFieldDef[]> {
  const res = await api.get<CustomFieldDef[]>(ENDPOINTS.customFields.base, {
    params: { projectId },
  });
  return res.data;
}

export async function createCustomField(
  payload: CreateCustomFieldPayload,
): Promise<CustomFieldDef> {
  const res = await api.post<CustomFieldDef>(
    ENDPOINTS.customFields.base,
    payload,
  );
  return res.data;
}

export async function updateCustomField(
  id: string,
  payload: UpdateCustomFieldPayload,
): Promise<CustomFieldDef> {
  const res = await api.patch<CustomFieldDef>(
    ENDPOINTS.customFields.byId(id),
    payload,
  );
  return res.data;
}

export async function deleteCustomField(
  id: string,
): Promise<{ message: string }> {
  const res = await api.delete<{ message: string }>(
    ENDPOINTS.customFields.byId(id),
  );
  return res.data;
}
