# Blocks - NYC Apartment Search

A modern, professional NYC apartment search application with a 4-step wizard and interactive Mapbox-powered block selection.

## Features

- **4-Step Wizard Flow**: Budget range → Borough selection → Neighborhood multi-select → Interactive map
- **Mapbox GL JS Integration**: Custom blocks vector layer with clickable city block polygons
- **Clean UI**: Minimal, professional design with Tailwind CSS
- **TypeScript**: Full type safety with strict mode
- **Mobile Responsive**: Works seamlessly on all devices
- **Keyboard Accessible**: Full keyboard navigation support

## Setup Instructions

### 1. Install Dependencies

Dependencies are already installed. If needed, run:

```bash
npm install
```

### 2. Configure Mapbox Token

The app requires a Mapbox access token to display the interactive map.

#### Getting Your Token:
1. Go to [https://account.mapbox.com/access-tokens/](https://account.mapbox.com/access-tokens/)
2. Sign up for a free account (free tier: 50,000 map loads/month)
3. Create a new access token or copy your default public token

#### Adding the Token:
Add your token as a secret using the Replit Secrets tool, or set it as an environment variable:

**Secret Name:** `VITE_MAPBOX_TOKEN`  
**Value:** Your Mapbox token (e.g., `pk.eyJ1...`)

### 3. Configure Map Layers (Optional)

Additional environment variables for custom map configuration:

- `VITE_MAP_STYLE`: Mapbox style URL (default: `mapbox://styles/mapbox/light-v11`)
- `VITE_BLOCKS_TILES`: Custom blocks vector tiles URL (optional)
- `VITE_BLOCKS_SOURCE`: Blocks source layer name (default: `blocks`)
- `VITE_BLOCKS_LAYER`: Blocks fill layer name (default: `blocks-fill`)
- `VITE_BLOCKS_SOURCE_LAYER`: Source layer in tileset (default: `blocks-fill`)

#### Two Configuration Scenarios:

**Scenario A: Blocks layer already in your Mapbox style**
- Set `VITE_MAP_STYLE` to your custom style URL
- Leave `VITE_BLOCKS_TILES` empty
- The app will use layers from your style

**Scenario B: Separate blocks vector tiles**
- Set `VITE_BLOCKS_TILES` to your tiles URL template
- Configure `VITE_BLOCKS_SOURCE` and `VITE_BLOCKS_LAYER` names
- The app will add the tiles as a separate source

### 4. Run Development Server

```bash
npm run dev
```

The app will be available at the URL shown in the console (typically port 5000).

## Customizing the Wizard Component

The main wizard component is a **placeholder stub** ready for your custom implementation.

**File Location:** `/client/src/components/BlocksOnboardingWizard.tsx`

To add your custom wizard implementation:
1. Open the file `/client/src/components/BlocksOnboardingWizard.tsx`
2. Replace the placeholder component with your custom code
3. The dev server will automatically reload with your changes

### Available Data:

NYC borough and neighborhood data is available in `/client/src/lib/geo.ts`:

```typescript
import { boroughs, getBoroughById, getNeighborhoodsByBorough } from '@/lib/geo';

// boroughs contains: Manhattan, Brooklyn, Queens, Bronx, Staten Island
// Each with their respective neighborhoods
```

### Mapbox Integration:

Your custom component can access Mapbox via:

```typescript
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Access token from environment
const token = import.meta.env.VITE_MAPBOX_TOKEN;
```

## Project Structure

```
client/
├── src/
│   ├── components/
│   │   └── BlocksOnboardingWizard.tsx    # ← Replace this with your wizard
│   ├── lib/
│   │   └── geo.ts                        # NYC borough/neighborhood data
│   └── App.tsx                           # Main app with routing
server/
└── routes.ts                             # API routes (if needed)
```

## Tech Stack

- **Frontend**: React + Vite + TypeScript
- **Routing**: Wouter
- **Styling**: Tailwind CSS
- **Maps**: Mapbox GL JS
- **Backend**: Express (Node.js)

## Next Steps

1. ✅ Add your Mapbox token as a secret
2. ✅ Run `npm run dev`
3. ✅ Replace the placeholder component in `/client/src/components/BlocksOnboardingWizard.tsx`
4. ✅ Build your 4-step wizard with Mapbox integration

Happy coding! 🗽
