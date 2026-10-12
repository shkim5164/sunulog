"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

export default function FitBookContent({
  children,
  className,
  label,
}: {
  children: ReactNode;
  className: string;
  label: string;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const box = frame.current;
    const content = inner.current;
    if (!box || !content) return;
    let alive = true;
    const fit = () => {
      if (!alive || !box.clientHeight) return;
      content.style.setProperty("--fit-height", `${box.clientHeight}px`);
      const scale = Math.min(
        1,
        box.clientHeight / content.scrollHeight,
        box.clientWidth / content.scrollWidth,
      );
      content.style.transform = `scale(${scale})`;
    };
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    void document.fonts.ready.then(fit);
    fit();
    return () => {
      alive = false;
      observer.disconnect();
    };
  }, [children]);
  return (
    <div
      className={`${className} fit-book-content`}
      role="region"
      aria-label={label}
    >
      <div className="fit-book-viewport" ref={frame}>
        <div className="fit-book-inner" ref={inner}>
          {children}
        </div>
      </div>
    </div>
  );
}
