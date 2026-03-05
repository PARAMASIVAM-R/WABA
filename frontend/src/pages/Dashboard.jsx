import { useState, useEffect } from 'react'
import TimePickerAMPM from '../components/TimePickerAMPM'

const API_URL = 'http://localhost:3000'

function Dashboard() {
  const [activeTab, setActiveTab] = useState('appointments')
  const [calendarView, setCalendarView] = useState('list') // 'list' or 'calendar'
  const [appointments, setAppointments] = useState([])
  const [todayVisits, setTodayVisits] = useState([])
  const [doctors, setDoctors] = useState([])
  const [categories, setCategories] = useState([])
  const [followups, setFollowups] = useState([])
  const [templates, setTemplates] = useState([])
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [doctorSlots, setDoctorSlots] = useState([])
  const [timeSlots, setTimeSlots] = useState([])
  const [slotBookings, setSlotBookings] = useState([])
  const [showSlotModal, setShowSlotModal] = useState(false)
  const [editingSlot, setEditingSlot] = useState(null)
  const [slotForm, setSlotForm] = useState({ startTime: '09:00', endTime: '17:00', capacity: '5' })
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
  const [dateFilter, setDateFilter] = useState('')
  const [calendarDoctor, setCalendarDoctor] = useState(null)
  const [weekSlots, setWeekSlots] = useState([])
  const [weekAppointments, setWeekAppointments] = useState([])
  const [showCalendarSlotModal, setShowCalendarSlotModal] = useState(false)
  const [calendarSlotForm, setCalendarSlotForm] = useState({ date: '', startTime: '09:00', endTime: '17:00', capacity: '5', applyToAll: false })
  const [editingCalendarSlot, setEditingCalendarSlot] = useState(null)
  const [dateRange, setDateRange] = useState({ fromDate: '', toDate: '' })

  useEffect(() => {
    if (activeTab === 'followups') {
      fetchFollowups()
      fetchTemplates()
    } else if (activeTab === 'today') {
      fetchTodayVisits()
    } else if (activeTab === 'appointments') {
      fetchAppointments()
    } else if (activeTab === 'calendar') {
      fetchDoctors()
      fetchCategories()
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

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr
    const options = { year: 'numeric', month: 'short', day: 'numeric' }
    return date.toLocaleDateString('en-US', options)
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
      
      console.log('API Response:', data)
      
      // Set time slots
      setTimeSlots(data.timeSlots || [])
      
      // Group ALL appointments by date and time_slot
      const grouped = {}
      const appointments = data.appointments || []
      
      appointments.forEach(apt => {
        const key = `${apt.date}_${apt.time_slot}`
        if (!grouped[key]) {
          // Find matching time slot to get capacity
          const matchingSlot = (data.timeSlots || []).find(slot => {
            const slotFormat1 = `${slot.start_time}-${slot.end_time}`
            const slotFormat2 = `${slot.start_time} - ${slot.end_time}`
            return apt.time_slot === slotFormat1 || apt.time_slot === slotFormat2
          })
          
          grouped[key] = {
            date: apt.date,
            time_slot: apt.time_slot,
            capacity: matchingSlot ? matchingSlot.capacity : 5,
            booked: 0,
            patients: []
          }
        }
        grouped[key].patients.push(apt)
        grouped[key].booked++
      })
      
      console.log('Grouped bookings:', grouped)
      setSlotBookings(Object.values(grouped))
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

  const handleSaveSlot = async () => {
    if (!slotForm.startTime || !slotForm.endTime || !slotForm.capacity) {
      alert('Please fill all fields')
      return
    }
    try {
      if (editingSlot) {
        await fetch(`${API_URL}/admin/appointments/slots/${editingSlot.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(slotForm)
        })
      } else {
        await fetch(`${API_URL}/admin/appointments/doctors/${selectedDoctor.id}/slots`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(slotForm)
        })
      }
      setShowSlotModal(false)
      setEditingSlot(null)
      setSlotForm({ startTime: '09:00', endTime: '17:00', capacity: '5' })
      fetchDoctorSlots(selectedDoctor.id)
    } catch (error) {
      alert('Error saving slot')
    }
  }

  const handleDeleteSlot = async (id) => {
    if (!confirm('Delete this time slot?')) return
    try {
      await fetch(`${API_URL}/admin/appointments/slots/${id}`, { method: 'DELETE' })
      if (calendarDoctor) {
        fetchWeekSlots(calendarDoctor.id)
      } else if (selectedDoctor) {
        fetchDoctorSlots(selectedDoctor.id)
      }
    } catch (error) {
      alert('Error deleting slot')
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

  const getWeekDates = () => {
    if (dateRange.fromDate && dateRange.toDate) {
      const dates = []
      const start = new Date(dateRange.fromDate)
      const end = new Date(dateRange.toDate)
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d))
      }
      return dates
    }
    const today = new Date()
    const week = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      week.push(date)
    }
    return week
  }

  const initializeDateRange = () => {
    const today = new Date()
    const endDate = new Date(today)
    endDate.setDate(today.getDate() + 6)
    setDateRange({
      fromDate: today.toISOString().split('T')[0],
      toDate: endDate.toISOString().split('T')[0]
    })
  }

  const shiftWeek = (direction) => {
    const days = direction === 'prev' ? -7 : 7
    const newFrom = new Date(dateRange.fromDate)
    const newTo = new Date(dateRange.toDate)
    newFrom.setDate(newFrom.getDate() + days)
    newTo.setDate(newTo.getDate() + days)
    setDateRange({
      fromDate: newFrom.toISOString().split('T')[0],
      toDate: newTo.toISOString().split('T')[0]
    })
  }

  const fetchWeekSlots = async (doctorId) => {
    try {
      const res = await fetch(`${API_URL}/admin/appointments/doctors/${doctorId}/slots`)
      const data = await res.json()
      console.log('Week slots data:', data)
      console.log('Time slots:', data.timeSlots)
      console.log('Appointments:', data.appointments)
      setWeekSlots(data.timeSlots || [])
      setWeekAppointments(data.appointments || [])
    } catch (error) {
      console.error(error)
    }
  }

  const handleSaveCalendarSlot = async () => {
    if (!calendarSlotForm.startTime || !calendarSlotForm.endTime || !calendarSlotForm.capacity) {
      alert('Please fill all fields')
      return
    }
    try {
      if (editingCalendarSlot) {
        await fetch(`${API_URL}/admin/appointments/slots/${editingCalendarSlot.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            startTime: calendarSlotForm.startTime,
            endTime: calendarSlotForm.endTime,
            capacity: calendarSlotForm.capacity
          })
        })
      } else if (calendarSlotForm.applyToAll) {
        const week = getWeekDates()
        for (const date of week) {
          await fetch(`${API_URL}/admin/appointments/doctors/${calendarDoctor.id}/slots`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              startTime: calendarSlotForm.startTime,
              endTime: calendarSlotForm.endTime,
              capacity: calendarSlotForm.capacity,
              date: date.toISOString().split('T')[0]
            })
          })
        }
      } else {
        await fetch(`${API_URL}/admin/appointments/doctors/${calendarDoctor.id}/slots`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            startTime: calendarSlotForm.startTime,
            endTime: calendarSlotForm.endTime,
            capacity: calendarSlotForm.capacity,
            date: calendarSlotForm.date
          })
        })
      }
      setShowCalendarSlotModal(false)
      setEditingCalendarSlot(null)
      setCalendarSlotForm({ date: '', startTime: '09:00', endTime: '17:00', capacity: '5', applyToAll: false })
      fetchWeekSlots(calendarDoctor.id)
    } catch (error) {
      alert('Error saving slot')
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
            { id: 'calendar', icon: '📆', label: 'Doctors Calendar' },
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
            {activeTab === 'calendar' && '📆 Doctors Calendar'}
            {activeTab === 'followups' && '📨 Follow-ups'}
          </h2>
          <button onClick={() => activeTab === 'today' ? fetchTodayVisits() : activeTab === 'appointments' ? fetchAppointments() : fetchFollowups()} style={{ padding: '12px 24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
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
                  <th style={{ padding: '16px', textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      Date
                      <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} style={{ padding: '6px', border: '1px solid white', borderRadius: '6px', fontSize: '13px', backgroundColor: '#2563eb', color: 'white' }} />
                      {dateFilter && (
                        <button onClick={() => setDateFilter('')} style={{ padding: '4px 8px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>✕</button>
                      )}
                    </div>
                  </th>
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
                  appointments.filter(apt => !dateFilter || apt.date === dateFilter).map((apt, i) => (
                  <tr key={apt.id} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: i % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                    <td style={{ padding: '16px', textAlign: 'left' }}>👤 {apt.patient_name}</td>
                    <td style={{ padding: '16px', textAlign: 'left' }}>📞 {apt.phone}</td>
                    <td style={{ padding: '16px', textAlign: 'left' }}>🏥 {apt.category}</td>
                    <td style={{ padding: '16px', textAlign: 'left' }}>👨⚕️ {apt.doctor}</td>
                    <td style={{ padding: '16px', textAlign: 'left' }}>📅 {formatDate(apt.date)}</td>
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
                        {(apt.status === 'accepted' || apt.status === 'visited' || apt.status === 'completed' || apt.status === 'rejected') && (
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
        ) : activeTab === 'calendar' ? (
          <div>
            {!calendarDoctor ? (
              <div style={{ backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#1e40af', color: 'white' }}>
                      <th style={{ padding: '16px', textAlign: 'left' }}>Doctor Name</th>
                      <th style={{ padding: '16px', textAlign: 'left' }}>Category</th>
                      <th style={{ padding: '16px', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctors.length === 0 ? (
                      <tr>
                        <td colSpan="3" style={{ padding: '60px', textAlign: 'center', color: '#64748b', fontSize: '16px' }}>
                          📭 No doctors added yet
                        </td>
                      </tr>
                    ) : (
                      doctors.map((doc, i) => (
                        <tr key={doc.id} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: i % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                          <td style={{ padding: '16px', textAlign: 'left' }}>
                            <div style={{ fontWeight: '600', fontSize: '15px' }}>👨⚕️ {doc.name}</div>
                          </td>
                          <td style={{ padding: '16px', textAlign: 'left' }}>
                            <span style={{ padding: '4px 12px', backgroundColor: '#dbeafe', color: '#1e40af', borderRadius: '6px', fontSize: '13px', fontWeight: '600' }}>🏥 {doc.category}</span>
                          </td>
                          <td style={{ padding: '16px', textAlign: 'center' }}>
                            <button onClick={() => { setCalendarDoctor(doc); initializeDateRange(); fetchWeekSlots(doc.id) }} style={{ padding: '8px 16px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
                              📆 View Calendar
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button onClick={() => { setCalendarDoctor(null); setWeekSlots([]); setWeekAppointments([]); setDateRange({ fromDate: '', toDate: '' }) }} style={{ padding: '10px 20px', backgroundColor: '#64748b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
                    ← Back to Doctors
                  </button>
                  <h3 style={{ margin: 0, fontSize: '20px', color: '#1e40af' }}>👨⚕️ {calendarDoctor.name} - Schedule</h3>
                </div>
                <div style={{ marginBottom: '16px', padding: '16px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <label style={{ fontWeight: '600', color: '#475569', fontSize: '14px' }}>📅 From:</label>
                      <input type="date" value={dateRange.fromDate} onChange={(e) => setDateRange({ ...dateRange, fromDate: e.target.value })} style={{ padding: '8px 12px', border: '2px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <label style={{ fontWeight: '600', color: '#475569', fontSize: '14px' }}>📅 To:</label>
                      <input type="date" value={dateRange.toDate} onChange={(e) => setDateRange({ ...dateRange, toDate: e.target.value })} style={{ padding: '8px 12px', border: '2px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' }} />
                    </div>
                    <button onClick={() => shiftWeek('prev')} style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>← Previous Week</button>
                    <button onClick={initializeDateRange} style={{ padding: '8px 16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>This Week</button>
                    <button onClick={() => shiftWeek('next')} style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>Next Week →</button>
                  </div>
                </div>
                {showCalendarSlotModal && (
                  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '16px', width: '500px' }}>
                      <h3 style={{ margin: '0 0 24px 0' }}>{editingCalendarSlot ? 'Edit' : 'Add'} Time Slot</h3>
                      <TimePickerAMPM label="🕐 Start Time" value={calendarSlotForm.startTime} onChange={(val) => setCalendarSlotForm({ ...calendarSlotForm, startTime: val })} />
                      <TimePickerAMPM label="🕐 End Time" value={calendarSlotForm.endTime} onChange={(val) => setCalendarSlotForm({ ...calendarSlotForm, endTime: val })} />
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>👥 Capacity (patients)</label>
                        <input type="number" min="1" max="50" value={calendarSlotForm.capacity} onChange={(e) => setCalendarSlotForm({ ...calendarSlotForm, capacity: e.target.value })} style={{ width: '100%', padding: '12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '15px' }} />
                      </div>
                      {!editingCalendarSlot && (
                        <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f1f5f9', borderRadius: '8px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                            <input type="checkbox" checked={calendarSlotForm.applyToAll} onChange={(e) => setCalendarSlotForm({ ...calendarSlotForm, applyToAll: e.target.checked })} style={{ marginRight: '8px' }} />
                            <span style={{ fontSize: '14px', fontWeight: '600' }}>Apply to all days in the week</span>
                          </label>
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button onClick={() => { setShowCalendarSlotModal(false); setEditingCalendarSlot(null); setCalendarSlotForm({ date: '', startTime: '09:00', endTime: '17:00', capacity: '5', applyToAll: false }) }} style={{ padding: '10px 20px', backgroundColor: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
                        <button onClick={handleSaveCalendarSlot} style={{ padding: '10px 20px', backgroundColor: '#1e40af', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Save</button>
                      </div>
                    </div>
                  </div>
                )}
                <div style={{ backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#1e40af', color: 'white' }}>
                        <th style={{ padding: '16px', textAlign: 'left', width: '200px' }}>Date</th>
                        <th style={{ padding: '16px', textAlign: 'left', width: '150px' }}>Slot Time</th>
                        <th style={{ padding: '16px', textAlign: 'center', width: '100px' }}>Capacity</th>
                        <th style={{ padding: '16px', textAlign: 'center', width: '150px' }}>Actions</th>
                        <th style={{ padding: '16px', textAlign: 'left' }}>Available Seats</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getWeekDates().map((date, idx) => {
                        const dateStr = date.toISOString().split('T')[0]
                        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })
                        const dateDisplay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        const daySlots = weekSlots.filter(slot => slot.date === dateStr)
                        
                        return daySlots.length === 0 ? (
                          <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                            <td style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>
                              {dateDisplay}<br/>
                              <span style={{ fontSize: '13px', color: '#64748b' }}>({dayName})</span>
                            </td>
                            <td colSpan="4" style={{ padding: '16px', textAlign: 'center' }}>
                              <button onClick={() => { setCalendarSlotForm({ ...calendarSlotForm, date: dateStr }); setShowCalendarSlotModal(true) }} style={{ padding: '8px 16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
                                + Add Slot
                              </button>
                            </td>
                          </tr>
                        ) : (
                          daySlots.map((slot, slotIdx) => (
                            <tr key={`${dateStr}-${slot.id}`} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                              {slotIdx === 0 && (
                                <td rowSpan={daySlots.length} style={{ padding: '16px', textAlign: 'left', fontWeight: '600', borderRight: '1px solid #e2e8f0' }}>
                                  {dateDisplay}<br/>
                                  <span style={{ fontSize: '13px', color: '#64748b' }}>({dayName})</span>
                                  <br/>
                                  <button onClick={() => { setCalendarSlotForm({ ...calendarSlotForm, date: dateStr }); setShowCalendarSlotModal(true) }} style={{ marginTop: '8px', padding: '6px 12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}>
                                    + Add Slot
                                  </button>
                                </td>
                              )}
                              <td style={{ padding: '16px', textAlign: 'left' }}>{formatTime12Hour(slot.start_time)} - {formatTime12Hour(slot.end_time)}</td>
                              <td style={{ padding: '16px', textAlign: 'center', fontWeight: '600' }}>{slot.capacity}</td>
                              <td style={{ padding: '16px', textAlign: 'center' }}>
                                <button onClick={() => { setEditingCalendarSlot(slot); setCalendarSlotForm({ date: '', startTime: slot.start_time, endTime: slot.end_time, capacity: slot.capacity.toString(), applyToAll: false }); setShowCalendarSlotModal(true) }} style={{ padding: '6px 12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', marginRight: '6px' }}>Edit</button>
                                <button onClick={() => handleDeleteSlot(slot.id)} style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Delete</button>
                              </td>
                              <td style={{ padding: '16px', textAlign: 'left' }}>
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                  {(() => {
                                    const bookedAppointments = weekAppointments.filter(apt => {
                                      if (apt.date !== dateStr) return false
                                      if (!['pending', 'accepted', 'visited'].includes(apt.status)) return false
                                      
                                      // Normalize times by removing :00, spaces, and [x/y]
                                      const aptTime = apt.time_slot.replace(/\s*\[\d+\/\d+\]\s*$/, '').replace(/:00/g, '').replace(/\s+/g, '').toUpperCase()
                                      const slotStart = formatTime12Hour(slot.start_time).replace(/:00/g, '').replace(/\s+/g, '').toUpperCase()
                                      const slotEnd = formatTime12Hour(slot.end_time).replace(/:00/g, '').replace(/\s+/g, '').toUpperCase()
                                      const slotTimeNorm = `${slotStart}-${slotEnd}`
                                      
                                      return aptTime === slotTimeNorm
                                    })
                                    
                                    console.log(`Slot ${dateStr} ${formatTime12Hour(slot.start_time)}-${formatTime12Hour(slot.end_time)}: ${bookedAppointments.length} bookings`)
                                    
                                    return Array.from({ length: slot.capacity }).map((_, seatIdx) => {
                                      const aptForSeat = bookedAppointments[seatIdx]
                                      const isBooked = !!aptForSeat
                                      
                                      return (
                                        <div key={seatIdx} style={{ 
                                          width: '80px', 
                                          height: '60px', 
                                          border: '2px solid ' + (isBooked ? '#10b981' : '#cbd5e1'), 
                                          borderRadius: '6px', 
                                          display: 'flex', 
                                          flexDirection: 'column',
                                          alignItems: 'center', 
                                          justifyContent: 'center', 
                                          backgroundColor: isBooked ? '#d1fae5' : '#f1f5f9', 
                                          fontSize: '11px', 
                                          color: isBooked ? '#065f46' : '#64748b',
                                          padding: '4px',
                                          fontWeight: isBooked ? '600' : '400'
                                        }}>
                                          {isBooked ? (
                                            <>
                                              <div style={{ fontSize: '10px', fontWeight: '700' }}>#{seatIdx + 1}</div>
                                              <div style={{ fontSize: '10px', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{aptForSeat.patient_name}</div>
                                              <div style={{ fontSize: '9px', padding: '2px 4px', backgroundColor: aptForSeat.status === 'visited' ? '#3b82f6' : aptForSeat.status === 'accepted' ? '#10b981' : '#f59e0b', color: 'white', borderRadius: '3px', marginTop: '2px' }}>
                                                {aptForSeat.status === 'visited' ? 'Visited' : aptForSeat.status === 'accepted' ? 'Accepted' : 'Pending'}
                                              </div>
                                            </>
                                          ) : (
                                            <div style={{ fontSize: '12px' }}>#{seatIdx + 1}</div>
                                          )}
                                        </div>
                                      )
                                    })
                                  })()}
                                </div>
                              </td>
                            </tr>
                          ))
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default Dashboard
