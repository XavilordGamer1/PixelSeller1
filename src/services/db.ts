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

// --- NUEVA INTERFAZ PARA CUPONES ---
export interface Coupon {
  id: number;
  code: string;
  discount_percentage: number;
  is_active: boolean;
  uses_remaining: number;
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

/**
 * Registra una nueva compra en la tabla 'purchases'.
 */
export const logPurchase = async (
  paypalOrderId: string,
  pixelIds: number[]
): Promise<boolean> => {
  // Generar la fecha y hora en la zona horaria de Toronto
  const torontoDate = new Date().toLocaleString("en-CA", {
    timeZone: "America/Toronto",
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const { error } = await supabase
    .from('purchases')
    .insert([{
      paypal_order_id: paypalOrderId,
      pixel_ids: pixelIds,
      purchase_time_toronto: torontoDate,
    }]);

  if (error) {
    console.error('Error al registrar la compra:', error);
    // No bloqueamos el flujo si el log falla, pero lo registramos en consola.
    return false;
  }

  console.log(`Compra registrada con PayPal Order ID: ${paypalOrderId}`);
  return true;
};


/**
 * --- NUEVA FUNCIÓN ---
 * Verifica si un cupón es válido y devuelve sus datos.
 */
export const verifyCoupon = async (code: string): Promise<Coupon | null> => {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code)
    .eq('is_active', true)
    .gt('uses_remaining', 0)
    .single();

  if (error || !data) {
    if (error && error.code !== 'PGRST116') { // PGRST116 = No se encontraron filas
      console.error('Error al verificar el cupón:', error);
    }
    return null;
  }

  return data as Coupon;
};

/**
 * --- NUEVA FUNCIÓN ---
 * Decrementa el uso de un cupón después de una compra exitosa.
 * Utiliza una función RPC de Supabase para seguridad.
 */
export const redeemCoupon = async (couponId: number): Promise<boolean> => {
  const { error } = await supabase.rpc('decrement_coupon_uses', {
    coupon_id: couponId,
  });

  if (error) {
    console.error('Error al redimir el cupón:', error);
    return false;
  }
  return true;
};