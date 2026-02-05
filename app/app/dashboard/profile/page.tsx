'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import DashboardHeader from '@/components/layout/DashboardHeader'
import { createClient } from '@/lib/supabase/client'
import { Upload, FileText, User } from 'lucide-react'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [resumePath, setResumePath] = useState('')
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (authUser) {
      setUser(authUser)
      const { data } = await supabase.from('resume').select('path').eq('id', authUser.id).single()
      if (data?.path) setResumePath(data.path)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    if (!file.name.endsWith('.pdf')) {
      setMessage('Only PDF files are allowed')
      return
    }

    setUploading(true)
    setMessage('')

    try {
      const filePath = `resumes/${user.id}/${Date.now()}_${file.name}`
      
      const { error: uploadError } = await supabase.storage
        .from('JobNexusBucket')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { error: dbError } = await supabase.from('resume').upsert({
        id: user.id,
        path: filePath,
        updatedat: new Date().toISOString()
      })

      if (dbError) throw dbError

      setResumePath(filePath)
      setMessage(resumePath ? 'Resume updated successfully!' : 'Resume uploaded successfully!')
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1">
        <DashboardHeader />
        <div className="p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-6">Profile</h2>
              <div className="flex items-center gap-4 mb-6">
                {user?.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-20 h-20 rounded-full" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                    {user?.user_metadata?.name?.charAt(0).toUpperCase() || <User size={32} />}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-semibold">{user?.user_metadata?.full_name || user?.user_metadata?.name || 'User'}</h3>
                  <p className="text-gray-600">{user?.email}</p>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">User ID:</span>
                  <span className="font-mono text-xs">{user?.id}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Email Verified:</span>
                  <span>{user?.user_metadata?.email_verified ? '✓ Yes' : '✗ No'}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Account Created:</span>
                  <span>{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Resume</h2>
              {resumePath && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded flex items-center gap-2">
                  <FileText size={20} className="text-green-600" />
                  <span className="text-sm text-green-800">Resume uploaded</span>
                </div>
              )}
              <label className="block">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 cursor-pointer transition">
                  <Upload size={48} className="mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600 mb-2">
                    {resumePath ? 'Click to update your resume' : 'Click to upload your resume'}
                  </p>
                  <p className="text-sm text-gray-500">PDF files only</p>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </div>
              </label>
              {uploading && <p className="mt-3 text-blue-600">Uploading...</p>}
              {message && (
                <p className={`mt-3 ${message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
                  {message}
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
