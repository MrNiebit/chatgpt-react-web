import { useState, useRef, useEffect } from 'react'
import { Input, Button, Avatar, Spin, Typography, List, Modal, Form, Select, message } from 'antd'
import { 
  UserOutlined, 
  RobotOutlined, 
  PlusOutlined,
  ReloadOutlined,
  SettingOutlined,
  DeleteOutlined,
  FullscreenOutlined,
  EditOutlined,
  BulbOutlined,
  BulbFilled,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons'
import ReactMarkdown from 'react-markdown'
import { Conversation, Message, ApiSettings, StreamResponse } from './types'

const { TextArea } = Input
const { Title, Paragraph, Text } = Typography
const { Option } = Select

// 添加防抖函数
const useDebounce = (value: any, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

function App() {
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: '1',
      title: '闲聊',
      messages: [],
      lastUpdated: new Date('2024/12/28 17:56:33')
    }
  ]);
  const [messageApi, contextHolder] = message.useMessage();
  const [activeConversation, setActiveConversation] = useState<string>('1');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 添加设置相关状态
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [apiSettings, setApiSettings] = useState<ApiSettings>({
    baseUrl: import.meta.env.VITE_OPENAI_API_BASE,
    model: import.meta.env.VITE_OPENAI_API_MODEL,
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    temperature: import.meta.env.VITE_OPENAI_API_TEMPERATURE,
  });
  const [form] = Form.useForm();
  
  // 添加流式响应状态
  // const [streamingMessage, setStreamingMessage] = useState<Message | null>(null);
  
  // 添加全屏状态
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 在App组件中添加
  const [darkMode, setDarkMode] = useState(false);

  // 添加响应式状态
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sidebarVisible, setSidebarVisible] = useState(!isMobile);

  // 在 App 组件顶部添加 messagesRef
  const messagesRef = useRef<Message[]>([]);

  // 在 useEffect 中更新 ref
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarVisible(true);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 添加新的 useEffect 来处理会话切换
  useEffect(() => {
    // 当 activeConversation 变化时，加载对应会话的消息
    const currentConversation = conversations.find(conv => conv.id === activeConversation);
    if (currentConversation) {
      setMessages(currentConversation.messages);
    }
  }, [activeConversation, conversations]);

  // 确保在组件挂载时加载数据
  useEffect(() => {
    // 初始化时从本地存储加载数据
    const savedConversations = localStorage.getItem('conversations');
    const savedSettings = localStorage.getItem('apiSettings');
    
    if (savedConversations) {
      try {
        // 需要将字符串日期转换回Date对象
        const parsed = JSON.parse(savedConversations, (key, value) => {
          if (key === 'lastUpdated' || key === 'timestamp') {
            return new Date(value);
          }
          return value;
        });
        
        if (Array.isArray(parsed) && parsed.length > 0) {
          setConversations(parsed);
          // 设置活动会话为第一个
          setActiveConversation(parsed[0].id);
          // 加载第一个会话的消息
          setMessages(parsed[0].messages || []);
          
          // 显示加载成功消息
          messageApi.success('已从本地存储加载会话');
        }
      } catch (e) {
        console.error('Failed to parse saved conversations:', e);
        messageApi.error('加载会话失败');
      }
    }
    
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        if (parsedSettings) {
          setApiSettings(parsedSettings);
        }
      } catch (e) {
        console.error('Failed to parse saved settings:', e);
      }
    }
  }, []);

  // 确保在conversations变化时保存到本地存储
  useEffect(() => {
    if (conversations.length > 0) {
      try {
        localStorage.setItem('conversations', JSON.stringify(conversations));
        console.log('会话已保存到本地存储', conversations);
      } catch (e) {
        console.error('保存会话到本地存储失败:', e);
      }
    }
  }, [conversations]);

  // 确保在apiSettings变化时保存到本地存储
  useEffect(() => {
    try {
      localStorage.setItem('apiSettings', JSON.stringify(apiSettings));
    } catch (e) {
      console.error('保存API设置到本地存储失败:', e);
    }
  }, [apiSettings]);

  // 在App组件内使用
