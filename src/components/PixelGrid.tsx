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

const BASE_CELL_SIZE = 10;

const PixelGrid: React.FC<PixelGridProps> = ({ pixelData, selectable, rows, columns }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { selectedPixels, setSelectedPixels } = usePixelContext();

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // --- MODIFICACIÓN CLAVE ---
    // 1. Define el tamaño del bitmap SIN el DPR.
    const canvasWidth = columns * BASE_CELL_SIZE;
    const canvasHeight = rows * BASE_CELL_SIZE;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    // 2. Ajusta el tamaño de visualización del canvas con CSS.
    //    Esto ya lo tenías bien en el 'style' del return.

    // 3. Escala el contexto de dibujado por DPR para mantener la nitidez.
    const dpr = window.devicePixelRatio || 1;
    ctx.resetTransform(); // Resetea transformaciones previas
    ctx.scale(dpr, dpr); // Escala todo lo que dibujes a partir de ahora
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Ajusta el tamaño de la celda para el dibujado (ya no necesita el DPR)
    const cellSize = BASE_CELL_SIZE;

    // El resto del código de dibujado permanece casi igual,
    // pero ahora opera en un canvas de tamaño base que luego se escala.

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        const index = y * columns + x;
        const pixel = pixelData[index];
        if (!pixel) continue;
        if (pixel.status === 'available') {
          ctx.fillStyle = '#E5E7EB';
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        } else if (pixel.status === 'sold') {
          if (selectable) {
            ctx.fillStyle = '#A78BFA';
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
          }
        }
      }
    }

    ctx.strokeStyle = '#898989';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= columns; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cellSize, 0);
      ctx.lineTo(x * cellSize, rows * cellSize);
      ctx.stroke();
    }
    for (let y = 0; y <= rows; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cellSize);
      ctx.lineTo(columns * cellSize, y * cellSize);
      ctx.stroke();
    }
    
    const selectionColor = "rgba(96, 165, 250, 0.6)"; 
    ctx.fillStyle = selectionColor;

    if (!isDragging && selectedPixels.length > 0) {
      selectedPixels.forEach((cell) => {
        ctx.fillRect(cell.x * cellSize, cell.y * cellSize, cellSize, cellSize);
      });
    }

    if (isDragging && dragStart && dragEnd) {
      const minX = Math.min(dragStart.x, dragEnd.x);
      const maxX = Math.max(dragStart.x, dragEnd.x);
      const minY = Math.min(dragStart.y, dragEnd.y);
      const maxY = Math.max(dragStart.y, dragEnd.y);
      for (let row = minY; row <= maxY; row++) {
        for (let col = minX; col <= maxX; col++) {
          ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
        }
      }
    }
    // La dependencia de 'dpr' no es estrictamente necesaria aquí, pero no hace daño.
  }, [pixelData, isDragging, dragStart, dragEnd, selectedPixels, selectable, columns, rows]);

  // --- El resto de tus manejadores de eventos están correctos y no necesitan cambios ---
  
  const getCoordsFromEvent = (clientX: number, clientY: number): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // --- MODIFICACIÓN: Ajustar coordenadas al tamaño de CSS del canvas ---
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasX = (clientX - rect.left) * scaleX;
    const canvasY = (clientY - rect.top) * scaleY;
    
    const x = Math.floor(canvasX / BASE_CELL_SIZE);
    const y = Math.floor(canvasY / BASE_CELL_SIZE);
    
    return { x, y };
  };

  const handleSelectionStart = (coords: { x: number; y: number }) => {
    if (!selectable || selectedPixels.length > 0) return;
    const candidatePixel = pixelData[coords.y * columns + coords.x];
    if (candidatePixel?.status === 'available') {
      setIsDragging(true);
      setDragStart(coords);
      setDragEnd(coords);
    }
  };

  const handleSelectionMove = (coords: { x: number; y: number }) => {
    if (!isDragging) return;
    setDragEnd(coords);
  };

  const handleSelectionEnd = (coords: { x: number; y: number } | null) => {
    if (!isDragging || !dragStart || !coords) {
        setIsDragging(false);
        return;
    };

    setIsDragging(false);
    const minX = Math.min(dragStart.x, coords.x);
    const maxX = Math.max(dragStart.x, coords.x);
    const minY = Math.min(dragStart.y, coords.y);
    const maxY = Math.max(dragStart.y, coords.y);

    for (let row = minY; row <= maxY; row++) {
      for (let col = minX; col <= maxX; col++) {
        const candidatePixel = pixelData[row * columns + col];
        if (candidatePixel?.status === "sold") {
          console.warn("Selección inválida.");
          setDragStart(null);
          setDragEnd(null);
          return;
        }
      }
    }

    const newSelectionCandidates = [];
    for (let row = minY; row <= maxY; row++) {
      for (let col = minX; col <= maxX; col++) {
        const id = row * columns + col;
        const candidatePixel = pixelData[id];
        if (candidatePixel?.status === "available") {
          newSelectionCandidates.push({ x: col, y: row, id: candidatePixel.id });
        }
      }
    }
    
    setSelectedPixels(newSelectionCandidates);
    setDragStart(null);
    setDragEnd(null);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => handleSelectionStart(getCoordsFromEvent(e.clientX, e.clientY));
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => handleSelectionMove(getCoordsFromEvent(e.clientX, e.clientY));
  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => handleSelectionEnd(getCoordsFromEvent(e.clientX, e.clientY));
  const handleMouseLeave = () => handleSelectionEnd(dragEnd);

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    handleSelectionStart(getCoordsFromEvent(e.touches[0].clientX, e.touches[0].clientY));
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    handleSelectionMove(getCoordsFromEvent(e.touches[0].clientX, e.touches[0].clientY));
  };
  
  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    if (touch) {
      handleSelectionEnd(getCoordsFromEvent(touch.clientX, touch.clientY));
    } else {
      handleSelectionEnd(dragEnd);
    }
  };

  return (
    <div className="w-full h-full bg-white touch-none">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={{
          // --- MODIFICACIÓN: El tamaño CSS debe coincidir con el tamaño del bitmap ---
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