import { Heart, MessageCircle } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface PostCardProps {
  id: string;
  username: string;
  avatarUrl: string | null;
  postImage: string;
  likes: number;
  caption: string | null;
  createdAt: string;
  isLiked: boolean;
  commentsCount: number;
  onLikeToggle: () => void;
}

export const PostCard = ({ 
  id,
  username, 
  avatarUrl,
  postImage, 
  likes, 
  caption, 
  createdAt,
  isLiked,
  commentsCount,
  onLikeToggle
}: PostCardProps) => {
  const navigate = useNavigate();
  const timeAgo = formatDistanceToNow(new Date(createdAt), { 
    addSuffix: true,
    locale: tr 
  });

  return (
    <div className="border-b border-border">
      {/* Header */}
      <div className="flex items-center gap-3 p-3">
        <div 
          onClick={() => navigate(`/profile/${username}`)}
          className="w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(var(--primary-gradient-start))] to-[hsl(var(--primary-gradient-end))] p-[2px] cursor-pointer"
        >
          <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
            <Avatar className="w-6 h-6">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="text-xs">
                {username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
        <span 
          onClick={() => navigate(`/profile/${username}`)}
          className="font-semibold text-sm cursor-pointer hover:text-muted-foreground transition-colors"
        >
          {username}
        </span>
      </div>

      {/* Image */}
      <AspectRatio ratio={1}>
        <img 
          src={postImage} 
          alt={`Post by ${username}`} 
          className="w-full h-full object-cover" 
        />
      </AspectRatio>

      {/* Actions */}
      <div className="flex items-center gap-4 px-3 py-2">
        <button 
          onClick={onLikeToggle}
          className="hover:text-muted-foreground transition-colors"
        >
          <Heart 
            className={cn(
              "w-6 h-6 transition-colors",
              isLiked && "fill-red-500 text-red-500"
            )} 
          />
        </button>
        <button 
          onClick={() => navigate(`/post/${id}`)}
          className="hover:text-muted-foreground transition-colors"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      </div>

      {/* Likes & Caption */}
      <div className="px-3 pb-2 space-y-1">
        <p className="font-semibold text-sm">{likes.toLocaleString('tr-TR')} beğenme</p>
        {caption && (
          <p className="text-sm">
            <span className="font-semibold mr-2">{username}</span>
            {caption}
          </p>
        )}
        {commentsCount > 0 && (
          <button 
            onClick={() => navigate(`/post/${id}`)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {commentsCount} yorumun tümünü gör
          </button>
        )}
        <p className="text-xs text-muted-foreground">{timeAgo}</p>
      </div>
    </div>
  );
};
