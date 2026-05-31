import { useState } from 'react'
import FunkyNav from './FunkyNav'
import FunkyFooter from './FunkyFooter'
import FunkyBackground from './FunkyBackground'
import FunkyPageTransition from './FunkyPageTransition'
import FunkyCursorPulse from './FunkyCursorPulse'
import UIPicker from '@/components/ui/UIPicker'

export default function FunkyLayout({ children }) {
  const [pickerOpen, setPickerOpen] = useState(false)

  return (
    <div className="funky-layout">
      <FunkyBackground />
      <FunkyCursorPulse />
      <FunkyPageTransition />
      <FunkyNav onOpenPicker={() => setPickerOpen(true)} />
      <main id="main-content" className="funky-main">
        {children}
      </main>
      <FunkyFooter onOpenPicker={() => setPickerOpen(true)} />
      <UIPicker isOpen={pickerOpen} onClose={() => setPickerOpen(false)} />
    </div>
  )
}
