import dummyJobs from './dummyJobs.json'

export type Job = {
  id: number
  title: string
  company: string
  location: string
  job_link: string
  posted_date: string
}

export const getJobsData = (): Job[] => {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem('jobsData')
  if (data) {
    return JSON.parse(data)
  }
  // Return dummy data if no jobs in localStorage
  localStorage.setItem('jobsData', JSON.stringify(dummyJobs))
  return dummyJobs
}

export const saveJobsData = (jobs: Job[]) => {
  localStorage.setItem('jobsData', JSON.stringify(jobs))
}

export const getSavedJobIds = (): number[] => {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem('savedJobs')
  return data ? JSON.parse(data) : []
}

export const toggleSaveJob = (jobId: number) => {
  const saved = getSavedJobIds()
  const updated = saved.includes(jobId) 
    ? saved.filter(id => id !== jobId)
    : [...saved, jobId]
  localStorage.setItem('savedJobs', JSON.stringify(updated))
  return updated
}

export const getSavedJobs = (): Job[] => {
  const allJobs = getJobsData()
  const savedIds = getSavedJobIds()
  return allJobs.filter(job => savedIds.includes(job.id))
}
