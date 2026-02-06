import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, useScroll, useMotionValueEvent, useReducedMotion } from "framer-motion";
import { ChevronRight, Home } from "lucide-react";
import { CATEGORIES } from "@/constants/categories";
import { CATEGORY_ICONS } from "@/components/icons/CategoryIcons";

interface FilterBarProps {
  onFilterChange: (category: string) => void;
}

export default function FilterBar({ onFilterChange }: FilterBarProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeSubCategory, setActiveSubCategory] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { scrollY } = useScroll();
  const prefersReducedMotion = useReducedMotion();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsCollapsed(latest > 80);
  });

  const handleCategoryClick = (id: string) => {
    if (activeCategory === id) {
      // Toggle off if clicking the same category
      setActiveCategory("all");
      setActiveSubCategory(null);
      onFilterChange("all");
    } else {
      setActiveCategory(id);
      setActiveSubCategory(null);
      onFilterChange(id);
    }
  };

  const handleSubCategoryClick = (id: string) => {
    setActiveSubCategory(id);
    onFilterChange(id);
  };

  const smoothTransition = prefersReducedMotion
    ? { duration: 0 }
    : { type: "spring", stiffness: 300, damping: 30 };

  const currentCategory = CATEGORIES.find(c => c.id === activeCategory);

  return (
    <div
      className={cn(
        "sticky top-20 z-20 transition-all duration-300 ease-in-out",
        isCollapsed
          ? "bg-transparent py-2"
          : "bg-white/95 backdrop-blur-md border-b border-gray-100 py-4 pb-2"
      )}
    >
      <div className="container mx-auto px-4 flex flex-col gap-4">
        {/* Main Categories Row */}
        <div
          className={cn(
            "overflow-x-auto no-scrollbar flex items-center transition-all duration-300 mx-auto",
            isCollapsed
              ? "bg-white/90 backdrop-blur-md border border-gray-200 shadow-lg rounded-full px-3 py-1 gap-1 max-w-fit"
              : "w-full pb-1 gap-6 justify-start md:justify-center"
          )}
        >
          <button
            onClick={() => { setActiveCategory("all"); setActiveSubCategory(null); onFilterChange("all"); }}
            className={cn(
              "flex flex-col items-center cursor-pointer rounded-full relative shrink-0 transition-all duration-150",
              isCollapsed ? "min-w-[40px] p-1.5" : "min-w-[72px] p-2 gap-2",
              activeCategory === "all" ? "text-blue-600" : "text-gray-500 hover:text-gray-900"
            )}
          >
            {activeCategory === "all" && (
              <motion.div
                layoutId="activeFilter"
                className={cn(
                  "absolute inset-0 rounded-full",
                  isCollapsed ? "bg-blue-50" : "bg-gray-50"
                )}
                transition={smoothTransition}
              />
            )}
            <Home className={cn("relative z-10", isCollapsed ? "w-5 h-5" : "w-7 h-7")} />
            {!isCollapsed && (
              <span className="text-[11px] font-semibold whitespace-nowrap relative z-10">All Stays</span>
            )}
          </button>

          {CATEGORIES.map((category) => {
            const IconComponent = CATEGORY_ICONS[category.id];
            return (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className={cn(
                  "flex flex-col items-center cursor-pointer rounded-full relative shrink-0 transition-all duration-200 group",
                  isCollapsed ? "min-w-[40px] p-1.5" : "min-w-[84px] p-2 gap-2",
                  activeCategory === category.id
                    ? isCollapsed
                      ? "text-blue-600"
                      : "text-blue-600"
                    : "text-gray-500 hover:text-gray-900"
                )}
              >
                {activeCategory === category.id && (
                  <motion.div
                    layoutId="activeFilter"
                    className={cn(
                      "absolute inset-0 rounded-full",
                      isCollapsed
                        ? "bg-blue-50"
                        : "bg-blue-50/50"
                    )}
                    transition={smoothTransition}
                  />
                )}

                {IconComponent ? (
                  <IconComponent
                    className={cn(
                      "relative z-10 transition-transform duration-200 group-hover:scale-110",
                      isCollapsed ? "w-5 h-5" : "w-8 h-8"
                    )}
                  />
                ) : (
                  <span
                    className={cn(
                      "relative z-10 transition-transform duration-200 group-hover:scale-110",
                      isCollapsed ? "text-lg" : "text-2xl"
                    )}
                  >
                    {category.icon}
                  </span>
                )}

                {!isCollapsed && (
                  <span className="text-[11px] font-semibold whitespace-nowrap relative z-10 text-center">
                    {category.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Subcategories Row - Animated Presence */}
        <AnimatePresence mode="wait">
          {currentCategory && !isCollapsed && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar py-2 border-t border-gray-50 mt-1"
            >
              <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50/50 rounded-full border border-blue-100 shrink-0">
                <span className="text-[10px] uppercase tracking-wider font-bold text-blue-600">Explore</span>
                <ChevronRight className="w-3 h-3 text-blue-400" />
              </div>
              <div className="flex items-center gap-2">
                {currentCategory.subcategories.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => handleSubCategoryClick(sub.id)}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border",
                      activeSubCategory === sub.id
                        ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200"
                        : "bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600"
                    )}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
