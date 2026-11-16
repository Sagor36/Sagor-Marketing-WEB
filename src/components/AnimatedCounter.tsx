import { useEffect, useRef, useState } from 'react';

interface AnimatedCounterProps {
  value: number;
  durationMs?: number;
  className?: string;
}

export function AnimatedCounter({
  value,
  durationMs = 550,
  className = '',
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const previousRef = useRef(value);

  useEffect(() => {
    const startValue = previousRef.current;
    const delta = value - startValue;
    if (delta === 0) {
      setDisplayValue(value);
      return;
    }

    const startTime = performance.now();
    let rafId = 0;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const ratio = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - ratio, 3);
      setDisplayValue(Math.round(startValue + delta * eased));
      if (ratio < 1) {
        rafId = requestAnimationFrame(animate);
      } else {
        previousRef.current = value;
      }
    };

    rafId = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(rafId);
      previousRef.current = value;
    };
  }, [value, durationMs]);

  return (
    <span className={`tabular-nums ${className}`}>
      {displayValue.toLocaleString()}
    </span>
  );
}
