import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import ImageUpload from "@/components/ui/image-upload";
import { Loader2, ShieldCheck, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function HostVerification() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'none' | 'pending' | 'verified' | 'rejected'>('none');
    const [documents, setDocuments] = useState<{
        id_front: string;
        id_back: string;
        selfie: string;
    }>({
        id_front: "",
        id_back: "",
        selfie: "",
    });

    useEffect(() => {
        if (user) {
            checkVerificationStatus();
        }
    }, [user]);

    async function checkVerificationStatus() {
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("verification_status, verification_docs")
                .eq("id", user?.id)
                .single();

            if (error) throw error;

            if (data) {
                setStatus(data.verification_status || 'none');
                if (data.verification_docs) {
                    setDocuments(data.verification_docs);
                }
            }
        } catch (error) {
            console.error("Error checking verification status:", error);
        }
    }

    async function submitVerification() {
        if (!documents.id_front || !documents.id_back || !documents.selfie) {
            toast({
                variant: "destructive",
                title: "Missing documents",
                description: "Please upload all required documents.",
            });
            return;
        }

        try {
            setLoading(true);
            const { error } = await supabase
                .from("profiles")
                .update({
                    verification_status: 'pending',
                    verification_docs: documents,
                    verification_submitted_at: new Date().toISOString(),
                })
                .eq("id", user?.id);

            if (error) throw error;

            setStatus('pending');
            toast({
                title: "Verification submitted",
                description: "We will review your documents shortly.",
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message,
            });
        } finally {
            setLoading(false);
        }
    }

    if (status === 'verified') {
        return (
            <div className="max-w-2xl mx-auto py-12 text-center space-y-6">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-12 h-12 text-green-600" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">You are verified!</h1>
                    <p className="text-gray-500 mt-2">Your identity has been confirmed. You have full access to all host features.</p>
                </div>
                <Alert className="bg-green-50 border-green-200 text-left max-w-md mx-auto">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">Verified Host Badge</AlertTitle>
                    <AlertDescription className="text-green-700">
                        A verified badge now appears on your profile and listings, increasing guest trust.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    if (status === 'pending') {
        return (
            <div className="max-w-2xl mx-auto py-12 text-center space-y-6">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <Clock className="w-12 h-12 text-blue-600" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Verification in Progress</h1>
                    <p className="text-gray-500 mt-2">Our team is currently reviewing your documents. This usually takes 24-48 hours.</p>
                </div>
                <Alert className="bg-blue-50 border-blue-200 text-left max-w-md mx-auto">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-800">Under Review</AlertTitle>
                    <AlertDescription className="text-blue-700">
                        You will be notified via email once your verification is complete.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Identity Verification</h1>
                <p className="text-gray-500 mt-2">Verify your identity to build trust with guests and unlock all features.</p>
            </div>

            {status === 'rejected' && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Verification Failed</AlertTitle>
                    <AlertDescription>
                        Your previous verification attempt was rejected. Please ensure your documents are clear and valid, then try again.
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Government ID</CardTitle>
                        <CardDescription>Upload a clear photo of your ID (Driver's License, Passport, or ID Card).</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Front of ID</label>
                            <ImageUpload
                                value={documents.id_front ? [documents.id_front] : []}
                                onChange={(urls) => setDocuments({ ...documents, id_front: urls[0] })}
                                onRemove={() => setDocuments({ ...documents, id_front: "" })}
                                bucket="verification"
                                maxFiles={1}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Back of ID</label>
                            <ImageUpload
                                value={documents.id_back ? [documents.id_back] : []}
                                onChange={(urls) => setDocuments({ ...documents, id_back: urls[0] })}
                                onRemove={() => setDocuments({ ...documents, id_back: "" })}
                                bucket="verification"
                                maxFiles={1}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Selfie Check</CardTitle>
                        <CardDescription>Take a selfie holding your ID to confirm it belongs to you.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Your Selfie</label>
                            <ImageUpload
                                value={documents.selfie ? [documents.selfie] : []}
                                onChange={(urls) => setDocuments({ ...documents, selfie: urls[0] })}
                                onRemove={() => setDocuments({ ...documents, selfie: "" })}
                                bucket="verification"
                                maxFiles={1}
                            />
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600">
                            <p className="font-medium mb-2">Tips for a good photo:</p>
                            <ul className="list-disc pl-4 space-y-1">
                                <li>Ensure good lighting</li>
                                <li>Face should be clearly visible</li>
                                <li>ID text must be readable</li>
                                <li>No sunglasses or hats</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end">
                <Button size="lg" onClick={submitVerification} disabled={loading} className="w-full md:w-auto">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit for Verification
                </Button>
            </div>
        </div>
    );
}
