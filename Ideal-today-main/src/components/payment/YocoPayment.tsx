import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface YocoPaymentProps {
    amountInCents: number;
    currency?: 'ZAR';
    name?: string;
    description?: string;
    image?: string;
    onSuccess: (token: string) => void;
    onError: (error: string) => void;
    className?: string;
}

const YOCO_SDK_URL = 'https://js.yoco.com/sdk/v1/yoco-sdk-web.js';
// Use the provided test key or fall back to a placeholder. 
// Ideally this comes from import.meta.env.VITE_YOCO_PUBLIC_KEY
const PUBLIC_KEY = import.meta.env.VITE_YOCO_PUBLIC_KEY || 'pk_test_ed3c54a6gOol69QA7f45';

export default function YocoPayment({
    amountInCents,
    currency = 'ZAR',
    name = 'Ideal Stay Booking',
    description,
    image,
    onSuccess,
    onError,
    className
}: YocoPaymentProps) {
    const [loading, setLoading] = useState(false);
    const [sdkLoaded, setSdkLoaded] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        // Check if script is already loaded
        if (document.querySelector(`script[src="${YOCO_SDK_URL}"]`)) {
            setSdkLoaded(true);
            return;
        }

        const script = document.createElement('script');
        script.src = YOCO_SDK_URL;
        script.async = true;
        script.onload = () => setSdkLoaded(true);
        script.onerror = () => {
            console.error('Failed to load Yoco SDK');
            toast({
                variant: "destructive",
                title: "Payment System Error",
                description: "Could not load the payment gateway. Please check your connection.",
            });
        };
        document.body.appendChild(script);

        return () => {
            // Optional: remove script on unmount if needed, but usually better to keep it
        };
    }, [toast]);

    const handlePay = () => {
        if (!sdkLoaded || !window.YocoSDK) {
            toast({
                variant: "destructive",
                title: "Not Ready",
                description: "Payment system is initializing. Please try again in a moment.",
            });
            return;
        }

        setLoading(true);

        try {
            const yoco = new window.YocoSDK({
                publicKey: PUBLIC_KEY,
            });

            yoco.showPopup({
                amountInCents,
                currency,
                name,
                description,
                image,
                callback: (result) => {
                    setLoading(false);
                    if (result.error) {
                        const errorMessage = result.error.message;
                        onError(errorMessage);
                        toast({
                            variant: "destructive",
                            title: "Payment Failed",
                            description: errorMessage,
                        });
                    } else {
                        onSuccess(result.id);
                    }
                },
            });
        } catch (error: any) {
            setLoading(false);
            const msg = error?.message || (typeof error === 'string' ? error : 'An unexpected error occurred');
            onError(msg);
            console.error("Yoco Error:", error);
        }
    };

    return (
        <Button
            onClick={handlePay}
            disabled={loading || !sdkLoaded}
            className={className}
        >
            {loading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                </>
            ) : (
                <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pay R{(amountInCents / 100).toFixed(2)}
                </>
            )}
        </Button>
    );
}
