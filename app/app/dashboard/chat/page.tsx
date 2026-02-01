'use client'

import { useState, useEffect, useRef } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import DashboardHeader from '@/components/layout/DashboardHeader'
import { Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [threadId, setThreadId] = useState('')
  const [userId, setUserId] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id)
        const savedMessages = localStorage.getItem(`chat_${user.id}`)
        const savedThreadId = localStorage.getItem(`thread_${user.id}`)
        if (savedMessages) setMessages(JSON.parse(savedMessages))
        if (savedThreadId) setThreadId(savedThreadId)
        else setThreadId(`thread_${Date.now()}`)
      }
    })
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    if (userId && messages.length > 0) {
      localStorage.setItem(`chat_${userId}`, JSON.stringify(messages))
      localStorage.setItem(`thread_${userId}`, threadId)
    }
  }, [messages, userId, threadId])

  const clearChat = () => {
    if (userId) {
      localStorage.removeItem(`chat_${userId}`)
      localStorage.removeItem(`thread_${userId}`)
      setMessages([])
      setThreadId(`thread_${Date.now()}`)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    const currentMessageCount = messages.length
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const isInitial = currentMessageCount === 0
      const url = isInitial 
        ? 'http://localhost:8000/chat/initiate'
        : `http://localhost:8000/chat/continue?thread_id=${threadId}&response=${encodeURIComponent(userMessage)}`
      
      const response = await fetch(url, {
        method: isInitial ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json' },
        ...(isInitial && {
          body: JSON.stringify({
            user_id: userId,
            thread_id: threadId,
            message: userMessage
          })
        })
      })

      const data = await response.json()
      
      if (data.AIMessage) {
        let messageContent = ''
        
        if (typeof data.AIMessage === 'string') {
          messageContent = data.AIMessage
        } else if (Array.isArray(data.AIMessage)) {
          messageContent = data.AIMessage.map((item: { text?: string }) => item.text || JSON.stringify(item)).join('\n')
        } else if (data.AIMessage.text) {
          messageContent = data.AIMessage.text
        } else {
          messageContent = JSON.stringify(data.AIMessage)
        }
        
        setMessages(prev => [...prev, { role: 'assistant', content: messageContent }])
        if (data.thread_id) setThreadId(data.thread_id)
      } else if (data.error) {
        setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${data.error}` }])
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Failed to connect to chatbot' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        <DashboardHeader />
        <div className="flex-1 flex flex-col p-6">
          <div className="bg-white rounded-lg shadow flex-1 flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">Job Assistant Chat</h2>
              <button onClick={clearChat} className="text-sm text-red-600 hover:text-red-800">Clear Chat</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-200 rounded-lg px-4 py-2">Typing...</div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Ask about jobs, resume, or anything..."
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
