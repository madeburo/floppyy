"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { WindowComponentProps } from "@/lib/windows";
import { PaintToolIcon } from "./PaintToolIcon";
import { useDocumentEditor } from "@/hooks/useDocumentEditor";
import { DocumentDialogs } from "@/components/ui/DocumentDialogs";
import { downloadFile } from "@/lib/personalFiles";
import { GameMenuBar } from "@/components/games/GameChrome";

type Tool = "pencil" | "brush" | "eraser" | "fill" | "line" | "rect" | "filledRect" | "ellipse" | "filledEllipse" | "spray" | "picker" | "text" | "select";

const COLORS = [
  "#000000", "#808080", "#800000", "#808000", "#008000", "#008080", "#000080", "#800080",
  "#808040", "#004040", "#0080ff", "#004080", "#4000ff", "#804000",
  "#ffffff", "#c0c0c0", "#ff0000", "#ffff00", "#00ff00", "#00ffff", "#0000ff", "#ff00ff",
  "#ffff80", "#00ff80", "#80ffff", "#8080ff", "#ff0080", "#ff8040",
];

const TOOLS: { id: Tool; label: string }[] = [
  { id: "select", label: "Select" },
  { id: "eraser", label: "Eraser/Color Eraser" },
  { id: "picker", label: "Pick Color" },
  { id: "fill", label: "Fill With Color" },
  { id: "pencil", label: "Pencil" },
  { id: "brush", label: "Brush" },
  { id: "spray", label: "Airbrush" },
  { id: "text", label: "Text" },
  { id: "line", label: "Line" },
  { id: "rect", label: "Rectangle" },
  { id: "filledRect", label: "Filled Rectangle" },
  { id: "ellipse", label: "Ellipse" },
  { id: "filledEllipse", label: "Filled Ellipse" },
];

// Tools that show a size/width picker underneath the toolbox.
const DOT_TOOLS = new Set<Tool>(["pencil", "brush", "eraser", "spray"]);
const WIDTH_TOOLS = new Set<Tool>(["line", "rect", "filledRect", "ellipse", "filledEllipse"]);

const BRUSH_SIZES = [1, 2, 3, 5, 8];

