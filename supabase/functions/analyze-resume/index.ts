import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.49.1/cors";

const OPENAI_API_URL = "https://api.lovable.dev/v1/chat/completions";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from token
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: userError } = await anonClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { filePath, jobTitle, company, jobDescription } = await req.json();

    if (!filePath || !jobTitle) {
      return new Response(JSON.stringify({ error: "filePath and jobTitle are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Download the resume file
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("resumes")
      .download(filePath);

    if (downloadError) {
      return new Response(JSON.stringify({ error: "Failed to download resume" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resumeText = await fileData.text();

    const prompt = `你是一位专业的简历优化顾问。请分析以下简历与目标职位的匹配度，并给出优化建议。

目标职位：${jobTitle}
${company ? `目标公司：${company}` : ""}
${jobDescription ? `职位描述：${jobDescription}` : ""}

简历内容：
${resumeText}

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

    // Save analysis to database
    await supabase.from("resume_analyses").insert({
      user_id: user.id,
      job_title: jobTitle,
      company: company || null,
      match_score: result.matchScore,
      dimensions: result.dimensions,
      suggestions: result.suggestions,
      optimized_content: result.optimizedContent,
      file_path: filePath,
    });

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
