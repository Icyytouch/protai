"use client";

type Props = {
  children: React.ReactNode;
  /** seconds per loop */
  speed?: number;
  className?: string;
};

/** Infinite horizontal ticker. Duplicate children inside for a seamless loop. */
export function Marquee({ children, speed = 30, className = "" }: Props) {
  return (
    <div className={`overflow-hidden ${className}`}>
      <div
        className="marquee-track flex w-max items-center"
        style={{ animationDuration: `${speed}s` }}
      >
        {children}
        {children}
      </div>
    </div>
  );
}
