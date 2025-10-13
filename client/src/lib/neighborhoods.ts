import * as turf from '@turf/turf';
import type { Feature, FeatureCollection, Polygon, MultiPolygon, BBox } from 'geojson';

export interface NeighborhoodProperties {
  nta2020?: string;  // 2020 NTA code
  ntaname?: string;  // Neighborhood name
  borocode?: string | number;  // Borough code
  boroname?: string;  // Borough name
  ntaabbrev?: string;  // NTA abbreviation
  ntatype?: string;  // NTA type
  cdta2020?: string;  // Community District code
  cdtaname?: string;  // Community District name
  [key: string]: any;
}

export type NeighborhoodFeature = Feature<Polygon | MultiPolygon, NeighborhoodProperties>;

export interface NeighborhoodData {
  id: string;
  name: string;
  slug: string;
  bbox: BBox;
  feature: NeighborhoodFeature;
  geometry: Polygon | MultiPolygon;
}

export type NeighborhoodsGeoJSON = FeatureCollection<Polygon | MultiPolygon, NeighborhoodProperties>;

/**
 * Fetch NYC DCP Neighborhood Tabulation Areas for Manhattan
 * Dataset: 2020 Neighborhood Tabulation Areas (NTAs)
 * ID: 9nt8-h7nd
 */
export async function fetchManhattanNeighborhoods(): Promise<NeighborhoodsGeoJSON> {
  const url = 'https://data.cityofnewyork.us/resource/9nt8-h7nd.geojson?borocode=1&$limit=500';
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch neighborhoods: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Fetched Manhattan neighborhoods:', data.features?.length, 'features');
    return data as NeighborhoodsGeoJSON;
  } catch (error) {
    console.error('Error fetching Manhattan neighborhoods:', error);
    // Return empty FeatureCollection on error
    return {
      type: 'FeatureCollection',
      features: []
    };
  }
}

/**
 * Process neighborhood GeoJSON into structured data
 */
export function processNeighborhoods(geojson: NeighborhoodsGeoJSON): Map<string, NeighborhoodData> {
  const neighborhoodMap = new Map<string, NeighborhoodData>();

  geojson.features.forEach((feature) => {
    // Extract properties using 2020 NTA field names
    const ntaCode = feature.properties.nta2020 || '';
    const ntaName = feature.properties.ntaname || '';
    
    if (!ntaCode || !ntaName) {
      console.warn('Skipping feature without NTA code or name:', feature.properties);
      return;
    }

    // Create slug from name
    const slug = ntaName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Compute bbox for this feature
    const bbox = turf.bbox(feature);

    neighborhoodMap.set(ntaCode, {
      id: ntaCode,
      name: ntaName,
      slug,
      bbox,
      feature,
      geometry: feature.geometry
    });
  });

  console.log('Processed neighborhoods:', neighborhoodMap.size);
  return neighborhoodMap;
}

/**
 * Get alphabetically sorted neighborhood list
 */
export function getSortedNeighborhoods(neighborhoodMap: Map<string, NeighborhoodData>): NeighborhoodData[] {
  return Array.from(neighborhoodMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Compute combined bbox for selected neighborhoods
 */
export function computeCombinedBbox(
  neighborhoodIds: string[],
  neighborhoodMap: Map<string, NeighborhoodData>
): BBox | null {
  const features = neighborhoodIds
    .map(id => neighborhoodMap.get(id)?.feature)
    .filter((f): f is NeighborhoodFeature => f !== undefined);

  if (features.length === 0) {
    return null;
  }

  const featureCollection = turf.featureCollection(features);

  return turf.bbox(featureCollection);
}

/**
 * Group neighborhoods alphabetically by first letter
 */
export function groupNeighborhoodsByLetter(neighborhoods: NeighborhoodData[]): Record<string, NeighborhoodData[]> {
  const groups: Record<string, NeighborhoodData[]> = {};
  
  neighborhoods.forEach(neighborhood => {
    const firstLetter = neighborhood.name.charAt(0).toUpperCase();
    if (!groups[firstLetter]) {
      groups[firstLetter] = [];
    }
    groups[firstLetter].push(neighborhood);
  });
  
  return groups;
}
