import { useTheme } from '@/themes/useTheme'
import DigitalContact from '@/pages/digital/DigitalContact'
import StandardContact from '@/components/standard/pages/StandardContact'

export default function Contact() {
  const { themeId } = useTheme()
  return (themeId === 'standard' || themeId === 'retro') ? <StandardContact /> : <DigitalContact />
}
