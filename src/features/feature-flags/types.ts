export type FlagConditions = {
  roles?: ("USER" | "ADMIN")[];
  emails?: string[];
  workspaceIds?: string[];
};

export type FeatureFlag = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  enabled: boolean;
  rolloutPercentage: number;
  conditions: FlagConditions | null;
  createdAt: string;
  updatedAt: string;
  createdById: string | null;
};

export type CreateFlagInput = {
  key: string;
  name: string;
  description?: string;
  enabled?: boolean;
  rolloutPercentage?: number;
  conditions?: FlagConditions;
};

export type UpdateFlagInput = Partial<Omit<CreateFlagInput, "key">>;

export type EvaluatedFlags = Record<string, boolean>;
