import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testExpirationRoutine() {
    console.log("Iniciando prueba de rutina de expiración...");
    try {
        const now = new Date().toISOString();
        
        // 1. Buscar candidatos expirados
        const { data: expiradosBefore, error: selectError } = await supabaseAdmin
            .from('candidatos')
            .select('id, nombre_completo, premium_hasta, es_premium')
            .eq('es_premium', true)
            .lt('premium_hasta', now);

        if (selectError) {
            console.error("Error al buscar candidatos expirados:", selectError.message);
            return;
        }

        console.log(`Candidatos que deberían expirar: ${expiradosBefore.length}`);
        expiradosBefore.forEach(c => {
            console.log(`- ${c.nombre_completo} (Venció: ${c.premium_hasta})`);
        });

        // 2. Ejecutar actualización
        const { data: actualizados, error: updateError } = await supabaseAdmin
            .from('candidatos')
            .update({ es_premium: false })
            .eq('es_premium', true)
            .lt('premium_hasta', now)
            .select('id, nombre_completo');

        if (updateError) {
            console.error("Error al actualizar candidatos:", updateError.message);
            return;
        }

        console.log(`Rutina ejecutada. Candidatos degradados a estándar: ${actualizados ? actualizados.length : 0}`);
        if (actualizados && actualizados.length > 0) {
            actualizados.forEach(c => {
                console.log(`- ${c.nombre_completo} degradado.`);
            });
        }
        console.log("¡Prueba completada con éxito!");
    } catch (err) {
        console.error("Error inesperado en prueba:", err.message);
    }
}

testExpirationRoutine();
