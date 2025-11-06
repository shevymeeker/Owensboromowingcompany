import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, X, Check } from 'lucide-react'
import { format } from 'date-fns'

export default function Jobs() {
  const [jobs, setJobs] = useState([])
  const [customers, setCustomers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingJob, setEditingJob] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    service: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    price: '',
    status: 'scheduled',
    notes: ''
  })

  useEffect(() => {
    loadJobs()
    loadCustomers()
  }, [])

  const loadJobs = () => {
    const saved = localStorage.getItem('jobs')
    if (saved) {
      setJobs(JSON.parse(saved))
    }
  }

  const loadCustomers = () => {
    const saved = localStorage.getItem('customers')
    if (saved) {
      setCustomers(JSON.parse(saved))
    }
  }

  const saveJobs = (newJobs) => {
    localStorage.setItem('jobs', JSON.stringify(newJobs))
    setJobs(newJobs)
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const selectedCustomer = customers.find(c => c.id === parseInt(formData.customerId))
    const jobData = {
      ...formData,
      customerName: selectedCustomer?.name || formData.customerName,
      id: editingJob !== null ? jobs[editingJob].id : Date.now()
    }

    if (editingJob !== null) {
      const updated = [...jobs]
      updated[editingJob] = jobData
      saveJobs(updated)
    } else {
      saveJobs([...jobs, jobData])
    }

    resetForm()
  }

  const handleEdit = (index) => {
    setEditingJob(index)
    setFormData(jobs[index])
    setShowModal(true)
  }

  const handleDelete = (index) => {
    if (confirm('Are you sure you want to delete this job?')) {
      const updated = jobs.filter((_, i) => i !== index)
      saveJobs(updated)
    }
  }

  const updateJobStatus = (index, status) => {
    const updated = [...jobs]
    updated[index] = { ...updated[index], status }
    saveJobs(updated)
  }

  const resetForm = () => {
    setFormData({
      customerId: '',
      customerName: '',
      service: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      price: '',
      status: 'scheduled',
      notes: ''
    })
    setEditingJob(null)
    setShowModal(false)
  }

  const filteredJobs = jobs.filter(job => {
    const matchesSearch =
      job.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.service.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === 'all' || job.status === filterStatus

    return matchesSearch && matchesStatus
  })

  const services = [
    'Lawn Mowing',
    'Edging',
    'Trimming',
    'Leaf Removal',
    'Fertilization',
    'Weed Control',
    'Aeration',
    'Other'
  ]

  const statuses = [
    { value: 'scheduled', label: 'Scheduled', color: 'slate' },
    { value: 'in-progress', label: 'In Progress', color: 'blue' },
    { value: 'completed', label: 'Completed', color: 'green' },
    { value: 'cancelled', label: 'Cancelled', color: 'red' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Jobs</h2>
          <p className="text-slate-600 mt-1">Manage and track all jobs</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-600 shadow-lg shadow-primary-500/30 transition-all hover:scale-105"
        >
          <Plus size={20} />
          Add Job
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-3 rounded-lg font-medium whitespace-nowrap transition-all ${
              filterStatus === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            All Jobs
          </button>
          {statuses.map(status => (
            <button
              key={status.value}
              onClick={() => setFilterStatus(status.value)}
              className={`px-4 py-3 rounded-lg font-medium whitespace-nowrap transition-all ${
                filterStatus === status.value
                  ? `bg-${status.color}-500 text-white`
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>

      {/* Jobs List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Customer</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Service</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Price</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Status</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <Plus className="mx-auto text-slate-300 mb-3" size={40} />
                    <p className="text-slate-500 font-medium">No jobs found</p>
                    <p className="text-sm text-slate-400 mt-1">
                      {searchTerm ? 'Try a different search term' : 'Add your first job to get started'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job, index) => {
                  const statusInfo = statuses.find(s => s.value === job.status)
                  return (
                    <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">{job.customerName}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-600">{job.service}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-600">{job.date}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">${job.price}</p>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={job.status}
                          onChange={(e) => updateJobStatus(index, e.target.value)}
                          className={`px-3 py-1 rounded-full text-sm font-medium border-0 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-${statusInfo.color}-100 text-${statusInfo.color}-700`}
                        >
                          {statuses.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(index)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-slate-900">
                {editingJob !== null ? 'Edit Job' : 'Add Job'}
              </h3>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Customer *
                </label>
                <select
                  required
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select a customer</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Service *
                </label>
                <select
                  required
                  value={formData.service}
                  onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select a service</option>
                  {services.map(service => (
                    <option key={service} value={service}>
                      {service}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Price *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {statuses.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
                >
                  {editingJob !== null ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
