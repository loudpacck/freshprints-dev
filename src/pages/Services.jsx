import { useTheme } from '@/themes/useTheme'
import DigitalServices from '@/pages/digital/DigitalServices'
import StandardServices from '@/components/standard/pages/StandardServices'

export default function Services() {
  const { themeId } = useTheme()
  return (themeId === 'standard' || themeId === 'retro' || themeId === 'funky') ? <StandardServices /> : <DigitalServices />
}
