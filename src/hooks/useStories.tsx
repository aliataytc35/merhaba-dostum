import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Story {
  id: string;
  user_id: string;
  image_url: string;
  created_at: string;
  profile: {
    username: string;
    avatar_url: string | null;
  };
}

interface GroupedStories {
  [userId: string]: {
    username: string;
    avatar_url: string | null;
    stories: Story[];
  };
}

export const useStories = () => {
  const { user } = useAuth();
  const [groupedStories, setGroupedStories] = useState<GroupedStories>({});
  const [loading, setLoading] = useState(true);

  const fetchStories = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("stories")
      .select(`
        *,
        profile:profiles(username, avatar_url)
      `)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching stories:", error);
      return;
    }

    const grouped: GroupedStories = {};
    data?.forEach((story: any) => {
      if (!grouped[story.user_id]) {
        grouped[story.user_id] = {
          username: story.profile.username,
          avatar_url: story.profile.avatar_url,
          stories: [],
        };
      }
      grouped[story.user_id].stories.push(story);
    });

    setGroupedStories(grouped);
    setLoading(false);
  };

  useEffect(() => {
    fetchStories();

    const channel = supabase
      .channel("stories-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "stories",
        },
        () => {
          fetchStories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { groupedStories, loading, refreshStories: fetchStories };
};
