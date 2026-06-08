import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Endpoint for generation
  app.post("/api/generate", async (req, res) => {
    try {
      const { prompt, clientApiKey, model = 'gemini-3-flash-preview' } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required." });
      }

      const keyToUse = clientApiKey || process.env.GEMINI_API_KEY;
      if (!keyToUse) {
        return res.status(400).json({ 
          error: "API Key가 설정되어 있지 않습니다. 개발자 설정 또는 직접 입력이 필요합니다." 
        });
      }

      const ai = new GoogleGenAI({ apiKey: keyToUse });
      
      let text = '';
      let aiResponse: any;
      let retries = 3;
      let delay = 2000;

      while (retries > 0) {
        try {
          aiResponse = await ai.models.generateContent({
            model: model,
            contents: prompt,
          });
          text = aiResponse.text || '결과를 생성하지 못했습니다.';
          break;
        } catch (err: any) {
          const errMsg = err instanceof Error ? err.message : String(err);
          if (errMsg.includes('503') || errMsg.includes('UNAVAILABLE') || errMsg.includes('high demand')) {
            retries--;
            if (retries === 0) {
              throw new Error('현재 AI 모델의 사용량이 매우 많아 일시적으로 접근이 어렵습니다. (503 High Demand) 잠시 후 다시 시도해주십시오.');
            }
            console.warn(`API error (503), retrying in ${delay}ms... (${3 - retries}/3)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 1.5;
          } else {
            throw err;
          }
        }
      }

      res.json({
        text,
        usageMetadata: aiResponse.usageMetadata || null
      });
    } catch (err: any) {
      console.error("Generation error:", err);
      res.status(500).json({ error: err.message || "Internal Server Error" });
    }
  });

  // Vite middleware for development or fallback static files for production
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
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
