import { useTheme } from '@/themes/useTheme'
import DigitalProjectPage from '@/pages/digital/DigitalProjectPage'
import StandardProjectPage from '@/components/standard/pages/StandardProjectPage'

export default function ProjectPage() {
  const { themeId } = useTheme()
  return themeId === 'standard' ? <StandardProjectPage /> : <DigitalProjectPage />
}
