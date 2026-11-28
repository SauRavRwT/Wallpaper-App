import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { IoSearch, IoClose, IoDownload } from "react-icons/io5";
import "./FisheyeInfiniteGrid.css";

const wrap = (value, size) => ((value % size) + size) % size;
const clamp = (value, lo, hi) => Math.min(hi, Math.max(lo, value));

/**
 * Radial lens. Maps distance from viewport centre (r) to a displaced distance (r')
 * and a tile scale (s):
 *   s(r)  = 1 + L * (1 - 2r/D)
 *   r'(r) = r + L * (r - r^2 / D)
 */
const applyLens = (r, D, L) => {
  if (r >= D) return [D + (1 - L) * (r - D), 1 - L];
  return [r + L * (r - (r * r) / D), 1 + L * (1 - (2 * r) / D)];
};

export default function FisheyeInfiniteGrid({
  items = [],
  onSearch,
  onLoadMore, // called when the viewer is about to run out of unseen photos
  searchStatus = "idle",
  tileWidth = 238,
  tileHeight = 272,
  gap = 8,
  lensStrength = 0.24,
  theme = "system", // "system" | "dark" | "light"
  hoverNudge = 16,
  inertia = 0.94,
  wheelSensitivity = 0.42,
  className = "",
}) {
  const rootRef = useRef(null);
  const tileRefs = useRef([]);
  const nodeItemsRef = useRef([]); // item currently shown by each pooled tile
  const cellColRef = useRef([]); // absolute grid cell each pooled tile represents
  const cellRowRef = useRef([]);
  const cellMapRef = useRef(new Map()); // "col,row" -> photo number (never repeats until photos run out)
  const nextPhotoRef = useRef(0);
  const requestedLenRef = useRef(-1);
  const itemsRef = useRef(items);
  const prevItemsRef = useRef([]);
  const onLoadMoreRef = useRef(onLoadMore);
  const sizeRef = useRef({ w: 0, h: 0 });
  const positionRef = useRef({
    x: (tileWidth + gap) / 2,
    y: (tileHeight + gap) / 2,
  });
  const velocityRef = useRef({ x: 0, y: 0 });
  const nudgeRef = useRef({ value: 0, target: 0 });
  const dragRef = useRef(null);
  const suppressClickRef = useRef(false);
  const frameRef = useRef(null);
  const lastTimeRef = useRef(0);
  const centerIndexRef = useRef(0);
  const searchedRef = useRef(false);

  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(null);
  const [dims, setDims] = useState({ cols: 8, rows: 6 });

  itemsRef.current = items;
  onLoadMoreRef.current = onLoadMore;
  const settings = useRef({});
  settings.current = {
    tileWidth,
    tileHeight,
    gap,
    lensStrength,
    hoverNudge,
    inertia,
    wheelSensitivity,
  };
  const dimsRef = useRef(dims);
  dimsRef.current = dims;

  // A pool of tiles that get recycled as you pan. Content is assigned imperatively.
  const pool = useMemo(
    () => Array.from({ length: dims.cols * dims.rows }, (_, index) => index),
    [dims],
  );

  const fillTile = (node, item) => {
    const img = node.querySelector("img");
    const labels = node.querySelectorAll(".fig-tile-chrome span");
    img.src = item.image;
    img.alt = item.alt || `Photo by ${item.title || "Pexels"}`;
    node.style.setProperty("--tile-color", item.avg_color || "transparent");
    node.setAttribute("aria-label", `View photo by ${item.title || "Pexels"}`);
    labels[0].textContent = item.alt ? item.alt.slice(0, 18) : item.title || "";
    labels[1].textContent = String(item.id).slice(-2).padStart(2, "0");
  };

  const paint = useCallback(() => {
    const { w, h } = sizeRef.current;
    if (!w || !h) return;
    const { cols, rows } = dimsRef.current;
    const s = settings.current;
    const list = itemsRef.current;
    const count = list.length;
    const nodes = tileRefs.current;

    if (!count) {
      nodes.forEach((node) => node && (node.style.visibility = "hidden"));
      return;
    }

    const cw = s.tileWidth + s.gap;
    const ch = s.tileHeight + s.gap;
    const totalW = cols * cw;
    const totalH = rows * ch;
    const L = clamp(s.lensStrength, 0, 0.6);
    const D = Math.hypot(w, h) / 2;
    const posX = positionRef.current.x + nudgeRef.current.value;
    const posY = positionRef.current.y + nudgeRef.current.value * 0.6;
    const cellCol = cellColRef.current;
    const cellRow = cellRowRef.current;
    const nodeItems = nodeItemsRef.current;
    const cellMap = cellMapRef.current;

    let nearest = Infinity;
    let nearestIndex = 0;

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const index = row * cols + col;
        const node = nodes[index];
        if (!node) continue;

        const dx =
          wrap(col * cw + cw / 2 - posX + totalW / 2, totalW) - totalW / 2;
        const dy =
          wrap(row * ch + ch / 2 - posY + totalH / 2, totalH) - totalH / 2;

        // Which cell of the infinite plane does this pooled tile show right now?
        const absCol = Math.round((posX + dx - cw / 2) / cw);
        const absRow = Math.round((posY + dy - ch / 2) / ch);
        if (cellCol[index] !== absCol || cellRow[index] !== absRow) {
          cellCol[index] = absCol;
          cellRow[index] = absRow;
          const key = `${absCol},${absRow}`;
          let photoNo = cellMap.get(key);
          if (photoNo === undefined) {
            photoNo = nextPhotoRef.current;
            nextPhotoRef.current += 1;
            cellMap.set(key, photoNo);
          }
          const item = list[photoNo % count];
          if (nodeItems[index]?.id !== item.id) fillTile(node, item);
          nodeItems[index] = item;
          node.style.visibility = "visible";
        }

        const r = Math.hypot(dx, dy);
        const [rr, scale] = applyLens(r, D, L);
        const k = r > 0.001 ? rr / r : 1 + L;
        const x = w / 2 + dx * k - s.tileWidth / 2;
        const y = h / 2 + dy * k - s.tileHeight / 2;
        node.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${Math.max(scale, 0.35).toFixed(4)})`;
        node.style.zIndex = Math.round(scale * 100);

        if (r < nearest) {
          nearest = r;
          nearestIndex = index;
        }
      }
    }
    centerIndexRef.current = nearestIndex;

    // Ask for more photos before the unseen ones run out (once per loaded batch).
    if (
      onLoadMoreRef.current &&
      nextPhotoRef.current + cols * rows > count &&
      requestedLenRef.current !== count
    ) {
      requestedLenRef.current = count;
      onLoadMoreRef.current();
    }
  }, []);

  const frame = useCallback(
    (now) => {
      frameRef.current = null;
      const dt = clamp(now - (lastTimeRef.current || now), 1, 50);
      lastTimeRef.current = now;
      const k = dt / 16.667;
      const friction = clamp(settings.current.inertia, 0, 0.98);
      let active = false;

      if (!dragRef.current?.moved) {
        const v = velocityRef.current;
        if (Math.abs(v.x) > 0.05 || Math.abs(v.y) > 0.05) {
          positionRef.current.x += v.x * k;
          positionRef.current.y += v.y * k;
          const decay = Math.pow(friction, k);
          v.x *= decay;
          v.y *= decay;
          active = true;
        } else {
          v.x = 0;
          v.y = 0;
        }
      }

      const nudge = nudgeRef.current;
      const diff = nudge.target - nudge.value;
      if (Math.abs(diff) > 0.05) {
        nudge.value += diff * (1 - Math.pow(0.85, k));
        active = true;
      } else {
        nudge.value = nudge.target;
      }

      paint();

      if (active) frameRef.current = requestAnimationFrame(frame);
      else lastTimeRef.current = 0;
    },
    [paint],
  );

  const requestFrame = useCallback(() => {
    if (!frameRef.current) frameRef.current = requestAnimationFrame(frame);
  }, [frame]);

  // Size the tile pool to the container, with ~1.5 tiles of off-screen margin per side
  // so new photos start loading before they slide into view.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const measure = () => {
      const rect = root.getBoundingClientRect();
      sizeRef.current = { w: rect.width, h: rect.height };
      const cols = Math.max(5, Math.ceil(rect.width / (tileWidth + gap)) + 3);
      const rows = Math.max(4, Math.ceil(rect.height / (tileHeight + gap)) + 3);
      setDims((prev) =>
        prev.cols === cols && prev.rows === rows ? prev : { cols, rows },
      );
      requestFrame();
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, [tileWidth, tileHeight, gap, requestFrame]);

  // New search -> start the infinite plane over. More pages appended -> keep every cell's photo.
  useLayoutEffect(() => {
    const prev = prevItemsRef.current;
    const restarted =
      !prev.length ||
      !items.length ||
      prev[0].id !== items[0].id ||
      items.length < prev.length;
    if (restarted) {
      cellMapRef.current.clear();
      nextPhotoRef.current = 0;
      nodeItemsRef.current = [];
      requestedLenRef.current = -1;
    }
    cellColRef.current = [];
    cellRowRef.current = [];
    prevItemsRef.current = items;
    paint();
  }, [items, paint]);

  useLayoutEffect(() => {
    tileRefs.current.length = pool.length;
    cellColRef.current = [];
    cellRowRef.current = [];
    paint();
  }, [pool, paint]);

  useEffect(
    () => () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    },
    [],
  );

  useEffect(() => {
    if (!onSearch) return undefined;
    if (query === "" && !searchedRef.current) return undefined;
    const timer = setTimeout(() => {
      searchedRef.current = true;
      onSearch(query);
    }, 350);
    return () => clearTimeout(timer);
  }, [query, onSearch]);

  const onPointerDown = (event) => {
    if (
      (event.pointerType === "mouse" && event.button !== 0) ||
      event.target.closest(".fig-search")
    )
      return;
    event.preventDefault();
    dragRef.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      startX: event.clientX,
      startY: event.clientY,
      t: event.timeStamp,
      moved: false,
    };
    velocityRef.current = { x: 0, y: 0 };
    event.currentTarget.classList.add("is-dragging");
    try {
      const captureTarget =
        event.target.closest(".fig-tile") || event.currentTarget;
      captureTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture can be unavailable for a synthetic pointer event.
    }
  };

  const onPointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;

    if (!drag.moved) {
      const travelled = Math.hypot(
        event.clientX - drag.startX,
        event.clientY - drag.startY,
      );
      if (travelled < 2) return;
      drag.moved = true;
    }

    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    const dt = Math.max(event.timeStamp - drag.t, 1);
    drag.x = event.clientX;
    drag.y = event.clientY;
    drag.t = event.timeStamp;

    positionRef.current.x -= dx;
    positionRef.current.y -= dy;
    const v = velocityRef.current;
    v.x = v.x * 0.4 + (-dx / dt) * 16.667 * 0.6;
    v.y = v.y * 0.4 + (-dy / dt) * 16.667 * 0.6;
    paint();
    requestFrame();
  };

  const endDrag = (event) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    dragRef.current = null;
    event.currentTarget.classList.remove("is-dragging");
    if (drag.moved) {
      if (event.timeStamp - drag.t > 80) velocityRef.current = { x: 0, y: 0 };
      suppressClickRef.current = true;
      setTimeout(() => {
        suppressClickRef.current = false;
      }, 50);
    }
    requestFrame();
  };

  const onPointerEnter = (event) => {
    if (event.pointerType !== "mouse") return;
    nudgeRef.current.target = settings.current.hoverNudge;
    requestFrame();
  };

  const onPointerLeave = () => {
    nudgeRef.current.target = 0;
    requestFrame();
  };

  const onWheel = useCallback(
    (event) => {
      event.preventDefault();
      const unit = event.deltaMode === 1 ? 16 : 1;
      const sens = settings.current.wheelSensitivity;
      velocityRef.current = { x: 0, y: 0 };
      positionRef.current.x += event.deltaX * unit * sens;
      positionRef.current.y += event.deltaY * unit * sens;
      requestFrame();
    },
    [requestFrame],
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    root.addEventListener("wheel", onWheel, { passive: false });
    return () => root.removeEventListener("wheel", onWheel);
  }, [onWheel]);

  const nudgeBy = (dx, dy) => {
    const friction = clamp(settings.current.inertia, 0.5, 0.98);
    const factor = -Math.log(friction);
    velocityRef.current.x += dx * factor;
    velocityRef.current.y += dy * factor;
    requestFrame();
  };

  const openTile = (index) => {
    if (suppressClickRef.current) return;
    const item = nodeItemsRef.current[index];
    if (item) setFocused(item);
  };

  const onTilePointerUp = (event, index) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId || drag.moved) return;
    openTile(index);
    suppressClickRef.current = true;
    setTimeout(() => {
      suppressClickRef.current = false;
    }, 50);
  };

  const onKeyDown = (event) => {
    if (event.target.closest("input")) return;
    const cw = tileWidth + gap;
    const ch = tileHeight + gap;
    if (event.key === "ArrowRight") nudgeBy(cw, 0);
    else if (event.key === "ArrowLeft") nudgeBy(-cw, 0);
    else if (event.key === "ArrowDown") nudgeBy(0, ch);
    else if (event.key === "ArrowUp") nudgeBy(0, -ch);
    else if (event.key === "Enter" || event.key === " ") {
      const item = nodeItemsRef.current[centerIndexRef.current];
      if (item) {
        event.preventDefault();
        setFocused(item);
      }
    }
  };

  useEffect(() => {
    if (!focused) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") setFocused(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focused]);

  const downloadPhoto = async (item) => {
    const source = item.original || item.large2x || item.image;
    if (!source) return;
    try {
      const response = await fetch(source);
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `pexels-${item.id || "photo"}.jpg`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(source, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <>
      <section
        ref={rootRef}
        className={`fig-grid ${className}`.trim()}
        data-theme={theme === "system" ? undefined : theme}
        style={{
          "--tile-width": `${tileWidth}px`,
          "--tile-height": `${tileHeight}px`,
        }}
        tabIndex={0}
        aria-label="Infinite draggable photo grid. Use arrow keys to move and Enter to open the centred photo."
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        onDragStart={(event) => event.preventDefault()}
      >
        <div className="fig-grid-field">
          {pool.map((index) => (
            <article
              className="fig-tile"
              key={index}
              draggable={false}
              ref={(node) => {
                tileRefs.current[index] = node;
              }}
              role="button"
              tabIndex={-1}
              onClick={() => openTile(index)}
              onPointerUp={(event) => onTilePointerUp(event, index)}
            >
              <div className="fig-tile-frame">
                <img draggable={false} decoding="async" alt="" />
                <div className="fig-tile-chrome">
                  <span />
                  <span />
                </div>
              </div>
            </article>
          ))}
        </div>

        {searchStatus === "searching" && (
          <div className="fig-status" role="status">
            Searching...
          </div>
        )}
        {!items.length && searchStatus !== "searching" && (
          <div className="fig-status" role="status">
            {query ? `No photos found for "${query}"` : "No photos available"}
          </div>
        )}

        <label className="fig-search" htmlFor="fig-photo-search">
          <IoSearch aria-hidden="true" />
          <input
            id="fig-photo-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search photos"
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              <IoClose aria-hidden="true" />
            </button>
          )}
        </label>
      </section>

      {focused && (
        <div
          className="fig-focus"
          data-theme={theme === "system" ? undefined : theme}
          role="dialog"
          aria-modal="true"
          aria-label={`Photo by ${focused.title || "Pexels"}`}
          onClick={() => setFocused(null)}
        >
          <div
            className="fig-focus-card"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={focused.original || focused.image}
              alt={focused.alt || `Photo by ${focused.title || "Pexels"}`}
            />
            <div className="fig-focus-footer">
              <a href={focused.url} target="_blank" rel="noreferrer">
                Photo by <strong>{focused.title || "Pexels"}</strong>
              </a>
              <div className="fig-focus-actions">
                <button
                  type="button"
                  onClick={() => downloadPhoto(focused)}
                  aria-label="Download photo"
                >
                  <IoDownload aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setFocused(null)}
                  aria-label="Close"
                >
                  <IoClose aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
