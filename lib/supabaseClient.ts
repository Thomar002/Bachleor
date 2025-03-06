import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://uagwfriznsbavoyuczjp.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZ3dmcml6bnNiYXZveXVjempwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4MzgyMTQsImV4cCI6MjA1NjQxNDIxNH0.5iLwxJkRzMW5jC9M2k7p6TwrcgEHutxAC9xcZbSL5CM"

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function getData() {
  const { data, error } = await supabase.from("Exams").select("id, created_at, description")
  if (error) {
    throw new Error(error.message)
  }
  return data
}

