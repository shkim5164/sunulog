"use client";

import {
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type PointerEvent,
  type KeyboardEvent,
} from "react";
import type {
  BlogPost,
  CoverElement,
  CoverLayout,
  CoverTextElement,
} from "@/types/post";
import { coverLabels, coverText, normalizeCoverLayout } from "@/lib/cover";
import Photo from "@/components/Photo";

function FittedText({
  element,
  text,
  titleLevel,
}: {
  element: CoverTextElement;
  text: string;
  titleLevel?: "h1" | "h2";
}) {
  const box = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const frame = box.current;
    const label = content.current;
    if (!frame || !label) return;
    let alive = true;
    const fit = () => {
      if (!alive) return;
      const width = frame.closest(".cover-canvas")?.clientWidth || 600;
      const requested = Math.max(12, (element.fontSize * width) / 600);
      let low = 1,
        high = requested;
      label.style.fontSize = `${requested}px`;
      const overflows = () =>
        label.scrollHeight > frame.clientHeight + 1 ||
        label.scrollWidth > frame.clientWidth + 1;
      if (overflows()) {
        for (let i = 0; i < 9; i++) {
          const middle = (low + high) / 2;
          label.style.fontSize = `${middle}px`;
          if (overflows()) high = middle;
          else low = middle;
        }
        label.style.fontSize = `${low}px`;
      }
    };
    const observer = new ResizeObserver(fit);
    observer.observe(frame);
    fit();
    void document.fonts.ready.then(fit);
    return () => {
      alive = false;
      observer.disconnect();
    };
  }, [element.fontSize, element.font, element.width, element.height, text]);
  const Tag = element.field === "title" && titleLevel ? titleLevel : "div";
  return (
    <div ref={box} className="cover-text-frame">
      <div
        ref={content}
        className={`cover-text font-${element.font}`}
        style={{
          fontSize: `${element.fontSize / 6}cqw`,
          textAlign: element.align,
        }}
      >
        <Tag>{text}</Tag>
      </div>
    </div>
  );
}

