
import { Search, Globe, Menu, User, LogOut, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AuthModal from "@/components/auth/AuthModal";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const { user, signOut } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authView, setAuthView] = useState<"login" | "signup">("login");
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      if (!user) { setIsAdmin(false); return; }
      const { data } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();
      setIsAdmin(!!data?.is_admin);
    };
    load();
  }, [user]);

  const handleAuthClick = (view: "login" | "signup") => {
    setAuthView(view);
    setIsAuthModalOpen(true);
  };

  return (
    <header className="fixed top-0 w-full z-[12000] bg-white border-b border-gray-100">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-400 rounded-lg flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5 text-white"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent hidden md:block">
            IdealStay
          </span>
        </div>

        <div />

        {/* User Menu */}
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            className="text-sm font-medium rounded-full hidden md:block"
            onClick={() => navigate("/host")}
          >
            List your property
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Globe className="w-4 h-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="rounded-full border-gray-200 flex items-center gap-2 px-2 py-1 h-auto hover:shadow-md transition-shadow ml-1"
              >
                <Menu className="w-4 h-4" />
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user?.user_metadata?.avatar_url || "https://github.com/shadcn.png"} />
                  <AvatarFallback>{user?.email?.[0].toUpperCase() || "G"}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {user ? (
                <>
                  <DropdownMenuItem className="font-semibold">{user.email}</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/rewards")} className="text-blue-400 font-medium">
                    <Trophy className="w-4 h-4 mr-2" />
                    My Rewards
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/trips")}>Trips</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/wishlists")}>Wishlists</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/host")}>Manage listings</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/account")}>Account</DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate("/admin")} className="text-red-500 font-semibold">
                      Admin Dashboard
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Log out
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem className="font-semibold" onClick={() => handleAuthClick("signup")}>
                    Sign up
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAuthClick("login")}>
                    Log in
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/host")}>List your property</DropdownMenuItem>
                  <DropdownMenuItem>Help Center</DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        defaultView={authView}
      />
    </header>
  );
}
