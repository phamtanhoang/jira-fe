export function NoIssuesIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect x="20" y="20" width="160" height="120" rx="8" fill="currentColor" opacity="0.06" />
      <rect x="40" y="40" width="120" height="12" rx="4" fill="currentColor" opacity="0.15" />
      <rect x="40" y="60" width="80" height="10" rx="4" fill="currentColor" opacity="0.10" />
      <rect x="40" y="78" width="100" height="10" rx="4" fill="currentColor" opacity="0.10" />
      <rect x="40" y="96" width="60" height="10" rx="4" fill="currentColor" opacity="0.08" />
      <circle cx="100" cy="130" r="16" fill="currentColor" opacity="0.08" />
      <path d="M93 130 L100 137 L110 124" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3" />
    </svg>
  );
}
