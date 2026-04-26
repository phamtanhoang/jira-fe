export type ThrottleOverride = {
  id: string;
  target: string;
  bypass: boolean;
  multiplier: number;
  reason: string | null;
  expiresAt: string | null;
  createdById: string | null;
  createdBy: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateThrottleOverridePayload = {
  target: string;
  bypass?: boolean;
  multiplier?: number;
  reason?: string;
  expiresAt?: string;
};

export type UpdateThrottleOverridePayload = Partial<
  Omit<CreateThrottleOverridePayload, "target">
>;
