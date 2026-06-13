"use client";

import { useEffect, useRef } from "react";
import { Download, X } from "lucide-react";

export type LightboxAttachment = {
  fileName: string;
  mimeType: string;
  url: string;
};

/**
 * Universal preview overlay for attachments. Supports:
 *
 * - `image/*`  → renders <img>
 * - `application/pdf` → renders <embed> (browser-native viewer)
 * - `video/*`  → renders <video controls>
 * - `audio/*`  → renders <audio controls> on a card
 * - text/csv/markdown/json → renders <iframe> with the signed URL
 * - everything else → "open in new tab" fallback
 *
 * Accessibility: ESC closes, click on the dimmed backdrop closes, the
 * close button traps the initial focus on mount. The inner content
 * stops click-propagation so user can interact with the preview
 * (zoom, pause video) without the overlay closing.
 */
export function AttachmentLightbox({
  attachment,
  onClose,
}: {
  attachment: LightboxAttachment | null;
  onClose: () => void;
}) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!attachment) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    // Focus the close button so screen readers announce the dialog.
    // Defer to next tick so the button is mounted.
    const focusTimer = setTimeout(() => closeBtnRef.current?.focus(), 0);
    // Prevent body scroll while the overlay is open.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      clearTimeout(focusTimer);
      document.body.style.overflow = prevOverflow;
    };
  }, [attachment, onClose]);

  if (!attachment) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={attachment.fileName}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Top bar */}
      <div className="absolute top-3 left-3 right-3 flex items-center gap-2 text-white">
        <span className="truncate text-sm font-medium">
          {attachment.fileName}
        </span>
        <a
          href={attachment.url}
          download={attachment.fileName}
          onClick={(e) => e.stopPropagation()}
          className="ml-auto rounded-md bg-white/10 p-2 transition-colors hover:bg-white/20"
          title="Download"
          aria-label="Download"
        >
          <Download className="h-4 w-4" />
        </a>
        <button
          ref={closeBtnRef}
          type="button"
          onClick={onClose}
          className="rounded-md bg-white/10 p-2 transition-colors hover:bg-white/20"
          title="Close (Esc)"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Preview content — stopPropagation so clicks inside don't dismiss */}
      <div
        className="max-h-[88vh] max-w-[92vw]"
        onClick={(e) => e.stopPropagation()}
      >
        <PreviewBody attachment={attachment} />
      </div>
    </div>
  );
}

function PreviewBody({ attachment }: { attachment: LightboxAttachment }) {
  const { mimeType, url, fileName } = attachment;

  if (mimeType.startsWith("image/")) {
    return (
      // Signed URLs rotate; next/image's loader would re-cache on every
      // refresh for tiny gain.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={fileName}
        className="max-h-[85vh] max-w-[90vw] rounded-lg shadow-2xl"
      />
    );
  }

  if (mimeType === "application/pdf") {
    return (
      <embed
        src={url}
        type="application/pdf"
        className="h-[85vh] w-[90vw] rounded-lg bg-white shadow-2xl"
      />
    );
  }

  if (mimeType.startsWith("video/")) {
    return (
      <video
        src={url}
        controls
        autoPlay
        className="max-h-[85vh] max-w-[90vw] rounded-lg shadow-2xl"
      />
    );
  }

  if (mimeType.startsWith("audio/")) {
    return (
      <div className="rounded-lg bg-card p-6 shadow-2xl">
        <p className="mb-3 text-center text-sm font-medium">{fileName}</p>
        <audio src={url} controls autoPlay className="w-[480px] max-w-[80vw]" />
      </div>
    );
  }

  if (
    mimeType.startsWith("text/") ||
    mimeType === "application/json" ||
    mimeType === "application/xml"
  ) {
    return (
      <iframe
        src={url}
        title={fileName}
        className="h-[80vh] w-[80vw] rounded-lg bg-white shadow-2xl"
      />
    );
  }

  // Fallback — unsupported type. Show file info + force the user to open
  // in a new tab. Avoids embedding random binary content in an iframe.
  return (
    <div className="rounded-lg bg-card p-8 text-center shadow-2xl">
      <p className="mb-2 text-base font-medium">{fileName}</p>
      <p className="mb-4 text-sm text-muted-foreground">
        This file type can&apos;t be previewed inline.
      </p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Open in new tab
      </a>
    </div>
  );
}
