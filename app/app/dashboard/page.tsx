'use client'

import { Award, Mic, Briefcase, UserPlus, Star } from 'lucide-react'
import CardWithIcon from '@/components/dashboard/CardWithIcon'
import Sidebar from '@/components/layout/Sidebar'
import DashboardHeader from '@/components/layout/DashboardHeader'
import { useEffect, useRef, useState } from 'react'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { SVGRenderer } from 'echarts/renderers'
import { getSavedJobs } from '@/lib/jobsData'

echarts.use([LineChart, GridComponent, TooltipComponent, SVGRenderer])

const dummyData = {
  avgInterviewScore: 8.5,
  totalInterviews: 12,
  interviewHistory: [
    { date: '26/01/2026, 23:05:27', company: 'Tech Corp', position: 'Senior Engineer', score: 9.2, avatar: 'https://i.pravatar.cc/150?img=11' },
    { date: '25/01/2026, 18:31:33', company: 'StartupXYZ', position: 'Full Stack Dev', score: 7.8, avatar: 'https://i.pravatar.cc/150?img=12' },
    { date: '24/01/2026, 14:20:15', company: 'Design Co', position: 'Frontend Engineer', score: 8.5, avatar: 'https://i.pravatar.cc/150?img=13' },
    { date: '23/01/2026, 10:45:22', company: 'DataCorp', position: 'Backend Developer', score: 6.9, avatar: 'https://i.pravatar.cc/150?img=14' },
    { date: '20/01/2026, 16:30:10', company: 'CloudTech', position: 'DevOps Engineer', score: 7.5, avatar: 'https://i.pravatar.cc/150?img=15' },
    { date: '18/01/2026, 11:15:45', company: 'AI Labs', position: 'ML Engineer', score: 8.8, avatar: 'https://i.pravatar.cc/150?img=16' },
    { date: '15/01/2026, 09:20:30', company: 'FinTech Inc', position: 'Software Engineer', score: 7.2, avatar: 'https://i.pravatar.cc/150?img=17' },
    { date: '13/01/2026, 15:40:18', company: 'GameDev Studio', position: 'Unity Developer', score: 6.5, avatar: 'https://i.pravatar.cc/150?img=18' },
    { date: '10/01/2026, 13:25:55', company: 'Mobile Apps', position: 'iOS Developer', score: 8.1, avatar: 'https://i.pravatar.cc/150?img=19' },
    { date: '08/01/2026, 17:10:40', company: 'Web Agency', position: 'React Developer', score: 7.9, avatar: 'https://i.pravatar.cc/150?img=20' },
    { date: '05/01/2026, 12:50:25', company: 'Security Corp', position: 'Security Engineer', score: 8.3, avatar: 'https://i.pravatar.cc/150?img=21' },
    { date: '03/01/2026, 10:05:12', company: 'Blockchain Co', position: 'Blockchain Dev', score: 6.8, avatar: 'https://i.pravatar.cc/150?img=22' },
  ],
  employees: [
    { id: 1, name: 'Sheila Schaefer', avatar: 'https://i.pravatar.cc/150?img=1' },
    { id: 2, name: 'Ezra Stanton', avatar: 'https://i.pravatar.cc/150?img=2' },
    { id: 3, name: 'Clay Hodkiewicz', avatar: 'https://i.pravatar.cc/150?img=3' },
    { id: 4, name: 'Fae Roob', avatar: 'https://i.pravatar.cc/150?img=4' },
    { id: 5, name: 'Araceli Goyette', avatar: 'https://i.pravatar.cc/150?img=5' },
    { id: 6, name: 'Alyce Zboncak', avatar: 'https://i.pravatar.cc/150?img=6' },
    { id: 7, name: 'Kaci Prohaska', avatar: 'https://i.pravatar.cc/150?img=7' },
    { id: 8, name: 'Trent Rogahn', avatar: 'https://i.pravatar.cc/150?img=8' },
    { id: 9, name: 'Richmond Ritchie', avatar: 'https://i.pravatar.cc/150?img=9' },
    { id: 10, name: 'Darrell Bernier', avatar: 'https://i.pravatar.cc/150?img=10' },
  ],

}

