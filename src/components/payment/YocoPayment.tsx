import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
const PUBLIC_KEY = import.meta.env.VITE_YOCO_PUBLIC_KEY || '';

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
    const [showOverlay, setShowOverlay] = useState(false);
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
        setShowOverlay(true);

        // Setup MutationObserver to catch the Yoco popup when it's added to DOM
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node instanceof HTMLElement) {
                        // Check for likely Yoco popup characteristics
                        const isYoco =
                            node.classList.contains('yoco-popup-wrapper') ||
                            node.querySelector('iframe[src*="yoco"]') ||
                            node.style.position === 'fixed';

                        if (isYoco) {
                            node.style.zIndex = '2147483647';
                            node.style.position = 'fixed';
                        }
                    }
                });
            });
        });

        observer.observe(document.body, { childList: true, subtree: false });

        // Backup: Iterate identifying likely Yoco elements and force z-index
        const forceZIndex = () => {
            // Target by common Yoco classes or generic structures
            const candidates = document.querySelectorAll('div[style*="z-index"], iframe[src*="yoco"], .yoco-overlay, .yoco-modal');
            candidates.forEach((el) => {
                if (el instanceof HTMLElement) {
                    // Heuristic: if it looks like a modal/overlay added recently
                    const z = parseInt(el.style.zIndex || '0');
                    if (z > 0 || el.tagName === 'IFRAME') {
                        el.style.zIndex = '2147483647';
                    }
                }
            });
        };

        // Run forceZIndex repeatedly for a short duration
        const interval = setInterval(forceZIndex, 100);
        setTimeout(() => clearInterval(interval), 3000);

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
                    setShowOverlay(false);
                    observer.disconnect();
                    clearInterval(interval);

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
            setShowOverlay(false);
            observer.disconnect();
            clearInterval(interval);
            onError(error.message || 'An unexpected error occurred');
            console.error("Yoco Error:", error);
        }
    };

    // Overlay Portal - renders at body level to ensure proper z-index
    // We keep this just behind the Yoco popup (max int - 1)
    const overlay = showOverlay ? createPortal(
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            style={{ zIndex: 2147483646 }}
            onClick={() => {
                // Warning: Yoco popup handles its own closing, so clicking this 
                // might close the overlay but leave Yoco open if not synchronized.
                // It's safer to let Yoco handle strict closing or only close if user cancels specifically.
                // But for UX we allow closing if it seems stuck.
            }}
        />,
        document.body
    ) : null;

    return (
        <>
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
            {overlay}
        </>
    );
}
