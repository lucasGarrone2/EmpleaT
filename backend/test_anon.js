import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Creamos un cliente anon
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkAnon() {
    const { data, error } = await supabase
        .from('candidatos')
        .select('*')
        .limit(1);
        
    console.log("Anon Data:", data);
    if (error) console.error("Anon Error:", error);
}

checkAnon();
