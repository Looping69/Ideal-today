import { supabase } from './src/lib/supabase';

async function debugListings() {
    const { data, error } = await supabase.from('properties').select('*').limit(5);
    console.log('Error:', error);
    console.log('Data:', JSON.stringify(data, null, 2));
}

debugListings();
