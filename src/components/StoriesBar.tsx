import { useStories } from "@/hooks/useStories";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

export const StoriesBar = () => {
  const { groupedStories, loading } = useStories();

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

  if (storyUsers.length === 0) {
    return null;
  }

  return (
    <div className="border-b border-border bg-background">
      <ScrollArea className="w-full">
        <div className="flex gap-4 px-4 py-3">
          {storyUsers.map(([userId, data]) => (
            <button
              key={userId}
              className="flex flex-col items-center gap-1 min-w-[64px] group"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[hsl(var(--primary-gradient-start))] to-[hsl(var(--primary-gradient-end))] p-[2px] transition-transform group-hover:scale-105">
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
