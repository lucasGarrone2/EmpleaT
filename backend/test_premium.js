import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkUser() {
    const { data, error } = await supabaseAdmin
        .from('candidatos')
        .select('*')
        .eq('auth_id', '2e80b9ea-7776-4473-b9c9-f15e5f9c27b6');
        
    console.log("Data:", data);
    if (error) console.error("Error:", error);
}

checkUser();
