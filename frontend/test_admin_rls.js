import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://amztsvqvsacubnezrurt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtenRzdnF2c2FjdWJuZXpydXJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzY2MzksImV4cCI6MjA4OTQ1MjYzOX0.hr9Ytr4gj2EXAKkMKFfHO9wLBzmoFC8Rls3TCUHWAmI'
)

async function testAdminUpdate() {
  console.log("Iniciando sesión...");
  const { error: authErr } = await supabase.auth.signInWithPassword({
    email: 'tohovos641@nazisat.com',
    password: 'Prueba1234#5'
  });
  if (authErr) {
    console.error("Auth error:", authErr);
    return;
  }

  console.log("Sesión iniciada. Leyendo ofertas...");
  const { data: ofertas, error: readErr } = await supabase.from('ofertas').select('id, oculta_admin').limit(1);
  if (readErr || !ofertas || ofertas.length === 0) {
    console.error("Read error or no offers:", readErr);
    return;
  }

  const targetId = ofertas[0].id;
  const targetState = ofertas[0].oculta_admin;

  console.log(`Intentando actualizar la oferta ${targetId} a oculta_admin = ${!targetState}...`);
  const { data: updateData, error: updateErr } = await supabase
    .from('ofertas')
    .update({ oculta_admin: !targetState })
    .eq('id', targetId)
    .select();

  if (updateErr) {
    console.error("Update error (RLS PROBABLY BLOCKING):", updateErr);
  } else {
    console.log("Update success! Data returned:", updateData);
    if (updateData.length === 0) {
      console.log("WARNING: Update succeed without errors, but 0 rows were updated. This means RLS policy silently blocked the update.");
    }
  }
}

testAdminUpdate();