export default function CoverCanvas({
  post,
  layout,
  selected,
  onSelect,
  onChange,
  titleLevel,
  disabled = false,
}: {
  post: BlogPost;
  layout: CoverLayout;
  selected?: string;
  onSelect?: (id: string) => void;
  onChange?: (layout: CoverLayout, commit: boolean) => void;
  titleLevel?: "h1" | "h2";
  disabled?: boolean;
}) {
  const canvas = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    base: CoverLayout;
    next: CoverLayout;
    item: CoverElement;
    x: number;
    y: number;
    width: number;
    height: number;
    resize: boolean;
    pointerId: number;
  }>();
  const editing = Boolean(onChange) && !disabled;
  const selection = layout.elements.find((e) => e.id === selected && !e.hidden);
  function changed(
    base: CoverLayout,
    id: string,
    patch: Partial<CoverElement>,
  ) {
    return normalizeCoverLayout(
      {
        ...base,
        elements: base.elements.map((e) =>
          e.id === id ? { ...e, ...patch } : e,
        ),
      },
      true,
    )!;
  }
  function begin(event: PointerEvent<HTMLDivElement>, item: CoverElement) {
    if (!editing || event.button !== 0) return;
    const rect = canvas.current!.getBoundingClientRect();
    event.preventDefault();
    event.stopPropagation();
    onSelect?.(item.id);
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      base: layout,
      next: layout,
      item,
      x: event.clientX,
      y: event.clientY,
      width: rect.width,
      height: rect.height,
      resize: Boolean((event.target as HTMLElement).closest("[data-resize]")),
      pointerId: event.pointerId,
    };
  }
  function move(event: PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d || event.pointerId !== d.pointerId) return;
    const dx = ((event.clientX - d.x) / d.width) * 100;
    const dy = ((event.clientY - d.y) / d.height) * 100;
    const patch = d.resize
      ? {
          width: Math.max(8, Math.min(100 - d.item.x, d.item.width + dx)),
          height: Math.max(3, Math.min(100 - d.item.y, d.item.height + dy)),
        }
      : { x: d.item.x + dx, y: d.item.y + dy };
    d.next = changed(d.base, d.item.id, patch);
    onChange?.(d.next, false);
  }
  function end(event: PointerEvent<HTMLDivElement>, cancel = false) {
    const d = drag.current;
    if (!d || event.pointerId !== d.pointerId) return;
    drag.current = undefined;
    onChange?.(cancel ? d.base : d.next, !cancel);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function key(event: KeyboardEvent<HTMLDivElement>, item: CoverElement) {
    if (!editing) return;
    if (event.key === "Escape" && drag.current) {
      event.preventDefault();
      event.stopPropagation();
      onChange?.(drag.current.base, false);
      drag.current = undefined;
      return;
    }
    const directions: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    const delta = directions[event.key];
    if (!delta) return;
    event.preventDefault();
    event.stopPropagation();
    const step = event.shiftKey ? 5 : 1;
    const resizing = Boolean(
      (event.target as HTMLElement).closest("[data-resize]"),
    );
    const patch = resizing
      ? {
          width: Math.min(100 - item.x, item.width + delta[0] * step),
          height: Math.min(100 - item.y, item.height + delta[1] * step),
        }
      : { x: item.x + delta[0] * step, y: item.y + delta[1] * step };
    onChange?.(changed(layout, item.id, patch), true);
  }
  return (
    <div
      ref={canvas}
      className={`cover-canvas ${onChange ? "is-editing" : ""}`}
      aria-label={onChange ? "표지 편집 캔버스" : "표지 디자인"}
    >
      {layout.elements
        .filter((e) => !e.hidden)
        .map((item, index) => {
          const label =
            item.kind === "text"
              ? coverLabels[item.field]
              : item.alt || "이미지";
          const text =
            item.kind === "text"
              ? coverText(post, item.field, Boolean(onChange))
              : "";
          if (!onChange && (item.kind === "image" ? !item.src : !text))
            return null;
          const style: CSSProperties = {
            left: `${item.x}%`,
            top: `${item.y}%`,
            width: `${item.width}%`,
            height: `${item.height}%`,
            zIndex: index + 1,
          };
          return (
            <div
              key={item.id}
              data-cover-id={item.id}
              data-selected={
                editing && selected === item.id ? "true" : undefined
              }
              className={`cover-element cover-${item.kind} ${item.kind === "text" ? `cover-field-${item.field}` : ""}`}
              style={style}
              role={onChange ? "group" : undefined}
              tabIndex={editing ? 0 : undefined}
              aria-label={onChange ? `${label} 위치 편집` : undefined}
              aria-roledescription={
                onChange ? "이동 가능한 표지 항목" : undefined
              }
              onFocus={editing ? () => onSelect?.(item.id) : undefined}
              onPointerDown={(event) => begin(event, item)}
              onPointerMove={move}
              onPointerUp={(event) => end(event)}
              onPointerCancel={(event) => end(event, true)}
              onLostPointerCapture={(event) => end(event, true)}
              onKeyDown={(event) => key(event, item)}
            >
              {item.kind === "text" ? (
                <FittedText
                  element={item}
                  text={text}
                  titleLevel={titleLevel}
                />
              ) : item.src ? (
                <Photo
                  src={item.src}
                  alt={item.alt}
                  fit={item.fit}
                  sizes="(max-width: 767px) 85vw, 600px"
                />
              ) : (
                <span className="cover-image-placeholder">
                  이미지를 선택해주세요
                </span>
              )}
            </div>
          );
        })}
      {editing && selection && (
        <div
          className="cover-selection-layer"
          tabIndex={-1}
          style={{
            left: `${selection.x}%`,
            top: `${selection.y}%`,
            width: `${selection.width}%`,
            height: `${selection.height}%`,
            zIndex: layout.elements.length + 1,
          }}
          onPointerDown={(event) => begin(event, selection)}
          onPointerMove={move}
          onPointerUp={(event) => end(event)}
          onPointerCancel={(event) => end(event, true)}
          onLostPointerCapture={(event) => end(event, true)}
          onKeyDown={(event) => key(event, selection)}
        >
          <button
            type="button"
            className="cover-resize-handle"
            data-resize
            aria-label={`${selection.kind === "text" ? coverLabels[selection.field] : selection.alt || "이미지"} 크기 조절`}
          />
        </div>
      )}
    </div>
  );
}
