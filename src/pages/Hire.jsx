import { useTheme } from '@/themes/useTheme'
import DigitalHire from '@/pages/digital/DigitalHire'
import StandardHire from '@/components/standard/pages/StandardHire'

export default function Hire() {
  const { themeId } = useTheme()
  return (themeId === 'standard' || themeId === 'retro' || themeId === 'funky') ? <StandardHire /> : <DigitalHire />
}
