import { useParams, Navigate } from 'react-router-dom'
import { useTheme } from '@/themes/useTheme'
import { getExperimentBySlug } from '@/data/labExperiments'
import DigitalLabExperiment from '@/pages/digital/DigitalLabExperiment'
import StandardLabExperiment from '@/components/standard/pages/StandardLabExperiment'

export default function LabExperiment() {
  const { slug } = useParams()
  const { themeId } = useTheme()
  const experiment = getExperimentBySlug(slug)

  if (experiment?.external) return <Navigate to={experiment.externalUrl} replace />

  return (themeId === 'standard' || themeId === 'retro' || themeId === 'funky') ? <StandardLabExperiment /> : <DigitalLabExperiment />
}
