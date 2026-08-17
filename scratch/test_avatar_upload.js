const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://awkreadldqmidcrrqukm.supabase.co';
const supabaseKey = 'sb_publishable_MluMrwkWs5-YedITa6ggNw_imK2nv8z';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("1. Testing storage upload...");
  const dummyBuffer = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
  const fileName = `test_avatar_${Date.now()}.png`;

  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(fileName, dummyBuffer, { contentType: 'image/png', upsert: true });

  if (error) {
    console.error("Avatars upload error:", error);
  } else {
    console.log("Avatars upload success:", data);
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
    console.log("Public URL:", publicUrl);
  }

  console.log("2. Testing profile update for eventzone114@gmail.com...");
  const { data: prof, error: pError } = await supabase
    .from('profiles')
    .update({ 
      full_name: 'Hachemi Mohamed', 
      job_title: 'CEO at Eventzone',
      updated_at: new Date().toISOString() 
    })
    .eq('email', 'eventzone114@gmail.com')
    .select();

  if (pError) {
    console.error("Profile update error:", pError);
  } else {
    console.log("Profile update success:", prof);
  }
}

test();
