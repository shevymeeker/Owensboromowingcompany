import { useState, useEffect } from 'react'
import { DollarSign, Users, Calendar, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'

export default function Dashboard() {
  const [stats, setStats] = useState({
    revenue: 0,
    customers: 0,
    jobsToday: 0,
    weeklyGrowth: 0
  })

  const [recentJobs, setRecentJobs] = useState([])

  useEffect(() => {
    // Load data from localStorage
    const customers = JSON.parse(localStorage.getItem('customers') || '[]')
    const jobs = JSON.parse(localStorage.getItem('jobs') || '[]')

    const today = format(new Date(), 'yyyy-MM-dd')
    const todayJobs = jobs.filter(job => job.date === today)

    const completedJobs = jobs.filter(job => job.status === 'completed')
    const revenue = completedJobs.reduce((sum, job) => sum + (job.price || 0), 0)

    setStats({
      revenue,
      customers: customers.length,
      jobsToday: todayJobs.length,
      weeklyGrowth: 12.5
    })

    setRecentJobs(jobs.slice(0, 5))
  }, [])

  const StatCard = ({ icon: Icon, label, value, color, suffix = '' }) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600 mb-1">{label}</p>
          <p className="text-3xl font-bold text-slate-900">
            {value}{suffix}
          </p>
        </div>
        <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="text-white" size={24} />
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome */}
      <div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">
          Welcome back!
        </h2>
        <p className="text-slate-600">
          Here's what's happening with your business today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={`$${stats.revenue.toLocaleString()}`}
          color="bg-gradient-to-br from-green-500 to-green-600"
        />
        <StatCard
          icon={Users}
          label="Total Customers"
          value={stats.customers}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <StatCard
          icon={Calendar}
          label="Jobs Today"
          value={stats.jobsToday}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Weekly Growth"
          value={stats.weeklyGrowth}
          suffix="%"
          color="bg-gradient-to-br from-orange-500 to-orange-600"
        />
      </div>

      {/* Recent Jobs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-xl font-bold text-slate-900">Recent Jobs</h3>
        </div>
        <div className="p-6">
          {recentJobs.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto text-slate-300 mb-4" size={48} />
              <p className="text-slate-500 font-medium">No jobs yet</p>
              <p className="text-sm text-slate-400 mt-1">
                Start by adding customers and scheduling jobs
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentJobs.map((job, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div>
                    <p className="font-medium text-slate-900">{job.customerName}</p>
                    <p className="text-sm text-slate-600">{job.service}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-slate-900">${job.price}</p>
                    <p className="text-sm text-slate-600">{job.date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
