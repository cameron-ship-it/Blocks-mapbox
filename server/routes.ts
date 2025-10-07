import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Mapbox configuration endpoint
  app.get("/api/mapbox-config", (_req, res) => {
    const config = {
      token: process.env.MAPBOX_TOKEN || "",
      tilesUrl: process.env.MAPBOX_TILES_URL || "",
      sourceLayer: process.env.MAPBOX_SOURCE_LAYER || ""
    };
    res.json(config);
  });

  const httpServer = createServer(app);

  return httpServer;
}
