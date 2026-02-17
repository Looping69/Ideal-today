import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface LightboxProps {
    images: string[];
    initialIndex?: number;
    isOpen: boolean;
    onClose: () => void;
}

export function Lightbox({ images, initialIndex = 0, isOpen, onClose }: LightboxProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [zoom, setZoom] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(initialIndex);
            setZoom(1);
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen, initialIndex]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowRight") handleNext();
            if (e.key === "ArrowLeft") handlePrev();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, currentIndex, images.length]);

    if (!isOpen) return null;

    const handleNext = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % images.length);
        setZoom(1);
    };

    const handlePrev = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
        setZoom(1);
    };

    const handleZoomIn = (e: React.MouseEvent) => {
        e.stopPropagation();
        setZoom((prev) => Math.min(prev + 0.5, 4));
    };

    const handleZoomOut = (e: React.MouseEvent) => {
        e.stopPropagation();
        setZoom((prev) => Math.max(prev - 0.5, 1));
    };

    const toggleFullscreen = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center backdrop-blur-md"
                onClick={onClose}
            >
                {/* Top bar controls */}
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/60 to-transparent flex items-center justify-between px-6 z-[10001]"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="text-white/90 font-medium">
                        {currentIndex + 1} / {images.length}
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/10 rounded-full h-10 w-10 transition-colors"
                            onClick={handleZoomIn}
                            title="Zoom In"
                        >
                            <ZoomIn className="w-5 h-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/10 rounded-full h-10 w-10 transition-colors"
                            onClick={handleZoomOut}
                            title="Zoom Out"
                        >
                            <ZoomOut className="w-5 h-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/10 rounded-full h-10 w-10 transition-colors"
                            onClick={toggleFullscreen}
                            title="Toggle Fullscreen"
                        >
                            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                        </Button>
                        <a href={images[currentIndex]} download target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full h-10 w-10 transition-colors" title="Download">
                                <Download className="w-5 h-5" />
                            </Button>
                        </a>
                        <div className="w-px h-6 bg-white/20 mx-1" />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/20 rounded-full h-10 w-10 transition-colors"
                            onClick={onClose}
                            title="Close (Esc)"
                        >
                            <X className="w-6 h-6" />
                        </Button>
                    </div>
                </motion.div>

                {/* Navigation buttons */}
                {images.length > 1 && (
                    <>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute left-6 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 z-[10001] h-14 w-14 rounded-full transition-all hover:scale-110 active:scale-95 bg-black/20 backdrop-blur-sm"
                            onClick={handlePrev}
                        >
                            <ChevronLeft className="w-10 h-10" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-6 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 z-[10001] h-14 w-14 rounded-full transition-all hover:scale-110 active:scale-95 bg-black/20 backdrop-blur-sm"
                            onClick={handleNext}
                        >
                            <ChevronRight className="w-10 h-10" />
                        </Button>
                    </>
                )}

                {/* Image Container */}
                <div className="relative w-full h-full flex items-center justify-center p-4 md:p-12 overflow-hidden select-none">
                    <motion.img
                        key={currentIndex}
                        layoutId={`lightbox-img-${currentIndex}`}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: zoom }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
                        src={images[currentIndex]}
                        className={cn(
                            "max-w-full max-h-full object-contain shadow-2xl rounded-sm cursor-default",
                            zoom > 1 ? "cursor-move" : ""
                        )}
                        onClick={(e) => e.stopPropagation()}
                        draggable={false}
                    />
                </div>

                {/* Thumbnail Strip */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 px-6 overflow-x-auto no-scrollbar z-[10001]"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex gap-2 p-2 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10">
                        {images.map((img, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    setCurrentIndex(idx);
                                    setZoom(1);
                                }}
                                className={cn(
                                    "relative w-14 h-14 rounded-lg overflow-hidden transition-all duration-300 border-2",
                                    currentIndex === idx ? "border-primary scale-110 shadow-lg" : "border-transparent opacity-50 hover:opacity-100"
                                )}
                            >
                                <img src={img} className="w-full h-full object-cover" alt="" />
                            </button>
                        ))}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
