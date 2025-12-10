import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2, Sparkles, Smartphone, ShieldCheck, Video, BarChart4, Gift } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";

type PlanTier = 'free' | 'standard' | 'premium';

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
            { text: "Self-managed Bookings", included: true },
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
    const [loading, setLoading] = useState(false);
    const [fetchingPlan, setFetchingPlan] = useState(true);
    const [currentPlan, setCurrentPlan] = useState<PlanTier>('free');

    useEffect(() => {
        async function fetchPlan() {
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
        }
        fetchPlan();
    }, [user]);

    const handleUpgrade = async (planId: PlanTier) => {
        if (!user) return;
        setLoading(true);

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
        } catch (err: any) {
            toast({
                variant: "destructive",
                title: "Failed to update plan",
                description: err.message || "Please try again.",
            });
        } finally {
            setLoading(false);
        }
    };

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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
                {plans.map((plan) => {
                    const isCurrent = currentPlan === plan.id;
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
                                    disabled={loading || isCurrent}
                                    variant={isCurrent ? "outline" : plan.id === 'premium' ? "default" : "secondary"}
                                    className={`w-full h-12 rounded-xl text-base font-semibold ${plan.id === 'premium' ? 'bg-primary hover:bg-primary/90' : ''
                                        }`}
                                >
                                    {loading && isCurrent ? (
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

            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm grid md:grid-cols-2 gap-8 items-center mt-12">
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
