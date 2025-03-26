import { useState } from 'react';
import { ApiSettings, Message } from '../types';

export const useApi = (apiSettings: ApiSettings, messageApi: any) => {
  const [loading, setLoading] = useState(false);

  const sendChatRequest = async (
    messages: { role: string; content: string }[],
    onChunkReceived: (content: string) => void
  ) => {
    setLoading(true);
    
    try {
      // 检查 API 设置是否完整
      if (!apiSettings.apiKey || !apiSettings.baseUrl || !apiSettings.model) {
        throw new Error('请先完成 API 设置');
      }
      
      // 准备请求体
      const requestBody = {
        model: apiSettings.model,
        messages,
        stream: true
      };
      
      // 发送 API 请求
      const response = await fetch(`${apiSettings.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiSettings.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || '请求失败');
      }
      
      // 处理流式响应
      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      
      if (!reader) {
        throw new Error('无法读取响应流');
      }
      
      let accumulatedContent = '';
      
      // 读取流式响应
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }
        
        // 解码二进制数据
        const chunk = decoder.decode(value, { stream: true });
        
        // 处理 SSE 格式的数据
        const lines = chunk
          .split('\n')
          .filter(line => line.trim() !== '' && line.trim() !== 'data: [DONE]');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonData = JSON.parse(line.substring(6));
              
              // 提取内容增量
              const contentDelta = jsonData.choices[0]?.delta?.content || '';
              
              // 累积内容
              accumulatedContent += contentDelta;
              
              // 调用回调函数
              onChunkReceived(accumulatedContent);
            } catch (e) {
              console.error('解析流式数据失败:', e);
            }
          }
        }
      }
      
      return accumulatedContent;
    } catch (error) {
      let errorMessage = '未知错误';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      messageApi.error(`请求失败: ${errorMessage}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    sendChatRequest
  };
}; 