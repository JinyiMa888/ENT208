const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AI_API_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { resumeText, preferences } = await req.json();

    if (!resumeText) {
      return new Response(JSON.stringify({ error: "resumeText is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `你是一位专业的职业顾问。请分析以下简历内容，提取关键信息用于岗位匹配。

简历内容：
${resumeText}

用户偏好：
${preferences ? JSON.stringify(preferences) : "无特殊偏好"}

请严格按以下JSON格式返回分析结果：
{
  "profile": {
    "currentTitle": "当前职位",
    "skills": ["技能1", "技能2"],
    "experienceYears": 3,
    "education": "学历",
    "industries": ["行业1"],
    "summary": "一句话概括"
  },
  "matchCriteria": {
    "mustHaveSkills": ["必须匹配的技能"],
    "niceToHaveSkills": ["加分技能"],
    "preferredIndustries": ["适合的行业"],
    "suitableRoles": ["适合的岗位类型"],
    "salaryRange": {"min": 20000, "max": 50000}
  }
}`;

    const aiResponse = await fetch(AI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "你是专业职业顾问。只返回JSON格式结果。" },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) return new Response(JSON.stringify({ error: "请求过于频繁，请稍后重试" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "AI额度不足，请充值后重试" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "AI analysis failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiData = await aiResponse.json();
    const result = JSON.parse(aiData.choices?.[0]?.message?.content);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
