import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { MobileNav } from "@/components/MobileNav";

const CreateStory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Dosya boyutu 10MB'dan küçük olmalı");
        return;
      }
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!user || !imageFile) return;

    setUploading(true);
    try {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("posts")
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("posts")
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase
        .from("stories")
        .insert({
          user_id: user.id,
          image_url: publicUrl,
        });

      if (insertError) throw insertError;

      toast.success("Story paylaşıldı");
      navigate("/");
    } catch (error) {
      console.error("Error uploading story:", error);
      toast.error("Story yüklenemedi");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 bg-background border-b border-border z-40 px-4 h-14 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <X className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">Story Ekle</h1>
        <Button
          onClick={handleUpload}
          disabled={!imageFile || uploading}
          size="sm"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Paylaş"}
        </Button>
      </header>

      <div className="max-w-md mx-auto p-4">
        {!preview ? (
          <label className="flex flex-col items-center justify-center h-96 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
            <Camera className="w-12 h-12 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground">Fotoğraf Seç</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </label>
        ) : (
          <div className="relative">
            <img
              src={preview}
              alt="Story preview"
              className="w-full rounded-lg"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 bg-background/80 hover:bg-background"
              onClick={() => {
                setImageFile(null);
                setPreview(null);
              }}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>

      <MobileNav />
    </div>
  );
};

export default CreateStory;
