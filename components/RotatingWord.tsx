"use client";

import { useEffect, useState } from "react";

/** Cycles through words with a flip animation. */
export function RotatingWord({ words, className = "" }: { words: string[]; className?: string }) {
  const [i, setI] = useState(0);
  const [anim, setAnim] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setAnim(false);
      setTimeout(() => {
        setI((v) => (v + 1) % words.length);
        setAnim(true);
      }, 180);
    }, 2600);
    return () => clearInterval(id);
  }, [words.length]);

  return (
    <span
      className={`inline-block transition-all duration-200 ${className} ${
        anim ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      }`}
    >
      {words[i]}
    </span>
  );
}
