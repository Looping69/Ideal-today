import * as React from "react";
import { Property } from "@/types/property";
import PropertyCard from "./PropertyCard";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { Star } from "lucide-react";
import Autoplay from "embla-carousel-autoplay";

interface FeaturedCarouselProps {
    properties: Property[];
    onPropertyClick: (property: Property) => void;
}

export default function FeaturedCarousel({ properties, onPropertyClick }: FeaturedCarouselProps) {
    const autoplayPlugin = React.useRef(
        Autoplay({ delay: 2000, stopOnInteraction: false, stopOnMouseEnter: true })
    );

    if (properties.length === 0) return null;

    return (
        <section className="w-full bg-[#FAFAFA] py-16 mb-16 border-y border-gray-100 overflow-visible">
            <div className="container mx-auto px-4 mb-10">
                <div className="flex items-end justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 flex items-center justify-center shadow-xl shadow-orange-200/40">
                            <Star className="text-white w-7 h-7 fill-white" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 tracking-tight font-primary">Featured Stays</h2>
                            <p className="text-gray-500 mt-1 text-lg">Experience the finest hospitality in handpicked locations</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full relative px-4">
                <Carousel
                    opts={{
                        align: "start",
                        loop: true,
                    }}
                    plugins={[autoplayPlugin.current] as any}
                    className="w-full max-w-[1400px] mx-auto overflow-visible"
                >
                    <CarouselContent className="-ml-6" viewportClassName="overflow-visible">
                        {properties.map((property) => (
                            <CarouselItem key={property.id} className="pl-6 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                                <div className="p-1 h-full">
                                    <div className="transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl hover:shadow-gray-200 rounded-2xl h-full">
                                        <PropertyCard property={property} onClick={onPropertyClick} showBorder={true} />
                                    </div>
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <div className="flex justify-end gap-3 mt-8 md:absolute md:-top-20 md:right-0">
                        <CarouselPrevious className="static translate-y-0 h-12 w-12 border-gray-200 hover:bg-gray-900 hover:text-white transition-all shadow-md" />
                        <CarouselNext className="static translate-y-0 h-12 w-12 border-gray-200 hover:bg-gray-900 hover:text-white transition-all shadow-md" />
                    </div>
                </Carousel>
            </div>
        </section>
    );
}
