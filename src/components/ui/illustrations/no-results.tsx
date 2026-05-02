export function NoResultsIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="90" cy="75" r="45" stroke="currentColor" strokeWidth="3" opacity="0.15" />
      <circle cx="90" cy="75" r="30" fill="currentColor" opacity="0.05" />
      <path d="M124 109 L150 135" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.2" />
      <path d="M80 65 L100 85 M100 65 L80 85" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.25" />
    </svg>
  );
}
