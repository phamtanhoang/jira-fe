"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface TruncatedTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  text: string | null | undefined;
  fallback?: string;
  /** Inline element instead of block (defaults to span with truncate+min-w-0). */
  asChild?: never;
  tooltipSide?: "top" | "bottom" | "left" | "right";
}

/**
 * Renders text with `truncate` + reveals the full value on hover via tooltip.
 * Only attaches tooltip when the rendered element actually overflows, so short
 * values don't get a useless hover state.
 */
export function TruncatedText({
  text,
  fallback = "—",
  className,
  tooltipSide = "top",
  ...rest
}: TruncatedTextProps) {
  const ref = React.useRef<HTMLSpanElement | null>(null);
  const [overflowing, setOverflowing] = React.useState(false);
  const value = text ?? fallback;

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setOverflowing(el.scrollWidth > el.clientWidth + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [value]);

  if (!overflowing) {
    return (
      <span
        ref={ref}
        className={cn("block min-w-0 truncate", className)}
        {...rest}
      >
        {value}
      </span>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            ref={ref}
            className={cn("block min-w-0 truncate", className)}
            {...rest}
          >
            {value}
          </span>
        }
      />
      <TooltipContent side={tooltipSide} className="max-w-sm break-all text-xs">
        {value}
      </TooltipContent>
    </Tooltip>
  );
}
