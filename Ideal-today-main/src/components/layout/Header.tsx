
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
import { NotificationBell } from "@/components/ui/notification-bell";

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
    <header className="fixed top-0 w-full z-[100] bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all duration-300">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate("/")}>
          <div className="w-9 h-9 bg-gradient-to-br from-primary to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5 text-white"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent hidden md:block tracking-tight">
            IdealStay
          </span>
        </div>

        {/* User Menu */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            className="text-sm font-medium rounded-full hidden md:block hover:bg-gray-100/80 px-4"
            onClick={() => navigate("/host")}
          >
            List your property
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100/80">
            <Globe className="w-4 h-4 text-gray-600" />
          </Button>

          {user && <NotificationBell />}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="rounded-full border-gray-200 flex items-center gap-3 pl-3 pr-2 py-1 h-11 hover:shadow-md transition-all ml-1 bg-white"
              >
                <Menu className="w-4 h-4 text-gray-600" />
                <Avatar className="w-8 h-8 border border-gray-100">
                  <AvatarImage src={user?.user_metadata?.avatar_url || "https://github.com/shadcn.png"} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {user?.email?.[0].toUpperCase() || "G"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-2 rounded-xl shadow-xl border-gray-100 mt-2">
              {user ? (
                <>
                  <div className="px-2 py-2 mb-2 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 font-medium">Signed in as</p>
                    <p className="text-sm font-semibold truncate">{user.email}</p>
                  </div>
                  <DropdownMenuItem onClick={() => navigate("/rewards")} className="text-blue-600 font-medium focus:bg-blue-50 focus:text-blue-700 rounded-lg cursor-pointer">
                    <Trophy className="w-4 h-4 mr-2" />
                    My Rewards
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/trips")} className="rounded-lg cursor-pointer">Trips</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/wishlists")} className="rounded-lg cursor-pointer">Wishlists</DropdownMenuItem>
                  <DropdownMenuSeparator className="my-2" />
                  <DropdownMenuItem onClick={() => navigate("/host")} className="rounded-lg cursor-pointer">Manage listings</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/account")} className="rounded-lg cursor-pointer">Account</DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate("/admin")} className="text-red-600 font-semibold focus:bg-red-50 focus:text-red-700 rounded-lg cursor-pointer mt-1">
                      Admin Dashboard
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="my-2" />
                  <DropdownMenuItem onClick={() => signOut()} className="text-gray-500 focus:text-gray-900 rounded-lg cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" />
                    Log out
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem className="font-semibold text-base py-3 rounded-lg cursor-pointer" onClick={() => handleAuthClick("signup")}>
                    Sign up
                  </DropdownMenuItem>
                  <DropdownMenuItem className="py-3 rounded-lg cursor-pointer" onClick={() => handleAuthClick("login")}>
                    Log in
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-2" />
                  <DropdownMenuItem onClick={() => navigate("/host")} className="rounded-lg cursor-pointer">List your property</DropdownMenuItem>
                  <DropdownMenuItem className="rounded-lg cursor-pointer">Help Center</DropdownMenuItem>
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
