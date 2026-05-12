export const experiments = [
  {
    slug: 'predictinator',
    name: 'Predictinator',
    shortName: 'PREDICTINATOR',
    status: 'ACTIVE',
    classification: 'LIVE SYSTEM',
    description: 'Live prediction feed with rolling accuracy stats. Pulls from the same model serving the production app.',
    category: 'ai',
    component: 'PredictinatorWidget',
    accentColor: '#00C8FF',
  },
  {
    slug: 'plutus',
    name: 'Plutus Simulator',
    shortName: 'PLUTUS',
    status: 'BETA',
    classification: 'BACKTEST SANDBOX',
    description: 'Run any of the bot strategies against historical data. P&L, win rate, drawdown — all computed in-browser.',
    category: 'software',
    component: 'PlutusSimulator',
    accentColor: '#22C55E',
  },
  {
    slug: 'architect',
    name: 'Architect (Archie)',
    shortName: 'ARCHITECT',
    status: 'CONCEPT',
    classification: 'PROOF OF CONCEPT',
    description: 'Drop an engineering drawing in. AI runs validation against GD&T standards, dimensional consistency, and DFM rules.',
    category: 'ai',
    component: 'ArchitectDemo',
    accentColor: '#8B5CF6',
  },
  {
    slug: 'cad-viewer',
    name: 'CAD Library',
    shortName: 'CAD VIEWER',
    status: 'STABLE',
    classification: 'INTERACTIVE GALLERY',
    description: 'Browse and orbit production CAD models in your browser. Specs, materials, and manufacturing notes included.',
    category: 'engineering',
    component: 'CADViewer',
    accentColor: '#A0A0B8',
  },
]

export function getExperimentBySlug(slug) {
  return experiments.find(e => e.slug === slug) || null
}
