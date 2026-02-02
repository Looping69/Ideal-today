import { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function HotelsResortsIcon(props: IconProps) {
    return (
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <rect x="8" y="18" width="32" height="24" rx="2" stroke="currentColor" strokeWidth="2.5" />
            <path d="M8 26H40" stroke="currentColor" strokeWidth="2" />
            <rect x="14" y="30" width="6" height="8" rx="1" stroke="currentColor" strokeWidth="2" />
            <rect x="28" y="30" width="6" height="8" rx="1" stroke="currentColor" strokeWidth="2" />
            <path d="M18 18V12C18 10.8954 18.8954 10 20 10H28C29.1046 10 30 10.8954 30 12V18" stroke="currentColor" strokeWidth="2.5" />
            <circle cx="24" cy="14" r="1.5" fill="currentColor" />
            <path d="M4 42H44" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
    );
}

export function GuesthousesBnBIcon(props: IconProps) {
    return (
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <path d="M6 24L24 8L42 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10 22V40C10 41.1046 10.8954 42 12 42H36C37.1046 42 38 41.1046 38 40V22" stroke="currentColor" strokeWidth="2.5" />
            <rect x="20" y="30" width="8" height="12" rx="1" stroke="currentColor" strokeWidth="2" />
            <circle cx="26" cy="36" r="1" fill="currentColor" />
            <rect x="14" y="24" width="6" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <rect x="28" y="24" width="6" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <path d="M24 8V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="24" cy="3" r="1.5" fill="currentColor" />
        </svg>
    );
}

export function SafariBushIcon(props: IconProps) {
    return (
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            {/* Lion face simplified */}
            <circle cx="24" cy="24" r="14" stroke="currentColor" strokeWidth="2.5" />
            {/* Mane spikes */}
            <path d="M24 6C24 6 28 10 28.5 10C29 10 32 6 32 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M16 6C16 6 19 10 19.5 10C20 10 24 6 24 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M38 16C38 16 34 19 34 19.5C34 20 38 24 38 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M10 24C10 24 14 20 14 19.5C14 19 10 16 10 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            {/* Eyes */}
            <circle cx="19" cy="22" r="2" fill="currentColor" />
            <circle cx="29" cy="22" r="2" fill="currentColor" />
            {/* Nose */}
            <path d="M24 26L22 29H26L24 26Z" fill="currentColor" />
            {/* Whiskers */}
            <path d="M16 28H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M16 31H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M32 28H36" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M32 31H35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

export function WinelandsIcon(props: IconProps) {
    return (
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            {/* Wine glass */}
            <path d="M24 28V40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M16 42H32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M14 8H34L32 20C31.5 24 28 28 24 28C20 28 16.5 24 16 20L14 8Z" stroke="currentColor" strokeWidth="2.5" />
            <path d="M16 16C18 18 22 18 24 16C26 14 30 14 32 16" stroke="currentColor" strokeWidth="2" />
            {/* Grape cluster */}
            <circle cx="38" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="42" cy="16" r="3" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="38" cy="20" r="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M38 8L40 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M40 4C42 3 44 4 44 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

export function CoastalBeachIcon(props: IconProps) {
    return (
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            {/* Sun */}
            <circle cx="36" cy="12" r="6" stroke="currentColor" strokeWidth="2" />
            <path d="M36 2V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M36 20V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M46 12H44" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M28 12H26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            {/* Umbrella */}
            <path d="M8 18C8 12 14 8 20 8C26 8 32 12 32 18" stroke="currentColor" strokeWidth="2.5" />
            <path d="M20 8V38" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M20 18V8" stroke="currentColor" strokeWidth="2" />
            <path d="M14 18L15 8" stroke="currentColor" strokeWidth="1.5" />
            <path d="M26 18L25 8" stroke="currentColor" strokeWidth="1.5" />
            {/* Waves */}
            <path d="M4 34C8 32 12 36 16 34C20 32 24 36 28 34C32 32 36 36 40 34C44 32 48 36 48 34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M4 40C8 38 12 42 16 40C20 38 24 42 28 40C32 38 36 42 40 40C44 38 48 42 48 40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

export function NatureCountryIcon(props: IconProps) {
    return (
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            {/* Mountain */}
            <path d="M4 40L18 14L26 28L32 20L44 40H4Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M18 14L14 22L18 20L22 24" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            {/* Snow cap */}
            <path d="M18 14L15 20H21L18 14Z" fill="currentColor" opacity="0.3" />
            {/* Tree */}
            <path d="M38 26L42 34H34L38 26Z" stroke="currentColor" strokeWidth="1.5" />
            <path d="M38 34V40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            {/* Sun/moon */}
            <circle cx="8" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
            <path d="M8 4V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M2 12H4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M14 12H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

export function BudgetBackpackersIcon(props: IconProps) {
    return (
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            {/* Backpack body */}
            <rect x="12" y="14" width="24" height="28" rx="4" stroke="currentColor" strokeWidth="2.5" />
            {/* Top flap */}
            <path d="M14 14C14 10 18 6 24 6C30 6 34 10 34 14" stroke="currentColor" strokeWidth="2.5" />
            {/* Front pocket */}
            <rect x="16" y="26" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
            <path d="M20 31H28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            {/* Straps */}
            <path d="M12 18C8 18 6 22 6 26" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M36 18C40 18 42 22 42 26" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            {/* Buckle */}
            <rect x="22" y="16" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
            {/* Side pocket indicator */}
            <path d="M12 28V34" stroke="currentColor" strokeWidth="2" />
            <path d="M36 28V34" stroke="currentColor" strokeWidth="2" />
        </svg>
    );
}

export function UniqueStaysIcon(props: IconProps) {
    return (
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            {/* Star burst / sparkle */}
            <path d="M24 4L26 16L38 14L28 22L36 32L24 26L12 32L20 22L10 14L22 16L24 4Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
            <circle cx="24" cy="20" r="4" fill="currentColor" opacity="0.3" />
            {/* Small sparkles */}
            <circle cx="40" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M40 4V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M40 10V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M36 8H38" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M42 8H44" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            {/* Ground line */}
            <path d="M8 42C12 40 16 42 20 40C24 38 28 42 32 40C36 38 40 42 44 40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            {/* Tent/unique structure hint */}
            <path d="M18 42L24 34L30 42" stroke="currentColor" strokeWidth="2" />
        </svg>
    );
}

// Map category IDs to icon components
export const CATEGORY_ICONS: Record<string, React.FC<IconProps>> = {
    "hotels-resorts": HotelsResortsIcon,
    "guesthouses-bnbs": GuesthousesBnBIcon,
    "safari-bush": SafariBushIcon,
    "winelands": WinelandsIcon,
    "coastal-beach": CoastalBeachIcon,
    "nature-country": NatureCountryIcon,
    "budget-backpackers": BudgetBackpackersIcon,
    "unique-stays": UniqueStaysIcon,
};
