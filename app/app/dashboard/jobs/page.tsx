'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import DashboardHeader from '@/components/layout/DashboardHeader'
import { Briefcase, MapPin, Calendar, ExternalLink, Bookmark } from 'lucide-react'
import { getJobsData, getSavedJobIds, toggleSaveJob, type Job } from '@/lib/jobsData'

export default function AllJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [savedJobs, setSavedJobs] = useState<Set<number>>(new Set())

  useEffect(() => {
    setJobs(getJobsData())
    setSavedJobs(new Set(getSavedJobIds()))
  }, [])

  const handleToggleSave = (jobId: number) => {
    const updated = toggleSaveJob(jobId)
    setSavedJobs(new Set(updated))
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1">
        <DashboardHeader />
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">All Jobs</h1>
          {jobs.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-600">No jobs found. Use the chat to scrape jobs for you!</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {jobs.map((job) => (
                <div key={job.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">{job.title}</h3>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Briefcase size={16} />
                          <span>{job.company}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin size={16} />
                          <span>{job.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar size={16} />
                          <span>{job.posted_date}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleSave(job.id)}
                        className={`p-2 rounded-lg ${
                          savedJobs.has(job.id) ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        <Bookmark size={20} fill={savedJobs.has(job.id) ? 'currentColor' : 'none'} />
                      </button>
                      <a
                        href={job.job_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <ExternalLink size={20} />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
