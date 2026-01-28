import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import ImageUpload from "@/components/ui/image-upload";
import { Loader2, ShieldCheck, AlertCircle, CheckCircle2, Clock, ChevronRight, ChevronLeft, User, FileText } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function HostVerification() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'none' | 'pending' | 'verified' | 'rejected'>('none');
    const [step, setStep] = useState(1);

    // Step 1: Profile Details
    const [profileData, setProfileData] = useState({
        full_name: "",
        phone: "",
        bio: "",
        business_address: ""
    });

    // Step 2: Documents
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
                .select("verification_status, verification_docs, full_name, phone, bio, business_address")
                .eq("id", user?.id)
                .single();

            if (error) throw error;

            if (data) {
                setStatus(data.verification_status || 'none');
                setProfileData({
                    full_name: data.full_name || "",
                    phone: data.phone || "",
                    bio: data.bio || "",
                    business_address: data.business_address || ""
                });
                if (data.verification_docs) {
                    setDocuments(data.verification_docs);
                }
            }
        } catch (error) {
            console.error("Error checking verification status:", error);
        }
    }

    const handleNext = () => {
        if (step === 1) {
            if (!profileData.full_name || !profileData.phone || !profileData.bio || !profileData.business_address) {
                toast({
                    variant: "destructive",
                    title: "Missing fields",
                    description: "Please fill in all profile details.",
                });
                return;
            }
            setStep(2);
        }
    };

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
                    // Profile fields
                    full_name: profileData.full_name,
                    phone: profileData.phone,
                    bio: profileData.bio,
                    business_address: profileData.business_address,

                    // Verification fields
                    verification_status: 'pending',
                    verification_docs: documents,
                    verification_submitted_at: new Date().toISOString(),
                })
                .eq("id", user?.id);

            if (error) throw error;

            // Notify Admins
            const { data: admins } = await supabase
                .from('profiles')
                .select('id')
                .eq('is_admin', true);

            if (admins && admins.length > 0) {
                const notifications = admins.map(admin => ({
                    user_id: admin.id,
                    title: 'New Host Verification',
                    message: `${profileData.full_name} has submitted verification documents.`,
                    type: 'system',
                    link: '/admin/users'
                }));

                await supabase.from('notifications').insert(notifications);
            }

            setStatus('pending');
            toast({
                title: "Verification submitted",
                description: "We'll review your details and documents shortly.",
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Host Verification</h1>
                    <p className="text-gray-500 mt-2">Complete your profile and verify identity to start hosting.</p>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium bg-gray-100 px-3 py-1 rounded-full">
                    <span className={step === 1 ? "text-primary" : "text-gray-500"}>1. Profile</span>
                    <span className="text-gray-300">/</span>
                    <span className={step === 2 ? "text-primary" : "text-gray-500"}>2. Documents</span>
                </div>
            </div>

            {status === 'rejected' && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Verification Failed</AlertTitle>
                    <AlertDescription>
                        Your previous verification attempt was rejected. Please ensure your details are correct and documents are clear.
                    </AlertDescription>
                </Alert>
            )}

            {step === 1 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Profile Details
                        </CardTitle>
                        <CardDescription>Tell us a bit about yourself. This information helps build trust.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Full Name</Label>
                                <Input
                                    placeholder="Legal full name"
                                    value={profileData.full_name}
                                    onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Phone Number</Label>
                                <Input
                                    placeholder="+27..."
                                    value={profileData.phone}
                                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Bio / About Me</Label>
                            <Textarea
                                placeholder="Tell guests about yourself, your hobbies or why you love hosting..."
                                className="h-32"
                                value={profileData.bio}
                                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Business / Residential Address</Label>
                            <Input
                                placeholder="Your physical address"
                                value={profileData.business_address}
                                onChange={(e) => setProfileData({ ...profileData, business_address: e.target.value })}
                            />
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button onClick={handleNext}>
                                Next Step
                                <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {step === 2 && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="w-5 h-5" />
                                    Government ID
                                </CardTitle>
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
                                <CardTitle className="flex items-center gap-2">
                                    <User className="w-5 h-5" />
                                    Selfie Check
                                </CardTitle>
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

                    <div className="flex justify-between pt-4">
                        <Button variant="outline" onClick={() => setStep(1)}>
                            <ChevronLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                        <Button size="lg" onClick={submitVerification} disabled={loading} className="w-full md:w-auto">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit for Verification
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
}
