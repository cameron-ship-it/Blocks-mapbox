import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, MapPin } from "lucide-react";
import { motion } from "framer-motion";

export default function Results() {
  const [, setLocation] = useLocation();

  // Mock preferences for now - will be passed via location state or context later
  const searchPreferences = {
    budgetMin: 1500,
    budgetMax: 4000,
    boroughs: [] as string[],
    neighborhoods: [] as string[],
    blockCount: 0
  };

  const handleBackToSearch = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with search summary */}
      <div className="sticky top-0 z-40 bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToSearch}
              data-testid="button-back-to-search"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back to Search
            </Button>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2" data-testid="text-budget-summary">
                <span className="font-bold tabular-nums">
                  ${searchPreferences.budgetMin.toLocaleString()} – ${searchPreferences.budgetMax.toLocaleString()}
                  <span className="text-sm font-normal text-muted-foreground ml-2">/month</span>
                </span>
              </div>
              {searchPreferences.boroughs.length > 0 && (
                <div className="hidden md:flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div className="flex gap-1">
                    {searchPreferences.boroughs.slice(0, 2).map((borough) => (
                      <Badge key={borough} variant="secondary" className="text-xs">
                        {borough}
                      </Badge>
                    ))}
                    {searchPreferences.boroughs.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{searchPreferences.boroughs.length - 2}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Button variant="outline" size="sm" data-testid="button-refine-search">
              Refine Search
            </Button>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Placeholder for future listing cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" data-testid="container-listings">
            {/* Listings will be rendered here */}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
