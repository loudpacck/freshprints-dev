import { useTheme } from '@/themes/useTheme'
import DigitalStore from '@/pages/digital/DigitalStore'
import StandardStore from '@/components/standard/pages/StandardStore'

export default function Store() {
  const { themeId } = useTheme()
  return (themeId === 'standard' || themeId === 'retro' || themeId === 'funky') ? <StandardStore /> : <DigitalStore />
}