export default function Dashboard() {
  const chartRef = useRef<HTMLDivElement>(null)
  const [savedJobs, setSavedJobs] = useState<any[]>([])

  useEffect(() => {
    setSavedJobs(getSavedJobs())
  }, [])

  useEffect(() => {
    if (!chartRef.current) return
    
    const chart = echarts.init(chartRef.current)
    
    chart.setOption({
      grid: { left: '10%', right: '5%', bottom: '15%', top: '5%' },
      xAxis: {
        type: 'category',
        data: dummyData.interviewHistory.map(d => d.date.split(',')[0]),
        axisLabel: { rotate: 45, fontSize: 10 },
        name: 'Date',
        nameLocation: 'middle',
        nameGap: 35,
      },
      yAxis: {
        type: 'value',
        name: 'Score',
        nameLocation: 'middle',
        nameGap: 40,
        min: 0,
        max: 10,
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const idx = params[0].dataIndex
          const interview = dummyData.interviewHistory[idx]
          return `${interview.date}<br/>${interview.company} - ${interview.position}<br/>Score: ${interview.score}`
        },
      },
      series: [{
        data: dummyData.interviewHistory.map(d => d.score),
        type: 'line',
        smooth: true,
        itemStyle: { color: '#3b82f6' },
        lineStyle: { width: 2 },
      }],
    })

    const handleResize = () => chart.resize()
    window.addEventListener('resize', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      chart.dispose()
    }
  }, [])

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      
      <main className="flex-1">
        <DashboardHeader />
        
        <div className="p-6 bg-gray-100">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <CardWithIcon
                  icon={Award}
                  title="Average Mock Interview Score"
                  subtitle={dummyData.avgInterviewScore}
                  href="/dashboard/interviews"
                />
                <CardWithIcon
                  icon={Mic}
                  title="Total Mock Interviews Given"
                  subtitle={dummyData.totalInterviews}
                  href="/dashboard/interviews"
                />
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Mock Interview History</h3>
                <div ref={chartRef} className="h-64 w-full" />
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Recent Interviews</h3>
                <div className="space-y-4">
                  {dummyData.interviewHistory.slice(0, 5).map((interview, idx) => (
                    <div key={idx} className="flex items-center gap-3 pb-3 border-b">
                      <img src={interview.avatar} alt="" className="w-10 h-10 rounded-full" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{interview.date}</p>
                        <p className="text-xs text-gray-500">{interview.company}, {interview.position}</p>
                      </div>
                      <span className="text-sm font-semibold">Score: {interview.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <CardWithIcon
                icon={Briefcase}
                title="Saved Jobs"
                subtitle={savedJobs.length}
                href="/dashboard/jobs"
              >
                <div className="max-h-64 overflow-y-auto">
                  {savedJobs.map((job) => (
                    <div key={job.id} className="flex items-start gap-3 p-3 border-b border-gray-100 hover:bg-gray-50">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <Star size={20} className="text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{job.title}</p>
                        <p className="text-sm text-gray-600 truncate mt-1">{job.company}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardWithIcon>
              <CardWithIcon
                icon={UserPlus}
                title="Employees to Outreach"
                subtitle={dummyData.employees.length}
                href="/dashboard/outreach"
              >
                <div className="max-h-64 overflow-y-auto">
                  {dummyData.employees.map((employee) => (
                    <div key={employee.id} className="flex items-center gap-3 p-3 border-b border-gray-100 hover:bg-gray-50">
                      <img src={employee.avatar} alt={employee.name} className="w-10 h-10 rounded-full" />
                      <span className="text-sm text-gray-700">{employee.name}</span>
                    </div>
                  ))}
                </div>
              </CardWithIcon>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
