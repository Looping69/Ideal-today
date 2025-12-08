
import { cn } from "@/lib/utils";

interface BadgeProps {
  name: string;
  icon: string;
  description: string;
  date?: string;
  isLocked?: boolean;
}

export default function BadgeCard({ name, icon, description, date, isLocked = false }: BadgeProps) {
  return (
    <div className={cn(
      "flex flex-col items-center p-4 rounded-xl border transition-all duration-300",
      isLocked 
        ? "bg-gray-50 border-gray-200 opacity-60 grayscale" 
        : "bg-white border-blue-100 shadow-sm hover:shadow-md hover:border-blue-200"
    )}>
      <div className={cn(
        "w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-3",
        isLocked ? "bg-gray-200" : "bg-blue-50"
      )}>
        {icon}
      </div>
      <h3 className="font-semibold text-center text-sm mb-1">{name}</h3>
      <p className="text-xs text-gray-500 text-center mb-2 line-clamp-2">{description}</p>
      {date && (
        <span className="text-[10px] font-medium text-blue-400 bg-blue-50 px-2 py-1 rounded-full">
          Earned {date}
        </span>
      )}
      {isLocked && (
        <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          Locked
        </span>
      )}
    </div>
  );
}
