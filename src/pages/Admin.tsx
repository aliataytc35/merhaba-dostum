import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, Image, MessageSquare, Shield } from "lucide-react";
import { MobileNav } from "@/components/MobileNav";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Stats {
  users: number;
  posts: number;
  comments: number;
}

interface User {
  id: string;
  username: string;
  full_name: string | null;
  email: string;
  role: string;
}

const Admin = () => {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({ users: 0, posts: 0, comments: 0 });
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/");
      toast.error("Bu sayfaya erişim yetkiniz yok");
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    try {
      const [profilesResult, postsResult, commentsResult] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("posts").select("id", { count: "exact", head: true }),
        supabase.from("comments").select("id", { count: "exact", head: true }),
      ]);

      setStats({
        users: profilesResult.count || 0,
        posts: postsResult.count || 0,
        comments: commentsResult.count || 0,
      });

      // Fetch users with their roles
      const { data: usersData, error: usersError } = await supabase
        .from("profiles")
        .select(`
          id,
          username,
          full_name
        `)
        .order("created_at", { ascending: false })
        .limit(20);

      if (usersError) throw usersError;

      // Get roles for each user
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("user_id, role");

      const usersWithDetails = usersData?.map(user => {
        const userRole = rolesData?.find(r => r.user_id === user.id);
        
        return {
          ...user,
          email: "hidden@privacy.com",
          role: userRole?.role || "user",
        };
      }) || [];

      setUsers(usersWithDetails);
    } catch (error) {
      console.error("Error fetching admin data:", error);
      toast.error("Veri yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      // Remove existing role
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      // Add new role if not 'user'
      if (newRole !== "user") {
        const { error } = await supabase
          .from("user_roles")
          .insert([{ user_id: userId, role: newRole as "admin" | "moderator" | "user" }]);

        if (error) throw error;
      }

      toast.success("Rol güncellendi");
      fetchData();
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Rol güncellenemedi");
    }
  };

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 bg-background border-b border-border z-40 px-4 h-14 flex items-center">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-semibold">Admin Paneli</h1>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Kullanıcı</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.users}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Gönderi</CardTitle>
              <Image className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.posts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Yorum</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.comments}</div>
            </CardContent>
          </Card>
        </div>

        {/* Users Management */}
        <Card>
          <CardHeader>
            <CardTitle>Kullanıcı Yönetimi</CardTitle>
            <CardDescription>Kullanıcı rollerini yönetin</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="font-medium">@{user.username}</div>
                    {user.full_name && (
                      <div className="text-sm text-muted-foreground">{user.full_name}</div>
                    )}
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </div>
                  <Select
                    value={user.role}
                    onValueChange={(value) => handleRoleChange(user.id, value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <MobileNav />
    </div>
  );
};

export default Admin;
