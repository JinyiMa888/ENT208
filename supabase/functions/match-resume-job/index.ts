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
    const { resumeText, jobDescription, jobTitle, company, lang } = await req.json();
    const isEn = lang === "en";

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

    const prompt = isEn ? `You are a professional resume-job matching analyst. Analyze the resume against job requirements sentence by sentence.

Target Position: ${jobTitle || "Unspecified"}
Target Company: ${company || "Unspecified"}

Job Description / Requirements:
${jobDescription}

Resume Content:
${resumeText}

IMPORTANT: ALL output text (dimension names, details, comments, suggestions, keywords, sentences) MUST be in ENGLISH. If resume content is in Chinese, translate to English in your output.

Return strictly in this JSON format:
{
  "overallScore": 75,
  "dimensions": [
    {"name": "Skill Match", "score": 80, "detail": "explanation"},
    {"name": "Experience Match", "score": 70, "detail": "explanation"},
    {"name": "Education", "score": 85, "detail": "explanation"},
    {"name": "Keyword Coverage", "score": 65, "detail": "explanation"},
    {"name": "Expression Professionalism", "score": 75, "detail": "explanation"}
  ],
  "sentenceAnalysis": [
    {"resumeSentence": "a sentence from resume (in English)", "status": "match", "relatedRequirement": "the related JD requirement (in English)", "comment": "match explanation (in English)"}
  ],
  "missingItems": [
    {"requirement": "missing requirement (in English)", "importance": "high", "suggestion": "how to supplement (in English)"}
  ],
  "keywords": {"matched": ["matched keywords"], "missing": ["missing keywords"], "extra": ["extra keywords"]}
}

status values: "match", "partial", "missing". importance values: "high", "medium", "low".`
    : `你是一位专业的简历匹配分析师。请逐句分析简历与岗位要求的匹配情况。

目标岗位：${jobTitle || "未指定"}
目标公司：${company || "未指定"}

岗位描述/要求：
${jobDescription}

简历内容：
${resumeText}

重要：所有输出文本（维度名、说明、评论、建议、关键词、句子）必须使用中文。

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
    {"resumeSentence": "简历中的一句话", "status": "match", "relatedRequirement": "对应的岗位要求", "comment": "匹配说明"}
  ],
  "missingItems": [
    {"requirement": "JD中要求但简历缺失的内容", "importance": "high", "suggestion": "建议如何补充"}
  ],
  "keywords": {"matched": ["已匹配的关键词"], "missing": ["缺失的关键词"], "extra": ["简历中有但JD没要求的关键词"]}
}

status只能是: "match", "partial", "missing"。importance只能是: "high", "medium", "low"。`;

    const aiResponse = await fetch(AI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: isEn ? "You are a professional resume-job match analyst. Return JSON only, in ENGLISH." : "你是专业简历匹配分析师。只返回JSON格式结果，使用中文。" },
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
