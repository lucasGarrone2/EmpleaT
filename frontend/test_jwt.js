import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://amztsvqvsacubnezrurt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtenRzdnF2c2FjdWJuZXpydXJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzY2MzksImV4cCI6MjA4OTQ1MjYzOX0.hr9Ytr4gj2EXAKkMKFfHO9wLBzmoFC8Rls3TCUHWAmI'
)

async function testJWT() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'tohovos641@nazisat.com',
    password: 'Prueba1234#5'
  });
  console.log("Session:", JSON.stringify(data.session, null, 2));
}
testJWT();
