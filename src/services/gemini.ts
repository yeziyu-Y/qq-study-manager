import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function searchFiles(query: string, files: any[]) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `你是一个学习资料管家。基于以下文件列表和内容片段，回答用户的搜索请求 "${query}"。
    如果找到匹配内容，请返回证据片段（约50字）和所在页码。
    
    文件列表:
    ${JSON.stringify(files)}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            fileId: { type: Type.STRING },
            fileName: { type: Type.STRING },
            snippet: { type: Type.STRING },
            pageNumber: { type: Type.INTEGER },
            relevance: { type: Type.NUMBER }
          },
          required: ["fileId", "fileName", "snippet", "pageNumber"]
        }
      }
    }
  });

  return JSON.parse(response.text || "[]");
}

export async function generateMicroTasks(fileContent: string, fileName: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `基于文件 "${fileName}" 的内容: "${fileContent}"，生成3道复习题目。
    题型包括选择、填空或判断。每道题必须注明源自哪一页（随机模拟一个页码）。`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            type: { type: Type.STRING, description: "choice, fill, or boolean" },
            options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "仅对选择题有效" },
            answer: { type: Type.STRING },
            evidencePage: { type: Type.INTEGER }
          },
          required: ["question", "type", "answer", "evidencePage"]
        }
      }
    }
  });

  return JSON.parse(response.text || "[]");
}
