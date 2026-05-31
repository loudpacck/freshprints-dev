import { useTheme } from '@/themes/useTheme'
import DigitalLab from '@/pages/digital/DigitalLab'
import StandardLab from '@/components/standard/pages/StandardLab'

export default function Lab() {
  const { themeId } = useTheme()
  return (themeId === 'standard' || themeId === 'retro' || themeId === 'funky') ? <StandardLab /> : <DigitalLab />
}
