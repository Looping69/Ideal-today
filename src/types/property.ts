export interface Property {
    id: string;
    title: string;
    location: string;
    province?: string;
    price: number;
    rating: number;
    reviews: number;
    image: string;
    images: string[];
    type: string; // Changed from union to string to be more flexible with DB data
    amenities: string[];
    guests: number;
    bedrooms: number;
    bathrooms: number;
    description: string;
    host: {
        name: string;
        image: string;
        joined: string;
    };
    coordinates: {
        lat: number;
        lng: number;
    };
    cleaning_fee?: number;
    service_fee?: number;
    categories?: string[];
    isVerifiedHost?: boolean;
}
