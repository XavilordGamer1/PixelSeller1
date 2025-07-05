// src/services/pixelService.ts
import {
  PixelData,
  getAllPixels,
  updatePixelContent as dbUpdatePixelContent,
  initializePixelDatabase,
  savePixelPurchase as dbSavePixelPurchase,
} from './db';

/**
 * Llama a esta función solo una vez en el primer montaje del componente
 * raíz de tu app para inicializar los 42880 píxeles si aún no existen.
 */
export const setupPixelDatabase = async (): Promise<void> => {
  await initializePixelDatabase(); // sin parámetros
};

/**
 * Recupera todos los datos de píxeles desde Supabase.
 */
export const fetchPixelData = async (): Promise<PixelData[]> => {
  return await getAllPixels();
};

/**
 * Actualiza uno o varios píxeles con nuevos datos (ej. imagen o status).
 */
export const updatePixelContent = async (
  updatedPixels: PixelData[]
): Promise<boolean> => {
  return await dbUpdatePixelContent(updatedPixels);
};

/**
 * Registra la compra de un píxel individual.
 */
export const savePixelPurchase = async (
  pixel: PixelData,
  owner: string
): Promise<boolean> => {
  return await dbSavePixelPurchase(pixel.id!, owner);
};
