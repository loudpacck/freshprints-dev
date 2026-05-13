import { useTheme } from '@/themes/useTheme'
import DigitalMedia from '@/pages/digital/DigitalMedia'
import StandardMedia from '@/components/standard/pages/StandardMedia'

export default function Media() {
  const { themeId } = useTheme()
  return themeId === 'standard' ? <StandardMedia /> : <DigitalMedia />
}
