import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function Diagnose() {
    const [results, setResults] = useState<any>({});
    const [loading, setLoading] = useState(true);

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

        setResults(res);
        setLoading(false);
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">System Diagnosis</h1>

            {loading ? (
                <div>Running tests...</div>
            ) : (
                <div className="space-y-6">
                    <div className={`p-4 rounded border ${results.profilesTable?.status === 'ok' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <h3 className="font-bold">Profiles Table Check</h3>
                        <p>{results.profilesTable?.message}</p>
                        {results.profilesTable?.details && (
                            <pre className="mt-2 text-xs overflow-auto bg-white p-2 rounded border">
                                {JSON.stringify(results.profilesTable.details, null, 2)}
                            </pre>
                        )}
                    </div>

                    <div className={`p-4 rounded border ${results.authSignup?.status === 'ok' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <h3 className="font-bold">Auth Signup Check</h3>
                        <p>{results.authSignup?.message}</p>
                        {results.authSignup?.details && (
                            <pre className="mt-2 text-xs overflow-auto bg-white p-2 rounded border">
                                {JSON.stringify(results.authSignup.details, null, 2)}
                            </pre>
                        )}
                    </div>

                    <button
                        onClick={runDiagnosis}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Rerun Diagnosis
                    </button>
                </div>
            )}
        </div>
    );
}
