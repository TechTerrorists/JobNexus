'use client'

import { useState, useEffect, useRef } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import DashboardHeader from '@/components/layout/DashboardHeader'
import { Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { saveJobsData, getJobsData } from '@/lib/jobsData'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

type ScrapedJob = {
  title: string
  company: string
  location: string
  job_link: string
  posted_date: string
  description?: string
}

function formatMarkdown(text: string) {
  const processLine = (line: string) => {
    // Replace ***text*** with <strong><em>text</em></strong>
    // Replace **text** with <strong>text</strong>
    return line.split(/(\*\*\*.*?\*\*\*|\*\*.*?\*\*)/).map((part, idx) => {
      if (part.startsWith('***') && part.endsWith('***')) {
        return <strong key={idx}><em>{part.slice(3, -3)}</em></strong>
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx}>{part.slice(2, -2)}</strong>
      }
      return part
    })
  }

  return text
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .split('\n')
    .map((line, i) => {
      const trimmed = line.trim()
      if (!trimmed) return null
      
      if (trimmed.startsWith('* **')) {
        const content = trimmed.replace(/^\* /, '')
        return <li key={i} className="ml-4 mb-2 font-semibold list-none">{processLine(content)}</li>
      }
      if (trimmed.startsWith('* ')) {
        const content = trimmed.replace(/^\* /, '')
        return <li key={i} className="ml-8 mb-1 text-sm list-none">• {processLine(content)}</li>
      }
      return <p key={i} className="mb-2">{processLine(line)}</p>
    })
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

  const storeJobs = (data: any) => {
    console.log('Checking for jobs in response:', data)
    
    // Check multiple possible locations for jobs
    let scrapedJobs = null
    
    if (data.state?.ScrapedJobs) {
      scrapedJobs = data.state.ScrapedJobs
    } else if (data.ScrapedJobs) {
      scrapedJobs = data.ScrapedJobs
    }
    
    console.log('Found scraped jobs:', scrapedJobs)
    
    if (scrapedJobs && Array.isArray(scrapedJobs) && scrapedJobs.length > 0) {
      const existingJobs = getJobsData()
      const maxId = existingJobs.length > 0 ? Math.max(...existingJobs.map(j => j.id)) : 0
      
      const newJobs = scrapedJobs.map((job: ScrapedJob, idx: number) => ({
        id: maxId + idx + 1,
        title: job.title,
        company: job.company,
        location: job.location,
        job_link: job.job_link,
        posted_date: job.posted_date,
        description: job.description || 'N/A'
      }))
      
      console.log('Storing jobs:', newJobs)
      saveJobsData([...existingJobs, ...newJobs])
      console.log('Jobs stored successfully')
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
        
        storeJobs(data)
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
                    msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none">
                        {formatMarkdown(msg.content)}
                      </div>
                    ) : (
                      msg.content
                    )}
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
