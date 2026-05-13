import React, { useState, useRef } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface ImageUploadProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export default function ImageUpload({ value, onChange, label = "Image" }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setIsUploading(true);
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post('/uploads/single', formData);
      const result = response.data;

      if (result.success) {
        onChange(result.data.url);
        toast.success(`Image "${file.name}" uploaded successfully!`);
      } else {
        throw new Error(result.error?.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      URL.revokeObjectURL(previewUrl);
      setPreview(null);
      toast.error(error.message || "Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  // Load preview from localStorage if value exists
  React.useEffect(() => {
    if (value && value.startsWith('uploaded-image-')) {
      const storedImage = localStorage.getItem(value);
      if (storedImage) {
        setPreview(storedImage);
      }
    } else if (value) {
      setPreview(value);
    }
  }, [value]);

  return (
    <div className="space-y-2">
      <Label htmlFor="image-upload">{label}</Label>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        id="image-upload"
      />

      {/* Upload area */}
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleClick}
          disabled={isUploading}
          className="flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          {isUploading ? "Uploading..." : "Upload Image"}
        </Button>

        {preview && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemove}
            className="text-destructive hover:text-destructive"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Preview */}
      {preview && (
        <div className="relative w-32 h-32 border border-border rounded-lg overflow-hidden">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* URL input fallback */}
      <div className="space-y-1">
        <Label htmlFor="image-url" className="text-sm text-muted-foreground">
          Or enter image URL directly:
        </Label>
        <Input
          id="image-url"
          value={value.startsWith('uploaded-image-') ? '' : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://example.com/image.jpg or /local-image.jpg"
        />
      </div>
    </div>
  );
}