export interface Neighborhood {
  id: string;
  name: string;
  boroughId: string;
}

export interface Borough {
  id: string;
  name: string;
  neighborhoods: Neighborhood[];
}

export const boroughs: Borough[] = [
  {
    id: 'manhattan',
    name: 'Manhattan',
    neighborhoods: [
      { id: 'upper-west-side', name: 'Upper West Side', boroughId: 'manhattan' },
      { id: 'upper-east-side', name: 'Upper East Side', boroughId: 'manhattan' },
      { id: 'midtown', name: 'Midtown', boroughId: 'manhattan' },
      { id: 'chelsea', name: 'Chelsea', boroughId: 'manhattan' },
      { id: 'greenwich-village', name: 'Greenwich Village', boroughId: 'manhattan' },
      { id: 'soho', name: 'SoHo', boroughId: 'manhattan' },
      { id: 'lower-east-side', name: 'Lower East Side', boroughId: 'manhattan' },
      { id: 'financial-district', name: 'Financial District', boroughId: 'manhattan' },
    ],
  },
  {
    id: 'brooklyn',
    name: 'Brooklyn',
    neighborhoods: [
      { id: 'williamsburg', name: 'Williamsburg', boroughId: 'brooklyn' },
      { id: 'park-slope', name: 'Park Slope', boroughId: 'brooklyn' },
      { id: 'dumbo', name: 'DUMBO', boroughId: 'brooklyn' },
      { id: 'bushwick', name: 'Bushwick', boroughId: 'brooklyn' },
      { id: 'bedford-stuyvesant', name: 'Bedford-Stuyvesant', boroughId: 'brooklyn' },
      { id: 'greenpoint', name: 'Greenpoint', boroughId: 'brooklyn' },
    ],
  },
  {
    id: 'queens',
    name: 'Queens',
    neighborhoods: [
      { id: 'astoria', name: 'Astoria', boroughId: 'queens' },
      { id: 'long-island-city', name: 'Long Island City', boroughId: 'queens' },
      { id: 'flushing', name: 'Flushing', boroughId: 'queens' },
      { id: 'jackson-heights', name: 'Jackson Heights', boroughId: 'queens' },
      { id: 'forest-hills', name: 'Forest Hills', boroughId: 'queens' },
    ],
  },
  {
    id: 'bronx',
    name: 'Bronx',
    neighborhoods: [
      { id: 'riverdale', name: 'Riverdale', boroughId: 'bronx' },
      { id: 'fordham', name: 'Fordham', boroughId: 'bronx' },
      { id: 'hunts-point', name: 'Hunts Point', boroughId: 'bronx' },
      { id: 'mott-haven', name: 'Mott Haven', boroughId: 'bronx' },
    ],
  },
  {
    id: 'staten-island',
    name: 'Staten Island',
    neighborhoods: [
      { id: 'st-george', name: 'St. George', boroughId: 'staten-island' },
      { id: 'new-brighton', name: 'New Brighton', boroughId: 'staten-island' },
      { id: 'tottenville', name: 'Tottenville', boroughId: 'staten-island' },
      { id: 'great-kills', name: 'Great Kills', boroughId: 'staten-island' },
    ],
  },
];

export function getBoroughById(id: string): Borough | undefined {
  return boroughs.find((b) => b.id === id);
}

export function getNeighborhoodById(id: string): Neighborhood | undefined {
  for (const borough of boroughs) {
    const neighborhood = borough.neighborhoods.find((n) => n.id === id);
    if (neighborhood) return neighborhood;
  }
  return undefined;
}

export function getNeighborhoodsByBorough(boroughId: string): Neighborhood[] {
  const borough = getBoroughById(boroughId);
  return borough?.neighborhoods || [];
}
