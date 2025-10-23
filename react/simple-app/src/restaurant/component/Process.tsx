import { useState, useEffect, useRef } from 'react';

interface ProcessProps {
  value: number;
  duration?: number;
  format?: (value: number) => string;
  className?: string;
}

export default function Process({
  value,
  duration = 800,
  format = val => val.toString(),
  className = '',
}: ProcessProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const prevValue = prevValueRef.current;

    if (prevValue === value) return;

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const startTime = performance.now();
    const startValue = prevValue;
    const endValue = value;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.floor(
        startValue + (endValue - startValue) * easeOut,
      );

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        prevValueRef.current = value;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]);

  return <span className={className}>{format(displayValue)}</span>;
}
