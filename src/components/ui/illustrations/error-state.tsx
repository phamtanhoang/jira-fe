export function ErrorStateIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect x="30" y="20" width="140" height="100" rx="8" fill="currentColor" opacity="0.06" />
      <path d="M100 50 L100 85" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.3" />
      <circle cx="100" cy="98" r="3" fill="currentColor" opacity="0.3" />
      <path d="M60 130 Q100 110 140 130" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.15" />
    </svg>
  );
}
