
import { Search, Globe, Menu, LogOut, Trophy } from "lucide-react";
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

import PreLaunchBanner from "./PreLaunchBanner";

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

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleAuthClick = (view: "login" | "signup") => {
    setAuthView(view);
    setIsAuthModalOpen(true);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <header className="fixed top-0 w-full z-[100] flex flex-col transition-all duration-300">
      <PreLaunchBanner isScrolled={isScrolled} />
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 w-full">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between relative">
          {/* Logo */}
          <div className="flex items-center cursor-pointer group shrink-0 z-20" onClick={() => navigate("/")}>
            <img
              src="/logo.png"
              alt="IdealStay"
              className="h-12 w-auto object-contain transition-transform group-hover:scale-105"
            />
            <span className="ml-2 text-xl font-bold text-primary tracking-tight hidden lg:block">Ideal Stay</span>
          </div>

          {/* Mini Search Bar - Desktop Only, Scroll Only */}
          {/* Mini Search Bar - Desktop Only, Scroll Only */}
          <div
            className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden lg:flex items-center bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer h-12 ${isScrolled ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
              }`}
            onClick={scrollToTop}
          >
            {/* Only Search by Location for now */}
            <div className="px-6 h-full flex flex-col justify-center hover:bg-gray-50 rounded-full min-w-[240px] flex-1">
              <div className="text-[10px] font-bold text-gray-800 leading-tight">Where</div>
              <div className="text-xs text-gray-500 font-medium truncate">Search destinations</div>
            </div>
            <div className="pr-2 h-full flex items-center">
              <div className="bg-primary hover:bg-primary/90 text-white rounded-full p-2 flex items-center justify-center transition-colors shadow-sm">
                <Search className="w-4 h-4 stroke-[3px]" />
              </div>
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-3 shrink-0 z-20">
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
                    {/* 
                    <DropdownMenuItem onClick={() => navigate("/rewards")} className="text-blue-600 font-medium focus:bg-blue-50 focus:text-blue-700 rounded-lg cursor-pointer">
                      <Trophy className="w-4 h-4 mr-2" />
                      My Rewards
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/trips")} className="rounded-lg cursor-pointer">Trips</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/wishlists")} className="rounded-lg cursor-pointer">Wishlists</DropdownMenuItem> 
                    */}
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
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultView={authView}
      />
    </header>
  );
}
