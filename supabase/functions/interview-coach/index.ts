import { corsHeaders } from '@supabase/supabase-js/cors'

const AI_API_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, resumeText, jobTitle, company, jobDescription, question, answer, conversationHistory } = await req.json();

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let prompt = "";
    let systemPrompt = "";

    if (action === "generate_questions") {
      systemPrompt = "你是专业面试官和职业顾问。只返回JSON格式结果。";
      prompt = `基于以下简历和目标岗位，预测最可能被追问的面试问题。

目标岗位：${jobTitle}
${company ? `目标公司：${company}` : ""}
${jobDescription ? `岗位描述：${jobDescription}` : ""}
${resumeText ? `简历内容：${resumeText}` : ""}

请生成15个面试问题，分为两类：
1. 基于简历薄弱项的追问（至少5个）
2. 该岗位的通用高频题（至少10个）

严格按JSON格式返回：
{
  "weaknessQuestions": [
    {
      "question": "面试问题",
      "category": "技能/经验/教育/项目",
      "difficulty": "easy/medium/hard",
      "why": "为什么会被问到这个问题",
      "framework": "STAR",
      "sampleAnswer": "基于简历内容的示例回答框架"
    }
  ],
  "commonQuestions": [
    {
      "question": "面试问题",
      "category": "行为/技术/情景/动机",
      "difficulty": "easy/medium/hard",
      "framework": "STAR/CAR/PAR",
      "sampleAnswer": "示例回答框架"
    }
  ]
}`;
    } else if (action === "evaluate_answer") {
      systemPrompt = "你是专业面试评估专家。只返回JSON格式结果。";
      prompt = `请评估以下面试回答的质量。

面试问题：${question}
目标岗位：${jobTitle}
用户回答：${answer}
${resumeText ? `简历背景：${resumeText.slice(0, 2000)}` : ""}

请从以下维度评分（0-100）并给出反馈：
{
  "overallScore": 75,
  "dimensions": {
    "keywordCoverage": {"score": 80, "feedback": "关键词覆盖情况"},
    "structureCompleteness": {"score": 70, "feedback": "回答结构是否完整（STAR等）"},
    "quantification": {"score": 60, "feedback": "是否有量化成果"},
    "relevance": {"score": 85, "feedback": "与问题的相关性"}
  },
  "strengths": ["回答中的亮点"],
  "improvements": ["需要改进的地方"],
  "improvedAnswer": "优化后的示例回答"
}`;
    } else if (action === "mock_interview") {
      systemPrompt = "你是一位专业面试官，正在面试候选人。请根据对话历史和岗位要求提出下一个问题或对回答进行追问。只返回JSON格式结果。";
      prompt = `目标岗位：${jobTitle}
${company ? `目标公司：${company}` : ""}
${resumeText ? `候选人简历：${resumeText.slice(0, 2000)}` : ""}

对话历史：
${conversationHistory ? JSON.stringify(conversationHistory) : "面试刚开始"}

${answer ? `候选人最新回答：${answer}` : "请开始面试"}

请返回：
{
  "response": "面试官的回应或追问（自然语言）",
  "nextQuestion": "下一个面试问题",
  "feedbackOnLastAnswer": ${answer ? '{"score": 75, "brief": "简短反馈"}' : 'null'},
  "interviewProgress": "beginning/middle/ending",
  "questionNumber": 1
}`;
    } else {
      return new Response(JSON.stringify({ error: "Invalid action. Use: generate_questions, evaluate_answer, mock_interview" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await fetch(AI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) return new Response(JSON.stringify({ error: "请求过于频繁" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "AI额度不足" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "AI failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
