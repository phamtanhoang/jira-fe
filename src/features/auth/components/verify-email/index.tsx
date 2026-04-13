"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Mail, Clock } from "lucide-react";
import { useAppStore } from "@/lib/stores/use-app-store";
import { VERIFICATION_CODE_LENGTH } from "@/lib/constants";
import { useVerifyEmail } from "@/features/auth/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function useCountdown(expiresAt: number) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)),
  );

  useEffect(() => {
    if (!expiresAt) return;
    const timer = setInterval(() => {
      const left = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  const minutes = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const display = `${minutes}:${secs.toString().padStart(2, "0")}`;

  return { remaining, display, isExpired: remaining <= 0 };
}

export function VerifyEmailForm() {
  const { t } = useAppStore();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const expiresAt = Number(searchParams.get("expiresAt")) || 0;
  const countdown = useCountdown(expiresAt);

  const [digits, setDigits] = useState<string[]>(Array(VERIFICATION_CODE_LENGTH).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const code = digits.join("");

  const { mutate: verify, isPending } = useVerifyEmail();

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const next = [...digits];
    next[index] = value.slice(-1);
    setDigits(next);
    if (value && index < VERIFICATION_CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, VERIFICATION_CODE_LENGTH);
    if (!pasted) return;
    const next = [...digits];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, VERIFICATION_CODE_LENGTH - 1)]?.focus();
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    verify({ email, token: code });
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-xl font-semibold">{t("auth.verifyEmail")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("auth.verifyEmailDesc")}{" "}
          <span className="font-medium text-foreground">{email}</span>
        </p>
        {expiresAt > 0 && (
          <div className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${countdown.isExpired ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>
            <Clock className="h-3 w-3" />
            {countdown.isExpired
              ? t("auth.codeExpired")
              : `${t("auth.codeExpiresIn")} ${countdown.display}`}
          </div>
        )}
      </div>

      <form onSubmit={onSubmit}>
        <div className="flex justify-center gap-2" onPaste={handlePaste}>
          {digits.map((digit, i) => (
            <Input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="h-12 w-10 text-center text-lg font-semibold"
            />
          ))}
        </div>

        <Button type="submit" className="mt-6 w-full p-5" disabled={isPending || code.length !== VERIFICATION_CODE_LENGTH}>
          {isPending ? t("auth.verifying") : t("auth.verify")}
        </Button>
      </form>
    </div>
  );
}
