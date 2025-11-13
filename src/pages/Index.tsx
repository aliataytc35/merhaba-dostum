import { MobileNav } from "@/components/MobileNav";
import { PostCard } from "@/components/PostCard";

const Index = () => {
  // Demo posts
  const posts = [
    {
      username: "izmir_gezgini",
      postImage: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800",
      likes: 1234,
      caption: "İzmir'in güzel günbatımı 🌅",
      timeAgo: "2 saat önce"
    },
    {
      username: "ege_denizi",
      postImage: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
      likes: 892,
      caption: "Deniz, güneş ve huzur ☀️",
      timeAgo: "5 saat önce"
    },
    {
      username: "kordon_manzarasi",
      postImage: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800",
      likes: 2156,
      caption: "Kordon'da akşam yürüyüşü 🚶‍♂️",
      timeAgo: "1 gün önce"
    }
  ];

  return (
    <div className="min-h-screen bg-background pb-14">
      {/* Header */}
      <header className="sticky top-0 bg-background border-b border-border z-40 px-4 h-14 flex items-center">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-[hsl(var(--primary-gradient-start))] to-[hsl(var(--primary-gradient-end))] bg-clip-text text-transparent">
          izmirgram
        </h1>
      </header>

      {/* Feed */}
      <div className="max-w-md mx-auto">
        {posts.map((post, index) => (
          <PostCard key={index} {...post} />
        ))}
      </div>

      {/* Bottom Navigation */}
      <MobileNav />
    </div>
  );
};

export default Index;
