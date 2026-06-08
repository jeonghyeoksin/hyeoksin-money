interface Env {
  GEMINI_API_KEY?: string;
  ADMIN_KV?: any;
}

// GET: Check if Admin key is set (on Cloudflare Pages)
export const onRequestGet = async (context: any) => {
  try {
    let isSet = false;

    // 1. Check if GEMINI_API_KEY is in Cloudflare env variables
    if (context.env?.GEMINI_API_KEY) {
      isSet = true;
    }

    // 2. Check if ADMIN_KV is bound and has the key
    if (!isSet && context.env?.ADMIN_KV) {
      const kvKey = await context.env.ADMIN_KV.get('GEMINI_API_KEY');
      if (kvKey) {
        isSet = true;
      }
    }

    return new Response(JSON.stringify({ isSet }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

// POST: Set Admin key / Authenticate (on Cloudflare Pages)
export const onRequestPost = async (context: any) => {
  try {
    const request = context.request;
    const body: any = await request.json();
    const { apiKey, adminId, password } = body;

    // 1. Check credentials
    if (adminId !== 'info@nextin.ai.kr' || password !== 'nextin1234!') {
      return new Response(JSON.stringify({ error: '관리자 계정 정보가 일치하지 않습니다.' }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    let savedOnKV = false;

    // 2. Try to store in KV namespace if bound
    if (context.env?.ADMIN_KV) {
      await context.env.ADMIN_KV.put('GEMINI_API_KEY', apiKey || '');
      savedOnKV = true;
    }

    return new Response(JSON.stringify({ 
      success: true, 
      savedOnKV,
      message: savedOnKV 
        ? "API Key가 Cloudflare KV에 저장되었습니다." 
        : "인증에 성공했습니다. (Cloudflare Pages 환경에서는 KV 네임스페이스 바인딩이 필요하거나, 대시보드의 '환경 변수' 설정을 권장합니다.)"
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
