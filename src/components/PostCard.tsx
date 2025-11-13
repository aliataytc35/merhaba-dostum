import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PostCardProps {
  username: string;
  userAvatar?: string;
  postImage: string;
  likes: number;
  caption: string;
  timeAgo: string;
}

export const PostCard = ({ username, userAvatar, postImage, likes, caption, timeAgo }: PostCardProps) => {
  return (
    <div className="bg-card border-b border-border">
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2">
          <Avatar className="w-8 h-8">
            <AvatarImage src={userAvatar} />
            <AvatarFallback>{username[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-semibold">{username}</span>
        </div>
        <MoreHorizontal className="w-5 h-5" />
      </div>

      {/* Image */}
      <div className="w-full aspect-square bg-muted">
        <img src={postImage} alt={`Post by ${username}`} className="w-full h-full object-cover" />
      </div>

      {/* Actions */}
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Heart className="w-6 h-6" />
            <MessageCircle className="w-6 h-6" />
            <Send className="w-6 h-6" />
          </div>
          <Bookmark className="w-6 h-6" />
        </div>

        {/* Likes */}
        <div className="font-semibold text-sm">
          {likes.toLocaleString()} beğeni
        </div>

        {/* Caption */}
        <div className="text-sm">
          <span className="font-semibold mr-2">{username}</span>
          <span>{caption}</span>
        </div>

        {/* Time */}
        <div className="text-xs text-muted-foreground uppercase">
          {timeAgo}
        </div>
      </div>
    </div>
  );
};
