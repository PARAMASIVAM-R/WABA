import { useState, useEffect, Fragment } from 'react'
import './App.css'

const API_URL = 'http://localhost:3000'

function App() {
  const [activeTab, setActiveTab] = useState('pending')
  const [appointments, setAppointments] = useState([])
  const [doctors, setDoctors] = useState([])
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [timeSlots, setTimeSlots] = useState([])
  const [loading, setLoading] = useState(false)
  const [alternateSlot, setAlternateSlot] = useState({})
  const [rejectReason, setRejectReason] = useState({})

  useEffect(() => {
    if (activeTab === 'doctors') {
      fetchDoctors()
    } else {
      fetchAppointments()
    }
  }, [activeTab])

  const fetchAppointments = async () => {
    setLoading(true)
    try {
      const endpoint = activeTab === 'pending' 
        ? `${API_URL}/admin/appointments/pending`
        : `${API_URL}/appointments`
      const res = await fetch(endpoint)
      const data = await res.json()
      const allAppointments = data.appointments || []
      
      if (activeTab === 'approved') {
        setAppointments(allAppointments.filter(apt => apt.status === 'accepted'))
      } else {
        setAppointments(allAppointments)
      }
    } catch (error) {
      alert('Error fetching appointments')
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
      alert('Error fetching doctors')
    }
    setLoading(false)
  }

  const fetchTimeSlots = async (doctorId) => {
    try {
      const res = await fetch(`${API_URL}/admin/appointments/doctors/${doctorId}/slots`)
      const data = await res.json()
      setTimeSlots(data.slots || [])
    } catch (error) {
      alert('Error fetching time slots')
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

  const handleAlternate = async (id) => {
    const slot = alternateSlot[id]
    if (!slot) {
      alert('Please enter alternate slot')
      return
    }
    try {
      await fetch(`${API_URL}/admin/appointments/${id}/alternate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alternateSlot: slot })
      })
      alert('Alternate slot suggested!')
      fetchAppointments()
    } catch (error) {
      alert('Error suggesting alternate')
    }
  }

  const handleReject = async (id) => {
    const reason = rejectReason[id]
    if (!reason) {
      alert('Please enter rejection reason')
      return
    }
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

  return (
    <div style={{ maxWidth: '90%', margin: '0 auto', minHeight: '100vh', backgroundColor: '#f0f4f8' }}>
      {/* Header */}
      <div style={{ 
        backgroundColor: '#264ac0', 
        color: 'white', 
        padding: '24px 40px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        borderRadius: '0 0 16px 16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '28px' }}>🏥 Appointment Management Dashboard</h1>
          <button 
            onClick={() => activeTab === 'doctors' ? fetchDoctors() : fetchAppointments()}
            style={{ 
              padding: '12px 24px', 
              backgroundColor: 'white',
              color: '#1e40af',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '15px'
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ backgroundColor: 'white', borderBottom: '2px solid #e2e8f0', borderRadius: '16px 16px 0 0', marginTop: '20px' }}>
        <div style={{ padding: '0 40px', display: 'flex', gap: '0' }}>
          <button
            onClick={() => setActiveTab('pending')}
            style={{
              padding: '20px 40px',
              backgroundColor: activeTab === 'pending' ? '#1e40af' : 'transparent',
              color: activeTab === 'pending' ? 'white' : '#64748b',
              border: 'none',
              borderBottom: activeTab === 'pending' ? '4px solid #1e40af' : '4px solid transparent',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '16px'
            }}
          >
            ⏳ Pending
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            style={{
              padding: '20px 40px',
              backgroundColor: activeTab === 'approved' ? '#1e40af' : 'transparent',
              color: activeTab === 'approved' ? 'white' : '#64748b',
              border: 'none',
              borderBottom: activeTab === 'approved' ? '4px solid #1e40af' : '4px solid transparent',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '16px'
            }}
          >
            ✅ Approved
          </button>
          <button
            onClick={() => setActiveTab('doctors')}
            style={{
              padding: '20px 40px',
              backgroundColor: activeTab === 'doctors' ? '#1e40af' : 'transparent',
              color: activeTab === 'doctors' ? 'white' : '#64748b',
              border: 'none',
              borderBottom: activeTab === 'doctors' ? '4px solid #1e40af' : '4px solid transparent',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '16px'
            }}
          >
            👨⚕️ Doctors
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '40px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
            <p style={{ fontSize: '20px' }}>Loading {activeTab === 'doctors' ? 'doctors' : 'appointments'}...</p>
          </div>
        ) : activeTab === 'doctors' ? (
          doctors.length === 0 ? (
            <div style={{ 
              backgroundColor: 'white', 
              padding: '80px 40px', 
              borderRadius: '16px',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <p style={{ fontSize: '20px', color: '#64748b', margin: 0 }}>
                📭 No doctors found
              </p>
            </div>
          ) : (
            <div style={{ backgroundColor: 'white', borderRadius: '16px', overflow: 'auto', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1e40af', color: 'white' }}>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '15px', fontWeight: '600', width: '80px' }}>ID</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '15px', fontWeight: '600', width: '60px' }}>Doctor Name</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '15px', fontWeight: '600', width: '60px' }}>Category</th>
                  </tr>
                </thead>
                <tbody>
                  {doctors.map((doc, index) => (
                    <Fragment key={doc.id}>
                      <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                        <td style={{ padding: '16px', fontSize: '15px', color: '#1e293b', fontWeight: '500', textAlign: 'left' }}>
                          {doc.id}
                        </td>
                        <td style={{ padding: '16px', fontSize: '15px', color: '#1e293b', fontWeight: '500', textAlign: 'left' }}>
                          👨⚕️ {doc.name}
                        </td>
                        <td style={{ padding: '16px', fontSize: '15px', color: '#1e293b', textAlign: 'left' }}>
                          🏥 {doc.category}
                        </td>
                      </tr>
                      <tr style={{ backgroundColor: '#f9fafb' }}>
                        <td colSpan="3" style={{ padding: '16px' }}>
                          <button
                            onClick={() => {
                              if (selectedDoctor?.id === doc.id) {
                                setSelectedDoctor(null)
                                setTimeSlots([])
                              } else {
                                setSelectedDoctor(doc)
                                fetchTimeSlots(doc.id)
                              }
                            }}
                            style={{ 
                              padding: '8px 16px', 
                              backgroundColor: '#3b82f6', 
                              color: 'white', 
                              border: 'none', 
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: '600',
                              fontSize: '13px',
                              marginBottom: selectedDoctor?.id === doc.id ? '12px' : '0'
                            }}
                          >
                            {selectedDoctor?.id === doc.id ? '▲ Hide Slots' : '🕐 View Slots'}
                          </button>
                          {selectedDoctor?.id === doc.id && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '12px' }}>
                              {timeSlots.map(slot => (
                                <div
                                  key={slot.id}
                                  style={{
                                    padding: '12px',
                                    backgroundColor: slot.is_booked ? '#fee2e2' : '#d1fae5',
                                    color: slot.is_booked ? '#991b1b' : '#065f46',
                                    borderRadius: '6px',
                                    textAlign: 'center',
                                    fontSize: '13px',
                                    fontWeight: '600'
                                  }}
                                >
                                  {slot.time}
                                  <div style={{ fontSize: '11px', marginTop: '4px' }}>
                                    {slot.is_booked ? '❌ Booked' : '✅ Available'}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : appointments.length === 0 ? (
          <div style={{ 
            backgroundColor: 'white', 
            padding: '80px 40px', 
            borderRadius: '16px',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <p style={{ fontSize: '20px', color: '#64748b', margin: 0 }}>
              📭 No {activeTab} appointments
            </p>
          </div>
        ) : (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#1e40af', color: 'white' }}>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '15px', fontWeight: '600' }}>Patient</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '15px', fontWeight: '600' }}>Phone</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '15px', fontWeight: '600' }}>Category</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '15px', fontWeight: '600' }}>Doctor</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '15px', fontWeight: '600' }}>Date</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '15px', fontWeight: '600' }}>Time</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '15px', fontWeight: '600' }}>Status</th>
                  {activeTab === 'pending' && (
                    <th style={{ padding: '16px', textAlign: 'center', fontSize: '15px', fontWeight: '600' }}>Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt, index) => (
                  <tr key={apt.id} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                    <td style={{ padding: '16px', fontSize: '15px', color: '#1e293b', fontWeight: '500', textAlign: 'left' }}>
                      👤 {apt.patient_name}
                    </td>
                    <td style={{ padding: '16px', fontSize: '15px', color: '#1e293b', textAlign: 'left' }}>
                      📞 {apt.phone}
                    </td>
                    <td style={{ padding: '16px', fontSize: '15px', color: '#1e293b', textAlign: 'left' }}>
                      🏥 {apt.category}
                    </td>
                    <td style={{ padding: '16px', fontSize: '15px', color: '#1e293b', textAlign: 'left' }}>
                      👨⚕️ {apt.doctor}
                    </td>
                    <td style={{ padding: '16px', fontSize: '15px', color: '#1e293b', textAlign: 'left' }}>
                      📅 {apt.date}
                    </td>
                    <td style={{ padding: '16px', fontSize: '15px', color: '#1e293b', textAlign: 'left' }}>
                      🕐 {apt.time_slot}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'left' }}>
                      <span style={{ 
                        display: 'inline-block',
                        padding: '6px 12px',
                        backgroundColor: apt.status === 'accepted' ? '#d1fae5' : '#fef3c7',
                        color: apt.status === 'accepted' ? '#065f46' : '#92400e',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '600'
                      }}>
                        {apt.status === 'accepted' ? '✅' : '⏳'} {apt.status.toUpperCase()}
                      </span>
                    </td>
                    {activeTab === 'pending' && (
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleAccept(apt.id)}
                            style={{ 
                              padding: '8px 16px', 
                              backgroundColor: '#10b981', 
                              color: 'white', 
                              border: 'none', 
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: '600',
                              fontSize: '13px',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            ✅ Accept
                          </button>
                          <button
                            onClick={() => {
                              const slot = prompt('Enter alternate time (e.g., 10:30 AM):')
                              if (slot) {
                                setAlternateSlot({ ...alternateSlot, [apt.id]: slot })
                                handleAlternate(apt.id)
                              }
                            }}
                            style={{ 
                              padding: '8px 16px', 
                              backgroundColor: '#3b82f6', 
                              color: 'white', 
                              border: 'none', 
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: '600',
                              fontSize: '13px',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            ⏰ Alternate
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Enter rejection reason:')
                              if (reason) {
                                setRejectReason({ ...rejectReason, [apt.id]: reason })
                                handleReject(apt.id)
                              }
                            }}
                            style={{ 
                              padding: '8px 16px', 
                              backgroundColor: '#ef4444', 
                              color: 'white', 
                              border: 'none', 
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: '600',
                              fontSize: '13px',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            ❌ Reject
                          </button>
                        </div>
                      </td>
                    )}
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

export default App
