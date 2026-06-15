// src/services/pixelService.ts
import {
  PixelData,
  getAllPixels,
  updatePixelContent as dbUpdatePixelContent,
  initializePixelDatabase,
  savePixelPurchase as dbSavePixelPurchase,
  logPurchase as dbLogPurchase, // <-- MODIFICACIÓN: Importar la nueva función
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

/**
 * --- NUEVA FUNCIÓN AÑADIDA ---
 * Registra los detalles de una compra en la base de datos.
 * @param paypalOrderId El ID de la orden de PayPal.
 * @param pixelIds Un array con los IDs de los píxeles comprados.
 */
export const logPurchase = async (
  paypalOrderId: string,
  pixelIds: number[]
): Promise<boolean> => {
  return await dbLogPurchase(paypalOrderId, pixelIds);
};