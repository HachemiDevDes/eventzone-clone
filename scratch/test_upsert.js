const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://awkreadldqmidcrrqukm.supabase.co';
const supabaseKey = 'sb_publishable_MluMrwkWs5-YedITa6ggNw_imK2nv8z';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpsert() {
  console.log("Fetching profile by email...");
  const { data: profs, error } = await supabase.from('profiles').select('*').eq('email', 'eventzone114@gmail.com');
  console.log("Profs:", profs);

  if (profs && profs.length > 0) {
    const p = profs[0];
    console.log("Found profile id:", p.id);

    // Test upsert with that profile id
    const payload = {
      id: p.id,
      email: p.email,
      full_name: 'Hachemi Mohamed',
      role: 'organizer',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      job_title: 'CEO at Eventzone',
      company_name: 'Eventzone',
      bio: 'test bio',
      location: 'Algiers',
      phone: '+213 781457511',
      interests: ['AI / ML'],
      social_links: [],
      updated_at: new Date().toISOString()
    };

    console.log("Attempting upsert with onConflict id...");
    const { data: upsertData, error: uError } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (uError) {
      console.error("UPSERT ERROR:", uError);
    } else {
      console.log("UPSERT SUCCESS! Updated avatar_url:", upsertData.avatar_url);
    }
  }
}

testUpsert();
