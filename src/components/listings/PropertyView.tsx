import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Property } from "@/types/property";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MapPin, Wifi, Car, Utensils, Wind, Share, Heart, Calendar as CalendarIcon, Play, Pause, Video } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import ImageUpload from "@/components/ui/image-upload";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { addDays, format, differenceInDays, parseISO } from "date-fns";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import SEO from "../SEO";
import PropertyMap from "./PropertyMap";

interface PropertyViewProps {
    property: Property;
    onBookingComplete?: () => void;
}

export default function PropertyView({ property, onBookingComplete }: PropertyViewProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [date, setDate] = useState<DateRange | undefined>();
    const [guests, setGuests] = useState(1);
    const [isBooking, setIsBooking] = useState(false);
    const [bookedDates, setBookedDates] = useState<Date[]>([]);
    const [reviews, setReviews] = useState<any[]>([]);
    const [canReview, setCanReview] = useState(false);
    const [myRating, setMyRating] = useState<number>(5);
    const [myText, setMyText] = useState("");
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [reviewPhotos, setReviewPhotos] = useState<string[]>([]);
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);

    useEffect(() => {
        if (property) {
            fetchBookedDates();
            loadReviews();
        }
    }, [property]);

    const fetchBookedDates = async () => {
        if (!property) return;

        const { data } = await supabase
            .from('bookings')
            .select('check_in, check_out')
            .eq('property_id', property.id)
            .neq('status', 'canceled');

        if (data) {
            const dates = data.flatMap(booking => {
                const range = [];
                let curr = parseISO(booking.check_in);
                const end = parseISO(booking.check_out);

                while (curr < end) {
                    range.push(new Date(curr));
                    curr.setDate(curr.getDate() + 1);
                }
                return range;
            });
            setBookedDates(dates);
        }
    };

    const loadReviews = async () => {
        if (!property) return;
        const { data } = await supabase
            .from('reviews')
            .select('rating, content, created_at, user:profiles!reviews_user_id_fkey(full_name, avatar_url)')
            .eq('property_id', property.id)
            .eq('status', 'approved')
            .order('created_at', { ascending: false });
        setReviews(data || []);

        if (user) {
            const { data: bookingOk } = await supabase
                .from('bookings')
                .select('id')
                .eq('property_id', property.id)
                .eq('user_id', user.id)
                .in('status', ['confirmed', 'completed'])
                .limit(1);

            const { data: existing } = await supabase
                .from('reviews')
                .select('id')
                .eq('property_id', property.id)
                .eq('user_id', user.id)
                .limit(1);

            setCanReview(!!bookingOk && bookingOk.length > 0 && !(existing && existing.length > 0));
        } else {
            setCanReview(false);
        }
    };

    const submitReview = async () => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Please login', description: 'Log in to write a review.' });
            return;
        }
        if (!property) return;
        if (!myRating || myRating < 1 || myRating > 5) {
            toast({ variant: 'destructive', title: 'Invalid rating', description: 'Choose a rating between 1 and 5.' });
            return;
        }
        setIsSubmittingReview(true);
        try {
            const { error } = await supabase
                .from('reviews')
                .insert({ property_id: property.id, user_id: user.id, rating: myRating, content: myText, photo_url: reviewPhotos[0] || null });
            if (error) throw error;
            toast({ title: 'Review submitted', description: 'Your review is pending approval.' });
            setMyText("");
            setReviewPhotos([]);
            setMyRating(5);
            loadReviews();
            setCanReview(false);
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: e.message || 'Could not submit review.' });
        } finally {
            setIsSubmittingReview(false);
        }
    };

    const handleReserve = () => {
        if (!user) {
            toast({
                title: "Please login",
                description: "You need to be logged in to book a property.",
                variant: "destructive",
            });
            return;
        }

        if (!date?.from || !date?.to) {
            toast({
                title: "Select dates",
                description: "Please select check-in and check-out dates.",
                variant: "destructive",
            });
            return;
        }

        // Navigate to payment page with booking details
        navigate('/book', {
            state: {
                property,
                date,
                guests,
                total,
                nights,
                user
            }
        });
        if (onBookingComplete) onBookingComplete();
    };

    const propertySchema = {
        "@context": "https://schema.org",
        "@type": "LodgingBusiness",
        "name": property.title,
        "description": property.description,
        "image": property.image,
        "address": {
            "@type": "PostalAddress",
            "addressLocality": property.location,
            "addressCountry": "ZA"
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": property.rating,
            "reviewCount": property.reviews
        },
        "priceRange": `R${property.price}`
    };

    const nights = date?.from && date?.to ? differenceInDays(date.to, date.from) : 0;
    const subtotal = property.price * nights;
    const cleaningFee = property.cleaning_fee || 0;
    const serviceFee = property.service_fee || 0;
    const total = subtotal + cleaningFee + serviceFee;

    return (
        <div className="p-6">
            <SEO
                title={property.title}
                description={`Book ${property.title} in ${property.location}. ${property.description.substring(0, 150)}...`}
                keywords={`${property.type}, holiday accommodation ${property.location}, ${property.title} rental`}
                ogImage={property.image}
                schema={propertySchema}
            />
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h1 className="text-2xl font-bold mb-1">{property.title}</h1>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Star className="w-4 h-4 fill-black text-black" />
                        <span className="font-medium text-black">{property.rating}</span>
                        <span>·</span>
                        <span className="underline cursor-pointer">{property.reviews} reviews</span>
                        <span>·</span>
                        <span className="font-medium underline cursor-pointer">
                            {property.area ? `${property.area}, ` : ""}{property.location}
                        </span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="gap-2">
                        <Share className="w-4 h-4" />
                        Share
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-2">
                        <Heart className="w-4 h-4" />
                        Save
                    </Button>
                </div>
            </div>

            {/* Images Grid */}
            <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[400px] rounded-xl overflow-hidden mb-8">
                <div className="col-span-2 row-span-2 relative">
                    <img src={property.image} alt={property.title} className="w-full h-full object-cover hover:opacity-95 transition-opacity cursor-pointer" />
                </div>
                {property.images.slice(0, 4).map((img, i) => (
                    <div key={i} className="col-span-1 row-span-1 relative">
                        <img src={img} alt={property.title} className="w-full h-full object-cover hover:opacity-95 transition-opacity cursor-pointer" />
                    </div>
                ))}
            </div>

            {/* Video Section */}
            {property.video_url && (
                <div className="mb-8">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Video className="w-5 h-5" />
                        Property Video Tour
                    </h3>
                    <div className="relative rounded-xl overflow-hidden bg-black shadow-lg">
                        <video
                            src={property.video_url}
                            className="w-full aspect-video object-contain"
                            controls
                            playsInline
                            poster={property.image}
                        />
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                {/* Left Column: Details */}
                <div className="md:col-span-2 space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-semibold mb-1">
                                {property.type} hosted by {property.host.name}
                            </h2>
                            <p className="text-gray-600">
                                {property.adults ? `${property.adults} adults` : `${property.guests} guests`}
                                {property.children ? `, ${property.children} children` : ""}
                                {" · "}
                                {property.bedrooms} bedrooms · {property.bathrooms} bathrooms
                            </p>
                        </div>
                        <Avatar className="w-14 h-14">
                            <AvatarImage src={property.host.image} />
                            <AvatarFallback>{property.host.name[0]}</AvatarFallback>
                        </Avatar>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="mt-1"><MapPin className="w-6 h-6 text-gray-600" /></div>
                            <div>
                                <h3 className="font-semibold">Great location</h3>
                                <p className="text-gray-500 text-sm">100% of recent guests gave the location a 5-star rating.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="mt-1"><KeyIcon className="w-6 h-6 text-gray-600" /></div>
                            <div>
                                <h3 className="font-semibold">Great check-in experience</h3>
                                <p className="text-gray-500 text-sm">100% of recent guests gave the check-in process a 5-star rating.</p>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <div>
                        <h3 className="text-xl font-semibold mb-4">About this place</h3>
                        <p className="text-gray-700 leading-relaxed">
                            {property.description}
                        </p>
                    </div>

                    <Separator />

                    {(property.is_self_catering || property.has_restaurant) && (
                        <>
                            <div className="space-y-4">
                                <h3 className="text-xl font-semibold">Catering</h3>
                                <div className="flex flex-wrap gap-4">
                                    {property.is_self_catering && (
                                        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full border border-green-100 text-sm font-medium">
                                            <Utensils className="w-4 h-4" />
                                            Self-Catering Available
                                        </div>
                                    )}
                                    {property.has_restaurant && (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full border border-blue-100 text-sm font-medium">
                                                <Utensils className="w-4 h-4" />
                                                Onsite Restaurant
                                            </div>
                                            {property.restaurant_offers && property.restaurant_offers.length > 0 && (
                                                <p className="text-sm text-gray-500 ml-4">
                                                    Offers: {property.restaurant_offers.join(", ")}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <Separator />
                        </>
                    )}

                    <div>
                        <h3 className="text-xl font-semibold mb-4">What this place offers</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {property.amenities.map((amenity, index) => (
                                <div key={index} className="flex items-center gap-3 text-gray-700">
                                    {getAmenityIcon(amenity)}
                                    <span>{amenity}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {property.facilities && property.facilities.length > 0 && (
                        <>
                            <Separator />
                            <div>
                                <h3 className="text-xl font-semibold mb-4">Onsite Facilities</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {property.facilities.map((fac, idx) => (
                                        <div key={idx} className="flex items-center gap-3 text-gray-700">
                                            <span className="text-xl">✓</span>
                                            <span>{fac === "Other" ? property.other_facility : fac}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    <Separator />

                    <div>
                        <h3 className="text-xl font-semibold mb-4">Location</h3>
                        <div className="h-[300px] rounded-xl overflow-hidden border border-gray-200">
                            <PropertyMap
                                properties={[property]}
                                onPropertyClick={() => { }}
                            />
                        </div>
                        <p className="mt-2 text-sm text-gray-500 flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {property.area ? `${property.area}, ` : ""}{property.location}
                        </p>
                    </div>

                    <Separator />

                    <div>
                        <h3 className="text-xl font-semibold mb-4">Reviews</h3>
                        {reviews.length === 0 ? (
                            <p className="text-gray-500">No reviews yet.</p>
                        ) : (
                            <div className="space-y-4">
                                {reviews.map((r, idx) => (
                                    <div key={idx} className="border rounded-lg p-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Avatar className="w-8 h-8">
                                                <AvatarImage src={r.user?.avatar_url} />
                                                <AvatarFallback>{(r.user?.full_name || 'G')[0]}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-medium text-sm">{r.user?.full_name || 'Guest'}</div>
                                                <div className="text-xs text-gray-500">{format(new Date(r.created_at), 'MMM d, yyyy')}</div>
                                            </div>
                                            <div className="ml-auto flex items-center gap-1">
                                                {[...Array(r.rating)].map((_, i) => <Star key={i} className="w-4 h-4 fill-black text-black" />)}
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-700">{r.content}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="mt-6">
                            <h4 className="font-semibold mb-2">Write a review</h4>
                            {!canReview ? (
                                <p className="text-sm text-gray-500">Reviews are available after a confirmed booking. You may have already reviewed this stay.</p>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        {[1, 2, 3, 4, 5].map(n => (
                                            <button key={n} onClick={() => setMyRating(n)} className={cn("p-1", myRating >= n ? "text-black" : "text-gray-400")}>
                                                <Star className={cn("w-5 h-5", myRating >= n ? "fill-black" : "")} />
                                            </button>
                                        ))}
                                    </div>
                                    <Textarea value={myText} onChange={(e) => setMyText(e.target.value)} placeholder="Share details of your stay" />
                                    <div>
                                        <span className="text-xs text-gray-500">Optional: add a photo (earns extra points)</span>
                                        <ImageUpload
                                            value={reviewPhotos}
                                            onChange={setReviewPhotos}
                                            onRemove={(url) => setReviewPhotos(reviewPhotos.filter(u => u !== url))}
                                            bucket="review-photos"
                                            maxFiles={1}
                                            className="mt-2"
                                        />
                                    </div>
                                    <Button onClick={submitReview} disabled={isSubmittingReview}>{isSubmittingReview ? 'Submitting...' : 'Submit review'}</Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Booking Widget */}
                <div className="md:col-span-1 relative z-10">
                    <div className="sticky top-6 border border-gray-200 rounded-xl p-6 shadow-lg bg-white z-10">
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                {property.discount && property.discount > 0 ? (
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-400 line-through text-lg">R{property.price}</span>
                                            <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded">-{property.discount}% OFF</span>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-bold">R{Math.round(property.price * (1 - (property.discount / 100)))}</span>
                                            <span className="text-gray-600"> / night</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <span className="text-2xl font-bold">R{property.price}</span>
                                        <span className="text-gray-600"> / night</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                                <Star className="w-4 h-4 fill-black" />
                                <span className="font-medium">{property.rating}</span>
                                <span className="text-gray-500">({property.reviews} reviews)</span>
                            </div>
                        </div>

                        <div className="border border-gray-400 rounded-lg mb-4 overflow-hidden">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <div className="grid grid-cols-2 border-b border-gray-400 cursor-pointer hover:bg-gray-50 transition-colors">
                                        <div className="p-3 border-r border-gray-400">
                                            <div className="text-[10px] font-bold uppercase">Check-in</div>
                                            <div className="text-sm truncate">{date?.from ? format(date.from, "dd MMM yyyy") : "Add date"}</div>
                                        </div>
                                        <div className="p-3">
                                            <div className="text-[10px] font-bold uppercase">Check-out</div>
                                            <div className="text-sm truncate">{date?.to ? format(date.to, "dd MMM yyyy") : "Add date"}</div>
                                        </div>
                                    </div>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 z-[200]" align="end">
                                    <Calendar
                                        initialFocus
                                        mode="range"
                                        defaultMonth={date?.from}
                                        selected={date}
                                        onSelect={setDate}
                                        numberOfMonths={2}
                                        disabled={[
                                            { before: new Date() },
                                            ...bookedDates
                                        ]}
                                    />
                                </PopoverContent>
                            </Popover>

                            <div className="p-3">
                                <div className="text-[10px] font-bold uppercase">Guests</div>
                                <div className="text-sm">{guests} guest{guests > 1 ? 's' : ''}</div>
                            </div>
                        </div>

                        <Button
                            onClick={handleReserve}
                            disabled={isBooking || !date?.from || !date?.to}
                            className="w-full bg-gradient-to-r from-primary to-blue-400 hover:from-primary/90 hover:to-blue-400/90 text-white font-semibold py-6 text-lg mb-4"
                        >
                            Reserve
                        </Button>

                        <p className="text-center text-sm text-gray-500 mb-4">
                            {user && date?.from && date?.to
                                ? "You will be charged immediately"
                                : "You won't be charged yet"}
                        </p>

                        {nights > 0 && (
                            <>
                                <div className="space-y-3 text-gray-600">
                                    <div className="flex justify-between">
                                        <span className="underline">R{property.discount ? Math.round(property.price * (1 - (property.discount / 100))) : property.price} x {nights} nights</span>
                                        <span>R{(property.discount ? Math.round(property.price * (1 - (property.discount / 100))) : property.price) * nights}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="underline">Cleaning fee</span>
                                        <span>R{cleaningFee}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="underline">Service fee</span>
                                        <span>R{serviceFee}</span>
                                    </div>
                                </div>

                                <Separator className="my-4" />

                                <div className="flex justify-between font-bold text-lg">
                                    <span>Total</span>
                                    <span>R{total}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function KeyIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
        </svg>
    );
}

function getAmenityIcon(amenity: string) {
    const className = "w-5 h-5 text-gray-500";
    const a = amenity.toLowerCase();
    if (a.includes("wifi")) return <Wifi className={className} />;
    if (a.includes("pool")) return <span className={className}>🏊</span>;
    if (a.includes("kitchen")) return <Utensils className={className} />;
    if (a.includes("air conditioning")) return <Wind className={className} />;
    if (a.includes("parking")) return <Car className={className} />;
    if (a.includes("gym")) return <span className={className}>🏋️</span>;
    if (a.includes("tv")) return <span className={className}>📺</span>;
    if (a.includes("bbq")) return <span className={className}>🔥</span>;
    return <Star className={className} />;
}
