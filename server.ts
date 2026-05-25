import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import tutorHandler from "./api/tutor";
import hintHandler from "./api/hint";
import simulateHandler from "./api/simulate";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Inject body parser for API requests
  app.use(express.json());

  // Mount API Endpoints directly
  app.post("/api/tutor", async (req, res) => {
    try {
      await tutorHandler(req, res);
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Express /api/tutor error:", error);
      res.status(500).json({ error: "api_error", message: error?.message || "Internal server error" });
    }
  });

  app.post("/api/hint", async (req, res) => {
    try {
      await hintHandler(req, res);
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Express /api/hint error:", error);
      res.status(500).json({ error: "api_error", message: error?.message || "Internal server error" });
    }
  });

  app.post("/api/simulate", async (req, res) => {
    try {
      await simulateHandler(req, res);
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Express /api/simulate error:", error);
      res.status(500).json({ error: "api_error", message: error?.message || "Internal server error" });
    }
  });

  // Serve static files / Vite SPA middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
