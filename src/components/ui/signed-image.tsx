import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignedImageProps {
    bucket: string;
    path: string;
    alt?: string;
    className?: string;
    fallback?: React.ReactNode;
}

export default function SignedImage({
    bucket,
    path,
    alt = "Image",
    className,
    fallback,
}: SignedImageProps) {
    const [url, setUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        async function getSignedUrl() {
            if (!path) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                // Path might be a full URL if it hasn't been migrated yet
                let filePath = path;
                if (path.includes("/storage/v1/object/public/")) {
                    filePath = path.split(`${bucket}/`)[1] || path;
                }

                const { data, error: signedError } = await supabase.storage
                    .from(bucket)
                    .createSignedUrl(filePath, 3600); // 1 hour expiry

                if (signedError) throw signedError;

                if (isMounted) {
                    setUrl(data.signedUrl);
                }
            } catch (err: any) {
                console.error("Error creating signed URL:", err);
                if (isMounted) {
                    setError(err.message);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        getSignedUrl();

        return () => {
            isMounted = false;
        };
    }, [bucket, path]);

    if (loading) {
        return (
            <div className={cn("flex items-center justify-center bg-gray-50 rounded-lg", className)}>
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
        );
    }

    if (error || !url) {
        return fallback || (
            <div className={cn("flex flex-col items-center justify-center bg-red-50 text-red-500 rounded-lg p-2 text-center", className)}>
                <AlertCircle className="w-5 h-5 mb-1" />
                <span className="text-[10px] leading-tight">Failed to load secure image</span>
            </div>
        );
    }

    return (
        <img
            src={url}
            alt={alt}
            className={cn("object-cover", className)}
        />
    );
}
