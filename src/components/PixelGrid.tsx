// src/components/PixelGrid.tsx
import React, { useRef, useEffect, useState } from 'react';
import { usePixelContext } from '../context/PixelContext';
import { PixelData } from '../services/db';

interface PixelGridProps {
  pixelData: PixelData[];
  selectable: boolean;
  rows: number;
  columns: number;
}

const BASE_CELL_SIZE = 10; // cada celda mide 10px x 10px

const PixelGrid: React.FC<PixelGridProps> = ({ pixelData, selectable, rows, columns }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { selectedPixels, setSelectedPixels } = usePixelContext();

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ x: number; y: number } | null>(null);

  // Se mantiene tu función de dibujado original, ya que funciona como esperas.
  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = columns * BASE_CELL_SIZE * dpr;
    canvas.height = rows * BASE_CELL_SIZE * dpr;
    ctx.resetTransform();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        const index = y * columns + x;
        const pixel = pixelData[index];
        if (!pixel) continue;
        if (pixel.status === 'available') {
          ctx.fillStyle = '#E5E7EB';
          ctx.fillRect(x * BASE_CELL_SIZE, y * BASE_CELL_SIZE, BASE_CELL_SIZE, BASE_CELL_SIZE);
        } else if (pixel.status === 'sold') {
          if (selectable) {
            ctx.fillStyle = '#A78BFA';
            ctx.fillRect(x * BASE_CELL_SIZE, y * BASE_CELL_SIZE, BASE_CELL_SIZE, BASE_CELL_SIZE);
          } else {
            if (pixel.imageUrl) {
              const img = new Image();
              img.src = pixel.imageUrl;
              img.onload = () =>
                ctx.drawImage(img, x * BASE_CELL_SIZE, y * BASE_CELL_SIZE, BASE_CELL_SIZE, BASE_CELL_SIZE);
            } else {
              ctx.fillStyle = '#60A5FA';
              ctx.fillRect(x * BASE_CELL_SIZE, y * BASE_CELL_SIZE, BASE_CELL_SIZE, BASE_CELL_SIZE);
            }
          }
        }
      }
    }

    ctx.strokeStyle = '#898989';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= columns; x++) {
      ctx.beginPath();
      ctx.moveTo(x * BASE_CELL_SIZE, 0);
      ctx.lineTo(x * BASE_CELL_SIZE, rows * BASE_CELL_SIZE);
      ctx.stroke();
    }
    for (let y = 0; y <= rows; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * BASE_CELL_SIZE);
      ctx.lineTo(columns * BASE_CELL_SIZE, y * BASE_CELL_SIZE);
      ctx.stroke();
    }

    if (!isDragging && selectedPixels.length > 0) {
      ctx.fillStyle = "rgba(173, 216, 230, 0.4)";
      selectedPixels.forEach((cell) => {
        ctx.fillRect(cell.x * BASE_CELL_SIZE, cell.y * BASE_CELL_SIZE, BASE_CELL_SIZE, BASE_CELL_SIZE);
      });
    }

    if (isDragging && dragStart && dragEnd) {
      const minX = Math.min(dragStart.x, dragEnd.x);
      const maxX = Math.max(dragStart.x, dragEnd.x);
      const minY = Math.min(dragStart.y, dragEnd.y);
      const maxY = Math.max(dragStart.y, dragEnd.y);
      ctx.fillStyle = "rgba(173, 216, 230, 0.4)";
      for (let row = minY; row <= maxY; row++) {
        for (let col = minX; col <= maxX; col++) {
          ctx.fillRect(col * BASE_CELL_SIZE, row * BASE_CELL_SIZE, BASE_CELL_SIZE, BASE_CELL_SIZE);
        }
      }
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawGrid(ctx);
  }, [pixelData, isDragging, dragStart, dragEnd, selectedPixels, selectable]);

  // --- LÓGICA DE EVENTOS (AÑADIENDO SOPORTE TÁCTIL) ---

  // Helper para obtener coordenadas desde cualquier tipo de evento
  const getCellCoordinates = (clientX: number, clientY: number): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((clientX - rect.left) / BASE_CELL_SIZE);
    const y = Math.floor((clientY - rect.top) / BASE_CELL_SIZE);
    return { x, y };
  };
  
  const endSelection = (coords: { x: number; y: number }) => {
    if (!isDragging || !dragStart) return;
    
    setIsDragging(false);

    const minX = Math.min(dragStart.x, coords.x);
    const maxX = Math.max(dragStart.x, coords.x);
    const minY = Math.min(dragStart.y, coords.y);
    const maxY = Math.max(dragStart.y, coords.y);
    
    // Tu lógica original de validación y selección se mantiene intacta
    for (let row = minY; row <= maxY; row++) {
      for (let col = minX; col <= maxX; col++) {
        const candidatePixel = pixelData[row * columns + col];
        if (candidatePixel && candidatePixel.status === "sold") {
          console.warn("El bloque seleccionado contiene un píxel vendido. Selección cancelada.");
          setDragStart(null);
          setDragEnd(null);
          return;
        }
      }
    }

    const newSelectionCandidates = [];
    for (let row = minY; row <= maxY; row++) {
      for (let col = minX; col <= maxX; col++) {
        const candidate = { x: col, y: row, id: row * columns + col };
        const candidatePixel = pixelData[candidate.id];
        if (candidatePixel?.status === "available" && !selectedPixels.some(p => p.id === candidate.id)) {
          newSelectionCandidates.push(candidate);
        }
      }
    }
    
    setSelectedPixels(newSelectionCandidates);
    setDragStart(null);
    setDragEnd(null);
  };

  // --- Manejadores de Mouse (usan tu lógica original) ---
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectable || selectedPixels.length > 0) return;
    const coords = getCellCoordinates(e.clientX, e.clientY);
    const candidatePixel = pixelData[coords.y * columns + coords.x];
    if (candidatePixel?.status === "available") {
      setIsDragging(true);
      setDragStart(coords);
      setDragEnd(coords);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setDragEnd(getCellCoordinates(e.clientX, e.clientY));
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    endSelection(getCellCoordinates(e.clientX, e.clientY));
  };

  // --- NUEVOS MANEJADORES TÁCTILES ---
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault(); // Previene el zoom/scroll del navegador
    const touch = e.touches[0];
    if (!selectable || selectedPixels.length > 0) return;
    const coords = getCellCoordinates(touch.clientX, touch.clientY);
    const candidatePixel = pixelData[coords.y * columns + coords.x];
    if (candidatePixel?.status === "available") {
      setIsDragging(true);
      setDragStart(coords);
      setDragEnd(coords);
    }
  };
  
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDragging) return;
    const touch = e.touches[0];
    setDragEnd(getCellCoordinates(touch.clientX, touch.clientY));
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const touch = e.changedTouches[0];
    endSelection(getCellCoordinates(touch.clientX, touch.clientY));
  };

  return (
    // Se añade `touch-none` para mejorar la experiencia táctil
    <div className="w-full h-full bg-white touch-none"> 
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        // Se añaden los nuevos manejadores táctiles
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd} // Por si el gesto es cancelado
        style={{
          width: `${columns * BASE_CELL_SIZE}px`,
          height: `${rows * BASE_CELL_SIZE}px`,
          imageRendering: "pixelated",
          cursor: selectable ? "pointer" : "default"
        }}
      />
    </div>
  );
};

export default PixelGrid;