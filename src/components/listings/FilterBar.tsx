import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion, useScroll, useMotionValueEvent, useReducedMotion } from "framer-motion";
import { supabase } from "@/lib/supabase";

interface Category {
  id: string;
  label: string;
  icon: string;
  sort_order: number;
  is_province: boolean;
}

// Fallback categories removed to enforce dynamic data
const fallbackCategories: Category[] = [];

interface FilterBarProps {
  onFilterChange: (category: string) => void;
}

export default function FilterBar({ onFilterChange }: FilterBarProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [categories, setCategories] = useState<Category[]>(fallbackCategories);
  const { scrollY } = useScroll();
  const prefersReducedMotion = useReducedMotion();

  // Fetch categories from database
  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, label, icon, sort_order, is_province")
        .order("sort_order", { ascending: true });

      if (!error && data && data.length > 0) {
        setCategories(data);
      }
    };

    fetchCategories();
  }, []);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsCollapsed(latest > 80);
  });

  const handleCategoryClick = (id: string) => {
    setActiveCategory(id);
    onFilterChange(id);
  };

  // Optimized transition - simpler for low-end devices
  const smoothTransition = prefersReducedMotion
    ? { duration: 0 }
    : { type: "tween", duration: 0.25, ease: "easeInOut" };

  return (
    <div
      className={cn(
        "sticky top-20 z-20 transition-all duration-200 ease-out",
        isCollapsed
          ? "bg-transparent py-2"
          : "bg-white/95 backdrop-blur-sm border-b border-gray-100 py-4 pb-2"
      )}
      style={{ willChange: "background-color, padding" }}
    >
      <div className={cn(
        "container mx-auto px-4 flex transition-all duration-200",
        isCollapsed ? "justify-center" : "items-center"
      )}>
        <div
          className={cn(
            "overflow-x-auto no-scrollbar flex items-center transition-all duration-200",
            isCollapsed
              ? "bg-white/90 backdrop-blur-md border border-gray-200 shadow-lg rounded-full px-3 py-1 gap-1 max-w-[280px]"
              : "flex-1 pb-1 gap-2"
          )}
          style={{ willChange: "transform, opacity" }}
        >
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              title={category.label}
              className={cn(
                "flex flex-col items-center cursor-pointer rounded-full relative shrink-0 transition-all duration-150",
                "transform-gpu",
                isCollapsed ? "min-w-[40px] p-1.5" : "min-w-[64px] p-2 gap-2",
                activeCategory === category.id
                  ? isCollapsed
                    ? "text-white"
                    : "text-black"
                  : "text-gray-500 hover:text-gray-900 hover:scale-105 active:scale-95"
              )}
            >
              {/* Active background - Polymorphic gradient when collapsed */}
              {activeCategory === category.id && (
                <motion.div
                  layoutId="activeFilter"
                  className={cn(
                    "absolute inset-0 rounded-full transform-gpu",
                    isCollapsed
                      ? "bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400"
                      : "bg-gray-100"
                  )}
                  transition={smoothTransition}
                  style={{ willChange: "transform" }}
                />
              )}

              <span
                className={cn(
                  "relative z-10 transition-all duration-150",
                  isCollapsed ? "text-lg" : "text-2xl"
                )}
              >
                {category.icon}
              </span>

              {/* Label - CSS transition for performance */}
              <span
                className={cn(
                  "text-xs font-medium whitespace-nowrap relative z-10 transition-all duration-150 overflow-hidden",
                  isCollapsed
                    ? "max-h-0 opacity-0 scale-y-0"
                    : "max-h-6 opacity-100 scale-y-100"
                )}
              >
                {category.label}
              </span>

              {/* Bottom border for expanded active state */}
              {activeCategory === category.id && !isCollapsed && (
                <motion.div
                  className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 rounded-full transform-gpu"
                  layoutId="activeUnderline"
                  transition={smoothTransition}
                  style={{ willChange: "transform" }}
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
