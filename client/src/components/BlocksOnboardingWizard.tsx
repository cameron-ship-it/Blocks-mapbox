import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RangeSlider } from "@/components/ui/range-slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FormHint } from "@/components/ui/form-hint";
import { EmptyState } from "@/components/ui/empty-state";
import { AppShell } from "@/components/layout/AppShell";
import { useStep, type WizardStep } from "@/hooks/useStep";
import { boroughs } from "@/lib/geo";
import { useQuery } from "@tanstack/react-query";
import { 
  ChevronRight, 
  ChevronLeft, 
  Building2, 
  Map as MapIcon, 
  Search, 
  X, 
  MapPin,
  CheckCircle2,
  DollarSign
} from "lucide-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Mapbox layer constants
const LAYER_SOURCE = "blocks";
const LAYER_ID = "blocks-fill";
const LAYER_LINE_ID = "blocks-outline";

interface MapboxConfig {
  token: string;
  tilesUrl: string;
  sourceLayer: string;
}

interface WizardState {
  budgetMin: number;
  budgetMax: number;
  selectedBoroughs: string[];
  selectedNeighborhoods: string[];
  selectedBlocks: Set<string>;
}

// Steps configuration for the stepper
const WIZARD_STEPS = [
  { id: 'budget', label: 'Budget' },
  { id: 'borough', label: 'Borough' },
  { id: 'neighborhood', label: 'Neighborhood' },
  { id: 'map', label: 'Blocks' },
  { id: 'review', label: 'Review' },
];

