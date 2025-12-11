
import { Property } from "@/types/property"; // Keep for type definition

import PropertyCard from "./PropertyCard";

interface PropertyGridProps {
  properties: Property[];
  onPropertyClick: (property: Property) => void;
  compact?: boolean;
}

export default function PropertyGrid({ properties, onPropertyClick, compact = false }: PropertyGridProps) {
  if (!properties || properties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h3 className="text-2xl font-semibold mb-2">No properties found</h3>
        <p className="text-gray-500">Try adjusting your search or filters to find what you're looking for.</p>
      </div>
    );
  }

  return (
    <div className={compact
      ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-6 pb-20"
      : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10 pb-20"
    }>
      {properties.map((property) => (
        <PropertyCard
          key={property.id}
          property={property}
          onClick={onPropertyClick}
        />
      ))}
    </div>
  );
}

