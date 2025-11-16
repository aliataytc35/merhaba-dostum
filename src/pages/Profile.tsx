import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Grid3X3, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface ProfileData {
  username: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
}

interface Post {
  id: string;
  image_url: string;
}

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    if (!user) return;

    try {
      const [profileResult, postsResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("username, full_name, bio, avatar_url")
          .eq("id", user.id)
          .single(),
        supabase
          .from("posts")
          .select("id, image_url")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (profileResult.error) throw profileResult.error;
      if (postsResult.error) throw postsResult.error;

      setProfile(profileResult.data);
      setPosts(postsResult.data || []);
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Profil yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Profil bulunamadı</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 bg-background border-b border-border z-40 px-4 h-14 flex items-center justify-between">
        <h1 className="text-lg font-semibold">{profile.username}</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSignOut}
          className="text-muted-foreground hover:text-foreground"
        >
          <LogOut className="w-5 h-5" />
        </Button>
      </header>

      <div className="max-w-md mx-auto">
        {/* Profile Info */}
        <div className="p-4">
          <div className="flex items-center gap-6 mb-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-2xl">
                {profile.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center gap-6 mb-2">
                <div className="text-center">
                  <div className="font-semibold text-lg">{posts.length}</div>
                  <div className="text-sm text-muted-foreground">gönderi</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-lg">0</div>
                  <div className="text-sm text-muted-foreground">takipçi</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-lg">0</div>
                  <div className="text-sm text-muted-foreground">takip</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1 mb-4">
            {profile.full_name && (
              <div className="font-semibold">{profile.full_name}</div>
            )}
            {profile.bio && (
              <div className="text-sm whitespace-pre-wrap">{profile.bio}</div>
            )}
          </div>

          <Button variant="outline" className="w-full">
            Profili Düzenle
          </Button>
        </div>

        {/* Posts Grid */}
        <div className="border-t border-border">
          <div className="flex items-center justify-center gap-2 py-3 border-b border-border">
            <Grid3X3 className="w-5 h-5" />
            <span className="text-sm font-semibold">GÖNDERİLER</span>
          </div>

          {posts.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-muted-foreground mb-2">Henüz gönderi yok</div>
              <Button
                variant="link"
                onClick={() => navigate("/create")}
                className="text-primary"
              >
                İlk gönderini paylaş
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {posts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => navigate(`/post/${post.id}`)}
                  className="aspect-square cursor-pointer hover:opacity-90 transition-opacity"
                >
                  <img
                    src={post.image_url}
                    alt="Post"
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
