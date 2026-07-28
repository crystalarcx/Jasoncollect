import React from 'react';
import { cn } from '../lib/utils';

interface PokeballProps extends React.ComponentProps<"svg"> {
  active?: boolean;
  className?: string;
}

export function Pokeball({ active = false, className, ...props }: PokeballProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn(
        "transition-colors duration-200",
        active ? "text-red-500 opacity-100" : "text-gray-300 opacity-40",
        className
      )}
      {...props}
    >
      {/* Outer circle */}
      <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="5" fill="white" />
      {/* Top half red */}
      <path d="M 5 50 A 45 45 0 0 1 95 50 Z" fill="currentColor" />
      {/* Center line */}
      <line x1="5" y1="50" x2="95" y2="50" stroke="currentColor" strokeWidth="5" />
      {/* Center button */}
      <circle cx="50" cy="50" r="15" stroke="currentColor" strokeWidth="5" fill="white" />
      <circle cx="50" cy="50" r="8" fill="currentColor" />
    </svg>
  );
}
