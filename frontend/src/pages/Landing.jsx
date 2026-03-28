import { useNavigate } from 'react-router-dom'

const API_URL = 'http://localhost:3000'
const WHATSAPP_NUMBER = '15551865740'

function Landing() {
  const navigate = useNavigate()
  const doctors = []
  const stats = { appointments: 500, doctors: 20 }

  const openWhatsApp = () => {
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=Hi`, '_blank')
  }

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Hero Section */}
      <div style={{ 
        background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
        color: 'white',
        padding: '80px 20px',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '48px', fontWeight: '700', margin: '0 0 20px 0', lineHeight: '1.2' }}>
            Book Doctor Appointments<br/>via WhatsApp
          </h1>
          <p style={{ fontSize: '24px', margin: '0 0 40px 0', opacity: 0.9 }}>
            Simple. Fast. Convenient. No app downloads required.
          </p>
          <button
            onClick={openWhatsApp}
            style={{
              padding: '18px 48px',
              fontSize: '20px',
              fontWeight: '600',
              backgroundColor: '#25D366',
              color: 'white',
              border: 'none',
              borderRadius: '50px',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(37, 211, 102, 0.4)'
            }}
          >
            📱 Start Booking on WhatsApp
          </button>
          <div style={{ marginTop: '60px', display: 'flex', justifyContent: 'center', gap: '60px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '36px', fontWeight: '700' }}>{stats.appointments}+</div>
              <div style={{ fontSize: '16px', opacity: 0.8 }}>Appointments Booked</div>
            </div>
            <div>
              <div style={{ fontSize: '36px', fontWeight: '700' }}>{stats.doctors}+</div>
              <div style={{ fontSize: '16px', opacity: 0.8 }}>Doctors Available</div>
            </div>
            <div>
              <div style={{ fontSize: '36px', fontWeight: '700' }}>5</div>
              <div style={{ fontSize: '16px', opacity: 0.8 }}>Medical Categories</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div style={{ padding: '80px 20px', backgroundColor: '#f9fafb' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '36px', fontWeight: '700', textAlign: 'center', marginBottom: '60px', color: '#1e293b' }}>
            Why Choose Us?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
            <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>🤖</div>
              <h3 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '12px', color: '#1e293b' }}>AI-Powered Bot</h3>
              <p style={{ fontSize: '16px', color: '#64748b', lineHeight: '1.6' }}>
                Conversational booking in 6 simple steps. Just chat naturally!
              </p>
            </div>
            <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>📅</div>
              <h3 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '12px', color: '#1e293b' }}>Real-Time Availability</h3>
              <p style={{ fontSize: '16px', color: '#64748b', lineHeight: '1.6' }}>
                See available slots instantly. Book what works for you.
              </p>
            </div>
            <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>✅</div>
              <h3 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '12px', color: '#1e293b' }}>Instant Confirmation</h3>
              <p style={{ fontSize: '16px', color: '#64748b', lineHeight: '1.6' }}>
                Get appointment confirmation directly on WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div style={{ padding: '80px 20px', backgroundColor: 'white' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '36px', fontWeight: '700', textAlign: 'center', marginBottom: '60px', color: '#1e293b' }}>
            How It Works
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px' }}>
            {[
              { icon: '📱', title: 'Send "Hi"', desc: 'Message our WhatsApp number' },
              { icon: '🏥', title: 'Choose Category', desc: 'Select medical specialty' },
              { icon: '👨⚕️', title: 'Select Doctor', desc: 'Pick your preferred doctor' },
              { icon: '📅', title: 'Pick Date & Time', desc: 'Choose available slot' },
              { icon: '👤', title: 'Enter Name', desc: 'Provide your details' },
              { icon: '✅', title: 'Get Confirmation', desc: 'Receive instant confirmation' }
            ].map((step, index) => (
              <div key={index} style={{ textAlign: 'center' }}>
                <div style={{ 
                  width: '80px', 
                  height: '80px', 
                  margin: '0 auto 20px', 
                  backgroundColor: '#eff6ff', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '36px'
                }}>
                  {step.icon}
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#1e293b' }}>
                  {index + 1}. {step.title}
                </h3>
                <p style={{ fontSize: '14px', color: '#64748b' }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Doctors Section */}
      {doctors.length > 0 && (
        <div style={{ padding: '80px 20px', backgroundColor: '#f9fafb' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '36px', fontWeight: '700', textAlign: 'center', marginBottom: '60px', color: '#1e293b' }}>
              Our Doctors
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px' }}>
              {doctors.map(doc => (
                <div key={doc.id} style={{ 
                  backgroundColor: 'white', 
                  padding: '30px', 
                  borderRadius: '16px', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  textAlign: 'center'
                }}>
                  <div style={{ 
                    width: '80px', 
                    height: '80px', 
                    margin: '0 auto 20px', 
                    backgroundColor: '#eff6ff', 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: '36px'
                  }}>
                    👨⚕️
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', color: '#1e293b' }}>
                    {doc.name}
                  </h3>
                  <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
                    {doc.category}
                  </p>
                  <button
                    onClick={openWhatsApp}
                    style={{
                      padding: '10px 24px',
                      fontSize: '14px',
                      fontWeight: '600',
                      backgroundColor: '#1e40af',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    Book Appointment
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CTA Section */}
      <div style={{ 
        background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
        color: 'white',
        padding: '80px 20px',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '36px', fontWeight: '700', marginBottom: '20px' }}>
            Ready to Book Your Appointment?
          </h2>
          <p style={{ fontSize: '20px', marginBottom: '40px', opacity: 0.9 }}>
            Start chatting with our bot on WhatsApp now!
          </p>
          <button
            onClick={openWhatsApp}
            style={{
              padding: '18px 48px',
              fontSize: '20px',
              fontWeight: '600',
              backgroundColor: '#25D366',
              color: 'white',
              border: 'none',
              borderRadius: '50px',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(37, 211, 102, 0.4)'
            }}
          >
            📱 Open WhatsApp
          </button>
        </div>
      </div>

      {/* Footer */}
      <div style={{ backgroundColor: '#1e293b', color: 'white', padding: '40px 20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '10px' }}>Hospital Name</h3>
            <p style={{ fontSize: '14px', opacity: 0.8 }}>Quality Healthcare at Your Fingertips</p>
          </div>
          <div style={{ marginBottom: '20px', fontSize: '14px', opacity: 0.8 }}>
            <p>📍 123 Medical Street, City, State 12345</p>
            <p>📞 +91 123 456 7890</p>
            <p>✉️ info@hospital.com</p>
          </div>
          <button
            onClick={() => navigate('/admin')}
            style={{
              padding: '10px 24px',
              fontSize: '14px',
              fontWeight: '600',
              backgroundColor: 'transparent',
              color: 'white',
              border: '2px solid white',
              borderRadius: '8px',
              cursor: 'pointer',
              marginTop: '20px'
            }}
          >
            🔐 Admin Login
          </button>
          <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.2)', fontSize: '14px', opacity: 0.6 }}>
            © 2024 Hospital Name. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  )
}

export default Landing
