import { Rocket } from "lucide-react";

export default function PreLaunchBanner() {
    return (
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white py-2 px-4 text-center cursor-default z-[200]">
            <div className="flex items-center justify-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-top duration-500">
                <Rocket className="w-4 h-4 fill-white text-white animate-pulse" />
                <span>
                    <span className="opacity-90">Pre-Launch Preview:</span>{" "}
                    <span className="font-bold">Bookings are live!</span>{" "}
                    <span className="opacity-75 hidden sm:inline">- Some features are still being polished.</span>
                </span>
            </div>
        </div>
    );
}
