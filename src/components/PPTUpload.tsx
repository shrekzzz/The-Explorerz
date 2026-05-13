import React, { useState, useRef } from "react";
import { Upload, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface PPTUploadProps {
  value: { url: string; filename: string } | null;
  onChange: (value: { url: string; filename: string } | null) => void;
  label?: string;
}

export default function PPTUpload({ value, onChange, label = "PPT File" }: PPTUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isVercelDeployment] = useState(() => {
    return typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/pdf'
    ];
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.(ppt|pptx|pdf)$/i)) {
      toast.error("Please select a PPT, PPTX, or PDF file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    if (isVercelDeployment) {
      toast.error("File upload is not available on the live preview.");
      return;
    }

    setIsUploading(true);

    try {
      setFileName(file.name);

      // Create FormData for upload
      const formData = new FormData();
      formData.append('ppt', file);

      // Upload to server
      const response = await api.post('/uploads/ppt', formData);
      const result = response.data;

      if (result.success) {
        onChange({ url: result.data.url, filename: result.data.filename });
        toast.success(`File "${file.name}" uploaded successfully!`);
      } else {
        throw new Error(result.error || 'Upload failed');
      }

    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file. Make sure the upload server is running.");
      setFileName(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setFileName(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  // Extract filename from value
  React.useEffect(() => {
    if (value) {
      setFileName(value.filename);
    } else {
      setFileName(null);
    }
  }, [value]);

  return (
    <div className="space-y-2">
      <Label htmlFor="ppt-upload">{label}</Label>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".ppt,.pptx,.pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/pdf"
        onChange={handleFileSelect}
        className="hidden"
        id="ppt-upload"
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
          {isUploading ? "Uploading..." : "Upload PPT/PDF"}
        </Button>

        {fileName && (
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

      {/* File info */}
      {fileName && (
        <div className="flex items-center gap-2 p-3 border border-border rounded-lg bg-muted/30">
          <FileText className="w-5 h-5 text-primary" />
          <span className="text-sm text-foreground">{fileName}</span>
        </div>
      )}
    </div>
  );
}
