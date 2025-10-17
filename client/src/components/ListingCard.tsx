import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bed, Bath, MapPin } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ListingCardProps {
  address: string;
  bedrooms: number;
  bathrooms: number;
  rent: number;
  images: string[];
}

export function ListingCard({ address, bedrooms, bathrooms, rent, images }: ListingCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const previousImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <Card className="overflow-hidden hover-elevate transition-all" data-testid={`card-listing-${address.replace(/\s+/g, '-')}`}>
      <CardContent className="p-0">
        {/* Image Gallery */}
        <div className="relative aspect-[4/3] bg-muted">
          <img
            src={images[currentImageIndex]}
            alt={`${address} - Image ${currentImageIndex + 1}`}
            className="w-full h-full object-cover"
          />
          
          {/* Image Navigation */}
          {images.length > 1 && (
            <>
              <button
                onClick={previousImage}
                className="absolute left-2 bottom-2 bg-background/80 backdrop-blur-sm rounded-full p-2 hover-elevate transition-all"
                data-testid="button-previous-image"
                aria-label="Previous image"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 bottom-2 bg-background/80 backdrop-blur-sm rounded-full p-2 hover-elevate transition-all"
                data-testid="button-next-image"
                aria-label="Next image"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              {/* Image Indicators */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all",
                      index === currentImageIndex 
                        ? "bg-background w-4" 
                        : "bg-background/50"
                    )}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Listing Details */}
        <div className="p-4 space-y-3">
          {/* Rent Price */}
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-bold tabular-nums" data-testid="text-rent">
                ${rent.toLocaleString()}
              </span>
              <span className="text-sm text-muted-foreground ml-1">/month</span>
            </div>
          </div>

          {/* Address */}
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <span className="text-sm font-medium" data-testid="text-address">{address}</span>
          </div>

          {/* Bed/Bath Info */}
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5" data-testid="text-bedrooms">
              <Bed className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{bedrooms} BR</span>
            </div>
            <div className="flex items-center gap-1.5" data-testid="text-bathrooms">
              <Bath className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{bathrooms} BA</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
