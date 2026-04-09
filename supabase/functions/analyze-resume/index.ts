

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPENAI_API_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { resumeText, jobTitle, company, jobDescription } = await req.json();

    if (!resumeText || !jobTitle) {
      return new Response(JSON.stringify({ error: "resumeText and jobTitle are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `你是一位专业的简历优化顾问。请分析以下简历与目标职位的匹配度，并给出优化建议。

目标职位：${jobTitle}
${company ? `目标公司：${company}` : ""}
${jobDescription ? `职位描述：${jobDescription}` : ""}

简历内容：
${resumeText.substring(0, 8000)}

请严格按以下JSON格式返回分析结果（不要包含其他文字）：
{
  "matchScore": <0-100的整数>,
  "dimensions": [
    {"name": "技能匹配", "score": <0-100>},
    {"name": "经验匹配", "score": <0-100>},
    {"name": "教育背景", "score": <0-100>},
    {"name": "关键词覆盖", "score": <0-100>},
    {"name": "表述专业度", "score": <0-100>}
  ],
  "suggestions": [
    "具体的优化建议1",
    "具体的优化建议2",
    "具体的优化建议3",
    "具体的优化建议4",
    "具体的优化建议5"
  ],
  "optimizedContent": "优化后的完整简历内容，高亮标注修改部分用【】包裹"
}`;

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "你是专业简历优化顾问。请只返回JSON格式的分析结果。" },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI API error:", errText);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const resultText = aiData.choices?.[0]?.message?.content;

    let result;
    try {
      result = JSON.parse(resultText);
    } catch {
      return new Response(JSON.stringify({ error: "Failed to parse AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
