// src/components/PixelGridGallery.tsx
import React, { useRef, useEffect, useState } from 'react';
import { PixelData } from '../services/db';

interface PixelGridGalleryProps {
  pixelData: PixelData[];
  rows: number;
  columns: number;
}

const BASE_CELL_SIZE = 10;
const ZOOM_VIEWER_SIZE = 250; // Ancho y alto del recuadro de zoom en píxeles
const ZOOM_VIEWER_OFFSET = 15; // Distancia del cursor

const PixelGridGallery: React.FC<PixelGridGalleryProps> = ({ pixelData, rows, columns }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasTouched = useRef(false);

  const [zoom, setZoom] = useState<number>(1);
  const [initialZoom, setInitialZoom] = useState<number>(1);
  const cellSize = BASE_CELL_SIZE * zoom;

  const [zoomViewer, setZoomViewer] = useState({
    visible: false,
    x: 0,
    y: 0,
    imageUrl: '',
    style: {},
  });

  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());

  useEffect(() => {
    const computeAndSetZoom = () => {
      if (!containerRef.current) return;
      const availableWidth = containerRef.current.clientWidth;
      const availableHeight = containerRef.current.clientHeight;
      const zoomX = availableWidth / (columns * BASE_CELL_SIZE);
      const zoomY = availableHeight / (rows * BASE_CELL_SIZE);
      const newInitialZoom = Math.min(zoomX, zoomY, 1);
      setInitialZoom(newInitialZoom);
      setZoom(newInitialZoom);
    };
    computeAndSetZoom();
    window.addEventListener('resize', computeAndSetZoom);
    return () => window.removeEventListener('resize', computeAndSetZoom);
  }, [rows, columns]);

  useEffect(() => {
    if (!zoomViewer.visible) return;
    const htmlElement = document.documentElement;
    const bodyElement = document.body;
    const originalStyles = {
      html: htmlElement.style.overflow,
      body: bodyElement.style.overflow,
    };
    htmlElement.style.overflow = 'hidden';
    bodyElement.style.overflow = 'hidden';
    return () => {
      htmlElement.style.overflow = originalStyles.html;
      bodyElement.style.overflow = originalStyles.body;
    };
  }, [zoomViewer.visible]);

  useEffect(() => {
    type BlockRegion = { origin: { x: number; y: number }; size: { width: number; height: number } };
    let renderedBlocks: BlockRegion[] = [];
    const isCellCovered = (cx: number, cy: number) => {
      for (const block of renderedBlocks) {
        if (cx >= block.origin.x && cx < block.origin.x + block.size.width && cy >= block.origin.y && cy < block.origin.y + block.size.height) return true;
      }
      return false;
    };
    const drawGrid = (ctx: CanvasRenderingContext2D) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = columns * cellSize * dpr;
      canvas.height = rows * cellSize * dpr;
      ctx.resetTransform();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#E5E7EB';
      ctx.fillRect(0, 0, columns * cellSize, rows * cellSize);
      renderedBlocks = [];
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < columns; x++) {
          if (isCellCovered(x, y)) continue;
          const index = y * columns + x;
          const pixel = pixelData[index];
          if (!pixel || pixel.status !== 'sold' || !pixel.imageUrl) continue;
          if (pixel.blockOrigin && pixel.blockSize && pixel.x === pixel.blockOrigin.x && pixel.y === pixel.blockOrigin.y) {
            let img = imageCacheRef.current.get(pixel.imageUrl);
            if (!img) {
              img = new Image(); img.src = pixel.imageUrl;
              img.onload = () => { imageCacheRef.current.set(pixel.imageUrl!, img!); window.requestAnimationFrame(() => drawGrid(ctx)); };
            } else {
              const { x: oX, y: oY } = pixel.blockOrigin; const { width: bW, height: bH } = pixel.blockSize;
              ctx.drawImage(img, oX * cellSize, oY * cellSize, bW * cellSize, bH * cellSize);
              renderedBlocks.push({ origin: { x: oX, y: oY }, size: { width: bW, height: bH } });
            }
          } else if (!pixel.blockOrigin) {
            let img = imageCacheRef.current.get(pixel.imageUrl);
            if (!img) {
              img = new Image(); img.src = pixel.imageUrl;
              img.onload = () => { imageCacheRef.current.set(pixel.imageUrl!, img!); window.requestAnimationFrame(() => drawGrid(ctx)); };
            } else { ctx.drawImage(img, x * cellSize, y * cellSize, cellSize, cellSize); }
          }
        }
      }
    };
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    drawGrid(ctx);
  }, [pixelData, zoom, cellSize, columns, rows]);

  const findPixelByCoords = (clientX: number, clientY: number): PixelData | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left; const y = clientY - rect.top;
    const gridX = Math.floor(x / cellSize); const gridY = Math.floor(y / cellSize);
    if (gridX < 0 || gridX >= columns || gridY < 0 || gridY >= rows) return null;
    for (const p of pixelData) {
      if (p.blockOrigin && p.blockSize) {
        if (gridX >= p.blockOrigin.x && gridX < p.blockOrigin.x + p.blockSize.width && gridY >= p.blockOrigin.y && gridY < p.blockOrigin.y + p.blockSize.height) {
          return pixelData[p.blockOrigin.y * columns + p.blockOrigin.x];
        }
      } else if (p.x === gridX && p.y === gridY) { return p; }
    }
    return pixelData[gridY * columns + gridX] || null;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (hasTouched.current) return;

    const pixel = findPixelByCoords(e.clientX, e.clientY);
    if (pixel && pixel.status === 'sold' && pixel.imageUrl) {
      const rect = canvasRef.current!.getBoundingClientRect();
      const xOnCanvas = e.clientX - rect.left;
      const yOnCanvas = e.clientY - rect.top;
      const blockWidth = (pixel.blockSize?.width || 1) * cellSize;
      const blockHeight = (pixel.blockSize?.height || 1) * cellSize;
      const originX = (pixel.blockOrigin?.x || pixel.x) * cellSize;
      const originY = (pixel.blockOrigin?.y || pixel.y) * cellSize;
      const percentX = ((xOnCanvas - originX) / blockWidth) * 100;
      const percentY = ((yOnCanvas - originY) / blockHeight) * 100;

      // --- LÓGICA DE POSICIONAMIENTO CORREGIDA ---
      let newX = e.clientX + ZOOM_VIEWER_OFFSET;
      let newY = e.clientY + ZOOM_VIEWER_OFFSET;

      if (newX + ZOOM_VIEWER_SIZE > window.innerWidth) {
        newX = e.clientX - ZOOM_VIEWER_SIZE - ZOOM_VIEWER_OFFSET;
      }
      if (newY + ZOOM_VIEWER_SIZE > window.innerHeight) {
        newY = e.clientY - ZOOM_VIEWER_SIZE - ZOOM_VIEWER_OFFSET;
      }
      
      setZoomViewer({
        visible: true, x: newX, y: newY, imageUrl: pixel.imageUrl,
        style: {
          backgroundPosition: `${percentX}% ${percentY}%`,
          backgroundSize: `${(pixel.blockSize?.width || 1) * 100}% ${(pixel.blockSize?.height || 1) * 100}%`,
        },
      });
    } else {
      handleMouseLeave();
    }
  };

  const handleMouseLeave = () => {
    setZoomViewer(prev => ({ ...prev, visible: false }));
  };
  
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    hasTouched.current = true;
    
    if (zoomViewer.visible) {
      setZoomViewer(prev => ({ ...prev, visible: false }));
      return;
    }

    const touch = e.touches[0];
    const pixel = findPixelByCoords(touch.clientX, touch.clientY);

    if (pixel && pixel.status === 'sold' && pixel.imageUrl) {
      setZoomViewer({
        visible: true,
        x: window.innerWidth / 2, y: window.innerHeight / 2,
        imageUrl: pixel.imageUrl,
        style: {
          backgroundSize: 'contain', backgroundPosition: 'center',
          transform: 'translate(-50%, -50%)',
          width: '90vw', height: '90vw',
          maxWidth: '400px', maxHeight: '400px',
        },
      });
    }
  };

  return (
    <div className="relative w-full h-full bg-white" ref={containerRef}>
      <div className="w-full h-full overflow-auto">
        <canvas
          key={zoom}
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          style={{
            width: `${columns * cellSize}px`, height: `${rows * cellSize}px`,
            imageRendering: 'pixelated', cursor: 'default',
          }}
        />
      </div>
      {zoomViewer.visible && (
        <div className="zoom-viewer" style={{
            left: `${zoomViewer.x}px`, top: `${zoomViewer.y}px`,
            backgroundImage: `url(${zoomViewer.imageUrl})`,
            ...zoomViewer.style,
          }}
        />
      )}
      <div style={{ position: 'fixed', bottom: '20px', left: '20px', zIndex: 1000, backgroundColor: 'rgba(255, 255, 255, 0.7)', borderRadius: '8px', backdropFilter: 'blur(4px)', }} className="p-2 shadow-lg">
        <div className="flex items-center space-x-2">
          <span className="text-black font-medium">{Math.round(zoom * 100)}%</span>
          <input type="range" min={initialZoom.toString()} max="3" step="0.01" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-full" />
          <span className="text-black font-medium">Zoom</span>
        </div>
      </div>
    </div>
  );
};

export default PixelGridGallery;