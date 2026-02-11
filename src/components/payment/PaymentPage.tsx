import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Users, MapPin, ShieldCheck, Star, CreditCard, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { useState } from 'react';
import { Property } from '@/types/property';

interface BookingState {
    property: Property;
    date: {
        from: Date;
        to: Date;
    };
    guests: number;
    total: number;
    nights: number;
    user: {
        id: string;
        email?: string;
    };
}

export default function PaymentPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);

    // Get booking data passed from the previous screen
    const bookingData = location.state as BookingState | null;

    if (!bookingData) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="text-center space-y-4">
                    <h1 className="text-2xl font-bold text-gray-900">No booking details found</h1>
                    <p className="text-gray-500">Please select a property and dates first.</p>
                    <Button onClick={() => navigate('/')}>Return Home</Button>
                </div>
            </div>
        );
    }

    const { property, date, guests, total, nights } = bookingData;
    const user = bookingData.user;

    const handlePayment = async () => {
        try {
            setIsProcessing(true);

            // 1. Create the booking in Supabase with 'pending' status
            const { data: booking, error: bookingError } = await supabase
                .from('bookings')
                .insert({
                    property_id: property.id,
                    user_id: user.id,
                    check_in: date.from,
                    check_out: date.to,
                    total_price: total,
                    status: 'pending' // Initial status
                })
                .select()
                .single();

            if (bookingError) throw bookingError;

            // 2. Create Yoco Checkout Session via Edge Function
            const { data: checkout, error: checkoutError } = await supabase.functions.invoke('create-checkout', {
                body: {
                    amount: Math.round(total * 100), // Amount in cents, rounded to avoid floating point issues
                    currency: 'ZAR',
                    metadata: {
                        bookingId: booking.id,
                        type: 'booking'
                    },
                    successUrl: `${window.location.origin}/book/success?bookingId=${booking.id}`,
                    cancelUrl: `${window.location.origin}/book?canceled=true`,
                    failureUrl: `${window.location.origin}/book?failed=true`
                }
            });

            if (checkoutError) throw checkoutError;

            // 3. Redirect user to Yoco
            if (checkout?.redirectUrl) {
                window.location.href = checkout.redirectUrl;
            } else {
                throw new Error("No redirect URL provided by payment gateway");
            }

        } catch (error: unknown) {
            console.error(error);
            const message = error instanceof Error ? error.message : "Could not start payment. Please try again.";
            toast({
                title: "Payment Initialization Failed",
                description: message,
                variant: "destructive",
            });
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h1 className="font-semibold text-lg">Confirm and Pay</h1>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Left Column: Trip Details */}
                    <div className="space-y-6">
                        <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                            <h2 className="text-xl font-bold mb-6">Your Trip</h2>

                            <div className="space-y-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-medium text-gray-900 mb-1">Dates</h3>
                                        <p className="text-gray-600">
                                            {format(new Date(date.from), 'MMM d')} – {format(new Date(date.to), 'MMM d, yyyy')}
                                        </p>
                                    </div>
                                    <Calendar className="w-5 h-5 text-gray-400" />
                                </div>

                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-medium text-gray-900 mb-1">Guests</h3>
                                        <p className="text-gray-600">{guests} guest{guests !== 1 && 's'}</p>
                                    </div>
                                    <Users className="w-5 h-5 text-gray-400" />
                                </div>

                                <div className="pt-6 border-t border-gray-100">
                                    <h3 className="font-medium text-gray-900 mb-4">Price Details</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-gray-600">
                                            <span>R{property.price} x {nights} nights</span>
                                            <span>R{property.price * nights}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-600">
                                            <span>Cleaning fee</span>
                                            <span>R{property.cleaning_fee || 0}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-600">
                                            <span>Service fee</span>
                                            <span>R{property.service_fee || 0}</span>
                                        </div>
                                        <div className="flex justify-between font-bold text-lg pt-4 border-t border-gray-100 mt-4">
                                            <span>Total (ZAR)</span>
                                            <span>R{total}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <ShieldCheck className="w-5 h-5 text-green-600" />
                                <h2 className="font-semibold">Payment</h2>
                            </div>

                            <p className="text-sm text-gray-500 mb-6">
                                Select a payment method to complete your booking. Your payment is secure and encrypted.
                            </p>

                            <Button
                                onClick={handlePayment}
                                disabled={isProcessing}
                                className="w-full bg-gradient-to-r from-primary to-blue-400 hover:from-primary/90 text-white font-bold py-6 text-lg rounded-xl shadow-lg shadow-blue-500/20"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="mr-2 h-4 w-4" />
                                        Pay R{total} with Yoco
                                    </>
                                )}
                            </Button>

                            <div className="mt-4 flex justify-center gap-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-300">
                                {/* Trusted payment badges visualization */}
                                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png" alt="Visa" className="h-6 object-contain" />
                                <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6 object-contain" />
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Property Card */}
                    <div className="md:sticky md:top-24 h-fit">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="aspect-video w-full relative">
                                <img
                                    src={property.image}
                                    alt={property.title}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                                    {property.type}
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Entire property</p>
                                        <h3 className="font-bold text-gray-900 leading-tight mb-2">{property.title}</h3>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                        <span className="font-medium text-sm">{property.rating}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-6">
                                    <MapPin className="w-4 h-4 shrink-0" />
                                    <span className="truncate">{property.location}</span>
                                </div>

                                <div className="pt-6 border-t border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden">
                                            <img src={property.host?.image} alt={property.host?.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Hosted by</p>
                                            <p className="font-medium text-sm">{property.host?.name}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
