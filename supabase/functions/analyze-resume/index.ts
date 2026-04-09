import { extractText } from "https://esm.sh/unpdf@0.12.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AI_API_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

// Simple DOCX text extraction without external library
// DOCX is a ZIP file containing XML; we extract text from word/document.xml
async function extractDocxText(bytes: Uint8Array): Promise<string> {
  // Use DecompressionStream to unzip
  // DOCX files are ZIP archives. We'll find document.xml and extract text from XML tags
  const { default: JSZip } = await import("https://esm.sh/jszip@3.10.1");
  
  const zip = await JSZip.loadAsync(bytes);
  const docXml = await zip.file("word/document.xml")?.async("string");
  
  if (!docXml) {
    throw new Error("Invalid DOCX file: missing word/document.xml");
  }
  
  // Extract text content from XML by removing all tags
  const text = docXml
    .replace(/<w:br[^>]*\/>/g, "\n")  // line breaks
    .replace(/<\/w:p>/g, "\n")         // paragraph breaks
    .replace(/<[^>]+>/g, "")           // remove all XML tags
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\n{3,}/g, "\n\n")        // collapse multiple newlines
    .trim();
  
  return text;
}

async function extractResumeText(fileBase64: string, fileName: string): Promise<string> {
  const binaryString = atob(fileBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const ext = fileName.split(".").pop()?.toLowerCase() || "";

  if (ext === "pdf") {
    const { text } = await extractText(bytes, { mergePages: true });
    return text.slice(0, 40000);
  } else if (ext === "docx" || ext === "doc") {
    const text = await extractDocxText(bytes);
    return text.slice(0, 40000);
  } else if (ext === "txt") {
    return new TextDecoder().decode(bytes).slice(0, 40000);
  } else {
    throw new Error(`不支持的文件格式: ${ext}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { fileBase64, fileName, jobTitle, company, jobDescription } = await req.json();

    if (!fileBase64 || !fileName || !jobTitle) {
      return new Response(JSON.stringify({ error: "fileBase64, fileName and jobTitle are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Extracting text from: ${fileName}`);
    const resumeText = await extractResumeText(fileBase64, fileName);
    console.log(`Extracted ${resumeText.length} characters`);

    if (!resumeText || resumeText.trim().length < 10) {
      return new Response(JSON.stringify({ error: "无法从文件中提取文本内容，请确认文件格式正确" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    const aiResponse = await fetch(AI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
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
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "请求过于频繁，请稍后重试" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI 额度不足，请充值后重试" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
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
      console.error("Failed to parse AI response:", resultText);
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
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
