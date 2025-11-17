import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFollow } from "@/hooks/useFollow";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Grid3X3, ArrowLeft, MessageCircle } from "lucide-react";
import { MobileNav } from "@/components/MobileNav";
import { toast } from "@/hooks/use-toast";

interface ProfileData {
  id: string;
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

const UserProfile = () => {
  const { username } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingConversation, setCreatingConversation] = useState(false);
  
  const { isFollowing, toggleFollow, loading: followLoading } = useFollow(profile?.id);

  useEffect(() => {
    fetchProfileData();
  }, [username]);

  const fetchProfileData = async () => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, username, full_name, bio, avatar_url, followers_count, following_count")
        .eq("username", username)
        .single();

      if (profileError) throw profileError;

      if (profileData.id === user?.id) {
        navigate("/profile");
        return;
      }

      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("id, image_url")
        .eq("user_id", profileData.id)
        .order("created_at", { ascending: false });

      if (postsError) throw postsError;

      setProfile(profileData);
      setPosts(postsData || []);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!user || !profile) return;

    setCreatingConversation(true);
    try {
      const { data: existingParticipants } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      if (existingParticipants) {
        for (const participant of existingParticipants) {
          const { data: otherParticipant } = await supabase
            .from("conversation_participants")
            .select("conversation_id")
            .eq("conversation_id", participant.conversation_id)
            .eq("user_id", profile.id)
            .single();

          if (otherParticipant) {
            navigate(`/messages/${participant.conversation_id}`);
            return;
          }
        }
      }

      const { data: newConversation, error: convError } = await supabase
        .from("conversations")
        .insert({})
        .select()
        .single();

      if (convError) throw convError;

      const { error: participantsError } = await supabase
        .from("conversation_participants")
        .insert([
          { conversation_id: newConversation.id, user_id: user.id },
          { conversation_id: newConversation.id, user_id: profile.id },
        ]);

      if (participantsError) throw participantsError;

      navigate(`/messages/${newConversation.id}`);
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast({ description: "Bir hata oluştu", variant: "destructive" });
    } finally {
      setCreatingConversation(false);
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
      <header className="sticky top-0 bg-background border-b border-border z-40 px-4 h-14 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">{profile.username}</h1>
      </header>

      <div className="max-w-md mx-auto">
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
                  <div className="font-semibold text-lg">{profile.followers_count}</div>
                  <div className="text-sm text-muted-foreground">takipçi</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-lg">{profile.following_count}</div>
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

          <div className="flex gap-2">
            <Button
              variant={isFollowing ? "outline" : "default"}
              className="flex-1"
              onClick={toggleFollow}
              disabled={followLoading}
            >
              {followLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isFollowing ? (
                "Takipten Çık"
              ) : (
                "Takip Et"
              )}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={handleSendMessage}
              disabled={creatingConversation}
            >
              {creatingConversation ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MessageCircle className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        <div className="border-t border-border">
          <div className="flex items-center justify-center gap-2 py-3 border-b border-border">
            <Grid3X3 className="w-5 h-5" />
            <span className="text-sm font-semibold">GÖNDERİLER</span>
          </div>

          {posts.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              Henüz gönderi yok
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

export default UserProfile;
