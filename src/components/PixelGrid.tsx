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
const LONG_PRESS_DURATION = 300; // 300ms para activar el modo selección

const PixelGrid: React.FC<PixelGridProps> = ({ pixelData, selectable, rows, columns }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { selectedPixels, setSelectedPixels } = usePixelContext();

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ x: number; y: number } | null>(null);

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initialTouchPositionRef = useRef<{ x: number, y: number } | null>(null);

  // --- MODIFICACIÓN CLAVE: Bloqueo de scroll más robusto ---
  useEffect(() => {
    // Si no estamos arrastrando, no hacemos nada.
    if (!isDragging) {
      return;
    }

    const htmlElement = document.documentElement;
    const bodyElement = document.body;
    // Buscamos el contenedor de scroll más cercano que tenga la clase 'overflow-auto'.
    // Esto hace que el componente sea más adaptable si su estructura padre cambia.
    const scrollContainer = canvasRef.current?.closest('.overflow-auto') as HTMLElement | null;

    // Guardar estilos originales ANTES de modificarlos
    const originalStyles = {
      html: htmlElement.style.overflow,
      body: bodyElement.style.overflow,
      container: scrollContainer ? scrollContainer.style.overflow : null
    };

    // Aplicar estilos de bloqueo para congelar la vista
    htmlElement.style.overflow = 'hidden';
    bodyElement.style.overflow = 'hidden';
    if (scrollContainer) {
      scrollContainer.style.overflow = 'hidden';
    }
    
    // Función de limpieza: se ejecuta cuando isDragging cambia a false o el componente se desmonta.
    // Esto asegura que los estilos siempre se restauren.
    return () => {
      htmlElement.style.overflow = originalStyles.html;
      bodyElement.style.overflow = originalStyles.body;
      if (scrollContainer && originalStyles.container !== null) {
        scrollContainer.style.overflow = originalStyles.container;
      }
    };
  }, [isDragging]);


  // El useEffect para dibujar el canvas permanece igual.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const canvasWidth = columns * BASE_CELL_SIZE;
    const canvasHeight = rows * BASE_CELL_SIZE;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    ctx.resetTransform();
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
          ctx.fillStyle = '#A78BFA';
          ctx.fillRect(x * BASE_CELL_SIZE, y * BASE_CELL_SIZE, BASE_CELL_SIZE, BASE_CELL_SIZE);
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

    const selectionColor = "rgba(96, 165, 250, 0.6)";
    ctx.fillStyle = selectionColor;

    if (!isDragging && selectedPixels.length > 0) {
      selectedPixels.forEach((cell) => {
        ctx.fillRect(cell.x * BASE_CELL_SIZE, cell.y * BASE_CELL_SIZE, BASE_CELL_SIZE, BASE_CELL_SIZE);
      });
    }

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
  }, [pixelData, isDragging, dragStart, dragEnd, selectedPixels, columns, rows]);


  const getCoordsFromEvent = (clientX: number, clientY: number): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const gridX = Math.floor(x / BASE_CELL_SIZE);
    const gridY = Math.floor(y / BASE_CELL_SIZE);
    return { x: gridX, y: gridY };
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

  // --- Handlers para Mouse (sin cambios) ---
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => handleSelectionStart(getCoordsFromEvent(e.clientX, e.clientY));
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => handleSelectionMove(getCoordsFromEvent(e.clientX, e.clientY));
  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => handleSelectionEnd(getCoordsFromEvent(e.clientX, e.clientY));
  const handleMouseLeave = () => handleSelectionEnd(dragEnd);

  // --- LÓGICA TÁCTIL MEJORADA CON "MANTENER PRESIONADO" ---
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!selectable) return;

    const touch = e.touches[0];
    initialTouchPositionRef.current = { x: touch.clientX, y: touch.clientY };

    longPressTimerRef.current = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(50);
      handleSelectionStart(getCoordsFromEvent(touch.clientX, touch.clientY));
      longPressTimerRef.current = null;
    }, LONG_PRESS_DURATION);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!selectable) return;

    if (isDragging) {
      e.preventDefault();
      handleSelectionMove(getCoordsFromEvent(e.touches[0].clientX, e.touches[0].clientY));
      return;
    }

    if (longPressTimerRef.current && initialTouchPositionRef.current) {
        const touch = e.touches[0];
        const deltaX = Math.abs(touch.clientX - initialTouchPositionRef.current.x);
        const deltaY = Math.abs(touch.clientY - initialTouchPositionRef.current.y);
        if (deltaX > 10 || deltaY > 10) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
    }
  };
  
  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!selectable) return;

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (isDragging) {
      const touch = e.changedTouches[0];
      if (touch) {
        handleSelectionEnd(getCoordsFromEvent(touch.clientX, touch.clientY));
      } else {
        handleSelectionEnd(dragEnd);
      }
    }
  };

  return (
    <div className="w-full h-full bg-white">
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
          imageRendering: "pixelated",
          cursor: selectable ? "crosshair" : "grab"
        }}
      />
    </div>
  );
};

export default PixelGrid;
