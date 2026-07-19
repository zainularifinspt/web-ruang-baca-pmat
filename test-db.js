const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('theses').select('student_name, student_nim');
  if (error) {
    console.error(error);
    return;
  }
  
  const withoutNim = data.filter(d => !d.student_nim || d.student_nim.trim() === '');
  console.log(`Total theses: ${data.length}`);
  console.log(`Theses without NIM: ${withoutNim.length}`);
}

check();
