import { createClient } from '@supabase/supabase-js'

// Vite exposes .env variables prefixed with VITE_ on import.meta.env.
// Make sure your .env file (in the project root, NOT inside src/) has:
//   VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
//   VITE_SUPABASE_ANON_KEY=your-anon-public-key
// and that you restart `npm run dev` after adding/changing them (Vite only
// reads .env at server start).
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // Don't throw — throwing here would take down the whole app with a blank
  // screen. Log loudly instead so it's obvious in the console what's wrong.
  console.error(
    '[supabase] Missing VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY. ' +
      'Check your .env file and restart the dev server.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)