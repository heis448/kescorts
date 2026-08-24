export default function BlueTick({ size = 16, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`inline-flex flex-shrink-0 ${className}`}
    >
      <circle cx="12" cy="12" r="12" fill="#1D9BF0" />
      <path
        d="M6.5 12.5l3.5 3.5 7.5-8"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
