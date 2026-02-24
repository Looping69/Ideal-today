import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2, Sparkles, Smartphone, ShieldCheck, Video, BarChart4, Users, Share2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { getErrorMessage } from "@/lib/errors";

type PlanTier = 'free' | 'standard' | 'professional' | 'premium';

interface PlanFeature {
    text: string;
    included: boolean;
}

interface Plan {
    id: PlanTier;
    name: string;
    price: string;
    description: string;
    features: PlanFeature[];
    highlight?: string;
    color: string;
    cta: string;
}

const plans: Plan[] = [
    {
        id: 'free',
        name: "Free Plan",
        price: "R0",
        description: "Remove all onboarding resistance. Start hosting today.",
        color: "bg-slate-100",
        cta: "Basic",
        features: [
            { text: "1 Property Listing", included: true },
            { text: "Basic Photos", included: true },
            { text: "Basic Description + Amenities", included: true },
            { text: "Listed in Search Results", included: true },
            { text: "Direct Enquiries", included: true },
            { text: "No Commission", included: true },
            { text: "Showcase Video Slot", included: false },
            { text: "Verified Host Badge", included: false },
        ]
    },
    {
        id: 'standard',
        name: "Standard",
        price: "R149",
        description: "The sweet spot. Credibility, visibility, and volume.",
        highlight: "Most Popular",
        color: "bg-blue-50 border-blue-200",
        cta: "Upgrade to Standard",
        features: [
            { text: "Everything in Free", included: true },
            { text: "Higher Search Ranking", included: true },
            { text: "Full Photo Gallery", included: true },
            { text: "Showcase Video Slot", included: true },
            { text: "Monthly Social Visibility", included: true },
            { text: "Verified Host Badge", included: true },
            { text: "Holiday Campaign Priority", included: true },
            { text: "Access to Promotions", included: true },
        ]
    },
    {
        id: 'professional',
        name: "Professional",
        price: "R350",
        description: "Scale your reach with advanced social & ranking tools.",
        color: "bg-blue-50/50 border-blue-100",
        cta: "Go Professional",
        features: [
            { text: "Everything in Standard", included: true },
            { text: "2 Social Promos/mo", included: true },
            { text: "Advanced Analytics", included: true },
            { text: "Custom Marketing Templates", included: true },
            { text: "Professional Video", included: false },
            { text: "Featured in 'Top Picks'", included: false },
            { text: "Direct WhatsApp Support", included: false },
        ]
    },
    {
        id: 'premium',
        name: "Premium",
        price: "R399",
        description: "Top-tier professional tools for serious hosts.",
        highlight: "Best Value",
        color: "bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200",
        cta: "Go Premium",
        features: [
            { text: "Everything in Standard", included: true },
            { text: "Professional Video", included: true },
            { text: "Full Social Promo (1/mo)", included: true },
            { text: "Featured in 'Top Picks'", included: true },
            { text: "Holiday Traffic Priority", included: true },
            { text: "Direct WhatsApp Support", included: true },
            { text: "Custom Marketing Templates", included: true },
            { text: "Partner Deals Priority", included: true },
        ]
    }
];

