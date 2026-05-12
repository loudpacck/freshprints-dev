import { useState } from 'react'
import StandardNav from './StandardNav'
import StandardFooter from './StandardFooter'
import UIPicker from '@/components/ui/UIPicker'

export default function StandardLayout({ children }) {
  const [pickerOpen, setPickerOpen] = useState(false)

  return (
    <div className="s-layout">
      <StandardNav onOpenPicker={() => setPickerOpen(true)} />
      <main id="main-content" className="s-main">
        {children}
      </main>
      <StandardFooter onOpenPicker={() => setPickerOpen(true)} />
      <UIPicker isOpen={pickerOpen} onClose={() => setPickerOpen(false)} />
    </div>
  )
}
