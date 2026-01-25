interface FrogIconProps {
  className?: string
}

export function FrogIcon({ className = "h-6 w-6" }: FrogIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Frog body */}
      <ellipse cx="12" cy="14" rx="8" ry="6" />
      {/* Left eye */}
      <circle cx="8" cy="8" r="2.5" />
      <circle cx="8" cy="8" r="1" fill="currentColor" />
      {/* Right eye */}
      <circle cx="16" cy="8" r="2.5" />
      <circle cx="16" cy="8" r="1" fill="currentColor" />
      {/* Smile */}
      <path d="M8 16 Q12 19 16 16" />
      {/* Front legs */}
      <path d="M5 18 L3 20 M4 20 L2 20" />
      <path d="M19 18 L21 20 M20 20 L22 20" />
    </svg>
  )
}

export default FrogIcon
