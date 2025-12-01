import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Grid3X3, LogOut, Settings, Camera } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useTranslation } from "react-i18next";
import { useAdmin } from "@/hooks/useAdmin";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MobileNav } from "@/components/MobileNav";

interface ProfileData {
  username: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  followers_count: number;
  following_count: number;
}

interface Post {
  id: string;
  image_url: string;
}

const Profile = () => {
  const { user, signOut } = useAuth();
  const { t } = useTranslation();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: "", bio: "" });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

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
          .select("username, full_name, bio, avatar_url, followers_count, following_count")
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
      toast.error(t('profile.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleEditClick = () => {
    setEditForm({
      full_name: profile?.full_name || "",
      bio: profile?.bio || "",
    });
    setAvatarPreview(profile?.avatar_url || null);
    setEditDialogOpen(true);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    setUpdating(true);
    try {
      let avatarUrl = profile?.avatar_url;

      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop();
        const fileName = `${user.id}/avatar.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("posts")
          .upload(fileName, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("posts")
          .getPublicUrl(fileName);

        avatarUrl = publicUrl;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: editForm.full_name.trim() || null,
          bio: editForm.bio.trim() || null,
          avatar_url: avatarUrl,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success(t('profile.updated'));
      setEditDialogOpen(false);
      fetchProfileData();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(t('profile.updateError'));
    } finally {
      setUpdating(false);
    }
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
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
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
                  <div className="text-sm text-muted-foreground">{t('profile.posts')}</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-lg">{profile.followers_count}</div>
                  <div className="text-sm text-muted-foreground">{t('profile.followers')}</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-lg">{profile.following_count}</div>
                  <div className="text-sm text-muted-foreground">{t('profile.following')}</div>
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

          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full" onClick={handleEditClick}>
                <Settings className="w-4 h-4 mr-2" />
                {t('profile.edit')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('profile.editTitle')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
...
                <div className="space-y-2">
                  <Label htmlFor="full_name">{t('profile.fullName')}</Label>
                  <Input
                    id="full_name"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    placeholder={t('profile.namePlaceholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">{t('profile.bio')}</Label>
                  <Textarea
                    id="bio"
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    placeholder={t('profile.bioPlaceholder')}
                    rows={4}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setEditDialogOpen(false)}
                    disabled={updating}
                  >
                    {t('profile.cancel')}
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleUpdateProfile}
                    disabled={updating}
                  >
                    {updating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      t('profile.save')
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {isAdmin && (
            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={() => navigate("/admin")}
            >
              <Settings className="w-4 h-4 mr-2" />
              Admin Paneli
            </Button>
          )}
        </div>

        {/* Posts Grid */}
        <div className="border-t border-border">
          <div className="flex items-center justify-center gap-2 py-3 border-b border-border">
            <Grid3X3 className="w-5 h-5" />
            <span className="text-sm font-semibold">{t('profile.postsTitle')}</span>
          </div>

          {posts.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-muted-foreground mb-2">{t('profile.noPosts')}</div>
              <Button
                variant="link"
                onClick={() => navigate("/create")}
                className="text-primary"
              >
                {t('profile.shareFirst')}
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

      <MobileNav />
    </div>
  );
};

export default Profile;
