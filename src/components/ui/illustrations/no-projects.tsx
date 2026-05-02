export function NoProjectsIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect x="20" y="30" width="70" height="90" rx="6" fill="currentColor" opacity="0.08" />
      <rect x="110" y="50" width="70" height="70" rx="6" fill="currentColor" opacity="0.06" />
      <rect x="30" y="45" width="50" height="8" rx="3" fill="currentColor" opacity="0.15" />
      <rect x="30" y="60" width="35" height="6" rx="3" fill="currentColor" opacity="0.10" />
      <rect x="30" y="73" width="42" height="6" rx="3" fill="currentColor" opacity="0.10" />
      <rect x="120" y="65" width="50" height="8" rx="3" fill="currentColor" opacity="0.12" />
      <rect x="120" y="80" width="35" height="6" rx="3" fill="currentColor" opacity="0.08" />
      <circle cx="100" cy="140" r="12" fill="currentColor" opacity="0.06" />
      <path d="M96 140 H104 M100 136 V144" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.25" />
    </svg>
  );
}
