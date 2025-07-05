// src/components/PixelGridGallery.tsx
import React, { useRef, useEffect, useState } from 'react';
import { PixelData } from '../services/db';

interface PixelGridGalleryProps {
  pixelData: PixelData[];
  rows: number;
  columns: number;
}

const BASE_CELL_SIZE = 10;

const PixelGridGallery: React.FC<PixelGridGalleryProps> = ({ pixelData, rows, columns }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Calcula el zoom inicial.
  const computeInitialZoom = () => {
    const availableWidth = window.innerWidth;
    const availableHeight = window.innerHeight - 64;
    const zoomX = availableWidth / (columns * BASE_CELL_SIZE);
    const zoomY = availableHeight / (rows * BASE_CELL_SIZE);
    return Math.min(zoomX, zoomY);
  };

  const [initialZoom] = useState<number>(() => computeInitialZoom());
  const [zoom, setZoom] = useState<number>(() => computeInitialZoom());
  const cellSize = BASE_CELL_SIZE * zoom;

  // Mapa de caché para imágenes.
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());

  // Para almacenar las regiones (en coordenadas de celda) de bloques ya renderizados.
  type BlockRegion = { origin: { x: number; y: number }; size: { width: number; height: number } };
  let renderedBlocks: BlockRegion[] = [];

  // Función que nos dice si una celda (columna x, fila y) ya fue cubierta por un bloque renderizado.
  const isCellCovered = (cx: number, cy: number) => {
    for (const block of renderedBlocks) {
      if (
        cx >= block.origin.x &&
        cx < block.origin.x + block.size.width &&
        cy >= block.origin.y &&
        cy < block.origin.y + block.size.height
      ) {
        return true;
      }
    }
    return false;
  };

  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Configurar canvas para alta densidad.
    const dpr = window.devicePixelRatio || 1;
    canvas.width = columns * cellSize * dpr;
    canvas.height = rows * cellSize * dpr;
    ctx.resetTransform();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;

    // Pinta el fondo de todas las celdas disponibles.
    ctx.fillStyle = '#E5E7EB';
    ctx.fillRect(0, 0, columns * cellSize, rows * cellSize);

    // Reiniciamos las regiones ya renderizadas.
    renderedBlocks = [];

    // Recorremos la grilla en orden (fila por fila) para dibujar imágenes.
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        // Si la celda actual ya está cubierta por una región de un bloque, la omitimos.
        if (isCellCovered(x, y)) continue;

        const index = y * columns + x;
        const pixel = pixelData[index];
        if (!pixel) continue;

        if (pixel.status === 'sold') {
          if (pixel.imageUrl) {
            // Caso de bloque: cuando el píxel forma parte de un bloque.
            if (pixel.blockOrigin && pixel.blockSize) {
              // Si es la celda origen del bloque...
              if (pixel.x === pixel.blockOrigin.x && pixel.y === pixel.blockOrigin.y) {
                let img = imageCacheRef.current.get(pixel.imageUrl);
                if (!img) {
                  img = new Image();
                  img.src = pixel.imageUrl;
                  img.onload = () => {
                    imageCacheRef.current.set(pixel.imageUrl!, img!);
                    window.requestAnimationFrame(() => drawGrid(ctx));
                  };
                } else {
                  // Calcular la región del bloque en coordenadas de celda.
                  const originX = pixel.blockOrigin.x; // en número de celdas
                  const originY = pixel.blockOrigin.y;
                  const blockWidth = pixel.blockSize.width;
                  const blockHeight = pixel.blockSize.height;
                  // Dibujar la imagen en toda la región del bloque.
                  ctx.drawImage(
                    img,
                    originX * cellSize,
                    originY * cellSize,
                    blockWidth * cellSize,
                    blockHeight * cellSize
                  );
                  // Registrar la región para evitar re-dibujar en celdas del bloque.
                  renderedBlocks.push({
                    origin: { x: originX, y: originY },
                    size: { width: blockWidth, height: blockHeight }
                  });
                }
              }
              // Si el píxel tiene blockOrigin y blockSize pero no es la celda origen, se omite.
              else {
                continue;
              }
            }
            // Caso individual: píxel vendido con imagen y sin información de bloque.
            else {
              let img = imageCacheRef.current.get(pixel.imageUrl);
              if (!img) {
                img = new Image();
                img.src = pixel.imageUrl;
                img.onload = () => {
                  imageCacheRef.current.set(pixel.imageUrl!, img!);
                  window.requestAnimationFrame(() => drawGrid(ctx));
                };
              } else {
                ctx.drawImage(img, x * cellSize, y * cellSize, cellSize, cellSize);
              }
            }
          }
          // Si no hay imagen asignada se podría dibujar un fallback (en este ejemplo no se sobrescribe).
        }
        // No se hace nada para celdas "available" ya que el fondo ya se pintó.
      }
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawGrid(ctx);
    // Se vuelve a dibujar cuando pixelData, zoom o cellSize cambian.
  }, [pixelData, zoom, cellSize]);

  return (
    <div className="relative w-full h-full bg-white">
      <div className="w-full h-full overflow-auto">
        <canvas
          key={zoom}
          ref={canvasRef}
          style={{
            width: `${columns * cellSize}px`,
            height: `${rows * cellSize}px`,
            imageRendering: 'pixelated',
            cursor: 'default'
          }}
        />
      </div>
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          zIndex: 1000,
          backgroundColor: 'transparent'
        }}
        className="p-2"
      >
        <div className="flex items-center space-x-2">
          <span className="text-black">{Math.round(zoom * 100)}%</span>
          <input
            type="range"
            min={initialZoom.toString()}
            max="3"
            step="0.01"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full"
          />
          <span className="text-black">Zoom</span>
        </div>
      </div>
    </div>
  );
};

export default PixelGridGallery;
