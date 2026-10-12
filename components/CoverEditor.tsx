"use client";

import { useMemo, useState } from "react";
import type { BlogPost, CoverElement, CoverLayout } from "@/types/post";
import {
  coverLabels,
  defaultCoverLayout,
  normalizeCoverLayout,
} from "@/lib/cover";
import { paperForPost } from "@/lib/book";
import CoverCanvas from "@/components/CoverCanvas";
import ImageField from "@/components/ImageField";
import ImageUploadButton from "@/components/ImageUploadButton";

export default function CoverEditor({
  post,
  onChange,
  canUpload,
  onBusyChange,
  disabled,
}: {
  post: BlogPost;
  onChange: (layout: CoverLayout) => void;
  canUpload: boolean;
  onBusyChange: (busy: boolean) => void;
  disabled: boolean;
}) {
  const saved = useMemo(
    () => normalizeCoverLayout(post.coverLayout, true) || defaultCoverLayout(),
    [post.coverLayout],
  );
  const [draft, setDraft] = useState<CoverLayout>();
  const [selected, setSelected] = useState("text-title");
  const [past, setPast] = useState<CoverLayout[]>([]);
  const [future, setFuture] = useState<CoverLayout[]>([]);
  const [busy, setBusy] = useState(false);
  const layout = draft || saved;
  const item = layout.elements.find((e) => e.id === selected);
  const imageCount = layout.elements.filter((e) => e.kind === "image").length;
  function commit(value: CoverLayout) {
    const next = normalizeCoverLayout(value, true)!;
    setDraft(undefined);
    if (JSON.stringify(next) === JSON.stringify(saved)) return;
    setPast((history) => [...history.slice(-29), saved]);
    setFuture([]);
    onChange(next);
  }
  function patch(change: Partial<CoverElement>) {
    commit({
      ...layout,
      elements: layout.elements.map((e) =>
        e.id === selected ? ({ ...e, ...change } as CoverElement) : e,
      ),
    });
  }
  function reorder(forward: boolean) {
    const elements = [...layout.elements];
    const index = elements.findIndex((e) => e.id === selected);
    const to = Math.max(
      0,
      Math.min(elements.length - 1, index + (forward ? 1 : -1)),
    );
    [elements[index], elements[to]] = [elements[to], elements[index]];
    commit({ ...layout, elements });
  }
  function addImage(src = "") {
    if (imageCount >= 6) return;
    const id = `image-${crypto.randomUUID()}`;
    commit({
      ...layout,
      elements: [
        {
          id,
          kind: "image",
          src,
          alt: "",
          fit: "cover",
          x: 15,
          y: 6,
          width: 70,
          height: 20,
          hidden: false,
        },
        ...layout.elements,
      ],
    });
    setSelected(id);
  }
  return (
    <section className="cover-editor" aria-label="표지 꾸미기">
      <header className="cover-editor-heading">
        <div>
          <h2>표지 꾸미기</h2>
          <p>항목을 끌어 옮기고, 모서리를 잡아 크기를 바꿔보세요.</p>
        </div>
        <div className="cover-history">
          <button
            type="button"
            className="text-button"
            disabled={disabled || busy || !past.length}
            onClick={() => {
              setFuture((history) => [...history, saved]);
              onChange(past[past.length - 1]);
              setPast(past.slice(0, -1));
              setDraft(undefined);
            }}
          >
            실행 취소
          </button>
          <button
            type="button"
            className="text-button"
            disabled={disabled || busy || !future.length}
            onClick={() => {
              setPast((history) => [...history, saved]);
              onChange(future[future.length - 1]);
              setFuture(future.slice(0, -1));
              setDraft(undefined);
            }}
          >
            다시 실행
          </button>
          <button
            type="button"
            className="text-button"
            disabled={disabled || busy}
            onClick={() => commit(defaultCoverLayout())}
          >
            기본 배치
          </button>
        </div>
      </header>
      <div className="cover-photo-actions">
        {canUpload && (
          <ImageUploadButton
            disabled={disabled || busy || imageCount >= 6}
            onUploaded={addImage}
            onBusyChange={(value) => {
              setBusy(value);
              onBusyChange(value);
            }}
          />
        )}
        <button
          type="button"
          className="secondary-button"
          disabled={disabled || busy || imageCount >= 6}
          onClick={() => addImage()}
        >
          이미지 주소로 추가
        </button>
        <span>사진 {imageCount}/6 · 넣은 뒤 드래그로 옮겨보세요.</span>
      </div>
      <div className="cover-workspace">
        <div>
          <div className={`cover-editor-sheet paper-${paperForPost(post)}`}>
            <CoverCanvas
              post={post}
              layout={layout}
              selected={selected}
              onSelect={setSelected}
              disabled={disabled || busy}
              onChange={(next, finished) =>
                finished ? commit(next) : setDraft(next)
              }
            />
          </div>
          <p className="cover-canvas-help">
            방향키로도 이동할 수 있어요. Shift를 누르면 더 크게 이동합니다.
          </p>
        </div>
        <fieldset
          className="cover-inspector editor-fieldset"
          disabled={disabled || busy}
        >
          <label className="cover-control">
            <span>편집할 항목</span>
            <select
              value={item?.id || ""}
              onChange={(event) => setSelected(event.target.value)}
            >
              {!item && (
                <option value="" disabled>
                  항목을 선택하세요
                </option>
              )}
              {layout.elements.map((element, i) => (
                <option key={element.id} value={element.id}>
                  {element.kind === "text"
                    ? coverLabels[element.field]
                    : `이미지 ${layout.elements.slice(0, i + 1).filter((e) => e.kind === "image").length}`}
                  {element.hidden ? " (숨김)" : ""}
                </option>
              ))}
            </select>
          </label>
          {item && (
            <>
              <label className="cover-visibility">
                <input
                  type="checkbox"
                  checked={!item.hidden}
                  onChange={(event) => patch({ hidden: !event.target.checked })}
                />
                표지에 표시
              </label>
              <div className="cover-measurements">
                {(
                  [
                    ["x", "가로 위치", 0, 100 - item.width],
                    ["y", "세로 위치", 0, 100 - item.height],
                    ["width", "영역 너비", 8, 100 - item.x],
                    ["height", "영역 높이", 3, 100 - item.y],
                  ] as const
                ).map(([key, label, min, max]) => (
                  <label className="cover-control" key={key}>
                    <span>{label} (%)</span>
                    <input
                      type="number"
                      min={min}
                      max={max}
                      step="0.1"
                      value={item[key]}
                      onChange={(event) =>
                        patch({ [key]: Number(event.target.value) })
                      }
                    />
                  </label>
                ))}
              </div>
              {item.kind === "text" ? (
                <>
                  <label className="cover-control">
                    <span>글자 크기</span>
                    <input
                      type="range"
                      min="12"
                      max="96"
                      value={item.fontSize}
                      onChange={(event) =>
                        patch({ fontSize: Number(event.target.value) })
                      }
                    />
                    <output>{item.fontSize}</output>
                  </label>
                  <label className="cover-control">
                    <span>표지 서체</span>
                    <select
                      value={item.font}
                      onChange={(event) =>
                        patch({ font: event.target.value as "serif" | "sans" })
                      }
                    >
                      <option value="serif">고운바탕</option>
                      <option value="sans">고딕</option>
                    </select>
                  </label>
                  <label className="cover-control">
                    <span>표지 정렬</span>
                    <select
                      value={item.align}
                      onChange={(event) =>
                        patch({
                          align: event.target.value as
                            | "left"
                            | "center"
                            | "right",
                        })
                      }
                    >
                      <option value="left">왼쪽</option>
                      <option value="center">가운데</option>
                      <option value="right">오른쪽</option>
                    </select>
                  </label>
                  <p className="cover-control-note">
                    글 내용은 위의 글 정보에서 바꿀 수 있어요. 글자가 넘치면
                    영역 안에 맞춰 작아집니다.
                  </p>
                </>
              ) : (
                <>
                  <ImageField
                    key={item.id}
                    label="표지 이미지"
                    value={item.src}
                    canUpload={canUpload}
                    showPreview={false}
                    onBusyChange={(value) => {
                      setBusy(value);
                      onBusyChange(value);
                    }}
                    onChange={(src) => patch({ src })}
                  />
                  <label className="cover-control">
                    <span>표지 이미지 설명</span>
                    <input
                      maxLength={180}
                      value={item.alt}
                      onChange={(event) => patch({ alt: event.target.value })}
                    />
                  </label>
                  <label className="cover-control">
                    <span>이미지 맞춤</span>
                    <select
                      value={item.fit}
                      onChange={(event) =>
                        patch({
                          fit: event.target.value as "cover" | "contain",
                        })
                      }
                    >
                      <option value="cover">영역 채우기</option>
                      <option value="contain">사진 전체 보기</option>
                    </select>
                  </label>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => {
                      commit({
                        ...layout,
                        elements: layout.elements.filter(
                          (e) => e.id !== item.id,
                        ),
                      });
                      setSelected("text-title");
                    }}
                  >
                    이미지 삭제
                  </button>
                </>
              )}
              <div className="cover-order">
                <button
                  type="button"
                  className="text-button"
                  disabled={layout.elements[0].id === item.id}
                  onClick={() => reorder(false)}
                >
                  뒤로 보내기
                </button>
                <button
                  type="button"
                  className="text-button"
                  disabled={
                    layout.elements[layout.elements.length - 1].id === item.id
                  }
                  onClick={() => reorder(true)}
                >
                  앞으로 가져오기
                </button>
              </div>
            </>
          )}
        </fieldset>
      </div>
    </section>
  );
}
