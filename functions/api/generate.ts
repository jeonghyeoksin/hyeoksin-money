import { GoogleGenAI } from "@google/genai";

interface Env {
  GEMINI_API_KEY?: string;
}

export const onRequestPost = async (context: any) => {
  try {
    const request = context.request;
    const body: any = await request.json();
    const { prompt, clientApiKey, model = 'gemini-3-flash-preview' } = body;

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Cloudflare env 변수 사용
    const keyToUse = clientApiKey || context.env.GEMINI_API_KEY;
    if (!keyToUse) {
      return new Response(JSON.stringify({ 
        error: "API Key가 설정되어 있지 않습니다. Cloudflare 설정 또는 직접 입력이 필요합니다." 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
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
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 1.5;
        } else {
          throw err;
        }
      }
    }

    return new Response(JSON.stringify({
      text,
      usageMetadata: aiResponse.usageMetadata || null
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err: any) {
    console.error("Generation error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
