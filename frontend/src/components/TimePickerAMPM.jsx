const TimePickerAMPM = ({ value, onChange, label }) => {
  const parseTime = (time24) => {
    if (!time24) return { hour: '09', minute: '00', period: 'AM' }
    const [h, m] = time24.split(':')
    const hour = parseInt(h)
    return {
      hour: String(hour % 12 || 12).padStart(2, '0'),
      minute: m,
      period: hour >= 12 ? 'PM' : 'AM'
    }
  }

  const to24Hour = (hour, minute, period) => {
    let h = parseInt(hour)
    if (period === 'PM' && h !== 12) h += 12
    if (period === 'AM' && h === 12) h = 0
    return `${String(h).padStart(2, '0')}:${minute}`
  }

  const { hour, minute, period } = parseTime(value)

  const handleChange = (newHour, newMinute, newPeriod) => {
    onChange(to24Hour(newHour || hour, newMinute || minute, newPeriod || period))
  }

  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>
        {label}
      </label>
      <div style={{ display: 'flex', gap: '8px' }}>
        <select value={hour} onChange={(e) => handleChange(e.target.value, minute, period)} style={{ flex: 1, padding: '12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '15px' }}>
          {hours.map(h => <option key={h} value={h}>{h}</option>)}
        </select>
        <span style={{ display: 'flex', alignItems: 'center', fontSize: '18px', fontWeight: '700' }}>:</span>
        <select value={minute} onChange={(e) => handleChange(hour, e.target.value, period)} style={{ flex: 1, padding: '12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '15px' }}>
          {minutes.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={period} onChange={(e) => handleChange(hour, minute, e.target.value)} style={{ padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '15px', fontWeight: '600', backgroundColor: period === 'AM' ? '#dbeafe' : '#fef3c7' }}>
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </div>
  )
}

export default TimePickerAMPM
