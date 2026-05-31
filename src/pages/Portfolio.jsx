import { useTheme } from '@/themes/useTheme'
import DigitalPortfolio from '@/pages/digital/DigitalPortfolio'
import StandardPortfolio from '@/components/standard/pages/StandardPortfolio'

export default function Portfolio() {
  const { themeId } = useTheme()
  return (themeId === 'standard' || themeId === 'retro' || themeId === 'funky') ? <StandardPortfolio /> : <DigitalPortfolio />
}
