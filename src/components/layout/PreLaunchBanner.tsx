import { Rocket } from "lucide-react";

interface PreLaunchBannerProps {
    isScrolled?: boolean;
}

export default function PreLaunchBanner({ isScrolled = false }: PreLaunchBannerProps) {
    return (
        <div
            className={`bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white py-1.5 px-4 text-center cursor-default z-[200] transition-all duration-300 overflow-hidden ${isScrolled ? 'max-h-0 py-0 opacity-0' : 'max-h-12 opacity-100'
                }`}
        >
            <div className="flex items-center justify-center gap-2 text-sm font-medium">
                <Rocket className="w-4 h-4 fill-white text-white animate-pulse" />
                <span>
                    <span className="opacity-90">Pre-Launch Preview:</span>{" "}
                    <span className="font-bold">Bookings are not yet live</span>{" "}
                    <span className="opacity-75 hidden sm:inline">- We're putting on the finishing touches!</span>
                </span>
            </div>
        </div>
    );
}
