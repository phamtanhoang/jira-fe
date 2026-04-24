"use client";

import { AVATAR_GRADIENT } from "@/lib/constants/issue-config";
import { cn, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserAvatarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  /** Extra className on the Avatar root (size, shape, ring, etc.). */
  className?: string;
  /** Optional class for the fallback initials (size / colour overrides). */
  fallbackClassName?: string;
  /** When true, skip the gradient fallback background (for light contexts). */
  plain?: boolean;
}

/**
 * Canonical user avatar. Renders `<AvatarImage>` when `user.image` is set,
 * otherwise initials via `getInitials`. Use this instead of hand-wiring
 * `<Avatar>` + `<AvatarFallback>` so a profile picture upload propagates
 * everywhere the component is mounted.
 */
export function UserAvatar({
  user,
  className,
  fallbackClassName,
  plain,
}: UserAvatarProps) {
  const initials = getInitials(user?.name, user?.email);
  const alt = user?.name || user?.email || "user";
  return (
    <Avatar className={className}>
      {user?.image ? <AvatarImage src={user.image} alt={alt} /> : null}
      <AvatarFallback
        className={cn(!plain && AVATAR_GRADIENT, fallbackClassName)}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
