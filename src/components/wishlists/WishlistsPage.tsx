
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function WishlistsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pt-24 pb-12 container mx-auto px-4">
      <h1 className="text-3xl font-bold mb-8">Wishlists</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="group cursor-pointer">
          <div className="aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden border-2 border-white shadow-sm relative mb-3">
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 group-hover:bg-gray-100 transition-colors">
              <span className="text-4xl opacity-20">+</span>
            </div>
          </div>
          <h3 className="font-semibold text-lg">Create new wishlist</h3>
        </div>
      </div>
    </div>
  );
}
