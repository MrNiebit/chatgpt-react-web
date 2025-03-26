import React from 'react';
import { Avatar } from 'antd';
import { UserOutlined, RobotOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  return (
    <div 
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
  );
};

export default ChatMessage; 