import { Home, Search, PlusSquare, Heart, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export const MobileNav = () => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <div className="flex justify-around items-center h-14 max-w-md mx-auto">
        <Link to="/" className={isActive("/") ? "text-foreground" : "text-muted-foreground"}>
          <Home className="w-6 h-6" />
        </Link>
        <Link to="/search" className={isActive("/search") ? "text-foreground" : "text-muted-foreground"}>
          <Search className="w-6 h-6" />
        </Link>
        <Link to="/create" className={isActive("/create") ? "text-foreground" : "text-muted-foreground"}>
          <PlusSquare className="w-6 h-6" />
        </Link>
        <Link to="/activity" className={isActive("/activity") ? "text-foreground" : "text-muted-foreground"}>
          <Heart className="w-6 h-6" />
        </Link>
        <Link to="/profile" className={isActive("/profile") ? "text-foreground" : "text-muted-foreground"}>
          <User className="w-6 h-6" />
        </Link>
      </div>
    </nav>
  );
};
