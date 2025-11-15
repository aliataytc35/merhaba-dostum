import { MobileNav } from "@/components/MobileNav";
import { PostCard } from "@/components/PostCard";
import { useAuth } from "@/hooks/useAuth";
import { usePosts } from "@/hooks/usePosts";
import { LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { signOut } = useAuth();
  const { posts, loading, toggleLike } = usePosts();

  return (
    <div className="min-h-screen bg-background pb-14">
      {/* Header */}
      <header className="sticky top-0 bg-background border-b border-border z-40 px-4 h-14 flex items-center justify-between">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-[hsl(var(--primary-gradient-start))] to-[hsl(var(--primary-gradient-end))] bg-clip-text text-transparent">
          izmirgram
        </h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={signOut}
          className="text-muted-foreground hover:text-foreground"
        >
          <LogOut className="w-5 h-5" />
        </Button>
      </header>

      {/* Feed */}
      <div className="max-w-md mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <p className="text-muted-foreground mb-2">Henüz gönderi yok</p>
            <p className="text-sm text-muted-foreground">
              İlk gönderiyi paylaşmak için + butonuna tıklayın
            </p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              id={post.id}
              username={post.profile.username}
              avatarUrl={post.profile.avatar_url}
              postImage={post.image_url}
              likes={post.likes_count}
              caption={post.caption}
              createdAt={post.created_at}
              isLiked={post.is_liked}
              commentsCount={post.comments_count}
              onLikeToggle={() => toggleLike(post.id)}
            />
          ))
        )}
      </div>

      {/* Bottom Navigation */}
      <MobileNav />
    </div>
  );
};

export default Index;
