import { useState, useEffect } from 'react'

const API_URL = 'http://localhost:3000'

function Dashboard() {
  const [activeTab, setActiveTab] = useState('pending')
  const [appointments, setAppointments] = useState([])
  const [doctors, setDoctors] = useState([])
  const [categories, setCategories] = useState([])
  const [followups, setFollowups] = useState([])
  const [templates, setTemplates] = useState([])
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [timeSlots, setTimeSlots] = useState([])
  const [loading, setLoading] = useState(false)
  const [showDoctorModal, setShowDoctorModal] = useState(false)
  const [editingDoctor, setEditingDoctor] = useState(null)
  const [doctorForm, setDoctorForm] = useState({ name: '', categoryId: '' })
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
      setAppointments(activeTab === 'approved' ? allAppointments.filter(apt => apt.status === 'accepted') : allAppointments)
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

  const fetchTimeSlots = async (doctorId) => {
    try {
      const res = await fetch(`${API_URL}/admin/appointments/doctors/${doctorId}/slots`)
      const data = await res.json()
      setTimeSlots(data.slots || [])
    } catch (error) {
      console.error(error)
    }
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

  const handleSaveDoctor = async () => {
    if (!doctorForm.name || !doctorForm.categoryId) {
      alert('Please fill all fields')
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
      setDoctorForm({ name: '', categoryId: '' })
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
            { id: 'pending', icon: '⏳', label: 'Pending' },
            { id: 'approved', icon: '✅', label: 'Approved' },
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
            {activeTab === 'doctors' && '👨⚕️ Doctors Management'}
            {activeTab === 'followups' && '📨 Follow-ups'}
          </h2>
          <button onClick={() => activeTab === 'doctors' ? fetchDoctors() : fetchAppointments()} style={{ padding: '12px 24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
            🔄 Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>Loading...</div>
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
                  {followups.map((f, i) => (
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'doctors' ? (
          <div>
            <div style={{ marginBottom: '24px', textAlign: 'right' }}>
              <button onClick={() => { setEditingDoctor(null); setDoctorForm({ name: '', categoryId: '' }); setShowDoctorModal(true) }} style={{ padding: '12px 24px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
                ➕ Add Doctor
              </button>
            </div>
            {showDoctorModal && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '16px', width: '500px' }}>
                  <h3 style={{ margin: '0 0 24px 0' }}>{editingDoctor ? 'Edit' : 'Add'} Doctor</h3>
                  <input type="text" placeholder="Name" value={doctorForm.name} onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })} style={{ width: '100%', padding: '12px', marginBottom: '16px', border: '2px solid #e2e8f0', borderRadius: '8px' }} />
                  <select value={doctorForm.categoryId} onChange={(e) => setDoctorForm({ ...doctorForm, categoryId: e.target.value })} style={{ width: '100%', padding: '12px', marginBottom: '24px', border: '2px solid #e2e8f0', borderRadius: '8px' }}>
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button onClick={() => { setShowDoctorModal(false); setEditingDoctor(null); setDoctorForm({ name: '', categoryId: '' }) }} style={{ padding: '10px 20px', backgroundColor: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
                    <button onClick={handleSaveDoctor} style={{ padding: '10px 20px', backgroundColor: '#1e40af', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Save</button>
                  </div>
                </div>
              </div>
            )}
            <div style={{ backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1e40af', color: 'white' }}>
                    <th style={{ padding: '16px', textAlign: 'left' }}>ID</th>
                    <th style={{ padding: '16px', textAlign: 'left' }}>Doctor Name</th>
                    <th style={{ padding: '16px', textAlign: 'left' }}>Category</th>
                    <th style={{ padding: '16px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {doctors.map((doc, i) => (
                    <>
                      <tr key={doc.id} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: i % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                        <td style={{ padding: '16px', textAlign: 'left' }}>{doc.id}</td>
                        <td style={{ padding: '16px', textAlign: 'left' }}>👨⚕️ {doc.name}</td>
                        <td style={{ padding: '16px', textAlign: 'left' }}>🏥 {doc.category}</td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <button onClick={() => { const cat = categories.find(c => c.name === doc.category); setEditingDoctor(doc); setDoctorForm({ name: doc.name, categoryId: cat?.id || '' }); setShowDoctorModal(true) }} style={{ padding: '6px 12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginRight: '8px' }}>✏️ Edit</button>
                          <button onClick={() => handleDeleteDoctor(doc.id)} style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginRight: '8px' }}>🗑️ Delete</button>
                          <button onClick={() => { if (selectedDoctor?.id === doc.id) { setSelectedDoctor(null); setTimeSlots([]) } else { setSelectedDoctor(doc); fetchTimeSlots(doc.id) } }} style={{ padding: '6px 12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                            {selectedDoctor?.id === doc.id ? '▲ Hide' : '🕐 Slots'}
                          </button>
                        </td>
                      </tr>
                      {selectedDoctor?.id === doc.id && (
                        <tr style={{ backgroundColor: '#f9fafb' }}>
                          <td colSpan="4" style={{ padding: '16px' }}>
                            {Object.entries(timeSlots.reduce((acc, slot) => {
                              const date = new Date(slot.slot_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                              if (!acc[date]) acc[date] = []
                              acc[date].push(slot)
                              return acc
                            }, {})).slice(0, 4).map(([date, slots]) => (
                              <div key={date} style={{ marginBottom: '16px' }}>
                                <div style={{ fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>📅 {date}</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                                  {slots.map(slot => (
                                    <div key={slot.id} style={{ padding: '12px', backgroundColor: slot.is_booked ? '#fee2e2' : '#d1fae5', color: slot.is_booked ? '#991b1b' : '#065f46', borderRadius: '6px', textAlign: 'center', fontSize: '13px', fontWeight: '600' }}>
                                      {slot.time}
                                      <div style={{ fontSize: '11px', marginTop: '4px' }}>{slot.is_booked ? '❌ Booked' : '✅ Available'}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </td>
                        </tr>
                      )}
                    </>
                  ))}}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
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
                  <th style={{ padding: '16px', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '16px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt, i) => (
                  <tr key={apt.id} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: i % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                    <td style={{ padding: '16px', textAlign: 'left' }}>👤 {apt.patient_name}</td>
                    <td style={{ padding: '16px', textAlign: 'left' }}>📞 {apt.phone}</td>
                    <td style={{ padding: '16px', textAlign: 'left' }}>🏥 {apt.category}</td>
                    <td style={{ padding: '16px', textAlign: 'left' }}>👨⚕️ {apt.doctor}</td>
                    <td style={{ padding: '16px', textAlign: 'left' }}>📅 {apt.date}</td>
                    <td style={{ padding: '16px', textAlign: 'left' }}>🕐 {apt.time_slot}</td>
                    <td style={{ padding: '16px', textAlign: 'left' }}>
                      <span style={{ padding: '6px 12px', backgroundColor: apt.status === 'accepted' ? '#d1fae5' : '#fef3c7', color: apt.status === 'accepted' ? '#065f46' : '#92400e', borderRadius: '6px', fontSize: '13px', fontWeight: '600' }}>
                        {apt.status === 'accepted' ? '✅' : '⏳'} {apt.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      {activeTab === 'pending' ? (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button onClick={() => handleAccept(apt.id)} style={{ padding: '8px 16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>✅ Accept</button>
                          <button onClick={() => handleReject(apt.id)} style={{ padding: '8px 16px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>❌ Reject</button>
                        </div>
                      ) : (
                        <button onClick={() => { setFollowupForm({ ...followupForm, phone: apt.phone, patientName: apt.patient_name }); setActiveTab('followups') }} style={{ padding: '8px 16px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>📨 Follow-up</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
