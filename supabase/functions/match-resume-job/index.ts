import { corsHeaders } from '@supabase/supabase-js/cors'

const AI_API_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { resumeText, jobDescription, jobTitle, company } = await req.json();

    if (!resumeText || !jobDescription) {
      return new Response(JSON.stringify({ error: "resumeText and jobDescription are required" }), {
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

    const prompt = `你是一位专业的简历匹配分析师。请逐句分析简历与岗位要求的匹配情况。

目标岗位：${jobTitle || "未指定"}
目标公司：${company || "未指定"}

岗位描述/要求：
${jobDescription}

简历内容：
${resumeText}

请严格按以下JSON格式返回：
{
  "overallScore": 75,
  "dimensions": [
    {"name": "技能匹配", "score": 80, "detail": "说明"},
    {"name": "经验匹配", "score": 70, "detail": "说明"},
    {"name": "教育背景", "score": 85, "detail": "说明"},
    {"name": "关键词覆盖", "score": 65, "detail": "说明"},
    {"name": "表述专业度", "score": 75, "detail": "说明"}
  ],
  "sentenceAnalysis": [
    {
      "resumeSentence": "简历中的一句话",
      "status": "match",
      "relatedRequirement": "对应的岗位要求",
      "comment": "匹配说明"
    }
  ],
  "missingItems": [
    {
      "requirement": "JD中要求但简历缺失的内容",
      "importance": "high",
      "suggestion": "建议如何补充"
    }
  ],
  "keywords": {
    "matched": ["已匹配的关键词"],
    "missing": ["缺失的关键词"],
    "extra": ["简历中有但JD没要求的关键词"]
  }
}

sentenceAnalysis中的status只能是: "match"(绿色匹配), "partial"(橙色部分匹配), "missing"(红色缺失)
missingItems中的importance只能是: "high", "medium", "low"`;

    const aiResponse = await fetch(AI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "你是专业简历匹配分析师。只返回JSON格式结果。" },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) return new Response(JSON.stringify({ error: "请求过于频繁，请稍后重试" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "AI额度不足" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
