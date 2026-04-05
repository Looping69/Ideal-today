import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Loader2, Upload, X, Video, Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface VideoUploadProps {
    value: string | null;
    onChange: (url: string | null) => void;
    bucket?: string;
    maxSizeMB?: number;
    className?: string;
}

export default function VideoUpload({
    value,
    onChange,
    bucket = "property-videos",
    maxSizeMB = 50,
    className,
}: VideoUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const { toast } = useToast();
    const { user } = useAuth();

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!user) {
            toast({
                variant: "destructive",
                title: "Authentication required",
                description: "Please sign in before uploading files.",
            });
            return;
        }

        // Validate file type
        const validTypes = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"];
        if (!validTypes.includes(file.type)) {
            toast({
                variant: "destructive",
                title: "Invalid file type",
                description: "Please upload an MP4, WebM, MOV, or AVI video.",
            });
            return;
        }

        // Validate file size
        const maxBytes = maxSizeMB * 1024 * 1024;
        if (file.size > maxBytes) {
            toast({
                variant: "destructive",
                title: "File too large",
                description: `Video must be under ${maxSizeMB}MB.`,
            });
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        try {
            const fileExt = file.name.split(".").pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;

            // Simulate progress (Supabase doesn't provide upload progress)
            const progressInterval = setInterval(() => {
                setUploadProgress((prev) => Math.min(prev + 10, 90));
            }, 200);

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, file, {
                    cacheControl: "3600",
                    upsert: false,
                });

            clearInterval(progressInterval);

            if (uploadError) {
                throw uploadError;
            }

            setUploadProgress(100);

            const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
            onChange(data.publicUrl);

            toast({
                title: "Video uploaded",
                description: "Your property video has been uploaded successfully.",
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Upload failed",
                description: error.message || "Failed to upload video. Please try again.",
            });
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleRemove = async () => {
        if (value) {
            // Extract filename from URL
            try {
                const url = new URL(value);
                const marker = `/object/public/${bucket}/`;
                const path = url.pathname.includes(marker)
                    ? decodeURIComponent(url.pathname.split(marker)[1])
                    : decodeURIComponent(url.pathname.split(`/${bucket}/`).slice(1).join(`/${bucket}/`));

                if (path) {
                    await supabase.storage.from(bucket).remove([path]);
                }
            } catch (e) {
                console.error("Error removing video:", e);
            }
        }
        onChange(null);
        setIsPlaying(false);
    };

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    return (
        <div className={cn("space-y-4", className)}>
            {value ? (
                <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-black">
                    <video
                        ref={videoRef}
                        src={value}
                        className="w-full aspect-video object-contain"
                        onEnded={() => setIsPlaying(false)}
                        playsInline
                    />

                    {/* Play/Pause overlay */}
                    <button
                        type="button"
                        onClick={togglePlay}
                        className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors group"
                    >
                        <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            {isPlaying ? (
                                <Pause className="w-6 h-6 text-gray-800" />
                            ) : (
                                <Play className="w-6 h-6 text-gray-800 ml-1" />
                            )}
                        </div>
                    </button>

                    {/* Remove button */}
                    <div className="absolute top-3 right-3">
                        <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8 rounded-full shadow-lg"
                            onClick={handleRemove}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Video badge */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/70 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                        <Video className="w-3 h-3" />
                        Property Video
                    </div>
                </div>
            ) : (
                <div>
                    <input
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleUpload}
                        disabled={isUploading}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        disabled={isUploading}
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-40 border-dashed border-2 flex flex-col gap-3 hover:bg-gray-50 hover:border-primary/50 transition-all"
                    >
                        {isUploading ? (
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                                <span className="text-sm text-gray-500">Uploading... {uploadProgress}%</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3 text-gray-500">
                                <div className="p-3 bg-primary/10 rounded-full">
                                    <Video className="h-6 w-6 text-primary" />
                                </div>
                                <div className="text-center">
                                    <span className="font-semibold text-gray-700 block">Upload Property Video</span>
                                    <span className="text-xs text-gray-400 block mt-1">
                                        MP4, WebM, MOV up to {maxSizeMB}MB
                                    </span>
                                </div>
                                <span className="text-xs text-primary font-medium">
                                    Showcase your property with a walkthrough video
                                </span>
                            </div>
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}
