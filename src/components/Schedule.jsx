import { useState, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns'

export default function Schedule() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [jobs, setJobs] = useState([])

  useEffect(() => {
    loadJobs()
  }, [])

  const loadJobs = () => {
    const saved = localStorage.getItem('jobs')
    if (saved) {
      setJobs(JSON.parse(saved))
    }
  }

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const getJobsForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return jobs.filter(job => job.date === dateStr)
  }

  const selectedDateJobs = getJobsForDate(selectedDate)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Schedule</h2>
        <p className="text-slate-600 mt-1">View and manage your job schedule</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-900">
              {format(currentDate, 'MMMM yyyy')}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-semibold text-slate-600 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {/* Days of month */}
            {daysInMonth.map(day => {
              const dayJobs = getJobsForDate(day)
              const isSelected = isSameDay(day, selectedDate)
              const isToday = isSameDay(day, new Date())

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`aspect-square p-2 rounded-lg transition-all relative ${
                    isSelected
                      ? 'bg-primary-500 text-white shadow-lg'
                      : isToday
                      ? 'bg-primary-100 text-primary-900 border-2 border-primary-500'
                      : 'hover:bg-slate-100 text-slate-900'
                  }`}
                >
                  <span className="text-sm font-medium">{format(day, 'd')}</span>
                  {dayJobs.length > 0 && (
                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-1">
                      {dayJobs.slice(0, 3).map((_, i) => (
                        <div
                          key={i}
                          className={`w-1 h-1 rounded-full ${
                            isSelected ? 'bg-white' : 'bg-primary-500'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Selected Day Jobs */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {format(selectedDate, 'MMM d, yyyy')}
              </h3>
              <p className="text-sm text-slate-600">
                {selectedDateJobs.length} {selectedDateJobs.length === 1 ? 'job' : 'jobs'}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {selectedDateJobs.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="mx-auto text-slate-300 mb-3" size={40} />
                <p className="text-slate-500 text-sm">No jobs scheduled</p>
              </div>
            ) : (
              selectedDateJobs.map((job, index) => (
                <div
                  key={index}
                  className="p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg border border-primary-200"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{job.customerName}</p>
                      <p className="text-sm text-slate-600 mt-1">{job.service}</p>
                      {job.notes && (
                        <p className="text-xs text-slate-500 mt-2">{job.notes}</p>
                      )}
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        job.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : job.status === 'in-progress'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-primary-200">
                    <p className="text-sm font-medium text-primary-700">${job.price}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
