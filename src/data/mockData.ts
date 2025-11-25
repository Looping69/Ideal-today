
export interface Property {
  id: string;
  title: string;
  location: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  images: string[];
  type: "Apartment" | "House" | "Guesthouse";
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
}

export const properties: Property[] = [
  {
    id: "1",
    title: "Modern Beachfront Apartment",
    location: "Camps Bay, Cape Town",
    price: 4500,
    rating: 4.9,
    reviews: 128,
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80"
    ],
    type: "Apartment",
    amenities: ["Wifi", "Pool", "Ocean View", "Kitchen", "Air Conditioning"],
    guests: 4,
    bedrooms: 2,
    bathrooms: 2,
    description: "Experience luxury living in this stunning beachfront apartment in Camps Bay. Enjoy panoramic ocean views, a private pool, and modern amenities. Perfect for a relaxing getaway.",
    host: {
      name: "Sarah",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
      joined: "2019"
    },
    coordinates: {
      lat: -33.9514,
      lng: 18.3778
    }
  },
  {
    id: "2",
    title: "Cozy Winelands Cottage",
    location: "Franschhoek, Western Cape",
    price: 2800,
    rating: 4.8,
    reviews: 85,
    image: "https://images.unsplash.com/photo-1449844908441-8829872d2607?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1449844908441-8829872d2607?w=800&q=80",
      "https://images.unsplash.com/photo-1599619351208-3e6c839d6828?w=800&q=80",
      "https://images.unsplash.com/photo-1484154218962-a1c002085d2f?w=800&q=80"
    ],
    type: "House",
    amenities: ["Wifi", "Fireplace", "Vineyard View", "Kitchen", "Parking"],
    guests: 2,
    bedrooms: 1,
    bathrooms: 1,
    description: "Escape to the vineyards in this charming cottage. Surrounded by mountains and vineyards, it's the perfect romantic retreat. Features a cozy fireplace and private patio.",
    host: {
      name: "Michael",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
      joined: "2020"
    },
    coordinates: {
      lat: -33.9090,
      lng: 19.1220
    }
  },
  {
    id: "3",
    title: "Luxury Safari Villa",
    location: "Kruger National Park",
    price: 8500,
    rating: 5.0,
    reviews: 42,
    image: "https://images.unsplash.com/photo-1493246318656-5bfd4cfb29b8?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1493246318656-5bfd4cfb29b8?w=800&q=80",
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80",
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80"
    ],
    type: "House",
    amenities: ["Wifi", "Pool", "Game Drive", "Chef", "Air Conditioning"],
    guests: 8,
    bedrooms: 4,
    bathrooms: 4,
    description: "Immerse yourself in the wild with this luxury safari villa. Located on a private reserve bordering Kruger National Park. Includes daily game drives and a private chef.",
    host: {
      name: "Thabo",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Thabo",
      joined: "2018"
    },
    coordinates: {
      lat: -24.9948,
      lng: 31.5969
    }
  },
  {
    id: "4",
    title: "Urban Loft in Maboneng",
    location: "Johannesburg, Gauteng",
    price: 1200,
    rating: 4.6,
    reviews: 210,
    image: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&q=80",
      "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=800&q=80",
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=80"
    ],
    type: "Apartment",
    amenities: ["Wifi", "City View", "Security", "Kitchen", "Workspace"],
    guests: 2,
    bedrooms: 1,
    bathrooms: 1,
    description: "Stay in the heart of Johannesburg's creative district. This stylish loft offers city views, modern decor, and easy access to art galleries, restaurants, and nightlife.",
    host: {
      name: "Lerato",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lerato",
      joined: "2021"
    },
    coordinates: {
      lat: -26.2041,
      lng: 28.0473
    }
  },
  {
    id: "5",
    title: "Seaside Family Home",
    location: "Umhlanga, KwaZulu-Natal",
    price: 3500,
    rating: 4.7,
    reviews: 95,
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
      "https://images.unsplash.com/photo-1600596542815-2a4d9fddace7?w=800&q=80",
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80"
    ],
    type: "House",
    amenities: ["Wifi", "Pool", "Beach Access", "BBQ", "Garage"],
    guests: 6,
    bedrooms: 3,
    bathrooms: 2,
    description: "A spacious family home just steps from the beach. Features a large swimming pool, braai area, and comfortable living spaces. Ideal for a family vacation.",
    host: {
      name: "David",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
      joined: "2017"
    },
    coordinates: {
      lat: -29.7285,
      lng: 31.0837
    }
  },
  {
    id: "6",
    title: "Garden Route Guesthouse",
    location: "Knysna, Western Cape",
    price: 1800,
    rating: 4.8,
    reviews: 150,
    image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80",
      "https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=800&q=80",
      "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&q=80"
    ],
    type: "Guesthouse",
    amenities: ["Wifi", "Breakfast", "Lagoon View", "Garden", "Parking"],
    guests: 2,
    bedrooms: 1,
    bathrooms: 1,
    description: "Charming guesthouse overlooking the Knysna Lagoon. Enjoy a delicious breakfast, explore the garden, or relax on the terrace. Close to town and local attractions.",
    host: {
      name: "Jenny",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jenny",
      joined: "2015"
    },
    coordinates: {
      lat: -34.0354,
      lng: 23.0471
    }
  }
];

export const mockProperties = properties;


