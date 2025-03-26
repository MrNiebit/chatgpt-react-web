import React from 'react';
import { List, Button } from 'antd';
import { SettingOutlined, PlusOutlined } from '@ant-design/icons';
import { Conversation } from '../types';

interface ConversationListProps {
  conversations: Conversation[];
  activeConversation: string;
  onSelectConversation: (id: string) => void;
  onCreateNewChat: () => void;
  onOpenSettings: () => void;
  formatDate: (date: Date) => string;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversation,
  onSelectConversation,
  onCreateNewChat,
  onOpenSettings,
  formatDate
}) => {
  return (
    <div className="w-72 bg-blue-50 flex flex-col border-r border-gray-200">
      <div className="p-4">
        <div className="flex items-center mb-4">
          <div className="flex-1">
            <h5 className="m-0 text-blue-800">NextChat</h5>
            <span className="text-xs text-gray-500">Build your own AI assistant.</span>
          </div>
        </div>
        
        <div className="flex space-x-2 mb-4">
          <Button 
            className="flex-1 flex items-center justify-center" 
            icon={<SettingOutlined />}
            onClick={onOpenSettings}
          >
            设置
          </Button>
          <Button 
            type="primary" 
            className="flex-1 flex items-center justify-center" 
            icon={<PlusOutlined />}
            onClick={onCreateNewChat}
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
              onClick={() => onSelectConversation(item.id)}
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
    </div>
  );
};

export default ConversationList; 