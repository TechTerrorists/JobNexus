import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8">Welcome to JobNexus</h1>
        {user ? (
          <div className="space-y-4">
            <p className="text-lg">Hello, {user.email}</p>
            <div className="space-x-4">
              <Link href="/dashboard" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Go to Dashboard
              </Link>
              <form action="/auth/signout" method="post" className="inline">
                <button className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="space-x-4">
            <Link href="/login" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Login
            </Link>
            <Link href="/signup" className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700">
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
