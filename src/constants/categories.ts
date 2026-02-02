export interface SubCategory {
    id: string;
    label: string;
}

export interface Category {
    id: string;
    label: string;
    icon: string;
    subcategories: SubCategory[];
}

export const CATEGORIES: Category[] = [
    {
        id: "hotels-resorts",
        label: "Hotels & Resorts",
        icon: "🏨",
        subcategories: [
            { id: "hotels", label: "Hotels" },
            { id: "boutique-hotels", label: "Boutique Hotels" },
            { id: "resorts-self-catering", label: "Resorts – Self-Catering" }
        ]
    },
    {
        id: "guesthouses-bnbs",
        label: "Guesthouses & BnB’s",
        icon: "🛌",
        subcategories: [
            { id: "guesthouses", label: "Guesthouses" },
            { id: "bnbs", label: "BnB’s" },
            { id: "farms-guesthouses", label: "Farms Guesthouses" }
        ]
    },
    {
        id: "safari-bush",
        label: "Safari and Bush",
        icon: "🦁",
        subcategories: [
            { id: "bush-lodges", label: "Bush Lodges" },
            { id: "game-lodge", label: "Game Lodge" },
            { id: "bush-camps", label: "Bush Camps" },
            { id: "luxury-safary-lodges", label: "Luxury Safary Lodges" },
            { id: "kruger-park", label: "Kruger Park and Surrounding Area" }
        ]
    },
    {
        id: "winelands",
        label: "Winelands",
        icon: "🍇",
        subcategories: [
            { id: "wine-farms", label: "Wine Farms Stays" },
            { id: "winelands-guesthouse", label: "Winelands Guesthouse" },
            { id: "luxury-wineland-lodges", label: "Luxury Wineland Lodges" }
        ]
    },
    {
        id: "coastal-beach",
        label: "Coastal & Beach",
        icon: "🏖️",
        subcategories: [
            { id: "beachfront-apartments", label: "Beachfront Apartments" },
            { id: "coastal-holiday-homes", label: "Coastal Holiday Homes" },
            { id: "coastal-guesthouses", label: "Coastal Guesthouses" }
        ]
    },
    {
        id: "nature-country",
        label: "Nature & Country",
        icon: "⛰️",
        subcategories: [
            { id: "lodges-nature-retreats", label: "Lodges and Nature Retreats" },
            { id: "farms-stays", label: "Farms Stays" },
            { id: "mountain-cabins-lodges", label: "Mountain Cabins or Lodges" }
        ]
    },
    {
        id: "budget-backpackers",
        label: "Budget & Backpackers",
        icon: "🎒",
        subcategories: [
            { id: "budget-lodges", label: "Budget Lodges and Accommodations" },
            { id: "backpackers", label: "Backpackers" }
        ]
    },
    {
        id: "unique-stays",
        label: "Unique Stays",
        icon: "✨",
        subcategories: [
            { id: "glamping", label: "Glamping" },
            { id: "tree-houses", label: "Tree Houses" },
            { id: "tiny-homes", label: "Tiny Homes" },
            { id: "historic-stays", label: "Historic Stays" }
        ]
    }
];
