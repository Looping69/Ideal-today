
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

export default function DevAuth() {
    const [status, setStatus] = useState('Initializing...');
    const navigate = useNavigate();
    const { toast } = useToast();

    useEffect(() => {
        const init = async () => {
            const email = import.meta.env.VITE_ADMIN_EMAIL;
            const password = import.meta.env.VITE_ADMIN_PASSWORD;

            if (!email || !password) {
                setStatus('Error: Missing admin credentials in environment.');
                return;
            }

            setStatus('Attempting login...');

            // Try to sign in first
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (!signInError && signInData.session) {
                setStatus('Login successful! Redirecting...');
                toast({ title: 'Success', description: 'Logged in as Admin' });
                setTimeout(() => navigate('/admin'), 1000);
                return;
            }

            // If login fails, try to sign up
            if (signInError && signInError.message.includes('Invalid login credentials')) {
                // This could mean wrong password OR user doesn't exist.
                // Let's try to Sign Up just in case.
                setStatus('Login failed. Attempting to create admin user...');

                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                });

                if (signUpError) {
                    console.error("Signup error:", signUpError);
                    // If user already registered but maybe email not confirmed?
                    if (signUpError.message.includes('User already registered')) {
                        setStatus('User exists but login failed. Check password or email confirmation.');
                    } else {
                        setStatus(`Error creating user: ${signUpError.message}`);
                    }
                    return;
                }

                if (signUpData.user) {
                    setStatus('User created! Please check your email for confirmation (if needed) or check logs.');
                    // Auto-login might happen if email confirmation is off
                    if (signUpData.session) {
                        setTimeout(() => navigate('/admin'), 1000);
                    } else {
                        setStatus('User created. Please confirm email or check console.');
                    }
                }
            } else {
                setStatus(`Login Error: ${signInError?.message}`);
            }
        };

        init();
    }, [navigate, toast]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <Card className="w-[400px]">
                <CardHeader>
                    <CardTitle>Dev Admin Auth</CardTitle>
                    <CardDescription>Automatic setup for local admin development</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        {status.includes('...') && <Loader2 className="h-4 w-4 animate-spin" />}
                        <span>{status}</span>
                    </div>

                    <div className="text-xs text-gray-400 mt-4">
                        <p>Email: {import.meta.env.VITE_ADMIN_EMAIL}</p>
                        <p>Password: {import.meta.env.VITE_ADMIN_PASSWORD?.replace(/./g, '*')}</p>
                    </div>

                    <Button
                        variant="outline"
                        onClick={() => navigate('/')}
                        className="w-full mt-4"
                    >
                        Return Home
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