export default function BlocksOnboardingWizard() {
  const { currentStep, next, back, goTo, isFirstStep, isLastStep } = useStep('budget');
  const [wizardState, setWizardState] = useState<WizardState>({
    budgetMin: 1500,
    budgetMax: 4000,
    selectedBoroughs: [],
    selectedNeighborhoods: [],
    selectedBlocks: new Set<string>(),
  });

  // Neighborhood search
  const [neighborhoodSearch, setNeighborhoodSearch] = useState("");

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const selectedBlockIds = useRef<Set<string>>(new Set());

  // Get Mapbox token directly from environment variable
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
  const mapboxConfig = {
    token: mapboxToken || "",
    tilesUrl: import.meta.env.VITE_MAPBOX_TILES_URL || "",
    sourceLayer: import.meta.env.VITE_MAPBOX_SOURCE_LAYER || ""
  };
  
  // Debug logging
  useEffect(() => {
    console.log('Mapbox Config:', {
      hasToken: !!mapboxConfig.token,
      tokenPrefix: mapboxConfig.token?.substring(0, 10),
      tilesUrl: mapboxConfig.tilesUrl,
      sourceLayer: mapboxConfig.sourceLayer
    });
  }, [mapboxConfig.token, mapboxConfig.tilesUrl, mapboxConfig.sourceLayer]);

  // Get available neighborhoods based on selected boroughs
  const availableNeighborhoods = boroughs
    .filter((b) => wizardState.selectedBoroughs.includes(b.id))
    .flatMap((b) => b.neighborhoods);

  // Filter neighborhoods by search
  const filteredNeighborhoods = neighborhoodSearch
    ? availableNeighborhoods.filter((n) =>
        n.name.toLowerCase().includes(neighborhoodSearch.toLowerCase())
      )
    : availableNeighborhoods;

  // Toggle borough selection
  const toggleBorough = (boroughId: string) => {
    setWizardState((prev) => {
      const isSelected = prev.selectedBoroughs.includes(boroughId);
      const newBoroughs = isSelected
        ? prev.selectedBoroughs.filter((id) => id !== boroughId)
        : [...prev.selectedBoroughs, boroughId];

      // Remove neighborhoods from deselected boroughs
      const newNeighborhoods = isSelected
        ? prev.selectedNeighborhoods.filter(
            (nId) => !boroughs.find((b) => b.id === boroughId)?.neighborhoods.some((n) => n.id === nId)
          )
        : prev.selectedNeighborhoods;

      return { ...prev, selectedBoroughs: newBoroughs, selectedNeighborhoods: newNeighborhoods };
    });
  };

  // Toggle neighborhood selection
  const toggleNeighborhood = (neighborhoodId: string) => {
    setWizardState((prev) => ({
      ...prev,
      selectedNeighborhoods: prev.selectedNeighborhoods.includes(neighborhoodId)
        ? prev.selectedNeighborhoods.filter((id) => id !== neighborhoodId)
        : [...prev.selectedNeighborhoods, neighborhoodId],
    }));
  };

  // Clear all neighborhoods
  const clearAllNeighborhoods = () => {
    setWizardState((prev) => ({ ...prev, selectedNeighborhoods: [] }));
  };

  // Initialize Mapbox map
  useEffect(() => {
    console.log('Map initialization useEffect triggered:', {
      currentStep,
      hasContainer: !!mapContainer.current,
      hasToken: !!mapboxConfig.token,
      hasMap: !!map.current
    });
    
    if (currentStep === "map" && mapboxConfig.token && !map.current) {
      // Use requestAnimationFrame to ensure the ref is attached after render
      const initMap = () => {
        if (!mapContainer.current) {
          console.log('Container not ready, retrying...');
          requestAnimationFrame(initMap);
          return;
        }

        console.log('Initializing Mapbox map...');
        
        if (!mapboxgl.supported()) {
          console.error('WebGL not supported');
          setMapError('WebGL not supported. Please open in a new browser tab with hardware acceleration enabled.');
          return;
        }

        try {
          mapboxgl.accessToken = mapboxConfig.token;
          setMapError(null);
          console.log('Mapbox accessToken set, creating map instance...');

          map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: "mapbox://styles/mapbox/light-v11",
            center: [-73.935242, 40.730610],
            zoom: 11,
          });

          console.log('Map instance created successfully');

          map.current.on('error', (e) => {
            console.error('Mapbox error:', e);
            console.error('Error details:', {
              error: e.error,
              message: e.error?.message,
              status: (e.error as any)?.status
            });
            
            if ((e.error as any)?.status === 401) {
              setMapError('Invalid Mapbox token. Please check your VITE_MAPBOX_TOKEN.');
            } else if (e.error?.message?.includes('style')) {
              setMapError('Map style failed to load. Please check your internet connection.');
            } else {
              setMapError('Map failed to load. Please refresh the page.');
            }
          });
          
          map.current.on('load', () => {
            console.log('=== MAP LOAD EVENT FIRED ===');
            console.log('Map loaded successfully');
            console.log('Map style loaded:', map.current?.getStyle()?.name);
            
            // Define source layer outside the conditional so it's accessible to click handlers
            const LAYER_SOURCE_LAYER = mapboxConfig.sourceLayer || "blocks";
            
            // Add custom tiles layer
            if (mapboxConfig.tilesUrl && map.current) {
              console.log('Adding custom tiles source:', {
                tilesUrl: mapboxConfig.tilesUrl,
                sourceLayer: mapboxConfig.sourceLayer
              });
              
              const sourceConfig: any = {
                type: "vector",
                promoteId: "block_id"
              };
              
              if (mapboxConfig.tilesUrl.startsWith("mapbox://")) {
                sourceConfig.url = mapboxConfig.tilesUrl;
                console.log('Using Mapbox tileset URL:', sourceConfig.url);
              } else {
                sourceConfig.tiles = [mapboxConfig.tilesUrl];
                console.log('Using custom tiles URL:', sourceConfig.tiles);
              }
              
              try {
                map.current.addSource(LAYER_SOURCE, sourceConfig);
                console.log('✓ Source added successfully');

                // Fill layer with Blocks NYC accent color
                map.current.addLayer({
                  id: LAYER_ID,
                  type: "fill",
                  source: LAYER_SOURCE,
                  "source-layer": LAYER_SOURCE_LAYER,
                  paint: {
                    "fill-color": [
                      "case",
                      ["boolean", ["feature-state", "selected"], false],
                      "hsl(214, 100%, 62%)", // accent-blue when selected
                      "hsl(0, 0%, 93%)" // gray-2 when not selected
                    ],
                    "fill-opacity": [
                      "case",
                      ["boolean", ["feature-state", "selected"], false],
                      0.3,
                      0.6
                    ],
                  },
                });
                console.log('✓ Fill layer added successfully');

                // Outline layer
                map.current.addLayer({
                  id: LAYER_LINE_ID,
                  type: "line",
                  source: LAYER_SOURCE,
                  "source-layer": LAYER_SOURCE_LAYER,
                  paint: {
                    "line-color": [
                      "case",
                      ["boolean", ["feature-state", "selected"], false],
                      "hsl(214, 100%, 62%)", // accent-blue when selected
                      "hsl(0, 0%, 86%)" // gray-3 when not selected
                    ],
                    "line-width": [
                      "case",
                      ["boolean", ["feature-state", "selected"], false],
                      2,
                      0.8
                    ],
                  },
                });
                console.log('✓ Outline layer added successfully');
                console.log('=== LAYERS CONFIGURED ===');
                
                // Listen for source data events
                map.current.on('sourcedata', (e) => {
                  if (e.sourceId === LAYER_SOURCE && e.isSourceLoaded) {
                    console.log('✓ Blocks source data loaded');
                    
                    // Query a sample feature to see its structure
                    const features = map.current?.querySourceFeatures(LAYER_SOURCE, {
                      sourceLayer: LAYER_SOURCE_LAYER
                    });
                    
                    if (features && features.length > 0) {
                      console.log('Sample feature from tileset:', {
                        id: features[0].id,
                        properties: features[0].properties,
                        totalFeatures: features.length
                      });
                    } else {
                      console.warn('No features found in tileset!');
                    }
                  }
                });
                
                // Check if tiles are loading
                map.current.on('data', (e) => {
                  if (e.sourceId === LAYER_SOURCE) {
                    console.log('Data event for blocks source:', e.dataType);
                  }
                });
              } catch (error) {
                console.error('✗ Error adding source or layers:', error);
                setMapError('Failed to load block tiles. Please check your tileset configuration.');
              }
            } else {
              console.log('No tiles URL configured, skipping custom layer');
            }
            
            // Handle block clicks with proper feature-specific state  
            map.current.on("click", LAYER_ID, (e) => {
              const features = map.current?.queryRenderedFeatures(e.point, { layers: [LAYER_ID] });
              console.log('Click event - features found:', features?.length);
              
              if (!features || features.length === 0) {
                console.log('No features found at click point');
                return;
              }

              const feature = features[0];
              console.log('Feature clicked:', {
                id: feature.id,
                properties: feature.properties,
                hasBlockId: 'block_id' in (feature.properties || {})
              });
              
              const rawId = feature.id ?? feature.properties?.block_id;
              console.log('Extracted ID:', rawId);
              
              if (rawId === undefined || rawId === null) {
                console.warn('Feature has no ID! Cannot set feature state.');
                return;
              }

              const id = String(rawId);

              // Toggle selection
              const isSelected = selectedBlockIds.current.has(id);
              
              if (isSelected) {
                selectedBlockIds.current.delete(id);
                map.current?.setFeatureState(
                  { source: LAYER_SOURCE, sourceLayer: LAYER_SOURCE_LAYER, id: rawId },
                  { selected: false }
                );
              } else {
                selectedBlockIds.current.add(id);
                map.current?.setFeatureState(
                  { source: LAYER_SOURCE, sourceLayer: LAYER_SOURCE_LAYER, id: rawId },
                  { selected: true }
                );
              }

              // Update React state
              setWizardState((prev) => {
                const next = new Set(prev.selectedBlocks);
                if (next.has(id)) {
                  next.delete(id);
                } else {
                  next.add(id);
                }
                return { ...prev, selectedBlocks: next };
              });
            });

            // Cursor changes
            map.current.on("mouseenter", LAYER_ID, () => {
              if (map.current) map.current.getCanvas().style.cursor = "pointer";
            });

            map.current.on("mouseleave", LAYER_ID, () => {
              if (map.current) map.current.getCanvas().style.cursor = "";
            });
            
            // Expose map debug info to window for troubleshooting
            if (typeof window !== 'undefined') {
              (window as any).debugMap = () => {
                if (!map.current) return 'No map instance';
                const style = map.current.getStyle();
                return {
                  loaded: map.current.loaded(),
                  style: style?.name,
                  sources: Object.keys(style?.sources || {}),
                  layers: style?.layers?.map(l => ({ id: l.id, type: l.type, source: (l as any).source })) || [],
                  center: map.current.getCenter(),
                  zoom: map.current.getZoom()
                };
              };
              console.log('Debug: Call window.debugMap() in console to inspect map state');
            }
          });
        } catch (error) {
          console.error('Failed to initialize Mapbox:', error);
          setMapError('Failed to initialize map.');
          return;
        }
      };

      requestAnimationFrame(initMap);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [currentStep, mapboxConfig.token, mapboxConfig.tilesUrl, mapboxConfig.sourceLayer]);

  // Validation for proceeding
  const canProceed = () => {
    switch (currentStep) {
      case "budget":
        return wizardState.budgetMin < wizardState.budgetMax;
      case "borough":
        return wizardState.selectedBoroughs.length > 0;
      case "neighborhood":
        return wizardState.selectedNeighborhoods.length > 0;
      case "map":
        return true;
      case "review":
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceed()) {
      next();
    }
  };

  const handleRemoveBlock = (blockId: string) => {
    if (map.current && mapboxConfig) {
      selectedBlockIds.current.delete(blockId);
      
      map.current.setFeatureState(
        { source: LAYER_SOURCE, sourceLayer: mapboxConfig.sourceLayer || "blocks", id: blockId },
        { selected: false }
      );
      
      setWizardState((prev) => {
        const nextBlocks = new Set(prev.selectedBlocks);
        nextBlocks.delete(blockId);
        return { ...prev, selectedBlocks: nextBlocks };
      });
    }
  };

  const handleClearAllBlocks = () => {
    if (map.current && mapboxConfig) {
      selectedBlockIds.current.forEach((id) => {
        map.current?.setFeatureState(
          { source: LAYER_SOURCE, sourceLayer: mapboxConfig.sourceLayer || "blocks", id },
          { selected: false }
        );
      });
      
      selectedBlockIds.current.clear();
      setWizardState((prev) => ({ ...prev, selectedBlocks: new Set<string>() }));
    }
  };

  // Get summary data
  const selectedBoroughNames = boroughs
    .filter((b) => wizardState.selectedBoroughs.includes(b.id))
    .map((b) => b.name);

  const selectedNeighborhoodNames = boroughs
    .flatMap((b) => b.neighborhoods)
    .filter((n) => wizardState.selectedNeighborhoods.includes(n.id))
    .map((n) => n.name);

  return (
    <AppShell
      currentStep={currentStep}
      steps={WIZARD_STEPS}
      onStepClick={(stepId) => goTo(stepId as WizardStep)}
      showStepper={currentStep !== "review"}
    >
      <div className="max-w-4xl mx-auto" data-testid="wizard-container">
        <Card className="rounded-card shadow-card" data-testid="card-wizard">
          <CardHeader>
            <CardTitle className="flex items-center gap-3" data-testid="text-step-title">
              {currentStep === "budget" && (
                <>
                  <DollarSign className="h-6 w-6 text-primary" />
                  Set your budget
                </>
              )}
              {currentStep === "borough" && (
                <>
                  <Building2 className="h-6 w-6 text-primary" />
                  Choose your boroughs
                </>
              )}
              {currentStep === "neighborhood" && (
                <>
                  <MapPin className="h-6 w-6 text-primary" />
                  Select neighborhoods
                </>
              )}
              {currentStep === "map" && (
                <>
                  <MapIcon className="h-6 w-6 text-primary" />
                  Pick your blocks
                </>
              )}
              {currentStep === "review" && (
                <>
                  <CheckCircle2 className="h-6 w-6 text-success" />
                  Review your preferences
                </>
              )}
            </CardTitle>
            <CardDescription data-testid="text-step-description">
              {currentStep === "budget" && "What is your monthly rent budget?"}
              {currentStep === "borough" && "Which NYC boroughs interest you?"}
              {currentStep === "neighborhood" && "Select specific neighborhoods to explore"}
              {currentStep === "map" && "Click on blocks to add them to your search"}
              {currentStep === "review" && "Review and edit your apartment search preferences"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Budget Step */}
            {currentStep === "budget" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
                data-testid="step-budget"
              >
                <div className="space-y-4 pt-8 pb-4">
                  <RangeSlider
                    min={500}
                    max={10000}
                    step={50}
                    value={[wizardState.budgetMin, wizardState.budgetMax]}
                    onChange={([min, max]) =>
                      setWizardState((prev) => ({ ...prev, budgetMin: min, budgetMax: max }))
                    }
                    formatValue={(v) => `$${v.toLocaleString()}`}
                    ariaLabel={["Minimum budget", "Maximum budget"]}
                    data-testid="slider-budget"
                  />
                </div>
                <FormHint tooltip="Budget should include utilities and amenities. Most NYC apartments range from $1,500 to $6,000 per month.">
                  Consider utilities and amenities in your range
                </FormHint>
              </motion.div>
            )}

            {/* Borough Step */}
            {currentStep === "borough" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                data-testid="step-borough"
              >
                {boroughs.map((borough) => {
                  const isSelected = wizardState.selectedBoroughs.includes(borough.id);
                  return (
                    <motion.div
                      key={borough.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.18 }}
                    >
                      <Card
                        className={cn(
                          "cursor-pointer transition-all hover-elevate",
                          isSelected && "border-primary bg-primary/5"
                        )}
                        onClick={() => toggleBorough(borough.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            toggleBorough(borough.id);
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-pressed={isSelected}
                        data-testid={`card-borough-${borough.id}`}
                      >
                        <CardHeader className="space-y-1">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg" data-testid={`text-borough-${borough.id}`}>
                              {borough.name}
                            </CardTitle>
                            {isSelected && (
                              <Badge variant="default" data-testid={`badge-selected-${borough.id}`}>
                                Selected
                              </Badge>
                            )}
                          </div>
                          <CardDescription data-testid={`text-neighborhoods-count-${borough.id}`}>
                            {borough.neighborhoods.length} neighborhoods
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {/* Neighborhood Step */}
            {currentStep === "neighborhood" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
                data-testid="step-neighborhood"
              >
                {availableNeighborhoods.length === 0 ? (
                  <EmptyState
                    icon={MapPin}
                    title="No boroughs selected"
                    description="Please select at least one borough first"
                    action={{
                      label: "Go back to boroughs",
                      onClick: back,
                    }}
                  />
                ) : (
                  <>
                    {/* Search Input */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Search neighborhoods..."
                        value={neighborhoodSearch}
                        onChange={(e) => setNeighborhoodSearch(e.target.value)}
                        className="pl-9"
                        data-testid="input-search-neighborhoods"
                      />
                    </div>

                    {/* Selected Count and Clear */}
                    {wizardState.selectedNeighborhoods.length > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground" data-testid="text-selected-count">
                          Selected {wizardState.selectedNeighborhoods.length}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearAllNeighborhoods}
                          data-testid="button-clear-all"
                        >
                          Clear all
                        </Button>
                      </div>
                    )}

                    {/* Selected Badges */}
                    {wizardState.selectedNeighborhoods.length > 0 && (
                      <div className="flex flex-wrap gap-2" data-testid="container-selected-neighborhoods">
                        {wizardState.selectedNeighborhoods.map((id) => {
                          const neighborhood = availableNeighborhoods.find((n) => n.id === id);
                          if (!neighborhood) return null;
                          return (
                            <Badge
                              key={id}
                              variant="secondary"
                              className="gap-1 pr-1"
                              data-testid={`badge-neighborhood-${id}`}
                            >
                              {neighborhood.name}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleNeighborhood(id);
                                }}
                                className="ml-1 hover-elevate rounded-full p-0.5"
                                data-testid={`button-remove-neighborhood-${id}`}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          );
                        })}
                      </div>
                    )}

                    {/* Neighborhood Grid */}
                    {wizardState.selectedBoroughs.map((boroughId) => {
                      const borough = boroughs.find((b) => b.id === boroughId);
                      if (!borough) return null;

                      const boroughNeighborhoods = filteredNeighborhoods.filter(
                        (n) => n.boroughId === borough.id
                      );

                      if (boroughNeighborhoods.length === 0) return null;

                      return (
                        <div key={borough.id} className="space-y-3" data-testid={`group-neighborhoods-${borough.id}`}>
                          <h3 className="font-semibold text-sm text-muted-foreground" data-testid={`text-borough-title-${borough.id}`}>
                            {borough.name}
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {boroughNeighborhoods.map((neighborhood) => (
                              <div
                                key={neighborhood.id}
                                className="flex items-center space-x-2 p-3 rounded-md hover-elevate border"
                                data-testid={`item-neighborhood-${neighborhood.id}`}
                              >
                                <Checkbox
                                  id={neighborhood.id}
                                  checked={wizardState.selectedNeighborhoods.includes(neighborhood.id)}
                                  onCheckedChange={() => toggleNeighborhood(neighborhood.id)}
                                  data-testid={`checkbox-neighborhood-${neighborhood.id}`}
                                />
                                <label
                                  htmlFor={neighborhood.id}
                                  className="text-sm flex-1 cursor-pointer"
                                  data-testid={`label-neighborhood-${neighborhood.id}`}
                                >
                                  {neighborhood.name}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </motion.div>
            )}

            {/* Map Step */}
            {currentStep === "map" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
                data-testid="step-map"
              >
                {!mapboxConfig.token ? (
                  <EmptyState
                    icon={MapIcon}
                    title="Map not available"
                    description="Mapbox token is not configured. Set MAPBOX_TOKEN to enable the map."
                  />
                ) : mapError ? (
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground text-center p-8 bg-muted/30 rounded-lg border-2 border-dashed" data-testid="text-map-unavailable">
                      <MapIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p className="font-medium mb-2">Map preview unavailable</p>
                      <p className="text-xs">The interactive map requires WebGL support. You can still proceed with your neighborhood selections.</p>
                    </div>
                    {!mapboxConfig.tilesUrl && (
                      <div className="text-sm text-muted-foreground text-center p-4 bg-muted/50 rounded-lg" data-testid="text-blocks-info">
                        <p>Interactive block selection requires custom tiles configuration.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div
                      ref={mapContainer}
                      style={{ height: '520px', width: '100%' }}
                      className="rounded-card border [&_.mapboxgl-canvas]:rounded-card"
                      data-testid="map-container"
                    />
                    {!mapboxConfig.tilesUrl && (
                      <div className="text-sm text-muted-foreground text-center p-4 bg-muted/50 rounded-lg" data-testid="text-blocks-info">
                        <p>Interactive block selection requires custom tiles configuration.</p>
                      </div>
                    )}
                  </>
                )}
                
                {/* Selected Blocks */}
                {wizardState.selectedBlocks.size > 0 && (
                  <div className="sticky bottom-0 bg-background border-t p-4 -mx-6 -mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium" data-testid="text-blocks-label">
                        {selectedBoroughNames.join(", ")} • {selectedNeighborhoodNames.length} neighborhoods • {wizardState.selectedBlocks.size} blocks
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearAllBlocks}
                        data-testid="button-clear-all-blocks"
                      >
                        Clear All
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {Array.from(wizardState.selectedBlocks).map((blockId) => (
                        <Badge
                          key={blockId}
                          variant="secondary"
                          className="pr-1 gap-1"
                          data-testid={`badge-block-${blockId}`}
                        >
                          Block {blockId}
                          <button
                            onClick={() => handleRemoveBlock(blockId)}
                            className="ml-1 hover-elevate rounded-full p-0.5"
                            data-testid={`button-remove-block-${blockId}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Review Step */}
            {currentStep === "review" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
                data-testid="step-review"
              >
                {/* Budget Summary */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Budget</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => goTo('budget')}
                      data-testid="button-edit-budget"
                    >
                      Edit
                    </Button>
                  </div>
                  <p className="text-2xl font-bold tabular-nums">
                    ${wizardState.budgetMin.toLocaleString()} – ${wizardState.budgetMax.toLocaleString()}
                    <span className="text-sm font-normal text-muted-foreground ml-2">/month</span>
                  </p>
                </div>

                {/* Boroughs Summary */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Boroughs</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => goTo('borough')}
                      data-testid="button-edit-boroughs"
                    >
                      Edit
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedBoroughNames.map((name) => (
                      <Badge key={name} variant="secondary">{name}</Badge>
                    ))}
                  </div>
                </div>

                {/* Neighborhoods Summary */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Neighborhoods</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => goTo('neighborhood')}
                      data-testid="button-edit-neighborhoods"
                    >
                      Edit
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedNeighborhoodNames.map((name) => (
                      <Badge key={name} variant="secondary">{name}</Badge>
                    ))}
                  </div>
                </div>

                {/* Blocks Summary */}
                {wizardState.selectedBlocks.size > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Selected Blocks</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => goTo('map')}
                        data-testid="button-edit-blocks"
                      >
                        Edit
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {wizardState.selectedBlocks.size} blocks selected
                    </p>
                  </div>
                )}

                {wizardState.selectedBlocks.size === 0 && (
                  <EmptyState
                    icon={MapIcon}
                    title="No blocks selected"
                    description="Add specific blocks to narrow your search, or proceed to see all available apartments in your selected neighborhoods."
                    action={{
                      label: "Select blocks",
                      onClick: () => goTo('map'),
                    }}
                  />
                )}
              </motion.div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t">
              <Button
                variant="ghost"
                onClick={back}
                disabled={isFirstStep}
                data-testid="button-back"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>

              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                data-testid="button-next"
              >
                {currentStep === "review" ? (
                  "Find Apartments"
                ) : (
                  <>
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
