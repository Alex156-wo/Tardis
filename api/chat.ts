// api/chat.ts
import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node'; // 引入 Vercel 类型

// Vercel Serverless Function 入口
export default async function handler(req: VercelRequest, res: VercelResponse) {

  // --- 1. 设置 CORS 头，允许前端跨域调用 ---
  
  // 在生产环境中，建议将 '*' 替换为你的特定前端域名，以增强安全性。
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理预检请求 (OPTIONS)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 2. 从请求体中读取用户的 API Key 和 消息
    // 注意：req.body 在 Vercel Serverless Function 中通常是解析好的 JSON 对象
    const { apiKey, message, history } = req.body as { 
      apiKey?: string; 
      message?: string; 
      history?: { role: 'user' | 'model', parts: { text: string }[] }[] 
    };

    // 基本验证
    if (!apiKey) {
      return res.status(401).json({ error: 'API Key is required' });
    }
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // 3. 初始化 Google GenAI SDK，使用用户提供的 Key
    const ai = new GoogleGenAI({ apiKey: apiKey });

    // 准备发送给模型的内容
    let contents: { role: 'user' | 'model', parts: { text: string }[] }[] = [];
    
    // 如果有历史记录（history），将其格式化并添加到 contents
    if (history && Array.isArray(history)) {
      // 这里的 history 结构应该与 Gemini API 的 contents 结构兼容
      contents = [...history];
    }
    
    // 添加当前用户消息
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    // 4. 设置流式响应头
    // 浏览器会识别 'Transfer-Encoding: chunked' 并将内容视为流
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    // 5. 调用 Gemini 2.5 Flash 模型并启用流式传输
    const result = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: contents,
      // 可选：你可以在这里添加 config，比如 temperature
      config: {
        temperature: 0.7,
      }
    });

    // 6. 迭代流数据并写入响应
    for await (const chunk of result.stream) {
      // 获取当前块的文本内容
      const chunkText = chunk.text();
      if (chunkText) {
        // 将文本块直接写入 HTTP 响应流
        res.write(chunkText);
      }
    }

    // 结束响应
    res.end();

  } catch (error) {
    console.error('Gemini API Error:', error);
    
    // 如果响应流还没开始发送 (headersSent)，返回 JSON 错误
    if (!res.headersSent) {
      // TypeScript/Node.js Environment error handling
      const errorMessage = error instanceof Error ? error.message : 'Unknown proxy error';
      res.status(500).json({ 
        error: 'Internal Server Error', 
        details: errorMessage
      });
    } else {
      // 如果流已经开始，直接关闭流
      res.end(); 
    }
  }
}
