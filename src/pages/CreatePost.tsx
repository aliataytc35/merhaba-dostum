import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera } from "@capacitor/camera";
import { CameraResultType, CameraSource } from "@capacitor/camera";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Camera as CameraIcon, Image as ImageIcon, ArrowLeft, Loader2 } from "lucide-react";

const CreatePost = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [caption, setCaption] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const takePhoto = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
      });

      if (image.webPath) {
        setImagePreview(image.webPath);
        const response = await fetch(image.webPath);
        const blob = await response.blob();
        const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
        setImageFile(file);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      toast.error("Fotoğraf çekilemedi");
    }
  };

  const pickFromGallery = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos,
      });

      if (image.webPath) {
        setImagePreview(image.webPath);
        const response = await fetch(image.webPath);
        const blob = await response.blob();
        const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
        setImageFile(file);
      }
    } catch (error) {
      console.error("Error picking photo:", error);
      toast.error("Fotoğraf seçilemedi");
    }
  };

  const handleSubmit = async () => {
    if (!imageFile || !user) {
      toast.error("Lütfen bir fotoğraf seçin");
      return;
    }

    setUploading(true);

    try {
      // Upload image to storage
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("posts")
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("posts")
        .getPublicUrl(fileName);

      // Create post in database
      const { error: postError } = await supabase
        .from("posts")
        .insert({
          user_id: user.id,
          image_url: publicUrl,
          caption: caption.trim() || null,
        });

      if (postError) throw postError;

      toast.success("Gönderi paylaşıldı!");
      navigate("/");
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Gönderi paylaşılamadı");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 bg-background border-b border-border z-40 px-4 h-14 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">Yeni Gönderi</h1>
        <div className="w-10" />
      </header>

      {/* Content */}
      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Image Selection */}
        {!imagePreview ? (
          <div className="space-y-3">
            <Button
              onClick={takePhoto}
              className="w-full h-32 flex flex-col gap-2"
              variant="outline"
            >
              <CameraIcon className="w-8 h-8" />
              <span>Fotoğraf Çek</span>
            </Button>
            <Button
              onClick={pickFromGallery}
              className="w-full h-32 flex flex-col gap-2"
              variant="outline"
            >
              <ImageIcon className="w-8 h-8" />
              <span>Galeriden Seç</span>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Image Preview */}
            <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Caption Input */}
            <Textarea
              placeholder="Bir açıklama yazın..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="min-h-24 resize-none"
              maxLength={500}
            />

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setImagePreview(null);
                  setImageFile(null);
                  setCaption("");
                }}
                disabled={uploading}
                className="flex-1"
              >
                Değiştir
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={uploading}
                className="flex-1"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Paylaşılıyor
                  </>
                ) : (
                  "Paylaş"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatePost;
