import { useState, useEffect } from 'react'

const API_URL = 'http://localhost:3000'

function Dashboard() {
  const [activeTab, setActiveTab] = useState('appointments')
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
  const [doctorForm, setDoctorForm] = useState({ name: '', categoryId: '', slotsPerDay: '', capacityPerSlot: '5', startTime: '', endTime: '' })
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
    } else if (activeTab === 'appointments') {
      fetchAppointments()
    }
  }, [activeTab])

  const formatTime12Hour = (time24) => {
    if (!time24) return ''
    const [hours, minutes] = time24.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  const fetchAppointments = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/appointments`)
      const data = await res.json()
      setAppointments(data.appointments || [])
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
      console.log('Fetching today visits...')
      const res = await fetch(`${API_URL}/admin/appointments/today`)
      const data = await res.json()
      console.log('Today visits response:', data)
      console.log('Number of appointments:', data.appointments?.length || 0)
      setTodayVisits(data.appointments || [])
    } catch (error) {
      console.error('Error fetching today visits:', error)
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
        if (activeTab === 'today') {
          fetchTodayVisits()
        } else {
          fetchAppointments()
        }
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
      if (selectedDoctor) {
        fetchDoctorSlots(selectedDoctor.id)
      }
    } catch (error) {
      alert('Error marking as completed')
    }
  }

  const handleSaveDoctor = async () => {
    if (!doctorForm.name || !doctorForm.categoryId) {
      alert('Please fill name and category')
      return
    }
    if (!doctorForm.slotsPerDay || !doctorForm.capacityPerSlot || !doctorForm.startTime || !doctorForm.endTime) {
      alert('Please fill all slot configuration fields')
      return
    }
    try {
      if (editingDoctor) {
        await fetch(`${API_URL}/admin/appointments/doctors/${editingDoctor.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(doctorForm)
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
      setDoctorForm({ name: '', categoryId: '', slotsPerDay: '', capacityPerSlot: '5', startTime: '', endTime: '' })
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
            { id: 'appointments', icon: '📋', label: 'Appointments' },
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
            {activeTab === 'appointments' && '📋 All Appointments'}
            {activeTab === 'today' && '📅 Today\'s Visits'}
            {activeTab === 'doctors' && '👨⚕️ Doctors Management'}
            {activeTab === 'followups' && '📨 Follow-ups'}
          </h2>
          <button onClick={() => activeTab === 'doctors' ? fetchDoctors() : activeTab === 'today' ? fetchTodayVisits() : activeTab === 'appointments' ? fetchAppointments() : fetchFollowups()} style={{ padding: '12px 24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
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
                      📭 No appointments for today
                    </td>
                  </tr>
                ) : (
                  todayVisits.map((visit, i) => (
                  <tr key={visit.id} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: i % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                    <td style={{ padding: '16px', textAlign: 'left' }}>
                      {visit.token_number ? (
                        <span style={{ padding: '6px 12px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '6px', fontSize: '14px', fontWeight: '700' }}>
                          🎫 #{visit.token_number}
                        </span>
                      ) : (
                        <span style={{ padding: '6px 12px', backgroundColor: '#e2e8f0', color: '#64748b', borderRadius: '6px', fontSize: '13px' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'left' }}>👤 {visit.patient_name}</td>
                    <td style={{ padding: '16px', textAlign: 'left' }}>📞 {visit.phone}</td>
                    <td style={{ padding: '16px', textAlign: 'left' }}>👨⚕️ {visit.doctor}</td>
                    <td style={{ padding: '16px', textAlign: 'left' }}>🕐 {visit.time_slot}</td>
                    <td style={{ padding: '16px', textAlign: 'left' }}>
                      <span style={{ padding: '6px 12px', backgroundColor: visit.status === 'completed' ? '#d1fae5' : visit.status === 'visited' ? '#e0e7ff' : '#fef3c7', color: visit.status === 'completed' ? '#065f46' : visit.status === 'visited' ? '#3730a3' : '#92400e', borderRadius: '6px', fontSize: '13px', fontWeight: '600' }}>
                        {visit.status === 'completed' ? '✅ Completed' : visit.status === 'visited' ? '🏥 Visited' : '⏳ Accepted'}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {visit.status === 'accepted' && (
                          <button onClick={() => handleMarkVisited(visit.id)} style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>🏥 Mark Visited</button>
                        )}
                        {visit.status === 'visited' && (
                          <button onClick={() => handleMarkCompleted(visit.id)} style={{ padding: '8px 16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>✅ Mark Completed</button>
                        )}
                        {(visit.status === 'accepted' || visit.status === 'visited' || visit.status === 'completed') && (
                          <button onClick={() => { setFollowupForm({ ...followupForm, phone: visit.phone, patientName: visit.patient_name }); setActiveTab('followups') }} style={{ padding: '8px 16px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>📨 Follow-up</button>
                        )}
                      </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'appointments' ? (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#1e40af', color: 'white' }}>
                  <th style={{ padding: '16px', textAlign: 'left' }}>Patient</th>
                  <th style={{ padding: '16px', textAlign: 'left' }}>Phone</th>
                  <th style={{ padding: '16px', textAlign: 'left' }}>Category</th>
                  <th style={{ padding: '16px', textAlign: 'left' }}>Doctor</th>
                  <th style={{ padding: '16px', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '16px', textAlign: 'left' }}>Time</th>
                  <th style={{ padding: '16px', textAlign: 'left' }}>Token</th>
                  <th style={{ padding: '16px', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '16px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ padding: '60px', textAlign: 'center', color: '#64748b', fontSize: '16px' }}>
                      📭 No appointments yet
                    </td>
                  </tr>
                ) : (
                  appointments.map((apt, i) => (
                  <tr key={apt.id} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: i % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                    <td style={{ padding: '16px', textAlign: 'left' }}>👤 {apt.patient_name}</td>
                    <td style={{ padding: '16px', textAlign: 'left' }}>📞 {apt.phone}</td>
                    <td style={{ padding: '16px', textAlign: 'left' }}>🏥 {apt.category}</td>
                    <td style={{ padding: '16px', textAlign: 'left' }}>👨⚕️ {apt.doctor}</td>
                    <td style={{ padding: '16px', textAlign: 'left' }}>📅 {apt.date}</td>
                    <td style={{ padding: '16px', textAlign: 'left' }}>🕐 {apt.time_slot}</td>
                    <td style={{ padding: '16px', textAlign: 'left' }}>
                      {apt.token_number ? (
                        <span style={{ padding: '6px 12px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '6px', fontSize: '14px', fontWeight: '700' }}>
                          🎫 #{apt.token_number}
                        </span>
                      ) : (
                        <span style={{ padding: '6px 12px', backgroundColor: '#e2e8f0', color: '#64748b', borderRadius: '6px', fontSize: '13px' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'left' }}>
                      <span style={{ padding: '6px 12px', backgroundColor: apt.status === 'completed' ? '#d1fae5' : apt.status === 'visited' ? '#e0e7ff' : apt.status === 'accepted' ? '#dbeafe' : apt.status === 'rejected' ? '#fee2e2' : '#fef3c7', color: apt.status === 'completed' ? '#065f46' : apt.status === 'visited' ? '#3730a3' : apt.status === 'accepted' ? '#1e40af' : apt.status === 'rejected' ? '#991b1b' : '#92400e', borderRadius: '6px', fontSize: '13px', fontWeight: '600' }}>
                        {apt.status === 'completed' ? '✅ Completed' : apt.status === 'visited' ? '🏥 Visited' : apt.status === 'accepted' ? '✅ Accepted' : apt.status === 'rejected' ? '❌ Rejected' : '⏳ Pending'}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {apt.status === 'pending' && (
                          <>
                            <button onClick={() => handleAccept(apt.id)} style={{ padding: '8px 16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>✅ Accept</button>
                            <button onClick={() => handleReject(apt.id)} style={{ padding: '8px 16px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>❌ Reject</button>
                            <button onClick={() => handleChangeSlot(apt)} style={{ padding: '8px 16px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>🔄 Change Slot</button>
                          </>
                        )}
                        {(apt.status === 'accepted' || apt.status === 'visited' || apt.status === 'completed') && (
                          <button onClick={() => { setFollowupForm({ ...followupForm, phone: apt.phone, patientName: apt.patient_name }); setActiveTab('followups') }} style={{ padding: '8px 16px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>📨 Follow-up</button>
                        )}
                      </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'followups' ? (
          <div>
            <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '16px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <h3 style={{ margin: '0 0 24px 0' }}>Create Follow-up</h3>
              <form onSubmit={handleCreateFollowup}>
                <input type="text" placeholder="Phone" value={followupForm.phone} onChange={(e) => setFollowupForm({ ...followupForm, phone: e.target.value })} style={{ width: '100%', padding: '12px', marginBottom: '16px', border: '2px solid #e2e8f0', borderRadius: '8px' }} />
                <input type="text" placeholder="Patient Name (Optional)" value={followupForm.patientName} onChange={(e) => setFollowupForm({ ...followupForm, patientName: e.target.value })} style={{ width: '100%', padding: '12px', marginBottom: '16px', border: '2px solid #e2e8f0', borderRadius: '8px' }} />
                <select value={followupForm.messageType} onChange={(e) => setFollowupForm({ ...followupForm, messageType: e.target.value, templateName: '', customMessage: '' })} style={{ width: '100%', padding: '12px', marginBottom: '16px', border: '2px solid #e2e8f0', borderRadius: '8px' }}>
                  <option value="custom">Custom Message</option>
                  <option value="template">Pre-defined Template</option>
                </select>
                {followupForm.messageType === 'template' ? (
                  <div>
                    <select value={followupForm.templateName} onChange={(e) => setFollowupForm({ ...followupForm, templateName: e.target.value })} style={{ width: '100%', padding: '12px', marginBottom: '16px', border: '2px solid #e2e8f0', borderRadius: '8px' }}>
                      <option value="">-- Select Template --</option>
                      {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    {followupForm.templateName && (
                      <div style={{ padding: '12px', backgroundColor: '#f1f5f9', borderRadius: '8px', fontSize: '13px', color: '#475569', marginBottom: '16px' }}>
                        <strong>Preview:</strong> {templates.find(t => t.id === followupForm.templateName)?.message}
                      </div>
                    )}
                  </div>
                ) : (
                  <textarea placeholder="Message" value={followupForm.customMessage} onChange={(e) => setFollowupForm({ ...followupForm, customMessage: e.target.value })} rows="4" style={{ width: '100%', padding: '12px', marginBottom: '16px', border: '2px solid #e2e8f0', borderRadius: '8px' }} />
                )}
                <button type="submit" style={{ padding: '12px 32px', backgroundColor: '#1e40af', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Create</button>
              </form>
            </div>
            <div style={{ backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1e40af', color: 'white' }}>
                    <th style={{ padding: '16px', textAlign: 'left' }}>Phone</th>
                    <th style={{ padding: '16px', textAlign: 'left' }}>Patient</th>
                    <th style={{ padding: '16px', textAlign: 'left' }}>Type</th>
                    <th style={{ padding: '16px', textAlign: 'left' }}>Message</th>
                    <th style={{ padding: '16px', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '16px', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {followups.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ padding: '60px', textAlign: 'center', color: '#64748b', fontSize: '16px' }}>
                        📭 No follow-ups created yet
                      </td>
                    </tr>
                  ) : (
                    followups.map((f, i) => (
                    <tr key={f.id} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: i % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                      <td style={{ padding: '16px', textAlign: 'left' }}>📞 {f.phone}</td>
                      <td style={{ padding: '16px', textAlign: 'left' }}>{f.patient_name || '-'}</td>
                      <td style={{ padding: '16px', textAlign: 'left' }}>{f.message_type === 'template' ? '📋 Template' : '✏️ Custom'}</td>
                      <td style={{ padding: '16px', textAlign: 'left', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {f.message_type === 'template' ? templates.find(t => t.id === f.template_name)?.name : f.custom_message}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'left' }}>
                        <span style={{ padding: '6px 12px', backgroundColor: f.status === 'sent' ? '#d1fae5' : '#fef3c7', color: f.status === 'sent' ? '#065f46' : '#92400e', borderRadius: '6px', fontSize: '13px', fontWeight: '600' }}>
                          {f.status === 'sent' ? '✅ Sent' : '⏳ Pending'}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        {f.status === 'pending' && (
                          <button onClick={() => handleSendFollowup(f.id)} style={{ padding: '8px 16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>📤 Send</button>
                        )}
                      </td>
                    </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'doctors' ? (
          <div>
            <div style={{ marginBottom: '24px', textAlign: 'right' }}>
              <button onClick={() => { setEditingDoctor(null); setDoctorForm({ name: '', categoryId: '', slotsPerDay: '', startTime: '', endTime: '' }); setShowDoctorModal(true) }} style={{ padding: '12px 24px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
                ➕ Add Doctor
              </button>
            </div>
            {showDoctorModal && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '16px', width: '500px' }}>
                  <h3 style={{ margin: '0 0 24px 0' }}>{editingDoctor ? 'Edit' : 'Add'} Doctor</h3>
                  <input type="text" placeholder="Name" value={doctorForm.name} onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })} style={{ width: '100%', padding: '12px', marginBottom: '16px', border: '2px solid #e2e8f0', borderRadius: '8px' }} />
                  <select value={doctorForm.categoryId} onChange={(e) => setDoctorForm({ ...doctorForm, categoryId: e.target.value })} style={{ width: '100%', padding: '12px', marginBottom: '16px', border: '2px solid #e2e8f0', borderRadius: '8px' }}>
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <input type="number" placeholder="Slots Per Day" value={doctorForm.slotsPerDay} onChange={(e) => setDoctorForm({ ...doctorForm, slotsPerDay: e.target.value })} style={{ width: '100%', padding: '12px', marginBottom: '16px', border: '2px solid #e2e8f0', borderRadius: '8px' }} />
                  <input type="number" placeholder="Capacity Per Slot (patients)" value={doctorForm.capacityPerSlot} onChange={(e) => setDoctorForm({ ...doctorForm, capacityPerSlot: e.target.value })} style={{ width: '100%', padding: '12px', marginBottom: '16px', border: '2px solid #e2e8f0', borderRadius: '8px' }} />
                  <input type="time" placeholder="Start Time" value={doctorForm.startTime} onChange={(e) => setDoctorForm({ ...doctorForm, startTime: e.target.value })} style={{ width: '100%', padding: '12px', marginBottom: '16px', border: '2px solid #e2e8f0', borderRadius: '8px' }} />
                  <input type="time" placeholder="End Time" value={doctorForm.endTime} onChange={(e) => setDoctorForm({ ...doctorForm, endTime: e.target.value })} style={{ width: '100%', padding: '12px', marginBottom: '16px', border: '2px solid #e2e8f0', borderRadius: '8px' }} />
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button onClick={() => { setShowDoctorModal(false); setEditingDoctor(null); setDoctorForm({ name: '', categoryId: '', slotsPerDay: '', startTime: '', endTime: '' }) }} style={{ padding: '10px 20px', backgroundColor: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
                    <button onClick={handleSaveDoctor} style={{ padding: '10px 20px', backgroundColor: '#1e40af', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Save</button>
                  </div>
                </div>
              </div>
            )}
            <div style={{ backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1e40af', color: 'white' }}>
                    <th style={{ padding: '16px', textAlign: 'left' }}>Doctor Name</th>
                    <th style={{ padding: '16px', textAlign: 'left' }}>Category</th>
                    <th style={{ padding: '16px', textAlign: 'center' }}>Working Hours</th>
                    <th style={{ padding: '16px', textAlign: 'center' }}>Slots/Day</th>
                    <th style={{ padding: '16px', textAlign: 'center' }}>Capacity/Slot</th>
                    <th style={{ padding: '16px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {doctors.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ padding: '60px', textAlign: 'center', color: '#64748b', fontSize: '16px' }}>
                        📭 No doctors added yet
                      </td>
                    </tr>
                  ) : (
                    doctors.map((doc, i) => (
                    <>
                      <tr key={doc.id} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: i % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                        <td style={{ padding: '16px', textAlign: 'left' }}>
                          <div style={{ fontWeight: '600', fontSize: '15px' }}>👨⚕️ {doc.name}</div>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'left' }}>
                          <span style={{ padding: '4px 12px', backgroundColor: '#dbeafe', color: '#1e40af', borderRadius: '6px', fontSize: '13px', fontWeight: '600' }}>🏥 {doc.category}</span>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <div style={{ fontSize: '14px', fontWeight: '600' }}>🕐 {formatTime12Hour(doc.start_time?.substring(0, 5))} - {formatTime12Hour(doc.end_time?.substring(0, 5))}</div>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <span style={{ padding: '6px 12px', backgroundColor: '#fef3c7', color: '#92400e', borderRadius: '6px', fontSize: '14px', fontWeight: '700' }}>{doc.slots_per_day}</span>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <span style={{ padding: '6px 12px', backgroundColor: '#d1fae5', color: '#065f46', borderRadius: '6px', fontSize: '14px', fontWeight: '700' }}>{doc.capacity_per_slot} patients</span>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <button onClick={() => { const cat = categories.find(c => c.name === doc.category); setEditingDoctor(doc); setDoctorForm({ name: doc.name, categoryId: cat?.id || '', slotsPerDay: doc.slots_per_day?.toString() || '', capacityPerSlot: doc.capacity_per_slot?.toString() || '5', startTime: doc.start_time?.substring(0, 5) || '', endTime: doc.end_time?.substring(0, 5) || '' }); setShowDoctorModal(true) }} style={{ padding: '6px 12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginRight: '8px', fontSize: '13px' }}>✏️ Edit</button>
                          <button onClick={() => handleDeleteDoctor(doc.id)} style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginRight: '8px', fontSize: '13px' }}>🗑️ Delete</button>
                          <button onClick={() => { if (selectedDoctor?.id === doc.id) { setSelectedDoctor(null); setDoctorSlots([]) } else { setSelectedDoctor(doc); fetchDoctorSlots(doc.id) } }} style={{ padding: '6px 12px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                            {selectedDoctor?.id === doc.id ? '▲ Hide Slots' : '📋 View Slots'}
                          </button>
                        </td>
                      </tr>
                      {selectedDoctor?.id === doc.id && (
                        <tr style={{ backgroundColor: '#f9fafb' }}>
                          <td colSpan="6" style={{ padding: '16px' }}>
                            {doctorSlots.length === 0 ? (
                              <div style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>No bookings yet</div>
                            ) : (
                              doctorSlots.map(slot => (
                                <div key={`${slot.date}_${slot.time_slot}`} style={{ marginBottom: '16px', padding: '16px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <div style={{ fontWeight: '600', fontSize: '14px' }}>📅 {slot.date} - 🕐 {slot.time_slot}</div>
                                    <div style={{ padding: '4px 12px', backgroundColor: slot.patients.length >= (doc.capacity_per_slot || 5) ? '#fee2e2' : '#d1fae5', color: slot.patients.length >= (doc.capacity_per_slot || 5) ? '#991b1b' : '#065f46', borderRadius: '6px', fontSize: '13px', fontWeight: '700' }}>
                                      {slot.patients.length}/{doc.capacity_per_slot || 5} booked
                                    </div>
                                  </div>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
                                    {slot.patients.map(p => (
                                      <div key={p.id} style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ fontSize: '13px', marginBottom: '4px' }}><strong>👤 {p.patient_name}</strong></div>
                                        <div style={{ fontSize: '12px', color: '#64748b' }}>📞 {p.phone}</div>
                                        {p.token_number && (
                                          <div style={{ fontSize: '12px', marginTop: '4px', color: '#3b82f6', fontWeight: '600' }}>🎫 Token #{p.token_number}</div>
                                        )}
                                        <div style={{ fontSize: '12px', marginTop: '6px' }}>
                                          <span style={{ padding: '4px 8px', backgroundColor: p.status === 'completed' ? '#d1fae5' : p.status === 'visited' ? '#e0e7ff' : p.status === 'accepted' ? '#dbeafe' : '#fef3c7', color: p.status === 'completed' ? '#065f46' : p.status === 'visited' ? '#3730a3' : p.status === 'accepted' ? '#1e40af' : '#92400e', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>
                                            {p.status === 'completed' ? '✅ Completed' : p.status === 'visited' ? '🏥 Visited' : p.status === 'accepted' ? '✅ Accepted' : '⏳ Pending'}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default Dashboard
