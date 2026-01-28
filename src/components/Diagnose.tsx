import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { SETUP_SQL } from "@/lib/setup_sql";

export default function Diagnose() {
    const [results, setResults] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        runDiagnosis();
    }, []);

    const runDiagnosis = async () => {
        setLoading(true);
        const res: any = {};

        // 1. Check connection
        try {
            const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
            if (error) {
                res.profilesTable = { status: 'error', message: error.message, details: error };
            } else {
                res.profilesTable = { status: 'ok', message: 'Table exists and is accessible' };
            }
        } catch (e: any) {
            res.profilesTable = { status: 'exception', message: e.message };
        }

        // 2. Check Auth (Try to sign up a random user to see if it 500s)
        try {
            const email = `test_diag_${Date.now()}@example.com`;
            const { data, error } = await supabase.auth.signUp({
                email,
                password: 'password123',
            });

            if (error) {
                res.authSignup = { status: 'error', message: error.message, details: error };
            } else {
                res.authSignup = { status: 'ok', message: 'Signup successful', user: data.user?.id };
            }
        } catch (e: any) {
            res.authSignup = { status: 'exception', message: e.message };
        }

        // 3. Check for new columns
        try {
            // Try selecting the new columns
            const { error } = await supabase.from('profiles').select('phone, bio, business_address, verification_status, verification_docs').limit(1);
            if (error) {
                res.profileColumns = { status: 'error', message: 'New profile columns missing', details: error };
            } else {
                res.profileColumns = { status: 'ok', message: 'New profile columns exist' };
            }
        } catch (e: any) {
            res.profileColumns = { status: 'exception', message: e.message };
        }

        try {
            // Try selecting the new columns
            const { error } = await supabase.from('properties').select('approval_status, rejection_reason').limit(1);
            if (error) {
                res.propertyColumns = { status: 'error', message: 'New property columns missing', details: error };
            } else {
                res.propertyColumns = { status: 'ok', message: 'New property columns exist' };
            }
        } catch (e: any) {
            res.propertyColumns = { status: 'exception', message: e.message };
        }

        // 5. Check Buckets
        try {
            const { data: buckets, error } = await supabase.storage.listBuckets();
            if (error) {
                res.buckets = { status: 'error', message: 'Could not list buckets', details: error };
            } else {
                const hasVerification = buckets.some(b => b.name === 'verification');
                res.buckets = {
                    status: hasVerification ? 'ok' : 'warning',
                    message: hasVerification ? 'All required buckets exist' : 'Missing buckets',
                    details: { verification: hasVerification }
                };
            }
        } catch (e: any) {
            res.buckets = { status: 'exception', message: e.message };
        }

        setResults(res);
        setLoading(false);
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">System Diagnosis</h1>
                <button
                    onClick={runDiagnosis}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Rerun Diagnosis
                </button>
            </div>

            {loading ? (
                <div>Running tests...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className={`p-4 rounded border ${results.profilesTable?.status === 'ok' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <h3 className="font-bold">Profiles Table Check</h3>
                        <p>{results.profilesTable?.message}</p>
                        {results.profilesTable?.details && <pre className="mt-2 text-xs overflow-auto bg-white p-2 rounded border">{JSON.stringify(results.profilesTable.details, null, 2)}</pre>}
                    </div>

                    <div className={`p-4 rounded border ${results.authSignup?.status === 'ok' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <h3 className="font-bold">Auth Signup Check</h3>
                        <p>{results.authSignup?.message}</p>
                        {results.authSignup?.details && <pre className="mt-2 text-xs overflow-auto bg-white p-2 rounded border">{JSON.stringify(results.authSignup.details, null, 2)}</pre>}
                    </div>

                    <div className={`p-4 rounded border ${results.profileColumns?.status === 'ok' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <h3 className="font-bold">New Profile Columns</h3>
                        <p>{results.profileColumns?.message}</p>
                        {results.profileColumns?.details && <pre className="mt-2 text-xs overflow-auto bg-white p-2 rounded border">{JSON.stringify(results.profileColumns.details, null, 2)}</pre>}
                    </div>

                    <div className={`p-4 rounded border ${results.propertyColumns?.status === 'ok' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <h3 className="font-bold">New Property Columns</h3>
                        <p>{results.propertyColumns?.message}</p>
                        {results.propertyColumns?.details && <pre className="mt-2 text-xs overflow-auto bg-white p-2 rounded border">{JSON.stringify(results.propertyColumns.details, null, 2)}</pre>}
                    </div>

                    <div className={`p-4 rounded border ${results.buckets?.status === 'ok' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                        <h3 className="font-bold">Storage Buckets</h3>
                        <p>{results.buckets?.message}</p>
                        <ul className="list-disc pl-4 text-sm mt-2">
                            <li>Verification Bucket: {results.buckets?.details?.verification ? '✅' : '❌'}</li>
                        </ul>
                    </div>
                </div>
            )}

            <div className="border rounded-xl overflow-hidden bg-slate-900 text-slate-50">
                <div className="p-4 bg-slate-800 flex justify-between items-center border-b border-slate-700">
                    <h3 className="font-bold">Database Setup / Migration SQL</h3>
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(SETUP_SQL);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                        }}
                        className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded transition-colors"
                    >
                        {copied ? "Copied!" : "Copy SQL"}
                    </button>
                </div>
                <div className="p-4 overflow-auto max-h-[400px]">
                    <pre className="text-xs font-mono">{SETUP_SQL}</pre>
                </div>
                <div className="p-4 bg-slate-800 text-sm text-slate-300">
                    <p>If columns are missing, copy this SQL and run it in the <a href="https://supabase.com/dashboard/project/_/sql" target="_blank" className="underline text-blue-400">Supabase SQL Editor</a>.</p>
                </div>
            </div>
        </div>
    );
}
