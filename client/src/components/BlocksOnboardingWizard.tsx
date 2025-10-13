import { useState, useEffect, useRef, useMemo } from "react";
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
import { 
  fetchManhattanNeighborhoods, 
  processNeighborhoods, 
  getSortedNeighborhoods,
  computeCombinedBbox,
  type NeighborhoodData,
  type NeighborhoodsGeoJSON
} from "@/lib/neighborhoods";
import { SelectionStore } from "@/lib/selectionStore";
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
  DollarSign,
  RotateCcw,
  Layers
} from "lucide-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import * as turf from "@turf/turf";

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
  
  // Initialize SelectionStore
  const selectionStore = useRef<SelectionStore>(new SelectionStore());
  const [selectionMode, setSelectionMode] = useState<'include' | 'exclude'>(selectionStore.current.getMode());
  const [, forceUpdate] = useState({});

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

  // Load NYC DCP Neighborhood Tabulation Areas for Manhattan
  const { data: manhattanNeighborhoods, isLoading: isLoadingNeighborhoods } = useQuery<NeighborhoodsGeoJSON>({
    queryKey: ['manhattan-neighborhoods'],
    queryFn: fetchManhattanNeighborhoods,
    staleTime: Infinity, // Data is static, cache indefinitely
  });

  // Process neighborhoods data
  const neighborhoodMap = useMemo(() => {
    if (!manhattanNeighborhoods) return new Map<string, NeighborhoodData>();
    return processNeighborhoods(manhattanNeighborhoods);
  }, [manhattanNeighborhoods]);

  const sortedNeighborhoods = useMemo(() => {
    return getSortedNeighborhoods(neighborhoodMap);
  }, [neighborhoodMap]);

  // Filter neighborhoods by search
  const filteredManhattanNeighborhoods = useMemo(() => {
    if (!neighborhoodSearch) return sortedNeighborhoods;
    return sortedNeighborhoods.filter((n) =>
      n.name.toLowerCase().includes(neighborhoodSearch.toLowerCase())
    );
  }, [sortedNeighborhoods, neighborhoodSearch]);

  // Keep old borough-based logic for backwards compatibility
  const availableNeighborhoods = boroughs
    .filter((b) => wizardState.selectedBoroughs.includes(b.id))
    .flatMap((b) => b.neighborhoods);

  // Filter neighborhoods by search (old logic)
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

  // Subscribe to SelectionStore changes
  useEffect(() => {
    const unsubscribe = selectionStore.current.subscribe(() => {
      forceUpdate({});
      setWizardState((prev) => ({
        ...prev,
        selectedBlocks: selectionStore.current.getSelected()
      }));
    });
    return unsubscribe;
  }, []);

  // Toggle neighborhood selection
  const toggleNeighborhood = (neighborhoodId: string) => {
    setWizardState((prev) => ({
      ...prev,
      selectedNeighborhoods: prev.selectedNeighborhoods.includes(neighborhoodId)
        ? prev.selectedNeighborhoods.filter((id) => id !== neighborhoodId)
        : [...prev.selectedNeighborhoods, neighborhoodId],
    }));
  };

  // Focus map on selected neighborhoods (Manhattan neighborhoods from API)
  useEffect(() => {
    if (!map.current || wizardState.selectedNeighborhoods.length === 0) return;

    const bbox = computeCombinedBbox(wizardState.selectedNeighborhoods, neighborhoodMap);
    if (bbox) {
      map.current.fitBounds(bbox as [number, number, number, number], {
        padding: 48,
        animate: true,
        duration: 800
      });
    }
  }, [wizardState.selectedNeighborhoods, neighborhoodMap]);

  // Spatial filtering: Auto-select blocks within selected neighborhoods
  useEffect(() => {
    if (!map.current || !manhattanNeighborhoods || wizardState.selectedNeighborhoods.length === 0) return;
    if (currentStep !== 'map') return; // Only filter when on map step

    const selectedNeighborhoodGeometries = wizardState.selectedNeighborhoods
      .map(id => neighborhoodMap.get(id))
      .filter((n): n is NeighborhoodData => n !== undefined)
      .map(n => n.geometry);

    if (selectedNeighborhoodGeometries.length === 0) return;

    // Use Mapbox querySourceFeatures to get all block features
    // Note: This requires the source to be loaded
    try {
      const features = map.current.querySourceFeatures(LAYER_SOURCE, {
        sourceLayer: mapboxConfig.sourceLayer
      });

      if (features.length === 0) {
        console.log('No block features found yet, source may not be loaded');
        return;
      }

      console.log(`Spatial filtering: checking ${features.length} blocks against ${selectedNeighborhoodGeometries.length} neighborhoods`);

      // Use Turf to check if each block intersects with any selected neighborhood
      const blocksToSelect: string[] = [];
      
      features.forEach(feature => {
        const blockId = feature.id ?? feature.properties?.block_id ?? feature.properties?.GEOID;
        if (!blockId) return;

        // Check if this block intersects with any selected neighborhood
        const intersects = selectedNeighborhoodGeometries.some(neighborhood => {
          try {
            // Use Turf booleanIntersects to check spatial relationship
            return turf.booleanIntersects(feature.geometry as any, neighborhood as any);
          } catch (e) {
            // If geometry is invalid or comparison fails, skip
            return false;
          }
        });

        if (intersects) {
          blocksToSelect.push(String(blockId));
        }
      });

      console.log(`Spatial filtering: found ${blocksToSelect.length} blocks within selected neighborhoods`);

      // Add these blocks to selection
      blocksToSelect.forEach(blockId => {
        selectionStore.current.add(blockId);
        
        // Update feature-state
        if (map.current) {
          const fid = !isNaN(Number(blockId)) ? Number(blockId) : blockId;
          map.current.setFeatureState(
            { source: LAYER_SOURCE, sourceLayer: mapboxConfig.sourceLayer, id: fid },
            { selected: true }
          );
        }
      });

      // Update selectedBlockIds ref for backward compatibility
      blocksToSelect.forEach(id => selectedBlockIds.current.add(id));

    } catch (error) {
      console.error('Spatial filtering error:', error);
    }
  }, [wizardState.selectedNeighborhoods, currentStep, manhattanNeighborhoods, neighborhoodMap]);

  // Clear all neighborhoods
  const clearAllNeighborhoods = () => {
    setWizardState((prev) => ({ ...prev, selectedNeighborhoods: [] }));
  };

  // Mode control handlers
  const handleSelectAll = () => {
    // TODO: Select all blocks visible in the current map view
    // This would require querying all features in the current bounds
    console.log('Select All not yet implemented - would select all visible blocks');
  };

  const handleInvert = () => {
    if (!map.current) {
      console.warn('Map not initialized, cannot invert selection');
      return;
    }

    try {
      // Query all block features from the map source
      const features = map.current.querySourceFeatures(LAYER_SOURCE, {
        sourceLayer: mapboxConfig.sourceLayer
      });

      if (features.length === 0) {
        console.warn('No block features found, source may not be loaded');
        return;
      }

      // Extract all block IDs
      const allBlockIds = features
        .map(f => {
          const id = f.id ?? f.properties?.block_id ?? f.properties?.GEOID;
          return id ? String(id) : null;
        })
        .filter((id): id is string => id !== null);

      console.log(`Inverting selection with ${allBlockIds.length} total blocks`);

      // Get current selection before inverting
      const previousSelection = selectionStore.current.getSelected();

      // Invert selection in store
      selectionStore.current.invert(allBlockIds);

      // Update feature-state on map
      const newSelection = selectionStore.current.getSelected();

      // Clear previously selected blocks
      previousSelection.forEach(blockId => {
        if (!newSelection.has(blockId)) {
          const fid = !isNaN(Number(blockId)) ? Number(blockId) : blockId;
          map.current?.setFeatureState(
            { source: LAYER_SOURCE, sourceLayer: mapboxConfig.sourceLayer, id: fid },
            { selected: false }
          );
        }
      });

      // Set newly selected blocks
      newSelection.forEach(blockId => {
        if (!previousSelection.has(blockId)) {
          const fid = !isNaN(Number(blockId)) ? Number(blockId) : blockId;
          map.current?.setFeatureState(
            { source: LAYER_SOURCE, sourceLayer: mapboxConfig.sourceLayer, id: fid },
            { selected: true }
          );
        }
      });

      // Update selectedBlockIds ref
      selectedBlockIds.current = new Set(newSelection);

    } catch (error) {
      console.error('Error inverting selection:', error);
    }
  };

  const handleClearAll = () => {
    if (!map.current) {
      selectionStore.current.clearAll();
      return;
    }

    // Get current selection before clearing
    const previousSelection = selectionStore.current.getSelected();

    // Clear selection in store
    selectionStore.current.clearAll();

    // Clear feature-state on map for all previously selected blocks
    previousSelection.forEach(blockId => {
      const fid = !isNaN(Number(blockId)) ? Number(blockId) : blockId;
      map.current?.setFeatureState(
        { source: LAYER_SOURCE, sourceLayer: mapboxConfig.sourceLayer, id: fid },
        { selected: false }
      );
    });

    // Clear selectedBlockIds ref
    selectedBlockIds.current.clear();
  };

  const handleModeChange = (mode: 'include' | 'exclude') => {
    selectionStore.current.setMode(mode);
    setSelectionMode(mode);
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
              
              // Determine the best ID property for promoteId
              // Priority: block_id > GEOID > let Mapbox use its internal ID
              const sourceConfig: any = {
                type: "vector",
                // We'll try block_id first, but the tileset might use GEOID or have a string ID field
                // Mapbox will use the tileset's native ID if promoteId property doesn't exist
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
                console.log('✓ Source added successfully with promoteId:', sourceConfig.promoteId);

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
                    console.log('[QA] ✓ Blocks source data loaded');
                    
                    // Query a sample feature to see its structure
                    const features = map.current?.querySourceFeatures(LAYER_SOURCE, {
                      sourceLayer: LAYER_SOURCE_LAYER
                    });
                    
                    if (features && features.length > 0) {
                      const sample = features[0];
                      console.log('[QA] Sample feature from tileset:', {
                        'feature.id': sample.id,
                        'has_block_id': sample.properties?.block_id !== undefined,
                        'has_GEOID': sample.properties?.GEOID !== undefined,
                        'properties': sample.properties,
                        'totalFeatures': features.length
                      });
                      
                      // Verify promoteId is working
                      if (sample.id === undefined) {
                        console.error('[QA] WARNING: feature.id is undefined! promoteId may not be working correctly.');
                        console.error('[QA] Check if the tileset has the property specified in promoteId:', sourceConfig.promoteId);
                      } else {
                        console.log('[QA] ✓ feature.id is set correctly:', sample.id);
                      }
                    } else {
                      console.warn('[QA] No features found in tileset!');
                    }
                  }
                });
                
                // Check if tiles are loading
                map.current.on('data', (e) => {
                  if (e.sourceId === LAYER_SOURCE) {
                    console.log('[QA] Data event for blocks source:', e.dataType);
                  }
                });
              } catch (error) {
                console.error('✗ Error adding source or layers:', error);
                setMapError('Failed to load block tiles. Please check your tileset configuration.');
              }
            } else {
              console.log('No tiles URL configured, skipping custom layer');
            }
            
            // Maintain Set of selected IDs (source of truth)
            const selectedIds = new Set<string>();
            
            const toggleFeature = (fid: string | number) => {
              const fidString = String(fid);
              const wasSelected = selectedIds.has(fidString);
              
              // Toggle in Set
              if (wasSelected) {
                selectedIds.delete(fidString);
              } else {
                selectedIds.add(fidString);
              }
              
              // Update feature-state for ONLY this feature
              if (map.current) {
                const featureId = !isNaN(Number(fid)) ? Number(fid) : fid;
                map.current.setFeatureState(
                  { source: LAYER_SOURCE, sourceLayer: LAYER_SOURCE_LAYER, id: featureId },
                  { selected: !wasSelected }
                );
              }
              
              // Update SelectionStore
              selectionStore.current.setSelected(fidString, !wasSelected);
              
              // Update backward compatibility ref
              if (wasSelected) {
                selectedBlockIds.current.delete(fidString);
              } else {
                selectedBlockIds.current.add(fidString);
              }
              
              // QA check: Log selected count and verify isolation
              console.log(`[QA] Toggled feature ${fidString}: ${wasSelected ? 'OFF' : 'ON'}`);
              console.log(`[QA] Total selected count: ${selectedIds.size}`);
            };

            const reapplySelections = () => {
              if (!map.current) return;
              
              console.log(`[QA] Reapplying ${selectedIds.size} selections`);
              
              // Clear all feature states first to ensure clean slate
              const allFeatures = map.current.querySourceFeatures(LAYER_SOURCE, {
                sourceLayer: LAYER_SOURCE_LAYER
              });
              
              allFeatures.forEach(feature => {
                if (feature.id !== undefined && map.current) {
                  map.current.setFeatureState(
                    { source: LAYER_SOURCE, sourceLayer: LAYER_SOURCE_LAYER, id: feature.id },
                    { selected: false }
                  );
                }
              });
              
              // Reapply selections from Set
              selectedIds.forEach(fidString => {
                if (map.current) {
                  const fid = !isNaN(Number(fidString)) ? Number(fidString) : fidString;
                  map.current.setFeatureState(
                    { source: LAYER_SOURCE, sourceLayer: LAYER_SOURCE_LAYER, id: fid },
                    { selected: true }
                  );
                }
              });
            };
            
            // Helper: Select all blocks
            const selectAllBlocks = (ids: string[]) => {
              if (!map.current) return;
              console.log(`[QA] Selecting all ${ids.length} blocks`);
              
              // Clear current selection
              selectedIds.clear();
              
              // Add all in chunks for smooth UI
              const CHUNK_SIZE = 100;
              for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
                const chunk = ids.slice(i, i + CHUNK_SIZE);
                chunk.forEach(id => {
                  selectedIds.add(id);
                  const fid = !isNaN(Number(id)) ? Number(id) : id;
                  if (map.current) {
                    map.current.setFeatureState(
                      { source: LAYER_SOURCE, sourceLayer: LAYER_SOURCE_LAYER, id: fid },
                      { selected: true }
                    );
                  }
                });
              }
              
              // Sync with stores
              selectionStore.current.selectAll(ids);
              ids.forEach(id => selectedBlockIds.current.add(id));
              
              console.log(`[QA] Selected ${selectedIds.size} blocks`);
            };
            
            // Helper: Clear all selections
            const clearAllBlocks = () => {
              if (!map.current) return;
              console.log(`[QA] Clearing all ${selectedIds.size} selections`);
              
              selectedIds.forEach(fidString => {
                const fid = !isNaN(Number(fidString)) ? Number(fidString) : fidString;
                if (map.current) {
                  map.current.setFeatureState(
                    { source: LAYER_SOURCE, sourceLayer: LAYER_SOURCE_LAYER, id: fid },
                    { selected: false }
                  );
                }
              });
              
              selectedIds.clear();
              selectionStore.current.clearAll();
              selectedBlockIds.current.clear();
              
              console.log(`[QA] All selections cleared`);
            };
            
            // Helper: Invert selection
            const invertSelection = (allIds: string[]) => {
              if (!map.current) return;
              console.log(`[QA] Inverting selection from ${selectedIds.size} blocks`);
              
              const newSelection = new Set<string>();
              
              // Determine which blocks to toggle
              allIds.forEach(id => {
                if (!selectedIds.has(id)) {
                  newSelection.add(id);
                }
              });
              
              // Clear all current selections
              selectedIds.forEach(fidString => {
                const fid = !isNaN(Number(fidString)) ? Number(fidString) : fidString;
                if (map.current) {
                  map.current.setFeatureState(
                    { source: LAYER_SOURCE, sourceLayer: LAYER_SOURCE_LAYER, id: fid },
                    { selected: false }
                  );
                }
              });
              
              // Apply new selections in chunks
              selectedIds.clear();
              const CHUNK_SIZE = 100;
              const newSelectionArray = Array.from(newSelection);
              
              for (let i = 0; i < newSelectionArray.length; i += CHUNK_SIZE) {
                const chunk = newSelectionArray.slice(i, i + CHUNK_SIZE);
                chunk.forEach(id => {
                  selectedIds.add(id);
                  const fid = !isNaN(Number(id)) ? Number(id) : id;
                  if (map.current) {
                    map.current.setFeatureState(
                      { source: LAYER_SOURCE, sourceLayer: LAYER_SOURCE_LAYER, id: fid },
                      { selected: true }
                    );
                  }
                });
              }
              
              // Sync with stores
              selectionStore.current.invert(allIds);
              selectedBlockIds.current.clear();
              selectedIds.forEach(id => selectedBlockIds.current.add(id));
              
              console.log(`[QA] Inverted to ${selectedIds.size} blocks`);
            };

            if (map.current) {
              map.current.on("click", LAYER_ID, (e) => {
                const features = map.current?.queryRenderedFeatures(e.point, { layers: [LAYER_ID] });
                
                if (!features || features.length === 0) {
                  console.log('[QA] No features found at click point');
                  return;
                }

                // Extract stable ID from feature
                const feature = features[0];
                // Try feature.id first (set by promoteId), then fallback properties
                const fid = feature.id ?? feature.properties?.block_id ?? feature.properties?.GEOID;
                
                console.log('[QA] Click event:', {
                  featuresAtPoint: features.length,
                  clickedFeatureId: fid,
                  hasFeatureId: feature.id !== undefined,
                  hasBlockId: feature.properties?.block_id !== undefined,
                  hasGeoId: feature.properties?.GEOID !== undefined,
                  currentlySelected: selectedIds.has(String(fid))
                });
                
                if (fid === undefined || fid === null || fid === '') {
                  console.error('[QA] Feature has no valid ID! Cannot set feature state.');
                  console.error('[QA] Feature properties:', feature.properties);
                  return;
                }

                // Toggle ONLY this feature
                toggleFeature(fid);
                
                // QA: Verify no other features changed state
                if (features.length > 1) {
                  console.warn(`[QA] Multiple features (${features.length}) at click point - only toggling first`);
                }
              });

              map.current.on("sourcedata", (e) => {
                if (e.sourceId === LAYER_SOURCE && e.isSourceLoaded && selectedIds.size > 0) {
                  console.log('[QA] Source data loaded, reapplying selections');
                  reapplySelections();
                }
              });

              map.current.on("mouseenter", LAYER_ID, () => {
                if (map.current) map.current.getCanvas().style.cursor = "pointer";
              });

              map.current.on("mouseleave", LAYER_ID, () => {
                if (map.current) map.current.getCanvas().style.cursor = "";
              });
            }
            
            // Expose map debug info and helpers to window for troubleshooting
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
                  zoom: map.current.getZoom(),
                  selectedCount: selectedIds.size,
                  selectedIds: Array.from(selectedIds)
                };
              };
              
              // Expose helper functions for manual testing
              (window as any).mapHelpers = {
                selectAll: selectAllBlocks,
                clearAll: clearAllBlocks,
                invert: invertSelection,
                getSelectedIds: () => Array.from(selectedIds),
                getSelectedCount: () => selectedIds.size
              };
              
              console.log('[QA] Debug: Call window.debugMap() to inspect map state');
              console.log('[QA] Debug: Call window.mapHelpers for selection utilities');
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
      
      const fid = !isNaN(Number(blockId)) ? Number(blockId) : blockId;
      map.current.setFeatureState(
        { source: LAYER_SOURCE, sourceLayer: mapboxConfig.sourceLayer || "blocks", id: fid },
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
        const fid = !isNaN(Number(id)) ? Number(id) : id;
        map.current?.setFeatureState(
          { source: LAYER_SOURCE, sourceLayer: mapboxConfig.sourceLayer || "blocks", id: fid },
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
                {isLoadingNeighborhoods ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading Manhattan neighborhoods...
                  </div>
                ) : sortedNeighborhoods.length === 0 && availableNeighborhoods.length === 0 ? (
                  <EmptyState
                    icon={MapPin}
                    title="No neighborhoods available"
                    description="Unable to load neighborhood data"
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
                          // Try Manhattan neighborhoods first, fallback to borough-based
                          const manhattanNeighborhood = neighborhoodMap.get(id);
                          const fallbackNeighborhood = availableNeighborhoods.find((n) => n.id === id);
                          const neighborhood = manhattanNeighborhood || fallbackNeighborhood;
                          
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

                    {/* Manhattan Neighborhoods from NYC DCP NTA */}
                    {filteredManhattanNeighborhoods.length > 0 && (
                      <div className="space-y-3" data-testid="group-neighborhoods-manhattan-api">
                        <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                          <Layers className="h-4 w-4" />
                          Manhattan (NYC DCP Neighborhoods)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {filteredManhattanNeighborhoods.map((neighborhood) => (
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
                    )}

                    {/* Other Borough Neighborhoods (fallback for non-Manhattan) */}
                    {wizardState.selectedBoroughs.filter(id => id !== 'manhattan').map((boroughId) => {
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
                    {/* Mode Controls */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Selection Tools</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* Mode Toggle */}
                        <div className="flex gap-2">
                          <Button
                            variant={selectionMode === 'include' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleModeChange('include')}
                            className="flex-1"
                            data-testid="button-mode-include"
                          >
                            Include Mode
                          </Button>
                          <Button
                            variant={selectionMode === 'exclude' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleModeChange('exclude')}
                            className="flex-1"
                            data-testid="button-mode-exclude"
                          >
                            Exclude Mode
                          </Button>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleInvert}
                            className="flex-1"
                            data-testid="button-invert"
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Invert
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleClearAll}
                            className="flex-1"
                            data-testid="button-clear-all-blocks"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Clear All
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

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
