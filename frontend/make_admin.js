import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://amztsvqvsacubnezrurt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtenRzdnF2c2FjdWJuZXpydXJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzY2MzksImV4cCI6MjA4OTQ1MjYzOX0.hr9Ytr4gj2EXAKkMKFfHO9wLBzmoFC8Rls3TCUHWAmI'
)

async function makeAdmin() {
  console.log("Iniciando sesión...");
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'tohovos641@nazisat.com',
    password: 'Prueba1234#5'
  });

  if (error) {
    console.error("Error al iniciar sesión:", error.message);
    return;
  }

  console.log("Sesión iniciada. Actualizando rol a admin...");
  const { data: updateData, error: updateError } = await supabase.auth.updateUser({
    data: { rol: 'admin' }
  });

  if (updateError) {
    console.error("Error al actualizar metadatos:", updateError.message);
  } else {
    console.log("¡Éxito! El usuario ahora es administrador:", updateData.user.user_metadata);
  }
}

makeAdmin();
