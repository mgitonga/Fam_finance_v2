import { cn } from '@/lib/utils';

interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export function Logo({ size = 32, className, showText = true }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="40" height="40" rx="10" fill="url(#famfin-grad)" />
        {/* House silhouette */}
        <path d="M20 7L6 19h4v14h20V19h4L20 7z" fill="white" fillOpacity="0.2" />
        {/* Growth chart line */}
        <path
          d="M12 28l6-6 4 3 6-8"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Arrow head */}
        <path
          d="M24 17h4v4"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient id="famfin-grad" x1="0" y1="0" x2="40" y2="40">
            <stop stopColor="#3b82f6" />
            <stop offset="1" stopColor="#1d4ed8" />
          </linearGradient>
        </defs>
      </svg>
      {showText && <span className="text-primary text-xl font-bold">FamFin</span>}
    </div>
  );
}
