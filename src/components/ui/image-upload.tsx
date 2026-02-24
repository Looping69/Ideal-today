import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Loader2, Upload, X, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import SignedImage from "./signed-image";
import { compressImage, blobToFile, formatBytes } from "@/lib/imageCompression";
import CameraCapture from "./camera-capture";

interface ImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  onRemove: (url: string) => void;
  bucket: "property-images" | "avatars" | "review-photos" | "verification";
  maxFiles?: number;
  className?: string;
  isPrivate?: boolean;
  allowCamera?: boolean;
}

export default function ImageUpload({
  value,
  onChange,
  onRemove,
  bucket,
  maxFiles = 5,
  className,
  isPrivate = false,
  allowCamera = false,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) return;

    if (value.length + files.length > maxFiles) {
      toast({
        variant: "destructive",
        title: "Too many files",
        description: `You can only upload a maximum of ${maxFiles} images.`,
      });
      return;
    }

    setIsUploading(true);
    const newUrls: string[] = [];
    let totalOriginalSize = 0;
    let totalCompressedSize = 0;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setCompressionProgress(`Optimizing ${i + 1}/${files.length}...`);

        // Skip non-image files
        if (!file.type.startsWith('image/')) {
          toast({
            variant: "destructive",
            title: "Invalid file type",
            description: `${file.name} is not an image file.`,
          });
          continue;
        }

        // Compress the image
        const result = await compressImage(file, {
          maxWidth: bucket === 'avatars' ? 400 : 1920,
          maxHeight: bucket === 'avatars' ? 400 : 1080,
          quality: 0.82,
          outputFormat: 'webp',
        });

        totalOriginalSize += result.originalSize;
        totalCompressedSize += result.compressedSize;

        // Convert blob to file for upload
        const compressedFile = blobToFile(result.blob, file.name, result.format);

        const fileName = `${Math.random().toString(36).substring(2)}.${result.format === 'webp' ? 'webp' : 'jpg'}`;
        const filePath = `${fileName}`;

        setCompressionProgress(`Uploading ${i + 1}/${files.length}...`);

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, compressedFile);

        if (uploadError) {
          throw uploadError;
        }

        if (isPrivate) {
          // For private files, we store the relative path
          newUrls.push(filePath);
        } else {
          const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
          newUrls.push(data.publicUrl);
        }
      }

      onChange([...value, ...newUrls]);

      // Show compression stats in toast
      const savedBytes = totalOriginalSize - totalCompressedSize;
      const savedPercent = Math.round((savedBytes / totalOriginalSize) * 100);

      toast({
        title: "Upload complete",
        description: savedPercent > 5
          ? `Optimized ${formatBytes(totalOriginalSize)} → ${formatBytes(totalCompressedSize)} (${savedPercent}% smaller)`
          : "Images uploaded successfully",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An unknown error occurred";
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: message,
      });
    } finally {
      setIsUploading(false);
      setCompressionProgress(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      uploadFiles(Array.from(files));
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
        {value.map((url) => (
          <div
            key={url}
            className="relative aspect-video rounded-xl overflow-hidden border border-gray-200 group"
          >
            <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="h-6 w-6 rounded-full"
                onClick={() => onRemove(url)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            {isPrivate ? (
              <SignedImage
                bucket={bucket}
                path={url}
                className="object-cover w-full h-full"
              />
            ) : (
              <img
                src={url}
                alt="Upload"
                className="object-cover w-full h-full"
              />
            )}
          </div>
        ))}
      </div>

      {value.length < maxFiles && (
        <div className="flex flex-col gap-3">
          <input
            type="file"
            accept="image/*"
            multiple={maxFiles > 1}
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileSelect}
            disabled={isUploading}
          />

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "flex-1 h-32 border-dashed border-2 flex flex-col gap-2 hover:bg-gray-50",
                allowCamera && "sm:h-32 h-24"
              )}
            >
              {isUploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  {compressionProgress && (
                    <span className="text-sm font-medium text-gray-600 animate-pulse">
                      {compressionProgress}
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-500">
                  <div className="p-2 bg-gray-100 rounded-full">
                    <Upload className="h-5 w-5" />
                  </div>
                  <span className="font-medium">Upload Image</span>
                  <span className="text-xs text-gray-400">
                    JPG, PNG, GIF
                  </span>
                </div>
              )}
            </Button>

            {allowCamera && (
              <CameraCapture
                onCapture={(file) => uploadFiles([file])}
                trigger={
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isUploading}
                    className="flex-1 h-32 border-dashed border-2 flex flex-col gap-2 hover:bg-gray-50"
                  >
                    <div className="p-2 bg-gray-100 rounded-full">
                      <Camera className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-medium text-primary">Take Photo</span>
                    <span className="text-xs text-gray-400 font-normal">
                      Use device camera
                    </span>
                  </Button>
                }
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

