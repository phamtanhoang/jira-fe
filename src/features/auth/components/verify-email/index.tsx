"use client";

import { useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Mail } from "lucide-react";
import { useAppStore } from "@/lib/stores/use-app-store";
import { VERIFICATION_CODE_LENGTH } from "@/lib/constants";
import { useVerifyEmail } from "@/features/auth/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function VerifyEmailForm() {
  const { t } = useAppStore();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [digits, setDigits] = useState<string[]>(Array(VERIFICATION_CODE_LENGTH).fill(""));
  const [error, setError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const code = digits.join("");

  const { mutate: verify, isPending } = useVerifyEmail({
    onError: (msg) => {
      setError(msg);
      setDigits(Array(VERIFICATION_CODE_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    },
  });

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
    setError("");
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

        {error && <p className="mt-4 text-center text-sm text-destructive">{error}</p>}

        <Button type="submit" className="mt-6 w-full" disabled={isPending || code.length !== VERIFICATION_CODE_LENGTH}>
          {isPending ? t("auth.verifying") : t("auth.verify")}
        </Button>
      </form>
    </div>
  );
}
