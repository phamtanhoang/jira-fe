export type UserRole = "USER" | "ADMIN";

export type AuthUser = {
  id: string;
  name: string | null;
  email: string;
  image?: string | null;
  role?: UserRole;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

export type VerifyEmailPayload = {
  email: string;
  token: string;
};

export type ForgotPasswordPayload = {
  email: string;
};

export type ResetPasswordPayload = {
  email: string;
  token: string;
  newPassword: string;
};

export type SessionRow = {
  id: string;
  createdAt: string;
  expiresAt: string;
  lastUsedAt: string;
  userAgent: string | null;
  ip: string | null;
  isCurrent: boolean;
};

export type PatRow = {
  id: string;
  name: string;
  tokenPrefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
};

export type CreatePatPayload = {
  name: string;
  expiresInDays?: number;
};

export type CreatePatResponse = {
  message: string;
  token: string;
  pat: PatRow;
};

export type OAuthProviderId = "google" | "github";

export type OAuthAccountRow = {
  id: string;
  provider: OAuthProviderId | string;
  email: string | null;
  createdAt: string;
  lastUsedAt: string;
};
