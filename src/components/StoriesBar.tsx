import { useStories } from "@/hooks/useStories";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const StoriesBar = () => {
  const { groupedStories, loading } = useStories();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleStoryClick = (userId: string) => {
    navigate(`/story?userId=${userId}`);
  };

  const handleCreateStory = () => {
    navigate("/create-story");
  };

  if (loading) {
    return (
      <div className="border-b border-border bg-background">
        <div className="flex gap-4 px-4 py-3 overflow-x-auto">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1 min-w-[64px]">
              <Skeleton className="w-16 h-16 rounded-full" />
              <Skeleton className="w-12 h-3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const storyUsers = Object.entries(groupedStories);
  const userHasStory = user && storyUsers.some(([userId]) => userId === user.id);

  return (
    <div className="border-b border-border bg-background">
      <ScrollArea className="w-full">
        <div className="flex gap-4 px-4 py-3">
          {/* Current user's story or create button */}
          <button
            onClick={userHasStory ? () => handleStoryClick(user.id) : handleCreateStory}
            className="flex flex-col items-center gap-1 min-w-[64px] group"
          >
            <div className={`w-16 h-16 rounded-full ${userHasStory ? 'bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--primary-gradient-end))]' : 'bg-muted'} p-[2px] transition-transform group-hover:scale-105`}>
              <div className="w-full h-full rounded-full bg-background p-[2px] relative">
                <Avatar className="w-full h-full">
                  <AvatarImage src={user?.id ? groupedStories[user.id]?.avatar_url || undefined : undefined} />
                  <AvatarFallback className="text-sm">
                    {user?.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {!userHasStory && (
                  <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1">
                    <Plus className="w-3 h-3" />
                  </div>
                )}
              </div>
            </div>
            <span className="text-xs text-foreground truncate max-w-[64px]">
              {userHasStory ? "Story'n" : "Ekle"}
            </span>
          </button>

          {/* Other users' stories */}
          {storyUsers
            .filter(([userId]) => userId !== user?.id)
            .map(([userId, data]) => (
              <button
                key={userId}
                onClick={() => handleStoryClick(userId)}
                className="flex flex-col items-center gap-1 min-w-[64px] group"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--primary-gradient-end))] p-[2px] transition-transform group-hover:scale-105">
                  <div className="w-full h-full rounded-full bg-background p-[2px]">
                    <Avatar className="w-full h-full">
                      <AvatarImage src={data.avatar_url || undefined} />
                      <AvatarFallback className="text-sm">
                        {data.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                <span className="text-xs text-foreground truncate max-w-[64px]">
                  {data.username}
                </span>
              </button>
            ))}
        </div>
      </ScrollArea>
    </div>
  );
};
