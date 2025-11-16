import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Heart, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface Activity {
  id: string;
  type: "like" | "comment";
  created_at: string;
  post_id: string;
  post_image: string;
  profile: {
    username: string;
    avatar_url: string | null;
  };
  comment_content?: string;
}

const Activity = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchActivities();
    }
  }, [user]);

  const fetchActivities = async () => {
    if (!user) return;

    try {
      const { data: postsData } = await supabase
        .from("posts")
        .select("id, image_url")
        .eq("user_id", user.id);

      if (!postsData || postsData.length === 0) {
        setActivities([]);
        setLoading(false);
        return;
      }

      const postIds = postsData.map(p => p.id);
      const postImageMap = postsData.reduce((acc, post) => {
        acc[post.id] = post.image_url;
        return acc;
      }, {} as Record<string, string>);

      const [likesResult, commentsResult] = await Promise.all([
        supabase
          .from("likes")
          .select("id, created_at, post_id, user_id, profile:profiles(username, avatar_url)")
          .in("post_id", postIds)
          .neq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("comments")
          .select("id, created_at, post_id, user_id, content, profile:profiles(username, avatar_url)")
          .in("post_id", postIds)
          .neq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      const likes = (likesResult.data || []).map(like => ({
        id: like.id,
        type: "like" as const,
        created_at: like.created_at,
        post_id: like.post_id,
        post_image: postImageMap[like.post_id],
        profile: like.profile,
      }));

      const comments = (commentsResult.data || []).map(comment => ({
        id: comment.id,
        type: "comment" as const,
        created_at: comment.created_at,
        post_id: comment.post_id,
        post_image: postImageMap[comment.post_id],
        profile: comment.profile,
        comment_content: comment.content,
      }));

      const allActivities = [...likes, ...comments].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setActivities(allActivities);
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 bg-background border-b border-border z-40 px-4 h-14 flex items-center">
        <h1 className="text-lg font-semibold">Aktivite</h1>
      </header>

      <div className="max-w-md mx-auto divide-y divide-border">
        {activities.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            Henüz aktivite yok
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              onClick={() => navigate(`/post/${activity.post_id}`)}
              className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors"
            >
              <Avatar className="w-10 h-10">
                <AvatarImage src={activity.profile.avatar_url || undefined} />
                <AvatarFallback>
                  {activity.profile.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold truncate">
                    {activity.profile.username}
                  </span>
                  {activity.type === "like" ? (
                    <Heart className="w-4 h-4 fill-red-500 text-red-500 flex-shrink-0" />
                  ) : (
                    <MessageCircle className="w-4 h-4 flex-shrink-0" />
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {activity.type === "like"
                    ? "gönderini beğendi"
                    : activity.comment_content
                    ? `"${activity.comment_content.length > 40 ? activity.comment_content.slice(0, 40) + "..." : activity.comment_content}"`
                    : "yorum yaptı"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(activity.created_at), {
                    addSuffix: true,
                    locale: tr,
                  })}
                </div>
              </div>

              <img
                src={activity.post_image}
                alt="Post"
                className="w-12 h-12 object-cover rounded flex-shrink-0"
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Activity;
