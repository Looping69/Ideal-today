
import { Property } from "@/data/mockData";
import { Star, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PropertyCardProps {
  property: Property;
  onClick: (property: Property) => void;
}

export default function PropertyCard({ property, onClick }: PropertyCardProps) {
  return (
    <div 
      className="group cursor-pointer flex flex-col gap-2"
      onClick={() => onClick(property)}
    >
      <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-200">
        <img
          src={property.image}
          alt={property.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <button className="absolute top-3 right-3 p-2 rounded-full hover:bg-white/10 transition-colors">
          <Heart className="w-6 h-6 text-white fill-black/50 hover:fill-red-500 hover:text-red-500 transition-colors" />
        </button>
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className="bg-white/90 text-black font-medium hover:bg-white">
            Guest favorite
          </Badge>
        </div>
      </div>
      
      <div className="flex justify-between items-start mt-1">
        <h3 className="font-semibold text-base truncate pr-2">{property.location}</h3>
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 fill-black text-black" />
          <span className="text-sm font-light">{property.rating}</span>
        </div>
      </div>
      
      <div className="flex flex-col gap-0.5 text-gray-500 text-sm">
        <p className="truncate text-gray-500">Hosted by {property.host.name}</p>
        <p className="truncate text-gray-500">Oct 23 - 28</p>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="font-semibold text-black text-base">R{property.price}</span>
          <span className="text-black">night</span>
        </div>
      </div>
    </div>
  );
}
