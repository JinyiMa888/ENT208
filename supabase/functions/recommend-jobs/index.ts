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
    const { resumeText, jobs, lang } = await req.json();
    const isEn = lang === "en";

    if (!resumeText) {
      return new Response(JSON.stringify({ error: "resumeText is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!Array.isArray(jobs) || jobs.length === 0) {
      return new Response(JSON.stringify({ error: "jobs array is required" }), {
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

    // 简化岗位描述以减少 token
    const jobsForPrompt = jobs.map((j: any) => ({
      id: j.id,
      title: j.job_title,
      company: j.company,
      skills: j.skills || [],
      exp: j.experience_years,
      edu: j.education,
      desc: (j.description || "").slice(0, 200),
      req: (j.requirements || "").slice(0, 300),
    }));

    const prompt = isEn ? `You are a professional resume-job match analyst. Use the SAME 5-dimension scoring as the deep match analysis (Skill / Experience / Education / Keywords / Expression) to evaluate each job below.

Resume:
${resumeText}

Jobs (${jobsForPrompt.length} total):
${JSON.stringify(jobsForPrompt, null, 2)}

Scoring rules:
- Each dimension 0-100. overallScore = weighted avg (skill 30% experience 25% education 15% keywords 20% expression 10%)
- Be strict and objective; align with the deep per-job match analysis
- matched/missing list at most 5 key skills from the job's skill list
- ALL text fields (matched, partial, missing) must be in ENGLISH

Return strictly in JSON:
{
  "results": [
    {
      "id": "job id",
      "overallScore": 75,
      "dimensions": {"skill": 80, "experience": 70, "education": 85, "keywords": 65, "expression": 75},
      "matched": ["matched skills"],
      "partial": ["partially related skills"],
      "missing": ["missing key skills"]
    }
  ]
}`
    : `你是专业简历匹配分析师。请用与"简历-岗位匹配分析"完全一致的5维度评分标准（技能匹配/经验匹配/教育背景/关键词覆盖/表述专业度），为下列每个岗位评估匹配度。

简历内容：
${resumeText}

岗位列表（共${jobsForPrompt.length}个）：
${JSON.stringify(jobsForPrompt, null, 2)}

评分要求：
- 每个维度0-100分，overallScore为5个维度的加权平均（技能30% 经验25% 教育15% 关键词20% 表述10%）
- 必须严格、客观，与单个岗位深度匹配分析的结果保持一致
- matched/missing只列举该岗位技能列表中的关键技能（最多5个）

严格按JSON返回：
{
  "results": [
    {
      "id": "岗位id",
      "overallScore": 75,
      "dimensions": {"skill": 80, "experience": 70, "education": 85, "keywords": 65, "expression": 75},
      "matched": ["匹配的技能"],
      "partial": ["部分相关技能"],
      "missing": ["缺失的关键技能"]
    }
  ]
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
          { role: "system", content: isEn ? "You are a professional resume-job match analyst. Return JSON only, in ENGLISH." : "你是专业简历匹配分析师，评分标准严格统一。只返回JSON格式结果。" },
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