export default function HostSubscription() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loadingPlan, setLoadingPlan] = useState<PlanTier | null>(null);
    const [fetchingPlan, setFetchingPlan] = useState(true);
    const [currentPlan, setCurrentPlan] = useState<PlanTier>('free');
    const [searchParams] = useSearchParams();

    const performUpgrade = useCallback(async (planId: PlanTier) => {
        if (!user) return;
        setLoadingPlan(planId);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ host_plan: planId })
                .eq('id', user.id);

            if (error) throw error;

            setCurrentPlan(planId);
            toast({
                title: "Plan Updated!",
                description: `You are now on the ${planId.charAt(0).toUpperCase() + planId.slice(1)} plan.`,
            });
        } catch (err: unknown) {
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: getErrorMessage(err),
            });
        } finally {
            setLoadingPlan(null);
        }
    }, [user, toast]);

    // Check for Upgrade Status on Return
    useEffect(() => {
        const checkPaymentStatus = async () => {
            const status = searchParams.get('status');
            const pendingPlan = sessionStorage.getItem('pending_plan_upgrade') as PlanTier | null;

            if (status === 'success' && pendingPlan) {
                // Clear immediately to prevent double processing
                sessionStorage.removeItem('pending_plan_upgrade');

                toast({
                    title: "Payment Successful",
                    description: "Finalizing your subscription upgrade...",
                });

                await performUpgrade(pendingPlan);
            } else if (status === 'cancelled') {
                sessionStorage.removeItem('pending_plan_upgrade');
                toast({
                    variant: "destructive",
                    title: "Payment Cancelled",
                    description: "You have not been charged.",
                });
            } else if (status === 'failed') {
                sessionStorage.removeItem('pending_plan_upgrade');
                toast({
                    variant: "destructive",
                    title: "Payment Failed",
                    description: "The payment could not be completed.",
                });
            }
        };

        checkPaymentStatus();
    }, [searchParams, performUpgrade, toast]);

    const fetchPlan = useCallback(async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('host_plan')
                .eq('id', user.id)
                .single();

            if (error) throw error;
            if (data?.host_plan) {
                setCurrentPlan(data.host_plan as PlanTier);
            }
        } catch (err) {
            console.error('Error fetching plan:', err);
        } finally {
            setFetchingPlan(false);
        }
    }, [user]);

    useEffect(() => {
        fetchPlan();
    }, [fetchPlan]);


    const handleUpgrade = useCallback(async (planId: PlanTier) => {
        if (!user) return;

        const plan = plans.find(p => p.id === planId);
        if (!plan) return;

        const priceAmount = parseInt(plan.price.replace('R', ''), 10);

        // If free plan, just update directly
        if (priceAmount === 0) {
            await performUpgrade(planId);
            return;
        }

        // For paid plans, create checkout session via Edge Function
        setLoadingPlan(planId);

        try {
            // Store plan intention
            sessionStorage.setItem('pending_plan_upgrade', planId);

            const { data, error } = await supabase.functions.invoke('create-checkout', {
                body: {
                    amount: priceAmount * 100, // Cents
                    currency: 'ZAR',
                    metadata: {
                        userId: user.id,
                        planId: planId
                    },
                    successUrl: window.location.href, // Return to this page
                    cancelUrl: window.location.href,
                    failureUrl: window.location.href
                }
            });

            if (error) throw error;

            if (data?.redirectUrl) {
                // Redirect user to Yoco
                window.location.href = data.redirectUrl;
            } else {
                throw new Error('No redirect URL returned from payment server');
            }

        } catch (error: unknown) {
            setLoadingPlan(null);
            sessionStorage.removeItem('pending_plan_upgrade');
            console.error("Payment setup error:", getErrorMessage(error));

            // Helpful error message if function fails (e.g. locally without serving)
            let msg = getErrorMessage(error);
            if (msg.includes('Failed to fetch')) {
                msg = "Payment server is unreachable. If developing locally, ensure 'supabase start' is running.";
            }

            toast({
                variant: "destructive",
                title: "Payment Error",
                description: msg,
            });

            // Log full details for debugging
            if (error && typeof error === 'object') {
                console.error("Payment error full details:", JSON.stringify(error, null, 2));
            }
        }
    }, [user, performUpgrade, toast]);

    if (fetchingPlan) {
        return (
            <div className="flex justify-center items-center p-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
            <div className="text-center space-y-4 max-w-2xl mx-auto">
                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Host Plans & Pricing</h1>
                <p className="text-lg text-gray-500">
                    Choose the toolkit that fits your scaling goals. No hidden fees, ever.
                </p>
            </div>

            <div className={`grid grid-cols-1 ${plans.length === 4 ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-6 pt-8`}>
                {plans.map((plan) => {
                    const isCurrent = currentPlan === plan.id;
                    const isLoading = loadingPlan === plan.id;

                    return (
                        <Card
                            key={plan.id}
                            className={`relative flex flex-col transition-all duration-200 hover:shadow-xl ${plan.color} ${isCurrent ? 'ring-2 ring-primary ring-offset-2 scale-[1.02]' : ''}`}
                        >
                            {plan.highlight && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                    <Badge className="bg-primary text-white hover:bg-primary px-4 py-1.5 text-xs uppercase tracking-widest font-bold">
                                        {plan.highlight}
                                    </Badge>
                                </div>
                            )}

                            <CardHeader className="text-center pb-2">
                                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                                <div className="mt-4 flex items-baseline justify-center gap-1">
                                    <span className="text-4xl font-extrabold tracking-tight text-gray-900">{plan.price}</span>
                                    <span className="text-sm font-semibold text-gray-500">/month</span>
                                </div>
                                <CardDescription className="pt-2 text-center text-gray-600">
                                    {plan.description}
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="flex-1">
                                <ul className="space-y-3 mt-4">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-start gap-3 text-sm">
                                            {feature.included ? (
                                                <Check className="w-5 h-5 text-green-600 shrink-0" />
                                            ) : (
                                                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                                                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                                                </div>
                                            )}
                                            <span className={feature.included ? 'text-gray-700 font-medium' : 'text-gray-400'}>
                                                {feature.text}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>

                            <CardFooter>
                                <Button
                                    onClick={() => handleUpgrade(plan.id)}
                                    disabled={loadingPlan !== null || isCurrent}
                                    variant={isCurrent ? "outline" : plan.id === 'premium' || plan.id === 'professional' ? "default" : "secondary"}
                                    className={`w-full h-12 rounded-xl text-base font-semibold ${plan.id === 'premium' ? 'bg-primary hover:bg-primary/90' : plan.id === 'professional' ? 'bg-indigo-600 hover:bg-indigo-700' : ''
                                        }`}
                                >
                                    {isLoading ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : isCurrent ? (
                                        "Current Plan"
                                    ) : (
                                        plan.cta
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>

            <div className="bg-indigo-600 rounded-2xl p-8 md:p-12 shadow-lg text-white grid md:grid-cols-2 gap-12 items-center mt-12 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
                <div className="relative z-10 space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-sm font-medium backdrop-blur-sm border border-white/20">
                        <Users className="w-4 h-4" />
                        <span>1 Million+ Followers</span>
                    </div>
                    <h3 className="text-3xl font-extrabold leading-tight">
                        Instant Access to South Africa's Largest Travel Community
                    </h3>
                    <p className="text-indigo-100 text-lg leading-relaxed">
                        One of the biggest reasons to join our host plans is the exclusive access to our Facebook groups.
                        You'll get full posting rights and a <span className="font-semibold text-white">verified tag</span> to build instant trust.
                        We even create custom social media posts for you, tailored to your plan, ensuring your property is seen by thousands of potential guests.
                    </p>
                </div>
                <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white/10 backdrop-blur-md p-5 rounded-xl border border-white/20 hover:bg-white/15 transition-colors">
                        <Share2 className="w-8 h-8 text-indigo-200 mb-3" />
                        <div className="font-bold text-lg">Viral Reach</div>
                        <p className="text-sm text-indigo-200 mt-1">Direct access to almost 1 million travelers.</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-5 rounded-xl border border-white/20 hover:bg-white/15 transition-colors">
                        <ShieldCheck className="w-8 h-8 text-indigo-200 mb-3" />
                        <div className="font-bold text-lg">Verified Tag</div>
                        <p className="text-sm text-indigo-200 mt-1">Stand out with official Facebook verification.</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-5 rounded-xl border border-white/20 hover:bg-white/15 transition-colors">
                        <Video className="w-8 h-8 text-indigo-200 mb-3" />
                        <div className="font-bold text-lg">Content Creation</div>
                        <p className="text-sm text-indigo-200 mt-1">We design posts that showcase your stay.</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-5 rounded-xl border border-white/20 hover:bg-white/15 transition-colors">
                        <Smartphone className="w-8 h-8 text-indigo-200 mb-3" />
                        <div className="font-bold text-lg">Community Access</div>
                        <p className="text-sm text-indigo-200 mt-1">Post directly to our massive audience.</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm grid md:grid-cols-2 gap-8 items-center mt-8">
                <div className="space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600 mb-4">
                        <BarChart4 className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold">Why Upgrade?</h3>
                    <p className="text-gray-600">
                        Hosts on the Standard plan earn <strong>2.4x more</strong> on average due to higher visibility and verified status.
                        Premium hosts unlock direct support that helps optimize occupancy year-round.
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-xl text-center">
                        <Video className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                        <div className="font-semibold text-gray-900">Showcase Video</div>
                        <div className="text-xs text-gray-500">Engage guests instantly</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl text-center">
                        <ShieldCheck className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <div className="font-semibold text-gray-900">Verified Badge</div>
                        <div className="text-xs text-gray-500">Build trust early</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl text-center">
                        <Sparkles className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                        <div className="font-semibold text-gray-900">Top Picks</div>
                        <div className="text-xs text-gray-500">Featured placement</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl text-center">
                        <Smartphone className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                        <div className="font-semibold text-gray-900">WhatsApp VIP</div>
                        <div className="text-xs text-gray-500">Direct expert help</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
