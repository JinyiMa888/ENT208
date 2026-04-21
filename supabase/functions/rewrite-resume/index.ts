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
    const { resumeText, jobDescription, jobTitle, style, matchAnalysis, lang } = await req.json();
    const isEn = lang === "en";

    if (!resumeText || !jobTitle) {
      return new Response(JSON.stringify({ error: "resumeText and jobTitle are required" }), {
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

    const styleDescZh: Record<string, string> = {
      "achievement": "成果导向：强调量化成果和具体贡献，用数字和百分比展示影响力",
      "responsibility": "职责导向：清晰展示岗位职责和工作范围，突出管理能力和团队贡献",
      "data-driven": "数据驱动：以数据为核心叙述，每条经历都包含可衡量的指标和KPI"
    };
    const styleDescEn: Record<string, string> = {
      "achievement": "Achievement-driven: emphasize quantified results and concrete contributions, use numbers and percentages",
      "responsibility": "Responsibility-driven: clearly present job duties and scope, highlight management and team contributions",
      "data-driven": "Data-driven: center every experience around measurable metrics and KPIs"
    };
    const styleDescriptions = isEn ? styleDescEn : styleDescZh;

    const selectedStyle = styleDescriptions[style] || styleDescriptions["achievement"];

    const prompt = isEn ? `You are a professional resume rewriting expert. Rewrite the user's resume to fit the target job.

Target Position: ${jobTitle}
Style: ${selectedStyle}

${jobDescription ? `Job Description:\n${jobDescription}` : ""}
${matchAnalysis ? `Match analysis (focus on missing items):\n${JSON.stringify(matchAnalysis)}` : ""}

Original Resume:
${resumeText}

IMPORTANT: ALL output text (rewrittenContent, changes, reasons, keywords, tips) MUST be in ENGLISH. Translate Chinese resume content to English if needed.

Return strictly in JSON:
{
  "rewrittenContent": "the full rewritten resume in English",
  "changes": [
    {"original": "original text", "rewritten": "rewritten text", "reason": "why it was changed", "type": "keyword_add | rephrase | new_point | remove"}
  ],
  "addedKeywords": ["added keywords"],
  "estimatedScoreImprovement": 15,
  "tips": ["extra optimization tips"]
}`
    : `你是一位专业的简历改写专家。请根据目标岗位要求，改写用户的简历。

目标岗位：${jobTitle}
改写风格：${selectedStyle}

${jobDescription ? `岗位描述：\n${jobDescription}` : ""}
${matchAnalysis ? `匹配分析（重点改进缺失项）：\n${JSON.stringify(matchAnalysis)}` : ""}

原始简历：
${resumeText}

所有输出文本必须使用中文。请严格按以下JSON格式返回：
{
  "rewrittenContent": "改写后的完整简历内容",
  "changes": [
    {"original": "原始文本", "rewritten": "改写后的文本", "reason": "改写原因", "type": "keyword_add | rephrase | new_point | remove"}
  ],
  "addedKeywords": ["新增的关键词列表"],
  "estimatedScoreImprovement": 15,
  "tips": ["额外的优化建议"]
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
          { role: "system", content: isEn ? "You are a professional resume rewriting expert. Return JSON only, in ENGLISH." : "你是专业简历改写专家。只返回JSON格式结果，使用中文。" },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) return new Response(JSON.stringify({ error: "请求过于频繁" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "AI额度不足" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "AI rewrite failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
