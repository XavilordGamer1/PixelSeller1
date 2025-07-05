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

const supabaseUrl = 'https://rcpqfggzgnkycngckbjm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjcHFmZ2d6Z25reWNuZ2NrYmptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NDc4NTAsImV4cCI6MjA2NTIyMzg1MH0.X--FyZMHWUWnbuf8ry6in65n2qKW3aHtoPHRhbR_YJI'; // Solo usa la "anon public"

export const supabase = createClient(supabaseUrl, supabaseKey);

