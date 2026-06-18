import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    console.error("Faltan variables de entorno en el archivo .env.");
    process.exit(1);
}

// Cliente administrador para setup y verificación bypass de RLS
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
});

// Clientes para simular candidatos y reclutadores a través de la API pública
const candidateClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false }
});

const recruiterClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false }
});

const CANDIDATE_EMAIL = 'test_candidate_appsec@empleat.com';
const RECRUITER_EMAIL = 'test_recruiter_appsec@empleat.com';
const TEST_PASSWORD = 'AppSecTestPassword123!';

async function cleanup(candAuthId, recAuthId, companyId, offerId) {
    console.log("Limpiando datos de prueba...");
    try {
        if (offerId) {
            await supabaseAdmin.from('postulaciones').delete().eq('oferta_id', offerId);
            await supabaseAdmin.from('ofertas').delete().eq('id', offerId);
        }
        if (companyId) {
            await supabaseAdmin.from('empresa_miembros').delete().eq('empresa_id', companyId);
            await supabaseAdmin.from('empresas').delete().eq('id', companyId);
        }
        if (candAuthId) {
            await supabaseAdmin.from('candidatos').delete().eq('auth_id', candAuthId);
            await supabaseAdmin.auth.admin.deleteUser(candAuthId);
        }
        if (recAuthId) {
            await supabaseAdmin.auth.admin.deleteUser(recAuthId);
        }
        console.log("Limpieza completada.");
    } catch (e) {
        console.error("Error durante la limpieza:", e.message);
    }
}

