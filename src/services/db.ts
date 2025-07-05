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
 * ✅ FUNCIÓN CORREGIDA
 * Recupera TODOS los píxeles desde Supabase usando paginación.
 */
export const getAllPixels = async (): Promise<PixelData[]> => {
  const allPixels: PixelData[] = [];
  const CHUNK_SIZE = 1000; // El límite por defecto de Supabase
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('pixels')
      .select('*')
      .range(from, from + CHUNK_SIZE - 1); // Pedimos un rango de 1000

    if (error) {
      console.error('Error al obtener los píxeles:', error);
      return []; // Devuelve un array vacío en caso de error
    }

    if (data) {
      allPixels.push(...data);
    }

    // Si la respuesta tiene menos de 1000 filas, significa que hemos llegado al final
    if (!data || data.length < CHUNK_SIZE) {
      break;
    }

    // Preparamos la siguiente petición
    from += CHUNK_SIZE;
  }
  
  // Ordenamos los pixeles por su 'id' para asegurar el orden correcto en el grid
  allPixels.sort((a, b) => a.id! - b.id!);

  return allPixels as PixelData[];
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
    const x = (i % COLUMNS) + 1;
    const y = Math.floor(i / COLUMNS) + 1;
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