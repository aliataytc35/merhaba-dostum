import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().email("Geçerli bir email adresi girin"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalı"),
  username: z.string().min(3, "Kullanıcı adı en az 3 karakter olmalı").optional(),
  fullName: z.string().optional(),
});

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate inputs
      const validation = authSchema.safeParse({
        email,
        password,
        username: isLogin ? undefined : username,
        fullName: isLogin ? undefined : fullName,
      });

      if (!validation.success) {
        toast({
          title: "Hata",
          description: validation.error.errors[0].message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: "Hoş geldiniz!",
          description: "Başarıyla giriş yaptınız.",
        });
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              username,
              full_name: fullName,
            },
          },
        });

        if (error) throw error;

        toast({
          title: "Kayıt başarılı!",
          description: "Hesabınız oluşturuldu, giriş yapabilirsiniz.",
        });
        navigate("/");
      }
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message === "User already registered" 
          ? "Bu email adresi zaten kayıtlı" 
          : error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[hsl(var(--primary-gradient-start))] to-[hsl(var(--primary-gradient-end))] bg-clip-text text-transparent">
            izmirgram
          </h1>
          <p className="mt-2 text-muted-foreground">
            {isLogin ? "Hesabına giriş yap" : "Yeni hesap oluştur"}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full"
            />
          </div>

          {!isLogin && (
            <>
              <div>
                <Input
                  type="text"
                  placeholder="Kullanıcı adı"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
              <div>
                <Input
                  type="text"
                  placeholder="Ad Soyad (isteğe bağlı)"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full"
                />
              </div>
            </>
          )}

          <div>
            <Input
              type="password"
              placeholder="Şifre"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-[hsl(var(--primary-gradient-start))] to-[hsl(var(--primary-gradient-end))] hover:opacity-90"
            disabled={loading}
          >
            {loading ? "Lütfen bekleyin..." : isLogin ? "Giriş Yap" : "Kayıt Ol"}
          </Button>
        </form>

        <div className="text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {isLogin
              ? "Hesabın yok mu? Kayıt ol"
              : "Zaten hesabın var mı? Giriş yap"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
