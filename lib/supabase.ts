import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://udzttyijzjjlvcgpznfa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkenR0eWlqempqbHZjZ3B6bmZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNzYwNzAsImV4cCI6MjA3OTc1MjA3MH0.rF-RPAOT4pWLjhSbyXxdmNt2elg_SPuiAPvX2X9Lao8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

