import { useTheme } from '@/themes/useTheme'
import DigitalLabExperiment from '@/pages/digital/DigitalLabExperiment'
import StandardLabExperiment from '@/components/standard/pages/StandardLabExperiment'

export default function LabExperiment() {
  const { themeId } = useTheme()
  return themeId === 'standard' ? <StandardLabExperiment /> : <DigitalLabExperiment />
}
