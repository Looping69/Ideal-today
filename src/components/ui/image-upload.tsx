
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Loader2, Upload, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

interface ImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  onRemove: (url: string) => void;
  bucket: "property-images" | "avatars" | "review-photos";
  maxFiles?: number;
  className?: string;
}

export default function ImageUpload({
  value,
  onChange,
  onRemove,
  bucket,
  maxFiles = 5,
  className,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

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

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file);

        if (uploadError) {
          throw uploadError;
        }

        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
        newUrls.push(data.publicUrl);
      }

      onChange([...value, ...newUrls]);
      toast({
        title: "Success",
        description: "Images uploaded successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message,
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
            <img
              src={url}
              alt="Upload"
              className="object-cover w-full h-full"
            />
          </div>
        ))}
      </div>

      {value.length < maxFiles && (
        <div>
          <input
            type="file"
            accept="image/*"
            multiple={maxFiles > 1}
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
            className="w-full h-32 border-dashed border-2 flex flex-col gap-2 hover:bg-gray-50"
          >
            {isUploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-500">
                <div className="p-2 bg-gray-100 rounded-full">
                  <Upload className="h-5 w-5" />
                </div>
                <span className="font-medium">Click to upload images</span>
                <span className="text-xs text-gray-400">
                  JPG, PNG, GIF up to 5MB
                </span>
              </div>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
