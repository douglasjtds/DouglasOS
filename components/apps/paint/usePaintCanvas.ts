import { useCallback, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import {
  canRedo,
  canUndo,
  createHistory,
  pushHistory,
  redoHistory,
  undoHistory,
  type History,
} from "@/lib/paint/history";
import { PAINT_FILL_TOLERANCE, floodFill } from "@/lib/paint/floodFill";
import {
  CANVAS_BACKGROUND,
  fitCanvasSize,
  hexToRgba,
  linePoints,
  paintFileName,
  rectFromPoints,
  strokeWidth,
  toCanvasPoint,
  type PaintSize,
  type PaintTool,
  type Point,
} from "@/lib/paint/tools";
import { downloadFile } from "@/lib/download";

interface Size {
  width: number;
  height: number;
}

/** The stroke in progress: one pointer at a time (a second finger is ignored). */
interface Stroke {
  pointerId: number;
  start: Point;
  last: Point;
}

/** Workspace padding around the canvas (px), kept out of the fitted size. */
const WORKSPACE_PADDING = 8;

const isShape = (tool: PaintTool) => tool === "line" || tool === "rectangle";

/**
 * The DouglasOS Paint canvas engine: a bitmap canvas plus a transparent
 * overlay on top for line/rectangle previews and pointer input (mouse, pen
 * and touch through Pointer Events). Every finished edit (stroke, shape, fill,
 * New) pushes an `ImageData` snapshot to a bounded history
 * (`lib/paint/history.ts`), so undo/redo just put a snapshot back.
 *
 * The canvas bitmap is sized once to the space available (and again on New),
 * like the classic program: resizing the window doesn't stretch the drawing.
 */
export function usePaintCanvas({ tool, color, size }: { tool: PaintTool; color: string; size: PaintSize }) {
  const workspaceNode = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const historyRef = useRef<History<ImageData> | null>(null);
  const strokeRef = useRef<Stroke | null>(null);
  const [dimensions, setDimensions] = useState<Size | null>(null);
  const [available, setAvailable] = useState({ undo: false, redo: false });

  const context = () => canvasRef.current?.getContext("2d", { willReadFrequently: true }) ?? null;
  const overlayContext = () => overlayRef.current?.getContext("2d") ?? null;

  const setHistory = (history: History<ImageData>) => {
    historyRef.current = history;
    setAvailable({ undo: canUndo(history), redo: canRedo(history) });
  };

  const resize = (next: Size) => {
    for (const c of [canvasRef.current, overlayRef.current]) {
      if (!c) continue;
      if (c.width !== next.width) c.width = next.width;
      if (c.height !== next.height) c.height = next.height;
    }
    setDimensions((prev) =>
      prev && prev.width === next.width && prev.height === next.height ? prev : next,
    );
  };

  /** Fresh white canvas fitted to the workspace; returns its snapshot. */
  const blank = (): ImageData | null => {
    const workspace = workspaceNode.current;
    if (!workspace) return null;
    const next = fitCanvasSize({
      width: workspace.clientWidth - WORKSPACE_PADDING * 2,
      height: workspace.clientHeight - WORKSPACE_PADDING * 2,
    });
    resize(next);
    const g = context();
    if (!g) return null;
    g.fillStyle = CANVAS_BACKGROUND;
    g.fillRect(0, 0, next.width, next.height);
    return g.getImageData(0, 0, next.width, next.height);
  };

  const restore = (snapshot: ImageData) => {
    resize({ width: snapshot.width, height: snapshot.height });
    context()?.putImageData(snapshot, 0, 0);
  };

  const commit = () => {
    const g = context();
    const canvas = canvasRef.current;
    const history = historyRef.current;
    if (!g || !canvas || !history) return;
    setHistory(pushHistory(history, g.getImageData(0, 0, canvas.width, canvas.height)));
  };

  const clearOverlay = () => {
    const o = overlayRef.current;
    overlayContext()?.clearRect(0, 0, o?.width ?? 0, o?.height ?? 0);
  };

  /**
   * Workspace ref callback: when it attaches (commit phase, after the canvases
   * inside it), size and blank the canvas before the first paint, so it never
   * flashes at the default 300 × 150. Later sizing happens only on New.
   */
  const workspaceRef = useCallback((node: HTMLDivElement | null) => {
    workspaceNode.current = node;
    if (!node || historyRef.current) return;
    const snapshot = blank();
    if (snapshot) setHistory(createHistory(snapshot));
    // Refs and stable setters only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const point = (e: { clientX: number; clientY: number }): Point => {
    const o = overlayRef.current!;
    return toCanvasPoint({ x: e.clientX, y: e.clientY }, o.getBoundingClientRect(), o);
  };

  /** Freehand segment a → b on the bitmap (pencil, brush, eraser). */
  const drawSegment = (g: CanvasRenderingContext2D, a: Point, b: Point) => {
    if (tool === "pencil") {
      // Crisp single pixels, no anti-aliasing.
      g.fillStyle = color;
      for (const p of linePoints(a, b)) g.fillRect(p.x, p.y, 1, 1);
      return;
    }
    const eraser = tool === "eraser";
    const width = strokeWidth(tool, size);
    if (a.x === b.x && a.y === b.y) {
      // A tap / single click: WebKit doesn't draw caps on zero-length
      // strokes, so stamp the dot ourselves (round brush, square eraser).
      g.fillStyle = eraser ? CANVAS_BACKGROUND : color;
      if (eraser) {
        g.fillRect(Math.round(a.x + 0.5 - width / 2), Math.round(a.y + 0.5 - width / 2), width, width);
      } else {
        g.beginPath();
        g.arc(a.x + 0.5, a.y + 0.5, width / 2, 0, Math.PI * 2);
        g.fill();
      }
      return;
    }
    g.strokeStyle = eraser ? CANVAS_BACKGROUND : color;
    g.lineWidth = width;
    g.lineCap = eraser ? "square" : "round";
    g.lineJoin = eraser ? "miter" : "round";
    g.beginPath();
    g.moveTo(a.x + 0.5, a.y + 0.5);
    g.lineTo(b.x + 0.5, b.y + 0.5);
    g.stroke();
  };

  /** Line or rectangle from a to b (preview on the overlay, final on the bitmap). */
  const drawShape = (g: CanvasRenderingContext2D, a: Point, b: Point) => {
    const width = strokeWidth(tool, size);
    g.strokeStyle = color;
    g.lineWidth = width;
    if (tool === "line") {
      g.lineCap = "round";
      g.beginPath();
      g.moveTo(a.x + 0.5, a.y + 0.5);
      g.lineTo(b.x + 0.5, b.y + 0.5);
      g.stroke();
    } else {
      const r = rectFromPoints(a, b);
      const offset = width % 2 === 1 ? 0.5 : 0;
      g.lineJoin = "miter";
      g.strokeRect(r.x + offset, r.y + offset, r.width, r.height);
    }
  };

  const onPointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    if (strokeRef.current) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const g = context();
    const canvas = canvasRef.current;
    if (!g || !canvas) return;
    e.preventDefault();
    // preventDefault stops the browser moving focus; take it ourselves so the
    // app's keys (Esc cancels, Ctrl+Z undoes) see the next key press.
    e.currentTarget.focus({ preventScroll: true });
    const p = point(e);

    if (tool === "fill") {
      const image = g.getImageData(0, 0, canvas.width, canvas.height);
      const painted = floodFill(
        { data: image.data, width: image.width, height: image.height },
        p.x,
        p.y,
        hexToRgba(color),
        PAINT_FILL_TOLERANCE,
      );
      if (painted > 0) {
        g.putImageData(image, 0, 0);
        commit();
      }
      return;
    }

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Synthetic events (tests) have no active pointer to capture.
    }
    strokeRef.current = { pointerId: e.pointerId, start: p, last: p };
    if (!isShape(tool)) drawSegment(g, p, p);
  };

  const onPointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    const stroke = strokeRef.current;
    if (!stroke || e.pointerId !== stroke.pointerId) return;
    // Coalesced events keep fast strokes smooth on high-rate pointers.
    const events = e.nativeEvent.getCoalescedEvents?.() ?? [];
    const samples = events.length > 0 ? events : [e.nativeEvent];
    if (isShape(tool)) {
      stroke.last = point(samples[samples.length - 1]);
      const o = overlayContext();
      if (!o) return;
      clearOverlay();
      drawShape(o, stroke.start, stroke.last);
      return;
    }
    const g = context();
    if (!g) return;
    for (const sample of samples) {
      const p = point(sample);
      drawSegment(g, stroke.last, p);
      stroke.last = p;
    }
  };

  const onPointerUp = (e: PointerEvent<HTMLCanvasElement>) => {
    const stroke = strokeRef.current;
    if (!stroke || e.pointerId !== stroke.pointerId) return;
    strokeRef.current = null;
    if (isShape(tool)) {
      clearOverlay();
      const g = context();
      if (g) drawShape(g, stroke.start, point(e));
    }
    commit();
  };

  /** Abandon the stroke in progress (pointer cancelled, Esc): back to the last state. */
  const cancelStroke = () => {
    if (!strokeRef.current) return false;
    strokeRef.current = null;
    clearOverlay();
    if (historyRef.current) restore(historyRef.current.present);
    return true;
  };

  const undo = useCallback(() => {
    cancelStroke();
    const history = historyRef.current;
    if (!history || !canUndo(history)) return;
    const next = undoHistory(history);
    restore(next.present);
    setHistory(next);
    // Refs and stable setters only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const redo = useCallback(() => {
    cancelStroke();
    const history = historyRef.current;
    if (!history || !canRedo(history)) return;
    const next = redoHistory(history);
    restore(next.present);
    setHistory(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** File → New: a fresh canvas fitted to the window. Undoable, so no confirm. */
  const newCanvas = () => {
    cancelStroke();
    const snapshot = blank();
    const history = historyRef.current;
    if (snapshot && history) setHistory(pushHistory(history, snapshot));
  };

  /** File → Save as PNG: downloads `douglasos-paint-<timestamp>.png`. Never uploaded. */
  const save = () => {
    canvasRef.current?.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      downloadFile(url, paintFileName());
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
  };

  /** Esc while drawing cancels the stroke instead of closing the window. */
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && cancelStroke()) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return {
    workspaceRef,
    canvasRef,
    overlayRef,
    dimensions,
    canUndo: available.undo,
    canRedo: available.redo,
    undo,
    redo,
    newCanvas,
    save,
    onKeyDown,
    surfaceHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: () => cancelStroke(),
    },
  };
}
