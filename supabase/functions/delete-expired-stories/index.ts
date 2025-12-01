import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Delete expired stories
    const { data, error } = await supabase
      .from('stories')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select();

    if (error) throw error;

    console.log(`Deleted ${data?.length || 0} expired stories`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        deleted: data?.length || 0 
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error deleting expired stories:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
