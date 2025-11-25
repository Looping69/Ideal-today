import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, User, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import ChatWindow from "@/components/inbox/ChatWindow";
import { format } from "date-fns";

interface Conversation {
  id: string; // booking_id
  property: {
    title: string;
    image: string;
  };
  user: {
    full_name: string;
    avatar_url: string;
  };
  last_message?: {
    content: string;
    created_at: string;
  };
  status: string;
}

export default function HostInbox() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { bookingId } = useParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      try {
        // 1. Get all properties owned by host
        const { data: properties } = await supabase
          .from("properties")
          .select("id")
          .eq("host_id", user.id);
        
        const propertyIds = (properties || []).map(p => p.id);

        if (propertyIds.length === 0) {
          setLoading(false);
          return;
        }

        // 2. Get confirmed bookings for these properties
        const { data: bookings, error } = await supabase
          .from("bookings")
          .select(`
            id,
            status,
            property:properties(
              title,
              image
            ),
            user:profiles(
              full_name,
              avatar_url
            )
          `)
          .in("property_id", propertyIds)
          .eq("status", "confirmed")
          .order("created_at", { ascending: false });

        if (error) throw error;

        // 3. Fetch last message for each
        const conversationsWithMessages = await Promise.all(
          (bookings || []).map(async (booking: any) => {
            const { data: messages } = await supabase
              .from("messages")
              .select("content, created_at")
              .eq("booking_id", booking.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .single();

            return {
              ...booking,
              last_message: messages,
            };
          })
        );

        setConversations(conversationsWithMessages);
      } catch (error) {
        console.error("Error fetching host conversations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [user]);

  const selectedConversation = conversations.find((c) => c.id === bookingId);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 h-[calc(100vh-100px)]">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inbox</h1>
          <p className="text-gray-500 mt-2">Messages from your guests.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full pb-6">
        {/* Conversation List */}
        <div className={cn(
          "bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full",
          bookingId ? "hidden lg:flex" : "flex"
        )}>
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h2 className="font-semibold text-gray-900">Guests</h2>
          </div>
          <ScrollArea className="flex-1">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No messages yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => navigate(`/host/inbox/${conv.id}`)}
                    className={cn(
                      "w-full p-4 text-left hover:bg-gray-50 transition-colors flex gap-3",
                      bookingId === conv.id && "bg-blue-50 hover:bg-blue-50"
                    )}
                  >
                    <Avatar>
                      <AvatarImage src={conv.user.avatar_url} />
                      <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-medium text-sm truncate pr-2">
                          {conv.user.full_name}
                        </h3>
                        {conv.last_message && (
                          <span className="text-[10px] text-gray-400 whitespace-nowrap">
                            {format(new Date(conv.last_message.created_at), "MMM d")}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate mb-1">
                        {conv.property.title}
                      </p>
                      <p className="text-sm text-gray-600 truncate">
                        {conv.last_message?.content || <span className="italic text-gray-400">No messages yet</span>}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat Window */}
        <div className={cn(
          "lg:col-span-2 h-full",
          !bookingId ? "hidden lg:block" : "block"
        )}>
          {selectedConversation ? (
            <ChatWindow
              bookingId={selectedConversation.id}
              otherUserName={selectedConversation.user.full_name}
              otherUserAvatar={selectedConversation.user.avatar_url}
              title={selectedConversation.property.title}
            />
          ) : (
            <div className="h-full bg-gray-50 rounded-xl border border-gray-200 border-dashed flex flex-col items-center justify-center text-gray-400">
              <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
              <p>Select a guest to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
