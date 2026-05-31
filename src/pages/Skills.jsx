import { useTheme } from '@/themes/useTheme'
import DigitalSkills from '@/pages/digital/DigitalSkills'
import StandardSkills from '@/components/standard/pages/StandardSkills'

export default function Skills() {
  const { themeId } = useTheme()
  return (themeId === 'standard' || themeId === 'retro' || themeId === 'funky') ? <StandardSkills /> : <DigitalSkills />
}
