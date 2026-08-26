import { useParams, Navigate } from 'react-router-dom'
import { useTheme } from '@/themes/useTheme'
import { getExperimentBySlug } from '@/data/labExperiments'
import DigitalLabExperiment from '@/pages/digital/DigitalLabExperiment'
import StandardLabExperiment from '@/components/standard/pages/StandardLabExperiment'

// Experiments retired from the Lab in Phase 4 — the simulated widgets are gone,
// so these slugs hand off to the project's Portfolio page (real screenshots)
// rather than 404ing on old links.
const RETIRED_TO_PORTFOLIO = {
  predictinator: '/portfolio/predictinator-5000',
  plutus: '/portfolio/plutus',
  architect: '/portfolio/architect',
}

export default function LabExperiment() {
  const { slug } = useParams()
  const { themeId } = useTheme()
  const experiment = getExperimentBySlug(slug)

  if (RETIRED_TO_PORTFOLIO[slug]) return <Navigate to={RETIRED_TO_PORTFOLIO[slug]} replace />
  if (experiment?.external) return <Navigate to={experiment.externalUrl} replace />

  return (themeId === 'standard' || themeId === 'retro' || themeId === 'funky') ? <StandardLabExperiment /> : <DigitalLabExperiment />
}
