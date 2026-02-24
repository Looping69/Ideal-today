import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw, Check, X, SwitchCamera, AlertTriangle } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface CameraCaptureProps {
    onCapture: (file: File) => void;
    trigger?: React.ReactNode;
}

export default function CameraCapture({ onCapture, trigger }: CameraCaptureProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const startCamera = async () => {
        setError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false,
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
                setIsReady(true);
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            setError("Camera access denied or not available. Please check your browser permissions.");
            setIsReady(false);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        setIsReady(false);
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext("2d");

            if (context) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                // Horizontal flip if using front camera
                if (facingMode === "user") {
                    context.translate(canvas.width, 0);
                    context.scale(-1, 1);
                }

                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
                setCapturedImage(dataUrl);
            }
        }
    };

    const handleUsePhoto = () => {
        if (capturedImage) {
            // Convert dataUrl to File
            fetch(capturedImage)
                .then((res) => res.blob())
                .then((blob) => {
                    const file = new File([blob], `selfie-${Date.now()}.jpg`, { type: "image/jpeg" });
                    onCapture(file);
                    handleClose();
                });
        }
    };

    const handleClose = () => {
        stopCamera();
        setCapturedImage(null);
        setError(null);
        setIsOpen(false);
    };

    const toggleCamera = () => {
        stopCamera();
        setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
        setTimeout(startCamera, 100);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (open) {
                setIsOpen(true);
                setTimeout(startCamera, 100);
            } else {
                handleClose();
            }
        }}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" className="gap-2">
                        <Camera className="w-4 h-4" />
                        Take Photo
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-black text-white border-gray-800">
                <DialogHeader className="p-4 bg-gray-900 border-b border-gray-800">
                    <DialogTitle>Take Photo</DialogTitle>
                </DialogHeader>

                <div className="relative aspect-[3/4] bg-neutral-900 flex items-center justify-center overflow-hidden">
                    {error ? (
                        <div className="p-8 text-center space-y-4">
                            <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto text-red-500">
                                <AlertTriangle className="w-8 h-8" />
                            </div>
                            <p className="text-gray-400 text-sm leading-relaxed">{error}</p>
                            <Button variant="outline" size="sm" onClick={startCamera} className="border-gray-700 text-white">
                                <RefreshCw className="w-3.5 h-3.5 mr-2" />
                                Try Again
                            </Button>
                        </div>
                    ) : (
                        <>
                            {!capturedImage ? (
                                <>
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        className={`w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
                                    />
                                    {!isReady && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                            <RefreshCw className="w-8 h-8 animate-spin text-white/50" />
                                        </div>
                                    )}
                                </>
                            ) : (
                                <img
                                    src={capturedImage}
                                    alt="Captured"
                                    className="w-full h-full object-cover"
                                />
                            )}

                            <canvas ref={canvasRef} className="hidden" />
                        </>
                    )}
                </div>

                <div className="p-6 bg-gray-900 flex items-center justify-between">
                    {!capturedImage ? (
                        <>
                            <Button variant="ghost" size="icon" onClick={handleClose} className="text-white hover:bg-gray-800">
                                <X className="w-6 h-6" />
                            </Button>
                            <Button
                                onClick={capturePhoto}
                                disabled={!isReady || !!error}
                                className="w-16 h-16 rounded-full bg-white hover:bg-gray-200 border-4 border-gray-400 p-0 disabled:opacity-50"
                            >
                                <div className="w-full h-full rounded-full border-2 border-primary" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={toggleCamera} disabled={!!error} className="text-white hover:bg-gray-800">
                                <SwitchCamera className="w-6 h-6" />
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => setCapturedImage(null)}
                                className="gap-2 bg-transparent border-white/20 text-white hover:bg-white/10"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Retake
                            </Button>
                            <Button
                                onClick={handleUsePhoto}
                                className="gap-2 bg-primary hover:bg-primary/90"
                            >
                                <Check className="w-4 h-4" />
                                Use Photo
                            </Button>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
