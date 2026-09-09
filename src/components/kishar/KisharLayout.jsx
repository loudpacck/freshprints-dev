import { useState } from 'react'
import KisharNav from './KisharNav'
import KisharFooter from './KisharFooter'
import UIPicker from '@/components/ui/UIPicker'

export default function KisharLayout({ children }) {
  const [pickerOpen, setPickerOpen] = useState(false)

  return (
    <div className="kishar-layout">
      <KisharNav onOpenPicker={() => setPickerOpen(true)} />
      {/* Width and rhythm come from the .s-container / .s-section copies in
          kishar/tokens.css, not from a hardcoded max-width here. */}
      <main id="main-content" className="kishar-main">
        {children}
      </main>
      <KisharFooter onOpenPicker={() => setPickerOpen(true)} />
      <UIPicker isOpen={pickerOpen} onClose={() => setPickerOpen(false)} />
    </div>
  )
}
