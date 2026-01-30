
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "./ui/button";

interface DevelopmentLandingProps {
    onEnter: () => void;
}

export default function DevelopmentLanding({ onEnter }: DevelopmentLandingProps) {
    return (
        <div className="min-h-screen w-full relative overflow-hidden bg-slate-950 flex items-center justify-center">
            {/* Background Gradients */}
            <div className="absolute inset-0 w-full h-full">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px] animate-pulse delay-1000" />
            </div>

            <div className="relative z-10 container mx-auto px-4 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="max-w-2xl mx-auto space-y-8"
                >
                    {/* Logo/Icon */}
                    <div className="flex justify-center mb-8">
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-500 opacity-20 blur-xl rounded-full" />
                            <div className="relative bg-slate-900/50 p-4 rounded-2xl border border-white/10 backdrop-blur-sm ring-1 ring-white/20 shadow-2xl">
                                <img src="/logo.png" alt="IdealStay" className="w-24 h-auto" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
                            Ideal Today
                        </h1>
                        <h2 className="text-xl md:text-2xl font-light text-slate-400 uppercase tracking-widest">
                            Under Development
                        </h2>
                    </div>

                    <p className="text-lg text-slate-300 leading-relaxed max-w-lg mx-auto">
                        We're currently crafting an exceptional experience for you.
                        The platform is in active development and features are being rolled out daily.
                    </p>

                    <div className="pt-8">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Button
                                onClick={onEnter}
                                size="lg"
                                className="bg-white text-slate-900 hover:bg-slate-200 text-lg px-8 py-6 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all duration-300 group"
                            >
                                Enter Preview
                                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </motion.div>
                    </div>

                    <div className="pt-12 text-sm text-slate-500">
                        &copy; {new Date().getFullYear()} Ideal Today. All rights reserved.
                    </div>
                </motion.div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="absolute bottom-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
    );
}
