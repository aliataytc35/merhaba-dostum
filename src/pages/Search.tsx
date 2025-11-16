import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search as SearchIcon, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Post {
  id: string;
  image_url: string;
  likes_count: number;
}

interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  full_name: string | null;
}

const Search = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<Profile[]>([]);
  const [explorePosts, setExplorePosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchExplorePosts();
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      searchUsers();
    } else {
      setUsers([]);
    }
  }, [searchTerm]);

  const fetchExplorePosts = async () => {
    try {
      const { data: postsData, error } = await supabase
        .from("posts")
        .select("id, image_url")
        .order("created_at", { ascending: false })
        .limit(30);

      if (error) throw error;

      const postIds = (postsData || []).map(p => p.id);
      const { data: likesData } = await supabase
        .from("likes")
        .select("post_id")
        .in("post_id", postIds);

      const likesMap = (likesData || []).reduce((acc, like) => {
        acc[like.post_id] = (acc[like.post_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      setExplorePosts((postsData || []).map(post => ({
        ...post,
        likes_count: likesMap[post.id] || 0
      })));
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    setSearching(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, full_name")
        .ilike("username", `%${searchTerm}%`)
        .limit(20);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 bg-background border-b border-border z-40 px-4 py-3">
        <div className="max-w-md mx-auto relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Ara"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          {searching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </div>
      </header>

      <div className="max-w-md mx-auto">
        {searchTerm.trim() ? (
          <div className="divide-y divide-border">
            {users.length === 0 && !searching && (
              <div className="py-8 text-center text-muted-foreground">
                Kullanıcı bulunamadı
              </div>
            )}
            {users.map((user) => (
              <div
                key={user.id}
                onClick={() => navigate(`/profile/${user.username}`)}
                className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <Avatar className="w-12 h-12">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback>
                    {user.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{user.username}</div>
                  {user.full_name && (
                    <div className="text-sm text-muted-foreground truncate">
                      {user.full_name}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <div className="px-4 py-3 font-semibold text-sm">Keşfet</div>
            {loading ? (
              <div className="py-16 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : explorePosts.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                Henüz gönderi yok
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {explorePosts.map((post) => (
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
        )}
      </div>
    </div>
  );
};

export default Search;
