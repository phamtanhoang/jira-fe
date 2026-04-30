import { api } from "@/lib/api";
import { ENDPOINTS } from "@/lib/constants";
import type { UserProfile } from "./types";

export const usersApi = {
  /**
   * Public-ish profile. Backend gates by shared-workspace overlap so a
   * stranger gets 404 — `react-query` falls through to error boundary which
   * renders the "Profile unavailable" state.
   */
  getProfile: (id: string) =>
    api
      .get<UserProfile>(ENDPOINTS.users.profile(id))
      .then((r) => r.data),
};
