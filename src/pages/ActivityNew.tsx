import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2, Heart, MessageCircle, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { useNotifications } from "@/hooks/useNotifications";
import { useTranslation } from "react-i18next";

const ActivityNew = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const getNotificationText = (type: string) => {
    switch (type) {
      case 'like':
        return 'gönderini beğendi';
      case 'comment':
        return 'gönderine yorum yaptı';
      case 'follow':
        return 'seni takip etmeye başladı';
      default:
        return '';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-4 h-4 fill-red-500 text-red-500 flex-shrink-0" />;
      case 'comment':
        return <MessageCircle className="w-4 h-4 flex-shrink-0 text-primary" />;
      case 'follow':
        return <UserPlus className="w-4 h-4 flex-shrink-0 text-primary" />;
      default:
        return null;
    }
  };

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    
    if (notification.post_id) {
      navigate(`/post/${notification.post_id}`);
    } else if (notification.type === 'follow') {
      navigate(`/profile/${notification.actor.username}`);
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
      <header className="sticky top-0 bg-background border-b border-border z-40 px-4 h-14 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Bildirimler</h1>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            className="text-primary text-sm"
          >
            Tümünü Okundu İşaretle
          </Button>
        )}
      </header>

      <div className="max-w-md mx-auto divide-y divide-border">
        {notifications.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            Henüz bildirim yok
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                !notification.read 
                  ? 'bg-primary/5 hover:bg-primary/10' 
                  : 'hover:bg-muted/50'
              }`}
            >
              <Avatar className="w-10 h-10">
                <AvatarImage src={notification.actor.avatar_url || undefined} />
                <AvatarFallback>
                  {notification.actor.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-semibold truncate ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {notification.actor.username}
                  </span>
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {getNotificationText(notification.type)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(notification.created_at), {
                    addSuffix: true,
                    locale: tr,
                  })}
                </div>
              </div>

              {!notification.read && (
                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActivityNew;
