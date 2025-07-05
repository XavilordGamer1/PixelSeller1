// src/services/db.ts

import { supabase } from './supabaseClient';

export interface BlockOrigin {
  x: number;
  y: number;
}

export interface BlockSize {
  width: number;
  height: number;
}

export interface PixelData {
  id?: number;
  x: number;
  y: number;
  status: "available" | "sold";
  imageUrl: string | null;
  owner: string | null;
  blockOrigin?: BlockOrigin;
  blockSize?: BlockSize;
}

const ROWS = 134;
const COLUMNS = 320;
const TOTAL_PIXELS = ROWS * COLUMNS;

/**
 * Recupera todos los píxeles desde Supabase.
 */
export const getAllPixels = async (): Promise<PixelData[]> => {
  const { data, error } = await supabase
    .from('pixels')
    .select('*');

  if (error) {
    console.error('Error al obtener los píxeles:', error);
    return [];
  }

  return data as PixelData[];
};

/**
 * Inserta todos los píxeles iniciales en la base de datos si no existen.
 */
export const initializePixelDatabase = async (): Promise<void> => {
  console.log("Verificando si hay píxeles existentes...");
  const { count, error } = await supabase
    .from('pixels')
    .select('id', { count: 'exact', head: true });

  if (error) {
    console.error("Error al verificar la base de datos:", error);
    return;
  }

  if (count === TOTAL_PIXELS) {
    console.log("La base de datos ya está inicializada.");
    return;
  }

  console.log("Creando e insertando los píxeles...");

  const pixels: Omit<PixelData, 'id'>[] = [];

  for (let i = 0; i < TOTAL_PIXELS; i++) {
    const x = i % COLUMNS;
    const y = Math.floor(i / COLUMNS);
    pixels.push({
      x,
      y,
      status: "available",
      imageUrl: null,
      owner: null,
    });
  }

  const chunkSize = 1000;
  for (let i = 0; i < pixels.length; i += chunkSize) {
    const chunk = pixels.slice(i, i + chunkSize);
    const { error: insertError } = await supabase
      .from('pixels')
      .insert(chunk);

    if (insertError) {
      console.error("Error al insertar píxeles:", insertError);
      return;
    }
  }

  console.log("Píxeles inicializados correctamente.");
};

/**
 * Actualiza múltiples píxeles en la base de datos.
 */
export const updatePixelContent = async (
  updatedPixels: PixelData[]
): Promise<boolean> => {
  const { error } = await supabase
    .from('pixels')
    .upsert(updatedPixels, { onConflict: 'id' });

  if (error) {
    console.error('Error al actualizar píxeles:', error);
    return false;
  }

  return true;
};

/**
 * Marca un píxel como vendido y le asigna un dueño.
 */
export const savePixelPurchase = async (
  pixelId: number,
  owner: string
): Promise<boolean> => {
  const { error } = await supabase
    .from('pixels')
    .update({
      status: 'sold',
      owner,
    })
    .eq('id', pixelId);

  if (error) {
    console.error('Error al guardar la compra del píxel:', error);
    return false;
  }

  return true;
};
