import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Property } from "@/types/property";
import PropertyView from "./PropertyView";

interface PropertyDetailsProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PropertyDetails({ property, isOpen, onClose }: PropertyDetailsProps) {
  if (!property) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[95vw] h-[95vh] p-0 overflow-hidden flex flex-col">
        <ScrollArea className="flex-1">
          <PropertyView
            property={property}
            onBookingComplete={onClose}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

