export type UserRole = "USER" | "ADMIN";

export type AuthUser = {
  id: string;
  name: string | null;
  email: string;
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
