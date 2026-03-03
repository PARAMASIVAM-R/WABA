import { useState, useEffect } from 'react'

const API_URL = 'http://localhost:3000'

function Dashboard() {
  const [activeTab, setActiveTab] = useState('pending')
  const [appointments, setAppointments] = useState([])
  const [todayVisits, setTodayVisits] = useState([])
  const [doctors, setDoctors] = useState([])
  const [categories, setCategories] = useState([])
  const [followups, setFollowups] = useState([])
  const [templates, setTemplates] = useState([])
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [doctorSlots, setDoctorSlots] = useState([])
  const [loading, setLoading] = useState(false)
  const [showDoctorModal, setShowDoctorModal] = useState(false)
  const [editingDoctor, setEditingDoctor] = useState(null)
  const [doctorForm, setDoctorForm] = useState({ name: '', categoryId: '', slotsPerDay: '', startTime: '', endTime: '' })
  const [followupForm, setFollowupForm] = useState({
    phone: '',
    patientName: '',
    messageType: 'custom',
    templateName: '',
    customMessage: ''
  })

  useEffect(() => {
    if (activeTab === 'doctors') {
      fetchDoctors()
      fetchCategories()
    } else if (activeTab === 'followups') {
      fetchFollowups()
      fetchTemplates()
    } else if (activeTab === 'today') {
      fetchTodayVisits()
    } else {
      fetchAppointments()
    }
  }, [activeTab])

  const fetchAppointments = async () => {
    setLoading(true)
    try {
      const endpoint = activeTab === 'pending' ? `${API_URL}/admin/appointments/pending` : `${API_URL}/appointments`
      const res = await fetch(endpoint)
      const data = await res.json()
      const allAppointments = data.appointments || []
      if (activeTab === 'approved') {
        setAppointments(allAppointments.filter(apt => apt.status === 'accepted'))
      } else if (activeTab === 'rejected') {
        setAppointments(allAppointments.filter(apt => apt.status === 'rejected'))
      } else {
        setAppointments(allAppointments)
      }
    } catch (error) {
      console.error(error)
    }
    setLoading(false)
  }

  const fetchDoctors = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/admin/appointments/doctors`)
      const data = await res.json()
      setDoctors(data.doctors || [])
    } catch (error) {
      console.error(error)
    }
    setLoading(false)
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/appointments/categories`)
      const data = await res.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error(error)
    }
  }

  const fetchDoctorSlots = async (doctorId) => {
    try {
      const res = await fetch(`${API_URL}/admin/appointments/doctors/${doctorId}/slots`)
      const data = await res.json()
      const grouped = (data.appointments || []).reduce((acc, apt) => {
        const key = `${apt.date}_${apt.time_slot}`
        if (!acc[key]) acc[key] = { date: apt.date, time_slot: apt.time_slot, patients: [] }
        acc[key].patients.push(apt)
        return acc
      }, {})
      setDoctorSlots(Object.values(grouped))
    } catch (error) {
      console.error(error)
    }
  }

  const fetchTodayVisits = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/admin/appointments/today`)
      const data = await res.json()
      setTodayVisits(data.appointments || [])
    } catch (error) {
      console.error(error)
    }
    setLoading(false)
  }

  const fetchFollowups = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/admin/followups`)
      const data = await res.json()
      setFollowups(data || [])
    } catch (error) {
      console.error(error)
    }
    setLoading(false)
  }

  const fetchTemplates = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/followups/templates`)
      const data = await res.json()
      setTemplates(data || [])
    } catch (error) {
      console.error(error)
    }
  }

  const handleAccept = async (id) => {
    try {
      await fetch(`${API_URL}/admin/appointments/${id}/accept`, { method: 'POST' })
      alert('Appointment accepted!')
      fetchAppointments()
    } catch (error) {
      alert('Error accepting appointment')
    }
  }

  const handleReject = async (id) => {
    const reason = prompt('Enter rejection reason:')
    if (!reason) return
    try {
      await fetch(`${API_URL}/admin/appointments/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      })
      alert('Appointment rejected!')
      fetchAppointments()
    } catch (error) {
      alert('Error rejecting appointment')
    }
  }

  const handleChangeSlot = async (apt) => {
    const newTime = prompt(`Current: ${apt.time_slot}\nEnter new time slot:`)
    if (!newTime) return
    try {
      await fetch(`${API_URL}/admin/appointments/${apt.id}/change-slot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newTime })
      })
      alert('Time slot updated!')
      fetchAppointments()
    } catch (error) {
      alert('Error changing slot')
    }
  }

  const handleMarkVisited = async (id) => {
    if (!confirm('Mark this patient as visited and assign token?')) return
    try {
      const res = await fetch(`${API_URL}/admin/appointments/${id}/visited`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        alert(`Patient marked as visited! Token Number: ${data.tokenNumber}`)
        fetchAppointments()
      } else {
        alert(data.error || 'Error marking as visited')
      }
    } catch (error) {
      alert('Error marking as visited')
    }
  }

  const handleMarkCompleted = async (id) => {
    if (!confirm('Mark checkup as completed?')) return
    try {
      await fetch(`${API_URL}/admin/appointments/${id}/completed`, { method: 'POST' })
      alert('Checkup marked as completed!')
      fetchTodayVisits()
    } catch (error) {
      alert('Error marking as completed')
    }
  }

  const handleSaveDoctor = async () => {
    if (!doctorForm.name || !doctorForm.categoryId) {
      alert('Please fill all fields')
      return
    }
    if (!editingDoctor && (!doctorForm.slotsPerDay || !doctorForm.startTime || !doctorForm.endTime)) {
      alert('Please fill slot configuration')
      return
    }
    try {
      if (editingDoctor) {
        await fetch(`${API_URL}/admin/appointments/doctors/${editingDoctor.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: doctorForm.name, categoryId: doctorForm.categoryId })
        })
      } else {
        await fetch(`${API_URL}/admin/appointments/doctors`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(doctorForm)
        })
      }
      setShowDoctorModal(false)
      setEditingDoctor(null)
      setDoctorForm({ name: '', categoryId: '', slotsPerDay: '', startTime: '', endTime: '' })
      fetchDoctors()
    } catch (error) {
      alert('Error saving doctor')
    }
  }

  const handleDeleteDoctor = async (id) => {
    if (!confirm('Delete this doctor?')) return
    try {
      await fetch(`${API_URL}/admin/appointments/doctors/${id}`, { method: 'DELETE' })
      fetchDoctors()
    } catch (error) {
      alert('Error deleting doctor')
    }
  }

  const handleCreateFollowup = async (e) => {
    e.preventDefault()
    if (!followupForm.phone) return alert('Phone required')
    if (followupForm.messageType === 'custom' && !followupForm.customMessage) return alert('Message required')
    if (followupForm.messageType === 'template' && !followupForm.templateName) return alert('Template required')
    try {
      await fetch(`${API_URL}/admin/followups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(followupForm)
      })
      setFollowupForm({ phone: '', patientName: '', messageType: 'custom', templateName: '', customMessage: '' })
      fetchFollowups()
    } catch (error) {
      alert('Error creating follow-up')
    }
  }

  const handleSendFollowup = async (id) => {
    if (!confirm('Send now?')) return
    try {
      await fetch(`${API_URL}/admin/followups/${id}/send`, { method: 'POST' })
      fetchFollowups()
    } catch (error) {
      alert('Error sending')
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f0f4f8' }}>
      <div style={{ width: '260px', backgroundColor: '#1e293b', color: 'white', padding: '24px 0' }}>
        <div style={{ padding: '0 24px', marginBottom: '40px' }}>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>🏥 Admin Dashboard</h1>
        </div>
        <nav>
          {[
            { id: 'pending', icon: '📋', label: 'Appointments' },
            { id: 'approved', icon: '✅', label: 'Approved' },
            { id: 'rejected', icon: '❌', label: 'Rejected' },
            { id: 'today', icon: '📅', label: "Today's Visits" },
            { id: 'doctors', icon: '👨⚕️', label: 'Doctors' },
            { id: 'followups', icon: '📨', label: 'Follow-ups' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                width: '100%',
                padding: '16px 24px',
                backgroundColor: activeTab === item.id ? '#3b82f6' : 'transparent',
                color: 'white',
                border: 'none',
                borderLeft: activeTab === item.id ? '4px solid #60a5fa' : '4px solid transparent',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '15px',
                textAlign: 'left'
              }}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div style={{ flex: 1, padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
          <h2 style={{ margin: 0, fontSize: '28px', color: '#1e293b', fontWeight: '700' }}>
            {activeTab === 'pending' && '⏳ Pending Appointments'}
            {activeTab === 'approved' && '✅ Approved Appointments'}
            {activeTab === 'rejected' && '❌ Rejected Appointments'}
            {activeTab === 'today' && '📅 Today\'s Visits'}
            {activeTab === 'doctors' && '👨⚕️ Doctors Management'}
            {activeTab === 'followups' && '📨 Follow-ups'}
          </h2>
          <button onClick={() => activeTab === 'doctors' ? fetchDoctors() : activeTab === 'today' ? fetchTodayVisits() : fetchAppointments()} style={{ padding: '12px 24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
            🔄 Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>Loading...</div>
        ) : activeTab === 'today' ? (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#1e40af', color: 'white' }}>
                  <th style={{ padding: '16px', textAlign: 'left' }}>Token</th>
                  <th style={{ padding: '16px', textAlign: 'left' }}>Patient</th>
                  <th style={{ padding: '16px', textAlign: 'left' }}>Phone</th>
                  <th style={{ padding: '16px', textAlign: 'left' }}>Doctor</th>
                  <th style={{ padding: '16px', textAlign: 'left' }}>Time Slot</th>
                  <th style={{ padding: '16px', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '16px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {todayVisits.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '60px', textAlign: 'center', color: '#64748b', fontSize: '16px' }}>
                      📭 No visits for today
                    </td>
                  </tr>
                ) : (
                  todayVisits.map((visit, i) => (
                  <tr key={visit.id} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: i % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                    <td style={{ padding: '16px', textAlign: 'left' }}>
                      <span style={{ padding: '6px 12px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '6px', fontSize: '14px', fontWeight: '700' }}>
                        🎫 #{visit.token_number}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'left' }}>👤 {visit.patient_name}</td>
                    <td style={{ padding: '16px', textAlign: 'left' }}>📞 {visit.phone}</td>
                    <td style={{ padding: '16px', textAlign: 'left' }}>👨⚕️ {visit.doctor}</td>
                    <td style={{ padding: '16px', textAlign: 'left' }}>🕐 {visit.time_slot}</td>
                    <td style={{ padding: '16px', textAlign: 'left' }}>
                      <span style={{ padding: '6px 12px', backgroundColor: visit.status === 'completed' ? '#d1fae5' : '#e0e7ff', color: visit.status === 'completed' ? '#065f46' : '#3730a3', borderRadius: '6px', fontSize: '13px', fontWeight: '600' }}>
                        {visit.status === 'completed' ? '✅ Completed' : '🏥 Visited'}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      {visit.status === 'visited' && (
                        <button onClick={() => handleMarkCompleted(visit.id)} style={{ padding: '8px 16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>✅ Mark Completed</button>
                      )}
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'followups' ? (
          <div>Follow-ups content here</div>
        ) : activeTab === 'doctors' ? (
          <div>Doctors content here</div>
        ) : (
          <div>Appointments content here</div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
