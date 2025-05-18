'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import { Button } from './button';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { User } from '@/types/user';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: number;
  read: boolean;
}

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipient: User;
}

export function ChatModal({ isOpen, onClose, recipient }: ChatModalProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Placeholder for WebSocket connection
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Scroll to bottom when messages change or modal opens
    scrollToBottom();

    // Initialize chat - loading messages
    setIsLoading(true);
    fetchChatHistory();

    // Setup WebSocket connection for real-time messaging
    initializeWebSocket();

    return () => {
      // Clean up WebSocket connection when modal closes
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [isOpen, recipient.id]);

  const fetchChatHistory = async () => {
    try {
      // This would be replaced with actual API call to fetch chat history
      // For demo purposes, we'll use placeholder messages
      setTimeout(() => {
        const demoMessages: Message[] = [
          {
            id: '1',
            senderId: session?.user?.id || '',
            receiverId: recipient.id,
            content: 'Hey there! I\'m interested in your products.',
            timestamp: Date.now() - 3600000,
            read: true
          },
          {
            id: '2',
            senderId: recipient.id,
            receiverId: session?.user?.id || '',
            content: 'Hello! Thanks for reaching out. Which product are you interested in?',
            timestamp: Date.now() - 3500000,
            read: true
          },
          {
            id: '3',
            senderId: session?.user?.id || '',
            receiverId: recipient.id,
            content: 'I saw your agricultural products. Do you have any organic options?',
            timestamp: Date.now() - 3400000,
            read: true
          },
          {
            id: '4',
            senderId: recipient.id,
            receiverId: session?.user?.id || '',
            content: 'Yes, we have several organic products. All of them are verified on the blockchain.',
            timestamp: Date.now() - 3300000,
            read: true
          }
        ];
        
        setMessages(demoMessages);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching chat history:', error);
      setIsLoading(false);
    }
  };

  const initializeWebSocket = () => {
    // This would be replaced with actual WebSocket connection
    // For demo purposes, we'll simulate real-time messaging
    console.log('Initializing WebSocket connection...');
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !session?.user?.id) return;
    
    setIsSending(true);
    
    try {
      // Create a new message object
      const message: Message = {
        id: Date.now().toString(),
        senderId: session.user.id,
        receiverId: recipient.id,
        content: newMessage,
        timestamp: Date.now(),
        read: false
      };
      
      // This would be replaced with actual API call to send message
      // For demo purposes, we'll simulate sending
      setTimeout(() => {
        // Add message to local state
        setMessages(prev => [...prev, message]);
        
        // Clear input field
        setNewMessage('');
        
        // Simulate recipient response after 2 seconds
        setTimeout(() => {
          const response: Message = {
            id: (Date.now() + 1).toString(),
            senderId: recipient.id,
            receiverId: session.user.id,
            content: 'Thanks for your message! I\'ll get back to you soon.',
            timestamp: Date.now(),
            read: false
          };
          
          setMessages(prev => [...prev, response]);
        }, 2000);
        
        setIsSending(false);
      }, 500);
      
    } catch (error) {
      console.error('Error sending message:', error);
      setIsSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatMessageTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md bg-gradient-to-br from-[#232526] to-[#0f2027] rounded-xl shadow-[0_0_40px_#00ffcc33] overflow-hidden animate-fadeIn">
        {/* Chat header */}
        <div className="flex items-center justify-between p-4 border-b border-[#00bfff]">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-[#00ffcc] via-[#a259ff] to-[#00bfff] p-0.5">
              <div className="h-full w-full rounded-full bg-[#232526] flex items-center justify-center text-sm font-bold text-white">
                {recipient.profilePicture ? (
                  <Image src={recipient.profilePicture} alt={recipient.name} width={40} height={40} className="rounded-full object-cover" />
                ) : (
                  recipient.name.charAt(0)
                )}
              </div>
            </div>
            <div className="ml-3">
              <h3 className="text-white font-semibold font-orbitron">{recipient.name}</h3>
              <p className="text-xs text-[#00bfff]">{recipient.role}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="h-8 w-8 p-0 rounded-full text-[#a259ff] hover:bg-[#a259ff22] hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Chat messages */}
        <div 
          ref={chatContainerRef}
          className="h-96 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-[#00bfff44] scrollbar-track-transparent"
        >
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-[#00bfff] animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-[#00bfff] text-sm">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`flex ${message.senderId === session?.user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[75%] rounded-lg p-3 ${
                      message.senderId === session?.user?.id 
                        ? 'bg-[#00bfff] text-white rounded-br-none' 
                        : 'bg-[#232526] border border-[#a259ff] text-white rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs text-right mt-1 opacity-70">{formatMessageTime(message.timestamp)}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        
        {/* Message input */}
        <div className="p-3 border-t border-[#00bfff]">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-[#232526] border border-[#00bfff] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#00ffcc]"
              disabled={isSending}
            />
            <Button 
              type="submit" 
              className="bg-[#00ffcc] text-[#232526] hover:bg-[#00bfff] hover:text-white rounded-lg h-10 px-3"
              disabled={isSending || !newMessage.trim()}
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
} 