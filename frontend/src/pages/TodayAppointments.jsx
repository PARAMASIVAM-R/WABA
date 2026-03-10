import { useState, useEffect } from 'react'

const API_URL = 'http://localhost:3000'

function TodayAppointments() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchTodayBookings()
  }, [])

  const fetchTodayBookings = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/admin/appointments/today`)
      const data = await res.json()
      console.log('Today bookings data:', data)
      console.log('Bookings array:', data.bookings || data.appointments)
      setBookings(data.bookings || data.appointments || [])
    } catch (error) {
      console.error(error)
    }
    setLoading(false)
  }

  const handleMarkVisited = async (id) => {
    if (!confirm('Mark this patient as visited?')) return
    try {
      await fetch(`${API_URL}/admin/appointments/${id}/visited`, { method: 'POST' })
      alert('Marked as visited!')
      fetchTodayBookings()
    } catch (error) {
      alert('Error marking as visited')
    }
  }

  const handleMarkNoShow = async (id) => {
    if (!confirm('Mark this patient as Not Visited? A reschedule message will be sent.')) return
    try {
      await fetch(`${API_URL}/admin/appointments/${id}/no-show`, { method: 'POST' })
      alert('Marked as Not Visited and message sent!')
      fetchTodayBookings()
    } catch (error) {
      alert('Error marking as not visited')
    }
  }

  const isAppointmentPassed = (timeSlot) => {
    console.log('Checking time slot:', timeSlot)
    const [, endTime] = timeSlot.split('-').map(t => t.trim())
    console.log('End time:', endTime)
    const isPM = endTime.toLowerCase().includes('pm')
    const isAM = endTime.toLowerCase().includes('am')
    let [hours, minutes] = endTime.replace(/[apm\s]/gi, '').split(':').map(Number)
    
    if (isPM && hours !== 12) hours += 12
    if (isAM && hours === 12) hours = 0
    
    const now = new Date()
    const appointmentEnd = new Date()
    appointmentEnd.setHours(hours, minutes || 0, 0, 0)
    console.log('Now:', now, 'Appointment end:', appointmentEnd, 'Passed:', now > appointmentEnd)
    return now > appointmentEnd
  }

  const groupedBySession = bookings.reduce((acc, booking) => {
    const key = `${booking.doctor} - ${booking.time_slot}`
    if (!acc[key]) acc[key] = []
    acc[key].push(booking)
    return acc
  }, {})

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f0f4f8' }}>
      <div style={{ width: '260px', backgroundColor: '#1e293b', color: 'white', padding: '24px 0' }}>
        <div style={{ padding: '0 24px', marginBottom: '40px' }}>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>🏥 Today's Appointments</h1>
        </div>
        <nav>
          <a href="/" style={{ display: 'block', width: '100%', padding: '16px 24px', color: 'white', textDecoration: 'none', fontWeight: '600', fontSize: '15px' }}>
            ← Back to Dashboard
          </a>
        </nav>
      </div>

      <div style={{ flex: 1, padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
          <h2 style={{ margin: 0, fontSize: '28px', color: '#1e293b', fontWeight: '700' }}>
            📅 Today's Appointments ({bookings.length})
          </h2>
          <button onClick={fetchTodayBookings} style={{ padding: '12px 24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
            🔄 Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>Loading...</div>
        ) : bookings.length === 0 ? (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '60px', textAlign: 'center', color: '#64748b', fontSize: '16px' }}>
            📭 No appointments for today
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {Object.entries(groupedBySession).map(([session, sessionBookings]) => (
              <div key={session} style={{ backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <div style={{ backgroundColor: '#1e40af', color: 'white', padding: '16px 24px', fontWeight: '700', fontSize: '16px' }}>
                  {session}
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: '14px 24px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Token</th>
                      <th style={{ padding: '14px 24px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Patient Name</th>
                      <th style={{ padding: '14px 24px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Phone</th>
                      <th style={{ padding: '14px 24px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Category</th>
                      <th style={{ padding: '14px 24px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Status</th>
                      <th style={{ padding: '14px 24px', textAlign: 'center', fontWeight: '600', color: '#475569' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessionBookings.map((booking, i) => (
                      <tr key={booking.id} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: i % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                        <td style={{ padding: '16px 24px', fontWeight: '700', color: '#1e40af' }}>🎫 {booking.token_id}</td>
                        <td style={{ padding: '16px 24px' }}>👤 {booking.patient_name}</td>
                        <td style={{ padding: '16px 24px' }}>📞 {booking.phone}</td>
                        <td style={{ padding: '16px 24px' }}>🏥 {booking.category}</td>
                        <td style={{ padding: '16px 24px' }}>
                          <span style={{ 
                            padding: '6px 12px', 
                            backgroundColor: booking.status === 'visited' ? '#d1fae5' : booking.status === 'no_show' ? '#fee2e2' : '#fef3c7', 
                            color: booking.status === 'visited' ? '#065f46' : booking.status === 'no_show' ? '#991b1b' : '#92400e', 
                            borderRadius: '6px', 
                            fontSize: '13px', 
                            fontWeight: '600' 
                          }}>
                            {booking.status === 'visited' ? '✅ Visited' : booking.status === 'no_show' ? '❌ No Show' : '⏳ Pending'}
                          </span>
                        </td>
                        <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                          {(booking.status === 'active' || booking.status === 'confirmed') && (
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                              <button 
                                onClick={() => handleMarkVisited(booking.id)} 
                                style={{ 
                                  padding: '8px 16px', 
                                  backgroundColor: '#10b981', 
                                  color: 'white', 
                                  border: 'none', 
                                  borderRadius: '6px', 
                                  cursor: 'pointer', 
                                  fontWeight: '600', 
                                  fontSize: '13px' 
                                }}
                              >
                                ✅ Mark Visited
                              </button>
                              {isAppointmentPassed(booking.time_slot) && (
                                <button 
                                  onClick={() => handleMarkNoShow(booking.id)} 
                                  style={{ 
                                    padding: '8px 16px', 
                                    backgroundColor: '#ef4444', 
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '6px', 
                                    cursor: 'pointer', 
                                    fontWeight: '600', 
                                    fontSize: '13px' 
                                  }}
                                >
                                  ❌ Not Visited
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default TodayAppointments
