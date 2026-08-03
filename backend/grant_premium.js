import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function grantPremium() {
  const args = process.argv.slice(2);
  const email = args[0];
  const days = parseInt(args[1] || '30', 10);

  if (!email) {
    console.log('\n❌ Uso: node grant_premium.js <email_usuario> [dias=30]');
    console.log('Ejemplo: node grant_premium.js candidato@ejemplo.com 60\n');
    process.exit(1);
  }

  console.log(`\n🔍 Buscando usuario con email: "${email}"...`);

  // 1. Buscar en auth.users
  const { data: usersData, error: usersErr } = await supabaseAdmin.auth.admin.listUsers();
  if (usersErr) {
    console.error('Error buscando usuarios en auth:', usersErr.message);
    process.exit(1);
  }

  const targetUser = usersData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
  if (!targetUser) {
    console.error(`❌ No se encontró ningún usuario registrado con el email "${email}".`);
    process.exit(1);
  }

  const authId = targetUser.id;
  const expirationDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

  let updated = false;

  // 2. Intentar actualizar en candidatos
  const { data: cand, error: candErr } = await supabaseAdmin
    .from('candidatos')
    .select('id, nombre_completo')
    .eq('auth_id', authId)
    .maybeSingle();

  if (cand) {
    const { error: updateCandErr } = await supabaseAdmin
      .from('candidatos')
      .update({
        es_premium: true,
        premium_hasta: expirationDate
      })
      .eq('id', cand.id);

    if (updateCandErr) {
      console.error('Error actualizando candidato:', updateCandErr.message);
    } else {
      console.log(`✅ ¡PREMIUM ACTIVADO para Candidato: ${cand.nombre_completo || email}!`);
      console.log(`   Válido por ${days} días (hasta: ${expirationDate})`);
      updated = true;
    }
  }

  // 3. Intentar actualizar en empresas (o miembros)
  const { data: emp, error: empErr } = await supabaseAdmin
    .from('empresas')
    .select('id, razon_social')
    .eq('auth_id', authId)
    .maybeSingle();

  if (emp) {
    const { error: updateEmpErr } = await supabaseAdmin
      .from('empresas')
      .update({
        plan: 'premium',
        premium_hasta: expirationDate
      })
      .eq('id', emp.id);

    if (updateEmpErr) {
      console.error('Error actualizando empresa:', updateEmpErr.message);
    } else {
      console.log(`✅ ¡PREMIUM ACTIVADO para Empresa: ${emp.razon_social || email}!`);
      console.log(`   Válido por ${days} días (hasta: ${expirationDate})`);
      updated = true;
    }
  }

  if (!updated && !cand && !emp) {
    console.log(`⚠️  El usuario existe en Auth (${authId}), pero no tiene perfil en 'candidatos' ni 'empresas'.`);
  }

  console.log('\n✨ Operación finalizada con éxito.\n');
}

grantPremium();
