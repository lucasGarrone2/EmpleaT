import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
    console.log("Testing quiz_intentos...");
    const { data, error } = await supabaseAdmin.from('quiz_intentos').select('*').limit(1);
    if (error) {
        console.error("DB Error:", error);
    } else {
        console.log("Success! Data:", data);
    }
}
test();
