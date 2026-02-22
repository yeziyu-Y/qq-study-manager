// Mock implementation for Gemini services
// No API key required

export async function searchFiles(query: string, files: any[]) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log(`[Mock Search] Query: "${query}"`);

  // Return static mock data based on query keywords or just generic results
  if (query.includes("四级") || query.includes("英语")) {
    return [
      {
        fileId: "1",
        fileName: "2026四级词汇大纲_校对版.pdf",
        snippet: "四级考试核心词汇包括... (此处为模拟搜索结果片段)",
        pageNumber: 5,
        relevance: 0.95
      },
      {
        fileId: "2",
        fileName: "四级作文万能模板汇总.pdf",
        snippet: "作文模板第一段通常用于引出话题... (此处为模拟搜索结果片段)",
        pageNumber: 2,
        relevance: 0.88
      }
    ];
  } else if (query.includes("宿舍") || query.includes("值日")) {
    return [
      {
        fileId: "4",
        fileName: "宿舍卫生值日表.xlsx",
        snippet: "本周值日生安排如下... (此处为模拟搜索结果片段)",
        pageNumber: 1,
        relevance: 0.92
      }
    ];
  }

  // Default fallback
  return [
    {
      fileId: "1",
      fileName: "2026四级词汇大纲_校对版.pdf",
      snippet: "相关内容片段... (模拟数据)",
      pageNumber: 3,
      relevance: 0.8
    }
  ];
}

export async function generateMicroTasks(fileContent: string, fileName: string) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  console.log(`[Mock Tasks] Generating tasks for file: "${fileName}"`);

  // Return static mock questions
  return [
    {
      question: "根据文件内容，该文档的主要目的是什么？",
      type: "choice",
      options: ["提供复习资料", "通知考试时间", "安排值日表", "记录会议纪要"],
      answer: "提供复习资料",
      evidencePage: 1
    },
    {
      question: "文中提到的核心概念是______。",
      type: "fill",
      answer: "词汇记忆",
      evidencePage: 5
    },
    {
      question: "该文件是否包含历年真题解析？",
      type: "boolean",
      answer: "是",
      evidencePage: 12
    }
  ];
}
