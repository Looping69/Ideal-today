
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Need a service role key for admin ops
const adminEmail = process.env.VITE_ADMIN_EMAIL;
const adminPassword = process.env.VITE_ADMIN_PASSWORD;

if (!supabaseUrl || !supabaseServiceKey || !adminEmail || !adminPassword) {
    console.error('Missing environment variables. Ensure VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VITE_ADMIN_EMAIL, and VITE_ADMIN_PASSWORD are set.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function seedAdmin() {
    console.log(`Attempting to seed admin user: ${adminEmail}`);

    // 1. Check if user already exists in Auth
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error('Error listing users:', listError.message);
        return;
    }

    const existingUser = users.find(u => u.email === adminEmail);

    let userId;

    if (existingUser) {
        console.log('User already exists in Auth.');
        userId = existingUser.id;
    } else {
        // 2. Create user in Auth
        console.log('Creating user in Auth...');
        const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
            email: adminEmail,
            password: adminPassword,
            email_confirm: true
        });

        if (createError) {
            console.error('Error creating user:', createError.message);
            return;
        }

        userId = user.id;
        console.log(`User created with ID: ${userId}`);
    }

    // 3. Ensure profile has is_admin = true
    console.log('Ensuring profile has admin privileges...');
    const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_admin: true })
        .eq('id', userId);

    if (profileError) {
        // If update fails, maybe profile doesn't exist yet (signup trigger might be slow or failing)
        console.log('Profile update failed or profile not found. Attempting upsert...');
        const { error: upsertError } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                email: adminEmail,
                is_admin: true,
                full_name: 'Super Admin'
            }, { onConflict: 'id' });

        if (upsertError) {
            console.error('Error upserting profile:', upsertError.message);
            return;
        }
    }

    console.log('Admin user successfully seeded and privileged!');
}

seedAdmin();
