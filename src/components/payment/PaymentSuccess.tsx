import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, Loader2, Home, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { billingApi } from "@/lib/api/billing";
import type { PaymentSessionStatus } from "@/lib/api/types";

export default function PaymentSuccess() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [paymentSession, setPaymentSession] = useState<PaymentSessionStatus | null>(null);
    const verifiedRef = useRef(false);

    useEffect(() => {
        const verifyPayment = async () => {
            if (verifiedRef.current) return;
            verifiedRef.current = true;

            const paymentSessionId = searchParams.get('paymentSessionId');

            if (!paymentSessionId) {
                setStatus('error');
                return;
            }

            try {
                for (let attempt = 0; attempt < 8; attempt += 1) {
                    const session = await billingApi.getSessionStatus({ paymentSessionId });
                    setPaymentSession(session);

                    if (session.status === 'succeeded' && session.booking?.status === 'confirmed') {
                        setStatus('success');
                        toast({
                            title: "Booking Confirmed!",
                            description: "Your trip is all set.",
                            duration: 5000,
                        });
                        return;
                    }

                    if (session.status === 'failed' || session.status === 'canceled') {
                        setStatus('error');
                        return;
                    }

                    await new Promise((resolve) => setTimeout(resolve, 1500));
                }
                setStatus('error');

            } catch (err) {
                console.error("Verification error:", err);
                setStatus('error');
            }
        };

        verifyPayment();
    }, [searchParams, toast]);

    if (status === 'verifying') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <h2 className="text-xl font-semibold text-gray-900">Finalizing your booking...</h2>
                <p className="text-gray-500 mt-2">Please verify your payment details.</p>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-2xl">⚠️</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
                    <p className="text-gray-600 mb-8">
                        We verify your payment but couldn't confirm the booking automatically. Please contact support if you were charged.
                    </p>
                    <div className="space-y-3">
                        <Button onClick={() => navigate('/contact')} variant="outline" className="w-full">
                            Contact Support
                        </Button>
                        <Button onClick={() => navigate('/')} variant="ghost" className="w-full">
                            Return Home
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />

            <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl shadow-indigo-100 border border-indigo-50 max-w-lg w-full text-center relative z-10 animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8 animate-in bounce-in duration-700 delay-200">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-4">You're all set!</h1>
                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                    Your booking at <span className="font-semibold text-gray-900">{paymentSession?.booking?.property?.title}</span> has been confirmed.
                </p>

                <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left border border-gray-100">
                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                        <span className="text-gray-500">Total Paid</span>
                        <span className="font-bold text-lg">R{paymentSession?.booking?.total_price}</span>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex justify-between">
                            <span>Check-in</span>
                            <span className="font-medium text-gray-900">{paymentSession?.booking?.check_in ? new Date(paymentSession.booking.check_in).toLocaleDateString() : "—"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Check-out</span>
                            <span className="font-medium text-gray-900">{paymentSession?.booking?.check_out ? new Date(paymentSession.booking.check_out).toLocaleDateString() : "—"}</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <Button onClick={() => navigate('/trips')} className="w-full h-12 text-lg font-semibold shadow-lg shadow-indigo-200 hover:shadow-xl transition-all">
                        <Receipt className="w-5 h-5 mr-2" />
                        View My Trips
                    </Button>
                    <Button onClick={() => navigate('/')} variant="ghost" className="w-full h-12 hover:bg-gray-50">
                        <Home className="w-5 h-5 mr-2" />
                        Back to Home
                    </Button>
                </div>
            </div>
        </div>
    );
}
