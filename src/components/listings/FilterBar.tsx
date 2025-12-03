
import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const categories = [
  { id: "all", label: "All", icon: "🏠" },
  { id: "apartment", label: "Apartments", icon: "🏢" },
  { id: "house", label: "Houses", icon: "🏡" },
  { id: "guesthouse", label: "Guesthouses", icon: "🛌" },
  { id: "beach", label: "Beachfront", icon: "🏖️" },
  { id: "safari", label: "Safari", icon: "🦁" },
  { id: "winelands", label: "Winelands", icon: "🍇" },
  { id: "city", label: "City", icon: "🏙️" },
  { id: "mountain", label: "Mountain", icon: "⛰️" },
  { id: "pool", label: "Amazing Pools", icon: "🏊" },
  // Provinces
  { id: "western-cape", label: "Western Cape", icon: "⛵" },
  { id: "eastern-cape", label: "Eastern Cape", icon: "🦅" },
  { id: "northern-cape", label: "Northern Cape", icon: "🏜️" },
  { id: "gauteng", label: "Gauteng", icon: "🏙️" },
  { id: "kwazulu-natal", label: "KwaZulu-Natal", icon: "🌊" },
  { id: "free-state", label: "Free State", icon: "🌾" },
  { id: "north-west", label: "North West", icon: "🌻" },
  { id: "mpumalanga", label: "Mpumalanga", icon: "🌿" },
  { id: "limpopo", label: "Limpopo", icon: "🦓" },
];

interface FilterBarProps {
  onFilterChange: (category: string) => void;
}

export default function FilterBar({ onFilterChange }: FilterBarProps) {
  const [activeCategory, setActiveCategory] = useState("all");

  const handleCategoryClick = (id: string) => {
    setActiveCategory(id);
    onFilterChange(id);
  };

  return (
    <div className="sticky top-20 z-20 bg-white pt-4 pb-2 shadow-sm">
      <div className="container mx-auto px-4 flex items-center gap-4">
        <div className="flex-1 overflow-x-auto no-scrollbar flex items-center gap-8 pb-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className={cn(
                "flex flex-col items-center gap-2 min-w-[64px] cursor-pointer transition-colors group",
                activeCategory === category.id
                  ? "text-black border-b-2 border-black pb-2"
                  : "text-gray-500 hover:text-black hover:bg-gray-50/50 pb-2 border-b-2 border-transparent hover:border-gray-200"
              )}
            >
              <span className="text-2xl group-hover:scale-110 transition-transform duration-200">
                {category.icon}
              </span>
              <span className="text-xs font-medium whitespace-nowrap">
                {category.label}
              </span>
            </button>
          ))}
        </div>

        <Button variant="outline" className="hidden md:flex items-center gap-2 rounded-xl border-gray-300 h-12 px-4">
          <SlidersHorizontal className="w-4 h-4" />
          <span>Filters</span>
        </Button>
      </div>
    </div>
  );
}
