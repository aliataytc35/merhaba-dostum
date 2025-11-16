import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Heart, ArrowLeft, Send, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  profile: {
    username: string;
    avatar_url: string | null;
  };
}

interface PostData {
  id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  user_id: string;
  profile: {
    username: string;
    avatar_url: string | null;
  };
}

const PostDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<PostData | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPostData();

    if (!postId) return;

    const channel = supabase
      .channel(`post-${postId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comments",
          filter: `post_id=eq.${postId}`,
        },
        () => {
          fetchPostData();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "likes",
          filter: `post_id=eq.${postId}`,
        },
        () => {
          fetchPostData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, user]);

  const fetchPostData = async () => {
    if (!postId) return;

    try {
      // Fetch post
      const { data: postData, error: postError } = await supabase
        .from("posts")
        .select(`
          *,
          profile:profiles(username, avatar_url)
        `)
        .eq("id", postId)
        .single();

      if (postError) throw postError;
      setPost(postData);

      // Fetch likes
      const { count: likesCount } = await supabase
        .from("likes")
        .select("*", { count: "exact", head: true })
        .eq("post_id", postId);
      setLikes(likesCount || 0);

      // Check if user liked
      if (user) {
        const { data: likeData } = await supabase
          .from("likes")
          .select("id")
          .eq("post_id", postId)
          .eq("user_id", user.id)
          .maybeSingle();
        setIsLiked(!!likeData);
      }

      // Fetch comments
      const { data: commentsData, error: commentsError } = await supabase
        .from("comments")
        .select(`
          *,
          profile:profiles(username, avatar_url)
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (commentsError) throw commentsError;
      setComments(commentsData || []);
    } catch (error) {
      console.error("Error fetching post:", error);
      toast.error("Gönderi yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async () => {
    if (!user || !postId) return;

    try {
      if (isLiked) {
        await supabase
          .from("likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);
        setLikes((prev) => prev - 1);
        setIsLiked(false);
      } else {
        await supabase.from("likes").insert({
          post_id: postId,
          user_id: user.id,
        });
        setLikes((prev) => prev + 1);
        setIsLiked(true);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !postId || !newComment.trim()) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("comments")
        .insert({
          post_id: postId,
          user_id: user.id,
          content: newComment.trim(),
        })
        .select(`
          *,
          profile:profiles(username, avatar_url)
        `)
        .single();

      if (error) throw error;

      setComments((prev) => [...prev, data]);
      setNewComment("");
      toast.success("Yorum eklendi");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Yorum eklenemedi");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Gönderi bulunamadı</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-background border-b border-border z-40 px-4 h-14 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">Gönderi</h1>
      </header>

      {/* Post */}
      <div className="max-w-md mx-auto">
        {/* Post Header */}
        <div className="flex items-center gap-3 p-3 border-b border-border">
          <Avatar className="w-8 h-8">
            <AvatarImage src={post.profile.avatar_url || undefined} />
            <AvatarFallback>
              {post.profile.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="font-semibold text-sm">{post.profile.username}</span>
        </div>

        {/* Post Image */}
        <AspectRatio ratio={1}>
          <img
            src={post.image_url}
            alt="Post"
            className="w-full h-full object-cover"
          />
        </AspectRatio>

        {/* Actions */}
        <div className="flex items-center gap-4 px-3 py-2 border-b border-border">
          <button onClick={toggleLike} className="hover:text-muted-foreground transition-colors">
            <Heart
              className={cn(
                "w-6 h-6 transition-colors",
                isLiked && "fill-red-500 text-red-500"
              )}
            />
          </button>
        </div>

        {/* Likes & Caption */}
        <div className="px-3 py-2 space-y-2 border-b border-border">
          <p className="font-semibold text-sm">{likes.toLocaleString("tr-TR")} beğenme</p>
          {post.caption && (
            <p className="text-sm">
              <span className="font-semibold mr-2">{post.profile.username}</span>
              {post.caption}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(post.created_at), {
              addSuffix: true,
              locale: tr,
            })}
          </p>
        </div>

        {/* Comments */}
        <div className="divide-y divide-border">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 p-3">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarImage src={comment.profile.avatar_url || undefined} />
                <AvatarFallback>
                  {comment.profile.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-semibold mr-2">
                    {comment.profile.username}
                  </span>
                  {comment.content}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(comment.created_at), {
                    addSuffix: true,
                    locale: tr,
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comment Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-3">
        <form onSubmit={handleSubmitComment} className="max-w-md mx-auto flex gap-2">
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Yorum ekle..."
            disabled={submitting}
            maxLength={500}
            className="flex-1"
          />
          <Button type="submit" disabled={!newComment.trim() || submitting} size="icon">
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default PostDetail;
