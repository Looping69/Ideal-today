
import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Building2, 
  Calendar, 
  MessageSquare, 
  Menu, 
  PlusCircle,
  LogOut,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export default function HostLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/host" },
    { icon: Building2, label: "Listings", path: "/host/listings" },
    { icon: Calendar, label: "Calendar", path: "/host/calendar" },
    { icon: MessageSquare, label: "Inbox", path: "/host/inbox" },
    { icon: Settings, label: "Settings", path: "/host/settings" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-white border-r border-gray-200 fixed inset-y-0 left-0 z-50 transition-all duration-300 flex flex-col",
          isSidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="h-20 flex items-center px-6 border-b border-gray-100">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
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
            {isSidebarOpen && (
              <span className="text-xl font-bold text-primary truncate">
                IdealHost
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 py-6 px-3 space-y-1">
          <Button 
            onClick={() => navigate("/host/create")}
            className={cn(
              "w-full mb-6 bg-primary hover:bg-primary/90 text-white shadow-md transition-all",
              !isSidebarOpen && "px-0 justify-center"
            )}
          >
            {isSidebarOpen ? (
              <>
                <PlusCircle className="w-4 h-4 mr-2" />
                Create Listing
              </>
            ) : (
              <PlusCircle className="w-5 h-5" />
            )}
          </Button>

          {sidebarItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors",
                location.pathname === item.path
                  ? "bg-blue-50 text-primary"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                !isSidebarOpen && "justify-center"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {isSidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={() => signOut()}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors",
              !isSidebarOpen && "justify-center"
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
          isSidebarOpen ? "ml-64" : "ml-20"
        )}
      >
        <header className="h-20 bg-white border-b border-gray-200 sticky top-0 z-40 px-8 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-gray-500"
          >
            <Menu className="w-5 h-5" />
          </Button>

          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate("/")}>
              Switch to Traveling
            </Button>
            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
              <img 
                src={user?.user_metadata?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=Host"} 
                alt="Host Profile" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </header>

        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
