import { useState, useEffect } from 'react'

export function useToast() {
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const ToastContainer = () => {
    if (!toast) return null

    const bgColor = toast.type === 'success' ? '#10b981' : toast.type === 'error' ? '#ef4444' : '#3b82f6'

    return (
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        backgroundColor: bgColor,
        color: 'white',
        padding: '16px 24px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 9999,
        animation: 'slideIn 0.3s ease-out',
        fontWeight: '600'
      }}>
        {toast.message}
      </div>
    )
  }

  return { showToast, ToastContainer }
}

export function useConfirm() {
  const [confirm, setConfirm] = useState(null)

  const showConfirm = (message) => {
    return new Promise((resolve) => {
      setConfirm({ message, resolve })
    })
  }

  const handleConfirm = (result) => {
    if (confirm) {
      confirm.resolve(result)
      setConfirm(null)
    }
  }

  const ConfirmModal = () => {
    if (!confirm) return null

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '32px',
          borderRadius: '16px',
          maxWidth: '400px',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
        }}>
          <p style={{ margin: '0 0 24px 0', fontSize: '16px', color: '#1e293b', lineHeight: '1.5' }}>
            {confirm.message}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => handleConfirm(false)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#e2e8f0',
                color: '#475569',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px'
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => handleConfirm(true)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px'
              }}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    )
  }

  return { showConfirm, ConfirmModal }
}