export function PaintWindow(props: WindowComponentProps) {
  const { window: win, openWindow, closeWindow } = props;
  const editor = useDocumentEditor(props, "image");
  const { changeContent } = editor;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasAreaRef = useRef<HTMLElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>("pencil");
  const [color, setColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [brushSize, setBrushSize] = useState(2);
  const [drawing, setDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [statusText, setStatusText] = useState("Ready");
  const [coords, setCoords] = useState("");
  const undoStack = useRef<ImageData[]>([]);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const activePointer = useRef<number | null>(null);
  const initialized = useRef<number | null>(null);
  const [zoom, setZoom] = useState("fit");
  const [pan, setPan] = useState(false);
  const panOrigin = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const [imageReady, setImageReady] = useState(false);

  const commitDrawing = useCallback(() => {
    if (canvasRef.current) changeContent(canvasRef.current.toDataURL("image/png"));
  }, [changeContent]);

  const saveUndo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    undoStack.current.push(data);
    if (undoStack.current.length > 30) undoStack.current.shift();
  }, []);

  useEffect(() => {
    if (editor.loading || initialized.current === editor.generation) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let cancelled = false;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    undoStack.current = [];
    const source = editor.content || (win.payload === "clouds" && editor.generation === 0 ? "/misc/clouds-painted.png" : "");
    if (source) {
      const image = new Image();
      image.onload = () => {
        if (cancelled) return;
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        initialized.current = editor.generation;
        setImageReady(true);
      };
      image.onerror = () => { if (!cancelled) { setStatusText("Could not open this image."); setImageReady(false); } };
      image.src = source;
    } else {
      queueMicrotask(() => { if (!cancelled) { initialized.current = editor.generation; setImageReady(true); } });
    }
    return () => { cancelled = true; };
  }, [editor.content, editor.generation, editor.loading, win.payload]);

  const undo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (undoStack.current.length > 0) {
      const prev = undoStack.current.pop()!;
      ctx.putImageData(prev, 0, 0);
      commitDrawing();
    }
  }, [commitDrawing]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    saveUndo();
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    commitDrawing();
  }, [bgColor, saveUndo, commitDrawing]);

  const saveImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      downloadFile(editor.name, canvas.toDataURL("image/png"), "image");
      setStatusText(`Downloaded ${editor.name}.`);
    } catch {
      setStatusText("Could not save image.");
    }
  }, [editor.name]);

  const save = () => {
    if (!imageReady || editor.busy) return;
    if (!editor.content) { commitDrawing(); editor.setSaveAs(true); }
    else editor.save();
  };

  const getCanvasPos = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: Math.max(0, Math.min(canvas.width - 1, Math.floor((e.clientX - rect.left) * scaleX))),
      y: Math.max(0, Math.min(canvas.height - 1, Math.floor((e.clientY - rect.top) * scaleY))),
    };
  }, []);

  const drawLine = useCallback((ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, strokeColor: string, size: number) => {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }, []);

  const floodFill = useCallback((startX: number, startY: number, fillColor: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const w = canvas.width;
    const h = canvas.height;

    const idx = (startY * w + startX) * 4;
    const targetR = data[idx];
    const targetG = data[idx + 1];
    const targetB = data[idx + 2];
    const targetA = data[idx + 3];

    // Parse fill color
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = 1;
    tempCanvas.height = 1;
    const tempCtx = tempCanvas.getContext("2d")!;
    tempCtx.fillStyle = fillColor;
    tempCtx.fillRect(0, 0, 1, 1);
    const fillData = tempCtx.getImageData(0, 0, 1, 1).data;
    const fillR = fillData[0];
    const fillG = fillData[1];
    const fillB = fillData[2];
    const fillA = fillData[3];

    if (targetR === fillR && targetG === fillG && targetB === fillB && targetA === fillA) return;

    const match = (i: number) =>
      data[i] === targetR && data[i + 1] === targetG && data[i + 2] === targetB && data[i + 3] === targetA;

    const stack: [number, number][] = [[startX, startY]];
    const visited = new Uint8Array(w * h);

    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      const pos = y * w + x;
      if (x < 0 || x >= w || y < 0 || y >= h) continue;
      if (visited[pos]) continue;
      const i = pos * 4;
      if (!match(i)) continue;

      visited[pos] = 1;
      data[i] = fillR;
      data[i + 1] = fillG;
      data[i + 2] = fillB;
      data[i + 3] = fillA;

      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }

    ctx.putImageData(imageData, 0, 0);
  }, []);

  const sprayAt = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.fillStyle = color;
    const radius = brushSize * 4;
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * radius;
      const px = Math.floor(x + Math.cos(angle) * dist);
      const py = Math.floor(y + Math.sin(angle) * dist);
      ctx.fillRect(px, py, 1, 1);
    }
  }, [color, brushSize]);

  const handleMouseDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!imageReady || editor.busy || activePointer.current !== null || !e.isPrimary) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    activePointer.current = e.pointerId;
    if (pan && canvasAreaRef.current) {
      panOrigin.current = { x: e.clientX, y: e.clientY, left: canvasAreaRef.current.scrollLeft, top: canvasAreaRef.current.scrollTop };
      return;
    }
    const pos = getCanvasPos(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setDrawing(true);
    setStartPos(pos);
    lastPos.current = pos;

    if (tool === "pencil" || tool === "brush") {
      saveUndo();
      ctx.fillStyle = color;
      const size = tool === "brush" ? brushSize * 2 : brushSize;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (tool === "eraser") {
      saveUndo();
      ctx.fillStyle = bgColor;
      const size = brushSize * 3;
      ctx.fillRect(pos.x - size / 2, pos.y - size / 2, size, size);
    } else if (tool === "fill") {
      saveUndo();
      floodFill(pos.x, pos.y, e.button === 2 ? bgColor : color);
    } else if (tool === "picker") {
      const pixel = ctx.getImageData(pos.x, pos.y, 1, 1).data;
      const hex = "#" + [pixel[0], pixel[1], pixel[2]].map(v => v.toString(16).padStart(2, "0")).join("");
      if (e.button === 2) {
        setBgColor(hex);
      } else {
        setColor(hex);
      }
    } else if (tool === "spray") {
      saveUndo();
      sprayAt(ctx, pos.x, pos.y);
    } else if (tool === "line" || tool === "rect" || tool === "filledRect" || tool === "ellipse" || tool === "filledEllipse") {
      saveUndo();
    }
  }, [tool, color, bgColor, brushSize, getCanvasPos, saveUndo, floodFill, sprayAt, imageReady, editor.busy, pan]);

  const handleMouseMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (panOrigin.current && activePointer.current === e.pointerId && canvasAreaRef.current) {
      canvasAreaRef.current.scrollLeft = panOrigin.current.left + panOrigin.current.x - e.clientX;
      canvasAreaRef.current.scrollTop = panOrigin.current.top + panOrigin.current.y - e.clientY;
      return;
    }
    const pos = getCanvasPos(e);
    setCoords(`${pos.x}, ${pos.y}px`);

    if (!drawing || activePointer.current !== e.pointerId) return;

    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (!canvas || !overlay) return;
    const ctx = canvas.getContext("2d");
    const overlayCtx = overlay.getContext("2d");
    if (!ctx || !overlayCtx) return;

    if (tool === "pencil" || tool === "brush") {
      const prev = lastPos.current || pos;
      const size = tool === "brush" ? brushSize * 2 : brushSize;
      drawLine(ctx, prev.x, prev.y, pos.x, pos.y, color, size);
      lastPos.current = pos;
    } else if (tool === "eraser") {
      const prev = lastPos.current || pos;
      const size = brushSize * 3;
      // Draw eraser path
      ctx.fillStyle = bgColor;
      const dx = pos.x - prev.x;
      const dy = pos.y - prev.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const steps = Math.max(1, Math.floor(dist));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = prev.x + dx * t;
        const y = prev.y + dy * t;
        ctx.fillRect(x - size / 2, y - size / 2, size, size);
      }
      lastPos.current = pos;
    } else if (tool === "spray") {
      sprayAt(ctx, pos.x, pos.y);
      lastPos.current = pos;
    } else if ((tool === "line" || tool === "rect" || tool === "filledRect" || tool === "ellipse" || tool === "filledEllipse") && startPos) {
      // Draw preview on overlay
      overlayCtx.clearRect(0, 0, overlay.width, overlay.height);
      overlayCtx.strokeStyle = color;
      overlayCtx.fillStyle = color;
      overlayCtx.lineWidth = brushSize;
      overlayCtx.lineCap = "round";

      if (tool === "line") {
        overlayCtx.beginPath();
        overlayCtx.moveTo(startPos.x, startPos.y);
        overlayCtx.lineTo(pos.x, pos.y);
        overlayCtx.stroke();
      } else if (tool === "rect") {
        const x = Math.min(startPos.x, pos.x);
        const y = Math.min(startPos.y, pos.y);
        const w = Math.abs(pos.x - startPos.x);
        const h = Math.abs(pos.y - startPos.y);
        overlayCtx.strokeRect(x, y, w, h);
      } else if (tool === "filledRect") {
        const x = Math.min(startPos.x, pos.x);
        const y = Math.min(startPos.y, pos.y);
        const w = Math.abs(pos.x - startPos.x);
        const h = Math.abs(pos.y - startPos.y);
        overlayCtx.fillRect(x, y, w, h);
      } else if (tool === "ellipse" || tool === "filledEllipse") {
        const cx = (startPos.x + pos.x) / 2;
        const cy = (startPos.y + pos.y) / 2;
        const rx = Math.abs(pos.x - startPos.x) / 2;
        const ry = Math.abs(pos.y - startPos.y) / 2;
        overlayCtx.beginPath();
        overlayCtx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        if (tool === "filledEllipse") {
          overlayCtx.fill();
        } else {
          overlayCtx.stroke();
        }
      }
    }
  }, [drawing, tool, color, bgColor, brushSize, getCanvasPos, startPos, drawLine, sprayAt]);

  const handleMouseUp = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    if (activePointer.current !== event.pointerId) return;
    activePointer.current = null;
    setDrawing(false);
    if (panOrigin.current) { panOrigin.current = null; return; }

    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (!canvas || !overlay) return;
    const ctx = canvas.getContext("2d");
    const overlayCtx = overlay.getContext("2d");
    if (!ctx || !overlayCtx) return;

    if ((tool === "line" || tool === "rect" || tool === "filledRect" || tool === "ellipse" || tool === "filledEllipse") && startPos) {
      // Commit overlay to main canvas
      ctx.drawImage(overlay, 0, 0);
      overlayCtx.clearRect(0, 0, overlay.width, overlay.height);
    }

    lastPos.current = null;
    setStartPos(null);
    if (tool !== "picker" && tool !== "select" && tool !== "text") commitDrawing();
  }, [tool, startPos, commitDrawing]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div className="paint-editor relative flex h-full flex-col bg-[#c0c0c0] text-[11px]" onKeyDown={event => {
      if (!(event.ctrlKey || event.metaKey) || event.target instanceof HTMLInputElement) return;
      if (event.key.toLowerCase() === "s") { event.preventDefault(); save(); }
      if (event.key.toLowerCase() === "z") { event.preventDefault(); undo(); }
    }}>
      {/* Menu bar */}
      <GameMenuBar items={[
        { label: "File", menu: [
          { label: "New", onClick: editor.newDocument },
          { label: "Open...", onClick: () => openWindow("documents") },
          { label: "Save", onClick: save, disabled: !imageReady || editor.busy },
          { label: "Save As...", onClick: () => { if (!editor.content) commitDrawing(); editor.setSaveAs(true); }, disabled: !imageReady || editor.busy },
          { label: "Download PNG", onClick: saveImage, disabled: !imageReady },
          { label: "Exit", onClick: () => closeWindow(win.instanceId) },
        ] },
        { label: "Edit", menu: [{ label: "Undo", onClick: undo, disabled: !imageReady }, { label: "Clear", onClick: clearCanvas, disabled: !imageReady }] },
      ]} />
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[#808080] px-2 py-1">
        <span className="min-w-0 truncate">{editor.name}{editor.dirty ? " *" : ""}</span>
        <div className="flex shrink-0 items-center gap-2">
          <button className={`win-button px-1 text-[11px] ${pan ? "active" : ""}`} aria-pressed={pan} aria-label="Pan canvas" title="Pan canvas" onClick={() => setPan(value => !value)}>Pan</button>
          <label className="flex items-center gap-1">Zoom<select aria-label="Canvas zoom" className="win-inset bg-white text-black" value={zoom} onChange={event => setZoom(event.target.value)}><option value="fit">Fit</option><option value="1">100%</option><option value="2">200%</option><option value="4">400%</option></select></label>
        </div>
      </div>

      {/* Main area */}
      <div className="flex min-h-0 flex-1">
        {/* Toolbox */}
        <aside className="w-[60px] shrink-0 overflow-y-auto border-r border-[#808080] bg-[#c0c0c0] p-[4px]">
          <div className="grid grid-cols-2 gap-[1px]">
            {TOOLS.map((t) => (
              <button
                key={t.id}
                className={`paint-tool flex h-[25px] w-[25px] items-center justify-center p-0 win-button disabled:opacity-40 ${
                  tool === t.id ? "active" : ""
                }`}
                title={t.label}
                aria-label={t.label}
                aria-pressed={tool === t.id}
                disabled={!imageReady || t.id === "text" || t.id === "select"}
                onClick={() => {
                  setTool(t.id);
                  setPan(false);
                  setStatusText(t.label);
                }}
              >
                <span className={tool === t.id ? "translate-x-[0.5px] translate-y-[0.5px]" : ""}>
                  <PaintToolIcon tool={t.id} />
                </span>
              </button>
            ))}
          </div>

          {/* Tool options: size dots for freehand tools, line widths for shapes */}
          {(DOT_TOOLS.has(tool) || WIDTH_TOOLS.has(tool)) && (
            <div
              className="mt-[8px] flex flex-col items-center gap-[3px] bg-[#c0c0c0] px-[4px] py-[6px]"
              style={{ boxShadow: "inset -1px -1px #ffffff, inset 1px 1px #808080, inset -2px -2px #dfdfdf, inset 2px 2px #0a0a0a" }}
            >
              {BRUSH_SIZES.map((size) => {
                const selected = brushSize === size;
                return (
                  <button
                    key={size}
                    className={`flex h-[15px] w-full items-center justify-center ${selected ? "bg-[#000080]" : ""}`}
                    onClick={() => setBrushSize(size)}
                    title={`Size ${size}`}
                  >
                    {WIDTH_TOOLS.has(tool) ? (
                      <div
                        style={{
                          width: "78%",
                          height: Math.max(1, size),
                          backgroundColor: selected ? "#ffffff" : "#000000",
                        }}
                      />
                    ) : (
                      <div
                        className="rounded-full"
                        style={{
                          width: Math.min(size * 2, 14),
                          height: Math.min(size * 2, 14),
                          backgroundColor: selected ? "#ffffff" : "#000000",
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        {/* Canvas area */}
        <main ref={canvasAreaRef} className="relative min-w-0 flex-1 overflow-auto bg-[#808080] p-[2px]" aria-label="Canvas area">
          <div className="relative" style={{ width: zoom === "fit" ? "100%" : 640 * Number(zoom), maxWidth: zoom === "fit" ? 640 : undefined, aspectRatio: "8 / 5" }}>
            <canvas
              ref={canvasRef}
              width={640}
              height={400}
              className={`block h-full w-full touch-none bg-white ${pan ? "cursor-grab" : "cursor-crosshair"}`}
              aria-label="Drawing canvas"
              data-testid="paint-canvas"
              style={{ imageRendering: zoom === "fit" ? "auto" : "pixelated" }}
              onPointerDown={handleMouseDown}
              onPointerMove={handleMouseMove}
              onPointerUp={handleMouseUp}
              onPointerCancel={handleMouseUp}
              onLostPointerCapture={handleMouseUp}
              onContextMenu={handleContextMenu}
            />
            <canvas
              ref={overlayRef}
              width={640}
              height={400}
              className="pointer-events-none absolute inset-0 block h-full w-full"
              style={{ imageRendering: "auto" }}
            />
          </div>
        </main>
      </div>

      {/* Color palette */}
      <div className="flex min-h-[38px] shrink-0 items-center border-t border-[#ffffff] bg-[#c0c0c0] px-[6px] py-1">
        {/* Current colors indicator */}
        <div className="relative mr-[8px] h-[28px] w-[28px]">
          <div
            className="absolute bottom-0 right-0 h-[18px] w-[18px] border border-[#808080]"
            style={{ backgroundColor: bgColor }}
            title="Background color (right-click to set)"
          />
          <div
            className="absolute left-0 top-0 h-[18px] w-[18px] border border-[#808080]"
            style={{ backgroundColor: color }}
            title="Foreground color (left-click to set)"
          />
        </div>

        {/* Color swatches */}
        <div className="paint-palette grid min-w-0 flex-1 grid-cols-[repeat(14,minmax(0,1fr))] gap-[1px]">
          {COLORS.map((c) => (
            <button
              key={c}
              className="paint-swatch h-[14px] w-full max-w-[20px] border border-[#808080]"
              style={{ background: c }}
              aria-label={c}
              onClick={() => setColor(c)}
              onContextMenu={(e) => {
                e.preventDefault();
                setBgColor(c);
              }}
              title={`Left: foreground, Right: background`}
            />
          ))}
        </div>
      </div>

      {/* Status bar */}
      <div className="status-bar">
        <p className="status-bar-field flex-[2]">{editor.loading ? "Opening..." : editor.draftStatus || statusText}</p>
        <p className="status-bar-field paint-coords text-center">{coords}</p>
        <p className="status-bar-field paint-actions text-center">
          <button className="text-[10px] underline" onClick={save} disabled={!imageReady || editor.busy} title="Save to My Documents">Save</button>
          {" | "}
          <button className="text-[10px] underline" onClick={undo} disabled={!imageReady || editor.busy} title="Undo (Ctrl+Z)">Undo</button>
          {" | "}
          <button className="text-[10px] underline" onClick={clearCanvas} disabled={!imageReady || editor.busy} title="Clear canvas">Clear</button>
        </p>
      </div>
      {editor.error && <p role="alert" className="bg-[#ffffcc] p-2 text-[#800000]">{editor.error}</p>}
      <DocumentDialogs editor={editor} />
    </div>
  );
}
