import { useState } from 'react'
import RetroToolbar from './RetroToolbar'
import RetroStatusBar from './RetroStatusBar'
import RetroFooter from './RetroFooter'
import UIPicker from '@/components/ui/UIPicker'

export default function RetroLayout({ children }) {
  const [pickerOpen, setPickerOpen] = useState(false)

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-base)',
    }}>
      <RetroToolbar onOpenPicker={() => setPickerOpen(true)} />

      <main
        id="main-content"
        style={{
          flex: 1,
          maxWidth: 1280,
          width: '100%',
          margin: '12px auto',
          padding: '0 12px 12px',
          background: 'var(--bg-elevated)',
          boxShadow: `
            inset 2px 2px 0 var(--bevel-highlight),
            inset -2px -2px 0 var(--bevel-dark),
            inset 4px 4px 0 var(--bevel-light),
            inset -4px -4px 0 var(--bevel-shadow),
            var(--shadow-window)
          `,
        }}
      >
        {children}
      </main>

      <RetroFooter />

      <RetroStatusBar onOpenPicker={() => setPickerOpen(true)} />

      <UIPicker isOpen={pickerOpen} onClose={() => setPickerOpen(false)} />
    </div>
  )
}
