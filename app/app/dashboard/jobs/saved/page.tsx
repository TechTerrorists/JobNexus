'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import DashboardHeader from '@/components/layout/DashboardHeader'
import { Briefcase, MapPin, Calendar, ExternalLink, Bookmark } from 'lucide-react'
import { getSavedJobs, toggleSaveJob, type Job } from '@/lib/jobsData'

export default function SavedJobsPage() {
  const [savedJobs, setSavedJobs] = useState<Job[]>([])

  useEffect(() => {
    setSavedJobs(getSavedJobs())
  }, [])

  const handleRemoveSaved = (jobId: number) => {
    toggleSaveJob(jobId)
    setSavedJobs(getSavedJobs())
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1">
        <DashboardHeader />
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">Saved Jobs</h1>
          {savedJobs.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-600">No saved jobs yet. Start saving jobs from the All Jobs page!</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {savedJobs.map((job) => (
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
                        onClick={() => handleRemoveSaved(job.id)}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                      >
                        <Bookmark size={20} fill="currentColor" />
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
