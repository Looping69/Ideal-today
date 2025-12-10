
import { Property } from "@/types/property"; // Keep for type definition

import PropertyCard from "./PropertyCard";

interface PropertyGridProps {
  properties: Property[];
  onPropertyClick: (property: Property) => void;
}

export default function PropertyGrid({ properties, onPropertyClick }: PropertyGridProps) {
  if (!properties || properties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h3 className="text-2xl font-semibold mb-2">No properties found</h3>
        <p className="text-gray-500">Try adjusting your search or filters to find what you're looking for.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10 pb-20">
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
