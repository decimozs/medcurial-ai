import { createClient } from "@supabase/supabase-js"

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://hyzaxowpeumvtkfhtdds.supabase.co"
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "sb_publishable_JXFrJ3W7YSK45ymCWN6jAw_Y_0Ts6L9"

export const supabase = createClient(supabaseUrl, supabaseKey)
