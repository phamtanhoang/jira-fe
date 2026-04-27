export type CustomFieldType =
  | "TEXT"
  | "NUMBER"
  | "DATE"
  | "SELECT"
  | "MULTI_SELECT";

export const CUSTOM_FIELD_TYPES: CustomFieldType[] = [
  "TEXT",
  "NUMBER",
  "DATE",
  "SELECT",
  "MULTI_SELECT",
];

export type CustomFieldDef = {
  id: string;
  projectId: string;
  name: string;
  type: CustomFieldType;
  options: string[];
  required: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
};

export type CustomFieldValue = {
  fieldId: string;
  valueText: string | null;
  valueNumber: number | null;
  valueDate: string | null;
  valueSelect: string[];
};

export type CreateCustomFieldPayload = {
  projectId: string;
  name: string;
  type: CustomFieldType;
  options?: string[];
  required?: boolean;
  position?: number;
};

export type UpdateCustomFieldPayload = Partial<
  Omit<CreateCustomFieldPayload, "projectId" | "type">
>;