async function runTests() {
    let candAuthId, recAuthId, candidateId, companyId, offerId;

    try {
        console.log("=== INICIANDO CONFIGURACIÓN DE PRUEBAS DE SEGURIDAD ===");

        // 1. Limpiar cualquier basura previa
        const { data: existingCand } = await supabaseAdmin.from('candidatos').select('auth_id').eq('email', CANDIDATE_EMAIL).maybeSingle();
        if (existingCand) {
            await cleanup(existingCand.auth_id, null, null, null);
        }
        
        // 2. Crear usuario Candidato
        console.log("Creando usuario candidato de prueba...");
        const { data: candAuth, error: candAuthErr } = await supabaseAdmin.auth.admin.createUser({
            email: CANDIDATE_EMAIL,
            password: TEST_PASSWORD,
            email_confirm: true,
            user_metadata: { rol: 'candidato' }
        });
        if (candAuthErr) throw candAuthErr;
        candAuthId = candAuth.user.id;

        // Insertar en la tabla candidatos
        const { data: candProfile, error: candProfileErr } = await supabaseAdmin.from('candidatos').insert({
            auth_id: candAuthId,
            nombre_completo: 'Test Candidate AppSec',
            email: CANDIDATE_EMAIL,
            es_premium: false
        }).select('id').single();
        if (candProfileErr) throw candProfileErr;
        candidateId = candProfile.id;

        // 3. Crear usuario Reclutador
        console.log("Creando usuario reclutador de prueba...");
        const { data: recAuth, error: recAuthErr } = await supabaseAdmin.auth.admin.createUser({
            email: RECRUITER_EMAIL,
            password: TEST_PASSWORD,
            email_confirm: true,
            user_metadata: { rol: 'empresa' }
        });
        if (recAuthErr) throw recAuthErr;
        recAuthId = recAuth.user.id;

        // Crear Empresa
        const { data: company, error: companyErr } = await supabaseAdmin.from('empresas').insert({
            auth_id: recAuthId,
            nombre: 'AppSec Test Company',
            cuit: '20999999999',
            ubicacion: 'Cordoba'
        }).select('id').single();
        if (companyErr) throw companyErr;
        companyId = company.id;

        // Asociar reclutador a la empresa (el trigger de empresas ya lo asocia como admin, pero lo aseguramos)
        const { error: memberErr } = await supabaseAdmin.from('empresa_miembros').insert({
            auth_id: recAuthId,
            empresa_id: companyId,
            rol: 'reclutador'
        }).select();
        if (memberErr && memberErr.code !== '23505') throw memberErr; // Ignorar si ya se insertó por trigger

        // Crear Oferta
        const { data: offer, error: offerErr } = await supabaseAdmin.from('ofertas').insert({
            empresa_id: companyId,
            titulo: 'AppSec Security Engineer Position',
            modalidad: 'Remoto',
            descripcion: 'Test offer for security hardening validation.',
            estado: 'Publicada',
            salario_min_usd: 1000
        }).select('id').single();
        if (offerErr) throw offerErr;
        offerId = offer.id;

        console.log("Configuración exitosa. Iniciando sesión de clientes...");

        // 4. Iniciar sesión con clientes
        const { error: candLoginErr } = await candidateClient.auth.signInWithPassword({
            email: CANDIDATE_EMAIL,
            password: TEST_PASSWORD
        });
        if (candLoginErr) throw candLoginErr;

        const { error: recLoginErr } = await recruiterClient.auth.signInWithPassword({
            email: RECRUITER_EMAIL,
            password: TEST_PASSWORD
        });
        if (recLoginErr) throw recLoginErr;

        console.log("=== INICIANDO CASOS DE PRUEBA ===");

        // --- TEST 1: Candidato intenta postularse forzando estado 'Seleccionado' y boost 'aprobado' ---
        console.log("\n[TEST 1] Candidato intenta postularse forzando estado = 'Seleccionado'...");
        const { error: postInsertErr } = await candidateClient.from('postulaciones').insert({
            candidato_id: candidateId,
            oferta_id: offerId,
            porcentaje_match_calculado: 85,
            estado: 'Seleccionado',
            match_boost_estado: 'aprobado'
        });
        if (postInsertErr) {
            console.error("Error al insertar postulación:", postInsertErr.message);
        }

        // Verificar el estado guardado real
        const { data: post1, error: fetch1Err } = await supabaseAdmin
            .from('postulaciones')
            .select('*')
            .eq('candidato_id', candidateId)
            .eq('oferta_id', offerId)
            .single();

        if (fetch1Err) throw fetch1Err;
        
        if (post1.estado === 'Postulado' && post1.match_boost_estado === 'pendiente') {
            console.log("-> ✅ ÉXITO: El trigger coaccionó el estado inicial a 'Postulado' y el boost a 'pendiente'.");
        } else {
            console.error("-> ❌ FALLO: Se permitieron valores no autorizados en el insert:", post1);
        }

        // --- TEST 2: Candidato intenta cambiar el estado a 'Seleccionado' vía UPDATE ---
        console.log("\n[TEST 2] Candidato intenta actualizar el estado a 'Seleccionado'...");
        const { error: candUpdateErr } = await candidateClient
            .from('postulaciones')
            .update({ estado: 'Seleccionado' })
            .eq('candidato_id', candidateId)
            .eq('oferta_id', offerId);
        
        if (candUpdateErr) console.warn("Aviso update candidato:", candUpdateErr.message);

        // Verificar
        const { data: post2 } = await supabaseAdmin.from('postulaciones').select('*').eq('candidato_id', candidateId).eq('oferta_id', offerId).single();
        if (post2.estado === 'Postulado') {
            console.log("-> ✅ ÉXITO: El trigger revirtió/bloqueó el intento de cambiar el estado.");
        } else {
            console.error("-> ❌ FALLO: El candidato pudo cambiar su propio estado a:", post2.estado);
        }

        // --- TEST 3: Candidato actualiza su match_boost_estado (permitido para quiz) ---
        console.log("\n[TEST 3] Candidato actualiza match_boost_estado a 'aprobado'...");
        const { error: candBoostErr } = await candidateClient
            .from('postulaciones')
            .update({ match_boost_estado: 'aprobado' })
            .eq('candidato_id', candidateId)
            .eq('oferta_id', offerId);
        
        if (candBoostErr) console.error("Error update boost:", candBoostErr.message);

        // Verificar
        const { data: post3 } = await supabaseAdmin.from('postulaciones').select('*').eq('candidato_id', candidateId).eq('oferta_id', offerId).single();
        if (post3.match_boost_estado === 'aprobado') {
            console.log("-> ✅ ÉXITO: El candidato pudo actualizar su match_boost_estado correctamente.");
        } else {
            console.error("-> ❌ FALLO: No se guardó el cambio de match_boost_estado:", post3.match_boost_estado);
        }

        // --- TEST 4: Reclutador actualiza el estado a 'Seleccionado' (permitido) ---
        console.log("\n[TEST 4] Reclutador actualiza el estado a 'Seleccionado'...");
        const { error: recUpdateErr } = await recruiterClient
            .from('postulaciones')
            .update({ estado: 'Seleccionado' })
            .eq('candidato_id', candidateId)
            .eq('oferta_id', offerId);

        if (recUpdateErr) console.error("Error reclutador update estado:", recUpdateErr.message);

        // Verificar
        const { data: post4 } = await supabaseAdmin.from('postulaciones').select('*').eq('candidato_id', candidateId).eq('oferta_id', offerId).single();
        if (post4.estado === 'Seleccionado') {
            console.log("-> ✅ ÉXITO: El reclutador cambió el estado exitosamente.");
        } else {
            console.error("-> ❌ FALLO: El reclutador no pudo cambiar el estado.");
        }

        // --- TEST 5: Reclutador intenta sabotear/cambiar el match_boost_estado ---
        console.log("\n[TEST 5] Reclutador intenta revertir el match_boost_estado del candidato a 'pendiente'...");
        const { error: recSabotageErr } = await recruiterClient
            .from('postulaciones')
            .update({ match_boost_estado: 'pendiente' })
            .eq('candidato_id', candidateId)
            .eq('oferta_id', offerId);

        if (recSabotageErr) console.warn("Aviso sabotaje reclutador:", recSabotageErr.message);

        // Verificar
        const { data: post5 } = await supabaseAdmin.from('postulaciones').select('*').eq('candidato_id', candidateId).eq('oferta_id', offerId).single();
        if (post5.match_boost_estado === 'aprobado') {
            console.log("-> ✅ ÉXITO: El trigger bloqueó/revirtió el intento del reclutador de alterar el quiz.");
        } else {
            console.error("-> ❌ FALLO: El reclutador pudo alterar el match_boost_estado a:", post5.match_boost_estado);
        }

        console.log("\n=== PRUEBAS FINALIZADAS ===");

    } catch (e) {
        console.error("Error ejecutando pruebas:", e);
    } finally {
        // Limpiar
        await cleanup(candAuthId, recAuthId, companyId, offerId);
    }
}

runTests();
