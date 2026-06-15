// /* ----------------------------------------------
//    Supabase client: funciona en Vite, CRA y Node
//    ---------------------------------------------- */

// import { createClient } from '@supabase/supabase-js';

// // 1) Frontend (Vite) → import.meta.env
// // 2) Backend (Node)  → process.env  (dotenv)
// const url =
//   (import.meta as any).env?.VITE_SUPABASE_URL ??
//   process.env.SUPABASE_URL;

// const anonKey =
//   (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ??
//   process.env.SUPABASE_ANON_KEY;

// if (!url || !anonKey) {
//   throw new Error('⚠️  SUPABASE_URL / SUPABASE_ANON_KEY no definidos');
// }

// export const supabase = createClient(url, anonKey);




// src/services/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://thmcvzigpobvecajslut.supabase.co';
const supabaseKey = 'sb_publishable_YrtW-ldNyjskTtOr-kG3GQ_N1EL5y2M';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('⚠️ ¡Error! Las credenciales de Supabase no están configuradas.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

