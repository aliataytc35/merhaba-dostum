import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export const useFollow = (targetUserId: string | undefined) => {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !targetUserId || user.id === targetUserId) return;

    const checkFollowing = async () => {
      const { data } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId)
        .single();

      setIsFollowing(!!data);
    };

    checkFollowing();
  }, [user, targetUserId]);

  const toggleFollow = async () => {
    if (!user || !targetUserId) return;

    setLoading(true);
    try {
      if (isFollowing) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", targetUserId);

        if (error) throw error;
        setIsFollowing(false);
        toast({ description: "Takipten çıkıldı" });
      } else {
        const { error } = await supabase
          .from("follows")
          .insert({ follower_id: user.id, following_id: targetUserId });

        if (error) throw error;
        setIsFollowing(true);
        toast({ description: "Takip edildi" });
      }
    } catch (error) {
      console.error("Follow error:", error);
      toast({ description: "Bir hata oluştu", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return { isFollowing, toggleFollow, loading };
};
