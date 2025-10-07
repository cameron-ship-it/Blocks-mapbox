import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { boroughs, type Borough, type Neighborhood } from "@/lib/geo";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, ChevronLeft, DollarSign, MapPin, Building2, Map, X } from "lucide-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

type WizardStep = "budget" | "borough" | "neighborhood" | "map" | "complete";

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

export default function BlocksOnboardingWizard() {
  const [currentStep, setCurrentStep] = useState<WizardStep>("budget");
  const [wizardState, setWizardState] = useState<WizardState>({
    budgetMin: 1500,
    budgetMax: 4000,
    selectedBoroughs: [],
    selectedNeighborhoods: [],
    selectedBlocks: new Set<string>(),
  });

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const selectedIds = useRef<Set<string>>(new Set());

  const { data: mapboxConfig } = useQuery<MapboxConfig>({
    queryKey: ["/api/mapbox-config"],
  });

  // Get available neighborhoods based on selected boroughs
  const availableNeighborhoods = boroughs
    .filter((b) => wizardState.selectedBoroughs.includes(b.id))
    .flatMap((b) => b.neighborhoods);

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

  // Initialize Mapbox map
  useEffect(() => {
    if (currentStep === "map" && mapContainer.current && mapboxConfig?.token && !map.current) {
      // WebGL diagnostics
      console.log("Mapbox supported:", mapboxgl.supported());
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      console.log("WebGL context:", !!gl);

      // Check if Mapbox is supported
      if (!mapboxgl.supported({ failIfMajorPerformanceCaveat: true })) {
        setMapError('WebGL not supported in this environment. Please open the app in a new browser tab and enable hardware acceleration.');
        return;
      }

      try {
        mapboxgl.accessToken = mapboxConfig.token;
        setMapError(null);

        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: "mapbox://styles/mapbox/light-v11",
          center: [-73.935242, 40.730610], // NYC center
          zoom: 11,
        });

        // Handle map errors
        map.current.on('error', (e) => {
          console.error('Mapbox error:', e);
          setMapError('Map failed to load. This may be due to WebGL not being available in this environment.');
        });
      } catch (error) {
        console.error('Failed to initialize Mapbox:', error);
        setMapError('Failed to initialize map. WebGL may not be available in this environment.');
        return;
      }

      map.current.on("load", () => {
        // Add blocks layer if tiles URL is available
        if (mapboxConfig.tilesUrl && map.current) {
          const LAYER_SOURCE_LAYER = mapboxConfig.sourceLayer || "blocks";
          
          // Use 'url' for Mapbox tileset references, 'tiles' for URL templates
          const sourceConfig: any = {
            type: "vector",
            promoteId: "block_id"
          };
          
          if (mapboxConfig.tilesUrl.startsWith("mapbox://")) {
            sourceConfig.url = mapboxConfig.tilesUrl;
          } else {
            sourceConfig.tiles = [mapboxConfig.tilesUrl];
          }
          
          map.current.addSource(LAYER_SOURCE, sourceConfig);

          map.current.addLayer({
            id: LAYER_ID,
            type: "fill",
            source: LAYER_SOURCE,
            "source-layer": LAYER_SOURCE_LAYER,
            paint: {
              "fill-color": [
                "case",
                ["boolean", ["feature-state", "selected"], false],
                "#2563eb",
                "#cbd5e1"
              ],
              "fill-opacity": 0.55,
            },
          });

          map.current.addLayer({
            id: LAYER_LINE_ID,
            type: "line",
            source: LAYER_SOURCE,
            "source-layer": LAYER_SOURCE_LAYER,
            paint: {
              "line-color": "#475569",
              "line-width": 0.6,
            },
          });

          // Runtime validator to prevent "wrong sourceLayer" bug
          const layers = map.current.getStyle().layers || [];
          const fillLayer = layers.find(l => l.id === LAYER_ID) as any;
          const srcLayerUsedByFill = fillLayer?.["source-layer"];
          if (srcLayerUsedByFill !== LAYER_SOURCE_LAYER) {
            console.error("source-layer mismatch:", {
              expected: LAYER_SOURCE_LAYER,
              actual: srcLayerUsedByFill
            });
          }

          // Handle block clicks
          map.current.on("click", LAYER_ID, (e) => {
            const f = map.current?.queryRenderedFeatures(e.point, { layers: [LAYER_ID] })?.[0];
            if (!f) return;

            // ID sanity: prefer f.id (from promoteId); fallback to properties.block_id
            const rawId = (f.id ?? (f.properties && f.properties.block_id));
            if (rawId === undefined || rawId === null) {
              console.warn("No id/block_id on feature. Check LAYER_SOURCE_LAYER and promoteId.");
              return;
            }
            
            // Normalize id to a stable primitive (string is safest across tiles)
            const id = typeof rawId === "number" ? rawId : String(rawId);
            console.log("clicked id:", rawId, "normalized:", id, "layer:", LAYER_SOURCE_LAYER);

            const key = { source: LAYER_SOURCE, sourceLayer: LAYER_SOURCE_LAYER, id };

            setWizardState((prev) => {
              const next = new Set(prev.selectedBlocks);
              const idStr = String(id);
              if (next.has(idStr)) {
                next.delete(idStr);
                selectedIds.current.delete(idStr);
                if (map.current) {
                  map.current.setFeatureState(key, { selected: false });
                }
              } else {
                next.add(idStr);
                selectedIds.current.add(idStr);
                if (map.current) {
                  map.current.setFeatureState(key, { selected: true });
                }
              }
              return { ...prev, selectedBlocks: next };
            });
          });

          // Change cursor on hover
          map.current.on("mouseenter", LAYER_ID, () => {
            if (map.current) map.current.getCanvas().style.cursor = "pointer";
          });

          map.current.on("mouseleave", LAYER_ID, () => {
            if (map.current) map.current.getCanvas().style.cursor = "";
          });
        }
      });
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [currentStep, mapboxConfig]);

  const canProceed = () => {
    switch (currentStep) {
      case "budget":
        return true;
      case "borough":
        return wizardState.selectedBoroughs.length > 0;
      case "neighborhood":
        return wizardState.selectedNeighborhoods.length > 0;
      case "map":
        return true; // Map is the final step, can always "finish"
      default:
        return false;
    }
  };

  const handleNext = () => {
    const steps: WizardStep[] = ["budget", "borough", "neighborhood", "map", "complete"];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handleRestart = () => {
    // Clear feature states when restarting
    if (map.current && mapboxConfig) {
      const sourceLayer = mapboxConfig.sourceLayer || "blocks";
      selectedIds.current.forEach((id) => {
        map.current?.setFeatureState(
          { source: LAYER_SOURCE, sourceLayer: sourceLayer, id },
          { selected: false }
        );
      });
      selectedIds.current.clear();
    }
    
    setCurrentStep("budget");
    setWizardState({
      budgetMin: 1500,
      budgetMax: 4000,
      selectedBoroughs: [],
      selectedNeighborhoods: [],
      selectedBlocks: new Set<string>(),
    });
  };

  const handleBack = () => {
    const steps: WizardStep[] = ["budget", "borough", "neighborhood", "map"];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleRemoveBlock = (blockId: string) => {
    if (map.current && mapboxConfig) {
      const sourceLayer = mapboxConfig.sourceLayer || "blocks";
      const numericId = Number(blockId);
      const id = isNaN(numericId) ? blockId : numericId;
      
      map.current.setFeatureState(
        { source: LAYER_SOURCE, sourceLayer: sourceLayer, id },
        { selected: false }
      );
      selectedIds.current.delete(String(id));
      
      setWizardState((prev) => {
        const next = new Set(prev.selectedBlocks);
        next.delete(blockId);
        return { ...prev, selectedBlocks: next };
      });
    }
  };

  const handleClearAllBlocks = () => {
    if (map.current && mapboxConfig) {
      const sourceLayer = mapboxConfig.sourceLayer || "blocks";
      
      wizardState.selectedBlocks.forEach((blockId) => {
        const numericId = Number(blockId);
        const id = isNaN(numericId) ? blockId : numericId;
        
        map.current?.setFeatureState(
          { source: LAYER_SOURCE, sourceLayer: sourceLayer, id },
          { selected: false }
        );
      });
      
      selectedIds.current.clear();
      
      setWizardState((prev) => ({
        ...prev,
        selectedBlocks: new Set<string>(),
      }));
    }
  };

  // Get selected borough and neighborhood names for summary
  const selectedBoroughNames = boroughs
    .filter((b) => wizardState.selectedBoroughs.includes(b.id))
    .map((b) => b.name);

  const selectedNeighborhoodNames = boroughs
    .flatMap((b) => b.neighborhoods)
    .filter((n) => wizardState.selectedNeighborhoods.includes(n.id))
    .map((n) => n.name);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" data-testid="wizard-container">
      <div className="w-full max-w-4xl">
        {/* Progress indicator - hide on complete */}
        {currentStep !== "complete" && (
          <div className="mb-8 flex justify-center gap-2" data-testid="progress-indicator">
            {["budget", "borough", "neighborhood", "map"].map((step, index) => (
              <div
                key={step}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  currentStep === step
                    ? "bg-primary"
                    : ["budget", "borough", "neighborhood", "map"].indexOf(currentStep) > index
                    ? "bg-primary/50"
                    : "bg-muted"
                }`}
                data-testid={`progress-step-${step}`}
              />
            ))}
          </div>
        )}

        <Card data-testid="card-wizard">
          <CardHeader>
            <CardTitle className="text-2xl" data-testid="text-step-title">
              {currentStep === "budget" && (
                <>
                  <DollarSign className="inline-block w-6 h-6 mr-2" data-testid="icon-budget" />
                  Set Your Budget
                </>
              )}
              {currentStep === "borough" && (
                <>
                  <Building2 className="inline-block w-6 h-6 mr-2" data-testid="icon-borough" />
                  Choose Your Boroughs
                </>
              )}
              {currentStep === "neighborhood" && (
                <>
                  <MapPin className="inline-block w-6 h-6 mr-2" data-testid="icon-neighborhood" />
                  Select Neighborhoods
                </>
              )}
              {currentStep === "map" && (
                <>
                  <Map className="inline-block w-6 h-6 mr-2" data-testid="icon-map" />
                  Pick Your Blocks
                </>
              )}
            </CardTitle>
            <CardDescription data-testid="text-step-description">
              {currentStep === "budget" && "What's your monthly rent budget?"}
              {currentStep === "borough" && "Which NYC boroughs interest you?"}
              {currentStep === "neighborhood" && "Select specific neighborhoods to explore"}
              {currentStep === "map" && "Click on blocks to add them to your search"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Budget Step */}
            {currentStep === "budget" && (
              <div className="space-y-6" data-testid="step-budget">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground" data-testid="text-budget-range">
                      Budget Range
                    </span>
                    <span className="text-lg font-semibold" data-testid="text-budget-value">
                      ${wizardState.budgetMin.toLocaleString()} - ${wizardState.budgetMax.toLocaleString()}
                    </span>
                  </div>
                  <Slider
                    min={500}
                    max={10000}
                    step={100}
                    value={[wizardState.budgetMin, wizardState.budgetMax]}
                    onValueChange={([min, max]) =>
                      setWizardState((prev) => ({ ...prev, budgetMin: min, budgetMax: max }))
                    }
                    data-testid="slider-budget"
                  />
                </div>
              </div>
            )}

            {/* Borough Step */}
            {currentStep === "borough" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="step-borough">
                {boroughs.map((borough) => (
                  <Card
                    key={borough.id}
                    className={`cursor-pointer transition-all hover-elevate ${
                      wizardState.selectedBoroughs.includes(borough.id)
                        ? "border-primary bg-primary/5"
                        : ""
                    }`}
                    onClick={() => toggleBorough(borough.id)}
                    data-testid={`card-borough-${borough.id}`}
                  >
                    <CardHeader className="space-y-1">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg" data-testid={`text-borough-${borough.id}`}>
                          {borough.name}
                        </CardTitle>
                        {wizardState.selectedBoroughs.includes(borough.id) && (
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
                ))}
              </div>
            )}

            {/* Neighborhood Step */}
            {currentStep === "neighborhood" && (
              <div className="space-y-4" data-testid="step-neighborhood">
                {availableNeighborhoods.length === 0 ? (
                  <p className="text-center text-muted-foreground" data-testid="text-no-boroughs">
                    Please select at least one borough first
                  </p>
                ) : (
                  wizardState.selectedBoroughs.map((boroughId) => {
                    const borough = boroughs.find((b) => b.id === boroughId);
                    if (!borough) return null;

                    return (
                      <div key={borough.id} className="space-y-3" data-testid={`group-neighborhoods-${borough.id}`}>
                        <h3 className="font-semibold text-sm text-muted-foreground" data-testid={`text-borough-title-${borough.id}`}>
                          {borough.name}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {borough.neighborhoods.map((neighborhood) => (
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
                  })
                )}
              </div>
            )}

            {/* Map Step */}
            {currentStep === "map" && (
              <div className="space-y-4" data-testid="step-map">
                {!mapboxConfig?.token ? (
                  <div className="h-96 w-full rounded-lg border flex items-center justify-center bg-muted/30" data-testid="map-error">
                    <div className="text-center p-6 space-y-2">
                      <p className="text-muted-foreground">Map not available</p>
                      <p className="text-sm text-muted-foreground">
                        Mapbox token is not configured. Set <code className="text-xs bg-background px-1 py-0.5 rounded">MAPBOX_TOKEN</code> to enable the map.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div
                    ref={mapContainer}
                    style={{ height: '520px', width: '100%', borderRadius: '16px' }}
                    className="border overflow-hidden"
                    data-testid="map-container"
                  />
                )}
                {mapError && (
                  <div className="text-sm text-destructive text-center p-4 bg-destructive/10 rounded-lg" data-testid="text-map-error">
                    {mapError}
                  </div>
                )}
                {!mapboxConfig?.tilesUrl && mapboxConfig?.token && !mapError && (
                  <div className="text-sm text-muted-foreground text-center p-4 bg-muted/50 rounded-lg" data-testid="text-blocks-info">
                    <p>Interactive block selection requires custom tiles configuration.</p>
                    <p className="mt-1">Set <code className="text-xs bg-background px-1 py-0.5 rounded">VITE_BLOCKS_TILES</code> environment variable to enable clickable blocks.</p>
                  </div>
                )}
                {wizardState.selectedBlocks.size > 0 && (
                  <div className="space-y-2" data-testid="container-selected-blocks">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-muted-foreground" data-testid="text-blocks-label">
                        Selected blocks: {wizardState.selectedBlocks.size}
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
                          {blockId}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveBlock(blockId);
                            }}
                            className="ml-1 hover:bg-secondary-foreground/20 rounded-sm p-0.5"
                            data-testid={`button-remove-block-${blockId}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Complete Step */}
            {currentStep === "complete" && (
              <div className="space-y-6" data-testid="step-complete">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center" data-testid="icon-complete">
                    <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold" data-testid="text-complete-title">Search Preferences Saved!</h3>
                  <p className="text-muted-foreground" data-testid="text-complete-description">
                    Here's a summary of your NYC apartment search preferences
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 border rounded-lg" data-testid="summary-budget">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Budget Range</span>
                    </div>
                    <p className="text-lg font-semibold" data-testid="text-summary-budget">
                      ${wizardState.budgetMin.toLocaleString()} - ${wizardState.budgetMax.toLocaleString()} / month
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg" data-testid="summary-boroughs">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Selected Boroughs</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedBoroughNames.map((name) => (
                        <Badge key={name} variant="secondary" data-testid={`summary-badge-borough-${name}`}>
                          {name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg" data-testid="summary-neighborhoods">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Selected Neighborhoods</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedNeighborhoodNames.map((name) => (
                        <Badge key={name} variant="secondary" data-testid={`summary-badge-neighborhood-${name}`}>
                          {name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {wizardState.selectedBlocks.size > 0 && (
                    <div className="p-4 border rounded-lg" data-testid="summary-blocks">
                      <div className="flex items-center gap-2 mb-2">
                        <Map className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Selected Blocks</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Array.from(wizardState.selectedBlocks).map((blockId) => (
                          <Badge key={blockId} variant="secondary" data-testid={`summary-badge-block-${blockId}`}>
                            {blockId}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Button 
                  onClick={handleRestart} 
                  variant="outline" 
                  className="w-full"
                  data-testid="button-restart"
                >
                  Start New Search
                </Button>
              </div>
            )}

            {/* Navigation Buttons - hide on complete */}
            {currentStep !== "complete" && (
              <div className="flex justify-between pt-4 border-t" data-testid="navigation-buttons">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === "budget"}
                  data-testid="button-back"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  data-testid="button-next"
                >
                  {currentStep === "map" ? "Finish" : "Next"}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
