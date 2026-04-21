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
    const { action, resumeText, jobTitle, company, jobDescription, question, answer, conversationHistory, lang } = await req.json();
    const isEn = lang === "en";

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
      systemPrompt = isEn
        ? "You are a professional interviewer and career coach. Return JSON only, in ENGLISH."
        : "你是专业面试官和职业顾问。只返回JSON格式结果，使用中文。";
      prompt = isEn ? `Based on the resume and target job, predict the most likely interview questions.

Target Position: ${jobTitle}
${company ? `Target Company: ${company}` : ""}
${jobDescription ? `Job Description: ${jobDescription}` : ""}
${resumeText ? `Resume: ${resumeText}` : ""}

Generate 15 interview questions in two groups:
1. Follow-ups based on resume weak spots (at least 5)
2. Common high-frequency questions for this role (at least 10)

ALL fields (question, category, why, framework, sampleAnswer) must be in ENGLISH.

Return strictly in JSON:
{
  "weaknessQuestions": [
    {"question": "...", "category": "Skill/Experience/Education/Project", "difficulty": "easy/medium/hard", "why": "why this would be asked", "framework": "STAR", "sampleAnswer": "sample answer framework based on resume"}
  ],
  "commonQuestions": [
    {"question": "...", "category": "Behavioral/Technical/Situational/Motivational", "difficulty": "easy/medium/hard", "framework": "STAR/CAR/PAR", "sampleAnswer": "sample answer framework"}
  ]
}`
      : `基于以下简历和目标岗位，预测最可能被追问的面试问题。

目标岗位：${jobTitle}
${company ? `目标公司：${company}` : ""}
${jobDescription ? `岗位描述：${jobDescription}` : ""}
${resumeText ? `简历内容：${resumeText}` : ""}

请生成15个面试问题，分为两类：
1. 基于简历薄弱项的追问（至少5个）
2. 该岗位的通用高频题（至少10个）

所有字段使用中文。严格按JSON格式返回：
{
  "weaknessQuestions": [
    {"question": "面试问题", "category": "技能/经验/教育/项目", "difficulty": "easy/medium/hard", "why": "为什么会被问到这个问题", "framework": "STAR", "sampleAnswer": "基于简历内容的示例回答框架"}
  ],
  "commonQuestions": [
    {"question": "面试问题", "category": "行为/技术/情景/动机", "difficulty": "easy/medium/hard", "framework": "STAR/CAR/PAR", "sampleAnswer": "示例回答框架"}
  ]
}`;
    } else if (action === "evaluate_answer") {
      systemPrompt = isEn
        ? "You are a professional interview evaluation expert. Return JSON only, in ENGLISH."
        : "你是专业面试评估专家。只返回JSON格式结果，使用中文。";
      prompt = isEn ? `Evaluate the interview answer below.

Question: ${question}
Target Position: ${jobTitle}
Candidate Answer: ${answer}
${resumeText ? `Resume: ${resumeText.slice(0, 2000)}` : ""}

Score across these dimensions (0-100) with feedback. ALL feedback in ENGLISH:
{
  "overallScore": 75,
  "dimensions": {
    "keywordCoverage": {"score": 80, "feedback": "..."},
    "structureCompleteness": {"score": 70, "feedback": "..."},
    "quantification": {"score": 60, "feedback": "..."},
    "relevance": {"score": 85, "feedback": "..."}
  },
  "strengths": ["..."],
  "improvements": ["..."],
  "improvedAnswer": "improved sample answer in English"
}`
      : `请评估以下面试回答的质量。

面试问题：${question}
目标岗位：${jobTitle}
用户回答：${answer}
${resumeText ? `简历背景：${resumeText.slice(0, 2000)}` : ""}

请从以下维度评分（0-100）并给出反馈，所有内容使用中文：
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
      systemPrompt = isEn
        ? "You are a professional interviewer conducting an interview. Based on dialog history and job requirements, ask the next question or follow up. Return JSON only, in ENGLISH."
        : "你是一位专业面试官，正在面试候选人。请根据对话历史和岗位要求提出下一个问题或对回答进行追问。只返回JSON格式结果，使用中文。";
      prompt = isEn ? `Target Position: ${jobTitle}
${company ? `Target Company: ${company}` : ""}
${resumeText ? `Candidate resume: ${resumeText.slice(0, 2000)}` : ""}

Dialog history:
${conversationHistory ? JSON.stringify(conversationHistory) : "Interview just started"}

${answer ? `Candidate's latest answer: ${answer}` : "Please start the interview"}

Return (all text in ENGLISH):
{
  "response": "interviewer reply or follow-up (natural language)",
  "nextQuestion": "next interview question",
  "feedbackOnLastAnswer": ${answer ? '{"score": 75, "brief": "short feedback"}' : 'null'},
  "interviewProgress": "beginning/middle/ending",
  "questionNumber": 1
}`
      : `目标岗位：${jobTitle}
${company ? `目标公司：${company}` : ""}
${resumeText ? `候选人简历：${resumeText.slice(0, 2000)}` : ""}

对话历史：
${conversationHistory ? JSON.stringify(conversationHistory) : "面试刚开始"}

${answer ? `候选人最新回答：${answer}` : "请开始面试"}

所有内容使用中文。请返回：
{
  "response": "面试官的回应或追问（自然语言）",
  "nextQuestion": "下一个面试问题",
  "feedbackOnLastAnswer": ${answer ? '{"score": 75, "brief": "简短反馈"}' : 'null'},
  "interviewProgress": "beginning/middle/ending",
  "questionNumber": 1
}`;
    } else if (action === "generate_report") {
      systemPrompt = isEn
        ? "You are a senior interview evaluation expert. Generate a comprehensive performance report from the interview transcript. Return JSON only, in ENGLISH."
        : "你是资深面试评估专家。请根据面试记录生成全面的面试表现报告。只返回JSON格式结果，使用中文。";
      prompt = isEn ? `Generate a complete interview performance report based on this mock interview record.

Target Position: ${jobTitle}
${company ? `Target Company: ${company}` : ""}
${resumeText ? `Candidate resume summary: ${resumeText.slice(0, 1500)}` : ""}

Q&A record:
${JSON.stringify(conversationHistory)}

ALL text fields in ENGLISH. Return strictly in JSON:
{
  "overallScore": 75,
  "overallComment": "overall assessment (3-4 sentences)",
  "dimensions": {
    "professionalKnowledge": {"score": 80, "comment": "..."},
    "communication": {"score": 70, "comment": "..."},
    "logicalThinking": {"score": 75, "comment": "..."},
    "stressHandling": {"score": 65, "comment": "..."},
    "jobFit": {"score": 80, "comment": "..."}
  },
  "strengths": ["highlight 1", "highlight 2", "highlight 3"],
  "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
  "questionReports": [
    {"question": "...", "userAnswer": "...", "score": 70, "analysis": "detailed analysis", "suggestedAnswer": "suggested high-quality answer (200+ chars)", "improvementTips": ["tip 1", "tip 2"]}
  ],
  "overallSuggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "nextSteps": ["next step 1", "next step 2"]
}`
      : `请根据以下模拟面试记录，生成一份完整的面试表现报告。

目标岗位：${jobTitle}
${company ? `目标公司：${company}` : ""}
${resumeText ? `候选人简历摘要：${resumeText.slice(0, 1500)}` : ""}

面试问答记录：
${JSON.stringify(conversationHistory)}

所有内容使用中文。请严格按以下JSON格式返回：
{
  "overallScore": 75,
  "overallComment": "对候选人整体面试表现的综合评价（3-4句话）",
  "dimensions": {
    "professionalKnowledge": {"score": 80, "comment": "专业知识掌握情况评价"},
    "communication": {"score": 70, "comment": "沟通表达能力评价"},
    "logicalThinking": {"score": 75, "comment": "逻辑思维能力评价"},
    "stressHandling": {"score": 65, "comment": "抗压与应变能力评价"},
    "jobFit": {"score": 80, "comment": "岗位匹配度评价"}
  },
  "strengths": ["亮点1", "亮点2", "亮点3"],
  "weaknesses": ["不足1", "不足2", "不足3"],
  "questionReports": [
    {"question": "面试问题", "userAnswer": "用户的回答", "score": 70, "analysis": "对回答的详细分析", "suggestedAnswer": "建议的优质回答（完整版，200字以上）", "improvementTips": ["改进建议1", "改进建议2"]}
  ],
  "overallSuggestions": ["整体改进建议1", "整体改进建议2", "整体改进建议3"],
  "nextSteps": ["下一步行动建议1", "下一步行动建议2"]
}`;
    } else {
      return new Response(JSON.stringify({ error: "Invalid action. Use: generate_questions, evaluate_answer, mock_interview, generate_report" }), {
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
      if (status === 429) return new Response(JSON.stringify({ error: isEn ? "Too many requests, try again later" : "请求过于频繁" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: isEn ? "AI credits exhausted" : "AI额度不足" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