//   const debouncedConversations = useDebounce(conversations, 500);

  // 改进错误处理函数
  const handleApiError = (error: unknown) => {
    console.error('API 请求失败:', error);
    
    let errorMessage = '未知错误';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String((error as any).message);
    }
    
    messageApi.error(`请求失败: ${errorMessage}`);
    
    // 返回错误信息，方便调用者处理
    return errorMessage;
  };

  // 添加消息处理函数
  const addMessage = (newMessage: Message) => {
    // 更新本地消息
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    
    // 同时更新 conversations 中的消息记录
    setConversations(prev => 
      prev.map(conv => 
        conv.id === activeConversation 
          ? { 
              ...conv, 
              messages: updatedMessages,
              lastUpdated: new Date()
            } 
          : conv
      )
    );
    
    return updatedMessages;
  };

  // 更新会话消息
  const updateConversationMessages = (updatedMessages: Message[]) => {
    setConversations(prev => 
      prev.map(conv => 
        conv.id === activeConversation 
          ? { 
              ...conv, 
              messages: updatedMessages,
              lastUpdated: new Date()
            } 
          : conv
      )
    );
  };

  // 修改 sendMessage 函数
  const sendMessage = async () => {
    if (!input.trim()) return;
    
    // 检查 API 设置
    if (!apiSettings.apiKey || !apiSettings.baseUrl || !apiSettings.model) {
      messageApi.error('请先完成 API 设置');
      openSettings();
      return;
    }
    
    // 添加用户消息
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date()
    };
    
    const updatedMessages = addMessage(userMessage);
    setInput('');
    setLoading(true);
    
    // 创建一个空的助手消息
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      content: '',
      role: 'assistant',
      timestamp: new Date()
    };
    
    // 添加助手消息
    addMessage(assistantMessage);
    
    try {
      // 准备请求体，遵循 OpenAI API 格式
      const requestBody = {
        model: apiSettings.model,
        messages: updatedMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
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
              const jsonData = JSON.parse(line.substring(6)) as StreamResponse;
              
              // 提取内容增量
              const contentDelta = jsonData.choices[0]?.delta?.content || '';
              
              // 累积内容
              accumulatedContent += contentDelta;
              
              // 更新消息内容
              const updatedMessages = messagesRef.current.map(msg => 
                msg.id === assistantMessageId
                  ? { ...msg, content: accumulatedContent }
                  : msg
              );
              
              // 更新本地消息状态
              setMessages(updatedMessages);
              
              // 更新 conversations 状态
              setConversations(prev => 
                prev.map(conv => 
                  conv.id === activeConversation 
                    ? { 
                        ...conv, 
                        messages: updatedMessages,
                        lastUpdated: new Date()
                      } 
                    : conv
                )
              );
            } catch (e) {
              console.error('解析流式数据失败:', e);
            }
          }
        }
      }
      
    } catch (error) {
      const errorMessage = handleApiError(error);
      
      // 移除失败的助手消息
      const messagesWithoutFailed = messagesRef.current.filter(msg => msg.id !== assistantMessageId);
      setMessages(messagesWithoutFailed);
      
      // 同时更新 conversations 中的消息记录
      setConversations(prev => 
        prev.map(conv => 
          conv.id === activeConversation 
            ? { 
                ...conv, 
                messages: messagesWithoutFailed,
                // 可以选择添加错误信息到会话中
                error: errorMessage
              } 
            : conv
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const createNewChat = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: '新对话',
      messages: [],
      lastUpdated: new Date()
    };
    
    setConversations(prev => [newConversation, ...prev]);
    setActiveConversation(newConversation.id);
    setMessages([]);
  };

  const selectConversation = (id: string) => {
    setActiveConversation(id);
    // 不需要在这里设置消息，因为 useEffect 会处理
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  // 打开设置模态框
  const openSettings = () => {
    form.setFieldsValue(apiSettings);
    setSettingsVisible(true);
  };

  // 保存设置
  const saveSettings = () => {
    form.validateFields().then(values => {
      setApiSettings(values);
      setSettingsVisible(false);
      // 在实际应用中，可能需要将设置保存到 localStorage 或后端
      localStorage.setItem('apiSettings', JSON.stringify(values));
    });
  };

  // 删除当前会话
  const deleteCurrentConversation = () => {
    if (conversations.length <= 1) {
      // 如果只有一个会话，创建一个新的空会话
      createNewChat();
      return;
    }
    
    const newConversations = conversations.filter(conv => conv.id !== activeConversation);
    setConversations(newConversations);
    setActiveConversation(newConversations[0].id);
    setMessages([]);
  };

  // 清空当前会话消息
  const clearCurrentMessages = () => {
    setMessages([]);
    // 更新会话列表中的消息
    setConversations(prev => 
      prev.map(conv => 
        conv.id === activeConversation 
          ? { ...conv, messages: [] } 
          : conv
      )
    );
  };

  // 重新加载当前会话
  const reloadConversation = () => {
    // 在实际应用中，这里可能需要从存储或API重新加载会话
    // 这里简单模拟重新加载
    setMessages([...messagesRef.current]);
  };

  // 编辑当前会话标题
  const editConversationTitle = () => {
    const newTitle = prompt('请输入新的会话标题', 
      conversations.find(c => c.id === activeConversation)?.title);
    
    if (newTitle) {
      setConversations(prev => 
        prev.map(conv => 
          conv.id === activeConversation 
            ? { ...conv, title: newTitle } 
            : conv
        )
      );
    }
  };

  // 切换全屏模式
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // 切换暗黑模式
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  // 导出会话
  const exportConversations = () => {
    const dataStr = JSON.stringify(conversations, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `nextchat-export-${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // 导入会话
  const importConversations = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content, (key, value) => {
          if (key === 'lastUpdated' || key === 'timestamp') {
            return new Date(value);
          }
          return value;
        });
        
        if (Array.isArray(parsed)) {
          setConversations(parsed);
          messageApi.success('会话导入成功');
        } else {
          throw new Error('Invalid format');
        }
      } catch (error) {
        messageApi.error('导入失败：无效的文件格式');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex h-screen bg-gray-50">
    {contextHolder}

      {/* 侧边栏切换按钮（仅在移动设备上显示） */}
      {isMobile && (
        <Button
          type="text"
          icon={sidebarVisible ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
          onClick={() => setSidebarVisible(!sidebarVisible)}
          className="fixed top-4 left-4 z-10"
        />
      )}
      
      {/* 左侧会话列表 */}
      {(sidebarVisible || !isMobile) && (
        <div className={`${isMobile ? 'fixed inset-0 z-10' : 'w-72'} bg-blue-50 flex flex-col border-r border-gray-200`}>
          <div className="p-4">
            <div className="flex items-center mb-4">
              <div className="flex-1">
                <Title level={5} className="m-0 text-blue-800">NextChat</Title>
                <Text className="text-xs text-gray-500">Build your own AI assistant.</Text>
              </div>
            </div>
            
            <div className="flex space-x-2 mb-4">
              <Button 
                className="flex-1 flex items-center justify-center" 
                icon={<SettingOutlined />}
                onClick={openSettings}
              >
                设置
              </Button>
              <Button 
                type="primary" 
                className="flex-1 flex items-center justify-center" 
                icon={<PlusOutlined />}
                onClick={createNewChat}
              >
                发起
              </Button>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto">
            <List
              dataSource={conversations}
              renderItem={item => (
                <div 
                  className={`px-4 py-2 cursor-pointer hover:bg-blue-100 ${
                    activeConversation === item.id ? 'bg-blue-200' : ''
                  }`}
                  onClick={() => selectConversation(item.id)}
                >
                  <div className="font-medium text-gray-800">{item.title}</div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{item.messages.length || 0} 条对话</span>
                    <span>{formatDate(item.lastUpdated).split(' ')[0]}</span>
                  </div>
                </div>
              )}
            />
          </div>
          
          <div className="p-4 border-t border-gray-200 flex justify-between">
            <Button 
              type="text" 
              icon={<DeleteOutlined />} 
              className="text-gray-500"
              onClick={deleteCurrentConversation}
            />
            <Button 
              type="text" 
              icon={<ReloadOutlined />}
              className="text-gray-500"
              onClick={reloadConversation}
            />
            <Button
              type="text"
              className="text-gray-500"
              onClick={exportConversations}
              title="导出会话"
            >
              导出
            </Button>
            <input
              type="file"
              accept=".json"
              onChange={importConversations}
              style={{ display: 'none' }}
              id="import-file"
            />
            <Button 
              type="text"
              className="text-gray-500"
              onClick={() => document.getElementById('import-file')?.click()}
              title="导入会话"
            >
              导入
            </Button>
          </div>
        </div>
      )}
      
      {/* 右侧聊天区域 */}
      <div className={`flex-1 flex flex-col ${isMobile && sidebarVisible ? 'opacity-50' : ''}`}>
        {/* 头部 */}
        <header className="bg-white shadow p-4 flex justify-between items-center">
          <div>
            <Text strong>
              {conversations.find(c => c.id === activeConversation)?.title || '对话'}
            </Text>
            <Text className="ml-2 text-gray-500 text-sm">
              共 {messages.length} 条对话
            </Text>
          </div>
          <div className="flex space-x-2">
            <Button type="text" icon={<ReloadOutlined />} onClick={reloadConversation} />
            <Button type="text" icon={<EditOutlined />} onClick={editConversationTitle} />
            <Button 
              type="text" 
              icon={isFullscreen ? <FullscreenOutlined /> : <FullscreenOutlined />} 
              onClick={toggleFullscreen}
            />
            <Button 
              type="text" 
              icon={darkMode ? <BulbOutlined /> : <BulbFilled />} 
              onClick={toggleDarkMode}
            />
          </div>
        </header>
        
        {/* 消息区域 */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <Paragraph className="text-gray-400">
                发送消息开始对话...
              </Paragraph>
            </div>
          ) : (
            messages.map(message => (
              <div 
                key={message.id} 
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex max-w-[70%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <Avatar 
                    icon={message.role === 'user' ? <UserOutlined /> : <RobotOutlined />} 
                    className={message.role === 'user' ? 'bg-blue-500' : 'bg-green-500'}
                  />
                  <div 
                    className={`px-4 py-2 rounded-lg mx-2 ${
                      message.role === 'user' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <ReactMarkdown className="markdown-content">
                        {message.content}
                      </ReactMarkdown>
                    ) : (
                      message.content
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="flex max-w-[70%]">
                <Avatar icon={<RobotOutlined />} className="bg-green-500" />
                <div className="px-4 py-2 rounded-lg mx-2 bg-white border border-gray-200">
                  <Spin size="small" /> 思考中...
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* 输入区域 */}
        <div className="p-4 bg-white border-t">
          <div className="flex flex-col">
            <div className="flex mb-2 justify-center space-x-2">
              <Button type="text" size="small" shape="circle" icon={<SettingOutlined />} onClick={openSettings} />
              <Button type="text" size="small" shape="circle" icon={<ReloadOutlined />} onClick={reloadConversation} />
              <Button type="text" size="small" shape="circle" icon={<PlusOutlined />} onClick={createNewChat} />
              <Button type="text" size="small" shape="circle" icon={<DeleteOutlined />} onClick={clearCurrentMessages} />
            </div>
            <div className="flex">
              <TextArea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter 发送, Shift + Enter 换行 / 输入指令"
                autoSize={{ minRows: 1, maxRows: 4 }}
                className="flex-1 mr-2 rounded-lg"
              />
              <Button 
                type="primary" 
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="flex items-center justify-center"
              >
                发送
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* 设置模态框 */}
      <Modal
        title="API 设置"
        open={settingsVisible}
        onOk={saveSettings}
        onCancel={() => setSettingsVisible(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={apiSettings}
        >
          <Form.Item
            name="baseUrl"
            label="API 基础 URL"
            rules={[{ required: true, message: '请输入 API 基础 URL' }]}
          >
            <Input placeholder="例如: https://api.openai.com/v1" />
          </Form.Item>
          
          <Form.Item
            name="model"
            label="模型"
            rules={[{ required: true, message: '请选择模型' }]}
          >
            <Select placeholder="选择模型">
              <Option value="gpt-3.5-turbo">GPT-3.5 Turbo</Option>
              <Option value="gpt-4">GPT-4</Option>
              <Option value="gpt-4-turbo">GPT-4 Turbo</Option>
              <Option value="claude-3-opus">Claude 3 Opus</Option>
              <Option value="claude-3-sonnet">Claude 3 Sonnet</Option>
              <Option value="claude-3-haiku">Claude 3 Haiku</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="apiKey"
            label="API Key"
            rules={[{ required: true, message: '请输入 API Key' }]}
          >
            <Input.Password placeholder="输入您的 API Key" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default App
