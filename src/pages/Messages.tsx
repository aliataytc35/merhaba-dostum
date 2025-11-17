import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { MobileNav } from "@/components/MobileNav";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface Conversation {
  id: string;
  updated_at: string;
  other_user: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  last_message?: {
    content: string;
    created_at: string;
    sender_id: string;
  };
}

const Messages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  const fetchConversations = async () => {
    if (!user) return;

    try {
      const { data: participantsData, error: participantsError } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      if (participantsError) throw participantsError;

      const conversationIds = participantsData.map((p) => p.conversation_id);

      if (conversationIds.length === 0) {
        setLoading(false);
        return;
      }

      const { data: allParticipants, error: allParticipantsError } = await supabase
        .from("conversation_participants")
        .select("conversation_id, user_id, profiles(id, username, avatar_url)")
        .in("conversation_id", conversationIds);

      if (allParticipantsError) throw allParticipantsError;

      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select("conversation_id, content, created_at, sender_id")
        .in("conversation_id", conversationIds)
        .order("created_at", { ascending: false });

      if (messagesError) throw messagesError;

      const { data: conversationsData, error: conversationsError } = await supabase
        .from("conversations")
        .select("id, updated_at")
        .in("id", conversationIds)
        .order("updated_at", { ascending: false });

      if (conversationsError) throw conversationsError;

      const conversationsWithDetails = conversationsData.map((conv) => {
        const otherParticipant = allParticipants.find(
          (p: any) => p.conversation_id === conv.id && p.user_id !== user.id
        );

        const lastMessage = messagesData.find((m) => m.conversation_id === conv.id);

        return {
          id: conv.id,
          updated_at: conv.updated_at,
          other_user: otherParticipant?.profiles || {
            id: "",
            username: "Kullanıcı",
            avatar_url: null,
          },
          last_message: lastMessage,
        };
      });

      setConversations(conversationsWithDetails);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 bg-background border-b border-border z-40 px-4 h-14 flex items-center">
        <h1 className="text-lg font-semibold">Mesajlar</h1>
      </header>

      <div className="max-w-md mx-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-muted-foreground mb-2">Henüz mesajınız yok</p>
            <p className="text-sm text-muted-foreground">
              Arkadaşlarınıza mesaj gönderin
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => navigate(`/messages/${conversation.id}`)}
                className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <Avatar className="w-12 h-12">
                  <AvatarImage src={conversation.other_user.avatar_url || undefined} />
                  <AvatarFallback>
                    {conversation.other_user.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">
                    {conversation.other_user.username}
                  </p>
                  {conversation.last_message && (
                    <p className="text-sm text-muted-foreground truncate">
                      {conversation.last_message.sender_id === user?.id && "Sen: "}
                      {conversation.last_message.content}
                    </p>
                  )}
                </div>
                {conversation.last_message && (
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(conversation.last_message.created_at), {
                      addSuffix: false,
                      locale: tr,
                    })}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <MobileNav />
    </div>
  );
};

export default Messages;
