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

  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Configurar canvas para alta densidad de píxeles
    const dpr = window.devicePixelRatio || 1;
    canvas.width = columns * BASE_CELL_SIZE * dpr;
    canvas.height = rows * BASE_CELL_SIZE * dpr;
    ctx.resetTransform();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar cada celda del grid
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        const index = y * columns + x;
        const pixel = pixelData[index];
        if (!pixel) continue;

        if (pixel.status === 'available') {
          // Celdas disponibles
          ctx.fillStyle = '#E5E7EB';
          ctx.fillRect(x * BASE_CELL_SIZE, y * BASE_CELL_SIZE, BASE_CELL_SIZE, BASE_CELL_SIZE);
        } else if (pixel.status === 'sold') {
          if (selectable) {
            // En modo selección, se pinta PURPURA (indicando que está vendido)
            ctx.fillStyle = '#A78BFA';
            ctx.fillRect(x * BASE_CELL_SIZE, y * BASE_CELL_SIZE, BASE_CELL_SIZE, BASE_CELL_SIZE);
          } else {
            // En otros modos (por ejemplo, galería), se muestra la imagen asignada.
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

    // Dibujar líneas de la cuadrícula
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

    // Dibujar la selección guardada (overlay para celdas ya seleccionadas)
    if (!isDragging && selectedPixels.length > 0) {
      ctx.fillStyle = "rgba(173, 216, 230, 0.4)";
      selectedPixels.forEach((cell) => {
        ctx.fillRect(cell.x * BASE_CELL_SIZE, cell.y * BASE_CELL_SIZE, BASE_CELL_SIZE, BASE_CELL_SIZE);
      });
    }

    // Durante el arrastre, se muestra la selección temporal del usuario
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

  const getCellCoordinates = (e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / BASE_CELL_SIZE);
    const y = Math.floor((e.clientY - rect.top) / BASE_CELL_SIZE);
    return { x, y };
  };

  // Inicia el arrastre de selección solo si se hace click en una celda disponible.
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectable) return;
    // Si ya existe una selección, no se inicia un nuevo drag.
    if (selectedPixels.length > 0) return;
    const coords = getCellCoordinates(e);
    const candidateId = coords.y * columns + coords.x;
    const candidatePixel = pixelData[candidateId];
    // Solo se inicia si el píxel existe y está available.
    if (!candidatePixel || candidatePixel.status !== "available") return;
    if (selectedPixels.some(p => p.id === candidateId)) return;
    setIsDragging(true);
    setDragStart(coords);
    setDragEnd(coords);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const coords = getCellCoordinates(e);
    setDragEnd(coords);
  };

  // Al finalizar el drag, se verifica que el bloque a seleccionar no contenga ningún píxel vendido (status === "sold").
  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragStart) return;
    const coords = getCellCoordinates(e);
    setDragEnd(coords);
    setIsDragging(false);

    const minX = Math.min(dragStart.x, coords.x);
    const maxX = Math.max(dragStart.x, coords.x);
    const minY = Math.min(dragStart.y, coords.y);
    const maxY = Math.max(dragStart.y, coords.y);

    // Verificar que el bloque a seleccionar no contenga ningún píxel vendido.
    for (let row = minY; row <= maxY; row++) {
      for (let col = minX; col <= maxX; col++) {
        const candidateId = row * columns + col;
        const candidatePixel = pixelData[candidateId];
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
        // Solo se agregan si el píxel existe y está available.
        if (candidatePixel && candidatePixel.status === "available" &&
            !selectedPixels.some(p => p.id === candidate.id)) {
          newSelectionCandidates.push(candidate);
        }
      }
    }
    // Se reemplaza la selección anterior por la nueva.
    setSelectedPixels(newSelectionCandidates);
    setDragStart(null);
    setDragEnd(null);
  };

  return (
    <div className="w-full h-full bg-white">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
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
