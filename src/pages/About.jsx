import { useTheme } from '@/themes/useTheme'
import DigitalAbout from '@/pages/digital/DigitalAbout'
import StandardAbout from '@/components/standard/pages/StandardAbout'

export default function About() {
  const { themeId } = useTheme()
  return (themeId === 'standard' || themeId === 'retro') ? <StandardAbout /> : <DigitalAbout />
}
