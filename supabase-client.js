// supabase-client.js
//
// Cria a conexão com o Supabase, usada pelo supabase-api-shim.js.
//
// A key abaixo é a "Publishable key" (segura de deixar visível no
// código do site) — NUNCA a "Secret key" (essa fica só no script
// de migração, rodado localmente no computador).

const SUPABASE_URL = 'https://cmakcxbcxdeaeweugnow.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_X-PEpYX93QqANriIZlfMgw_44RX9j2N';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
