import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Calendar,
  MessageSquare,
  Menu,
  PlusCircle,
  LogOut,
  Settings,
  ClipboardList,
  Users,
  CheckSquare,
  BarChart3,
  CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { NotificationBell } from "@/components/ui/notification-bell";

export default function HostLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      toast({
        variant: "destructive",
        title: "Sign in required",
        description: "Please sign in to access host features.",
      });
      navigate("/");
    }
  }, [loading, user]);

  const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/host" },
    { icon: MessageSquare, label: "Inbox", path: "/host/inbox" },
    { icon: Calendar, label: "Calendar", path: "/host/calendar" },
    { icon: ClipboardList, label: "Bookings", path: "/host/bookings" },
    { icon: CheckSquare, label: "Operations", path: "/host/operations" },
    { icon: Building2, label: "Listings", path: "/host/listings" },
    { icon: Users, label: "Guests", path: "/host/guests" },
    { icon: CreditCard, label: "Plan & Billing", path: "/host/subscription" },
    { icon: BarChart3, label: "Reports", path: "/host/reports" },
    { icon: Settings, label: "Settings", path: "/host/settings" },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "bg-white border-r border-gray-200 fixed inset-y-0 left-0 z-50 transition-all duration-300 flex flex-col shadow-sm",
          isSidebarOpen ? "w-72" : "w-20"
        )}
      >
        <div className="h-20 flex items-center px-6 border-b border-gray-100">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate("/")}>
            <img
              src="/logo.png"
              alt="IdealStay"
              className={cn(
                "object-contain transition-transform group-hover:scale-105",
                isSidebarOpen ? "h-14 w-auto" : "h-10 w-10 object-cover"
              )}
            />
          </div>
        </div>

        <div className="flex-1 py-8 px-4 space-y-2 overflow-y-auto no-scrollbar">
          <Button
            onClick={() => navigate("/host/create")}
            className={cn(
              "w-full mb-8 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] h-12 rounded-xl",
              !isSidebarOpen && "px-0 justify-center"
            )}
          >
            {isSidebarOpen ? (
              <>
                <PlusCircle className="w-5 h-5 mr-2.5" />
                <span className="font-semibold">Create Listing</span>
              </>
            ) : (
              <PlusCircle className="w-6 h-6" />
            )}
          </Button>

          <div className="space-y-1">
            {sidebarItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                  location.pathname === item.path
                    ? "bg-blue-50 text-primary font-semibold shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                  !isSidebarOpen && "justify-center px-0"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5 shrink-0 transition-colors",
                  location.pathname === item.path ? "text-primary" : "text-gray-400 group-hover:text-gray-600"
                )} />
                {isSidebarOpen && <span>{item.label}</span>}
                {location.pathname === item.path && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={() => signOut()}
            className={cn(
              "w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-white hover:text-red-600 hover:shadow-sm transition-all",
              !isSidebarOpen && "justify-center px-0"
            )}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span>Log out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 transition-all duration-300 min-h-screen",
          isSidebarOpen ? "ml-72" : "ml-20"
        )}
      >
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40 px-8 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-gray-500 hover:bg-gray-100 rounded-xl"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <h2 className="text-lg font-semibold text-gray-800 hidden md:block">
              {sidebarItems.find(i => i.path === location.pathname)?.label || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="hidden md:flex rounded-full border-gray-200 hover:bg-gray-50 hover:text-primary transition-colors"
            >
              Switch to Traveling
            </Button>

            <NotificationBell />

            <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
              <div className="text-right hidden md:block">
                <p className="text-sm font-semibold text-gray-900">{user?.user_metadata?.full_name || 'Host'}</p>
                {user?.user_metadata?.is_superhost && <p className="text-xs text-gray-500">Superhost</p>}
              </div>
              <div className="w-10 h-10 rounded-full bg-gray-100 p-0.5 ring-2 ring-gray-100 overflow-hidden">
                <img
                  src={user?.user_metadata?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=Host"}
                  alt="Host Profile"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main >
    </div >
  );
}
