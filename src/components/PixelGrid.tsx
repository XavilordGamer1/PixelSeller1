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

const BASE_CELL_SIZE = 10; // Cada celda mide 10px x 10px

const PixelGrid: React.FC<PixelGridProps> = ({ pixelData, selectable, rows, columns }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { selectedPixels, setSelectedPixels } = usePixelContext();

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ x: number; y: number } | null>(null);

  // Se redibuja el canvas cuando cambian las props o el estado del arrastre
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // --- CORRECCIÓN DE DIBUJADO ---
    // 1. Establece el tamaño del bitmap del canvas. Este será el tamaño real de la superficie de dibujo.
    //    Lo mantenemos por debajo del límite de iOS.
    const canvasWidth = columns * BASE_CELL_SIZE;
    const canvasHeight = rows * BASE_CELL_SIZE;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // 2. NO escalamos el contexto. El tamaño del bitmap y el tamaño de visualización (CSS)
    //    serán los mismos, por lo que no se necesita escalado manual.
    ctx.resetTransform();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibuja la cuadrícula y los píxeles (disponibles y comprados)
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
            ctx.fillStyle = '#A78BFA'; // Púrpura para "Purchased"
            ctx.fillRect(x * BASE_CELL_SIZE, y * BASE_CELL_SIZE, BASE_CELL_SIZE, BASE_CELL_SIZE);
          }
        }
      }
    }

    // Dibuja las líneas de la cuadrícula
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

    // Dibuja la selección de píxeles
    const selectionColor = "rgba(96, 165, 250, 0.6)";
    ctx.fillStyle = selectionColor;

    if (!isDragging && selectedPixels.length > 0) {
      selectedPixels.forEach((cell) => {
        ctx.fillRect(cell.x * BASE_CELL_SIZE, cell.y * BASE_CELL_SIZE, BASE_CELL_SIZE, BASE_CELL_SIZE);
      });
    }

    // Dibuja el área de arrastre en tiempo real
    if (isDragging && dragStart && dragEnd) {
      const minX = Math.min(dragStart.x, dragEnd.x);
      const maxX = Math.max(dragStart.x, dragEnd.x);
      const minY = Math.min(dragStart.y, dragEnd.y);
      const maxY = Math.max(dragStart.y, dragEnd.y);
      for (let row = minY; row <= maxY; row++) {
        for (let col = minX; col <= maxX; col++) {
          ctx.fillRect(col * BASE_CELL_SIZE, row * BASE_CELL_SIZE, BASE_CELL_SIZE, BASE_CELL_SIZE);
        }
      }
    }
  }, [pixelData, isDragging, dragStart, dragEnd, selectedPixels, selectable, columns, rows]);

  // --- LÓGICA DE MANEJADORES DE EVENTOS ---

  // --- CORRECCIÓN DE COORDENADAS ---
  // Función simplificada y precisa para obtener las coordenadas del grid
  const getCoordsFromEvent = (clientX: number, clientY: number): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    // Calcula la posición del toque RELATIVA al borde del canvas
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Convierte la posición en píxeles a coordenadas del grid
    const gridX = Math.floor(x / BASE_CELL_SIZE);
    const gridY = Math.floor(y / BASE_CELL_SIZE);

    return { x: gridX, y: gridY };
  };

  // El resto de los manejadores de eventos usan la función corregida y no necesitan cambios
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
          width: `${columns * BASE_CELL_SIZE}px`,
          height: `${rows * BASE_CELL_SIZE}px`,
          imageRendering: "pixelated", // Clave para que los píxeles no se vean borrosos
          cursor: selectable ? "pointer" : "default"
        }}
      />
    </div>
  );
};

export default PixelGrid;