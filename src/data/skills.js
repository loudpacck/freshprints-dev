export const skillTiers = {
  disciplines: [
    {
      id: 'mechanical',
      label: 'Mechanical Design',
      color: '#A0A0B8',
      description: 'CAD modeling, manufacturability, prototyping, and end-to-end product design.',
      toolIds: ['siemens-nx', 'fusion360', 'fdm', 'gdt', 'dfm', 'scanning'],
    },
    {
      id: 'software',
      label: 'Software Engineering',
      color: '#00C8FF',
      description: 'Full-stack systems, APIs, and production web apps.',
      toolIds: ['python', 'fastapi', 'react', 'vite', 'postgresql', 'websockets'],
    },
    {
      id: 'gamedev',
      label: 'Game Development',
      color: '#FFB347',
      description: 'Multiplayer systems, custom mechanics, and shipped games.',
      toolIds: ['roblox', 'unreal', 'blueprint', 'cpp', 'luau'],
    },
    {
      id: 'ai',
      label: 'AI & Automation',
      color: '#8B5CF6',
      description: 'ML pipelines, AI-assisted tooling, and intelligent workflows.',
      toolIds: ['scikit', 'pytorch', 'opencv', 'llm-workflows', 'ml-pipelines'],
    },
    {
      id: 'content',
      label: 'Content Creation',
      color: '#FBBF24',
      description: 'Video production, thumbnails, and devlog content.',
      toolIds: ['youtube', 'video-editing', 'thumbnail-design', 'devlogs'],
    },
  ],

  tools: [
    // Mechanical
    { id: 'siemens-nx',  parentId: 'mechanical', label: 'Siemens NX',      proficiency: 'PRODUCTION',   projectLinks: ['fresh-prints-prototypes'] },
    { id: 'fusion360',   parentId: 'mechanical', label: 'Fusion 360',      proficiency: 'PRODUCTION',   projectLinks: ['fresh-prints-prototypes'] },
    { id: 'fdm',         parentId: 'mechanical', label: 'FDM Printing',    proficiency: 'PRODUCTION',   projectLinks: ['fresh-prints-prototypes'] },
    { id: 'gdt',         parentId: 'mechanical', label: 'GD&T',            proficiency: 'PROFESSIONAL', projectLinks: ['fresh-prints-prototypes'] },
    { id: 'dfm',         parentId: 'mechanical', label: 'DFM',             proficiency: 'PROFESSIONAL', projectLinks: ['fresh-prints-prototypes'] },
    { id: 'scanning',    parentId: 'mechanical', label: '3D Scanning',     proficiency: 'PROFESSIONAL', projectLinks: ['fresh-prints-prototypes'] },

    // Software
    { id: 'python',      parentId: 'software',   label: 'Python',          proficiency: 'PRODUCTION',   projectLinks: ['predictinator-5000', 'plutus', 'architect'] },
    { id: 'fastapi',     parentId: 'software',   label: 'FastAPI',         proficiency: 'PRODUCTION',   projectLinks: ['predictinator-5000', 'plutus', 'architect'] },
    { id: 'react',       parentId: 'software',   label: 'React',           proficiency: 'PRODUCTION',   projectLinks: ['predictinator-5000', 'plutus'] },
    { id: 'vite',        parentId: 'software',   label: 'Vite',            proficiency: 'PRODUCTION',   projectLinks: ['predictinator-5000', 'plutus'] },
    { id: 'postgresql',  parentId: 'software',   label: 'PostgreSQL',      proficiency: 'PROFESSIONAL', projectLinks: ['predictinator-5000', 'plutus'] },
    { id: 'websockets',  parentId: 'software',   label: 'WebSockets',      proficiency: 'PROFESSIONAL', projectLinks: ['plutus'] },

    // Game Dev
    { id: 'roblox',      parentId: 'gamedev',    label: 'Roblox',          proficiency: 'PRODUCTION',   projectLinks: ['hot-potato'] },
    { id: 'luau',        parentId: 'gamedev',    label: 'Luau',            proficiency: 'PRODUCTION',   projectLinks: ['hot-potato'] },
    { id: 'unreal',      parentId: 'gamedev',    label: 'Unreal Engine 5', proficiency: 'ACTIVE',       projectLinks: ['pantheon', 'jogger'] },
    { id: 'blueprint',   parentId: 'gamedev',    label: 'Blueprint',       proficiency: 'ACTIVE',       projectLinks: ['pantheon', 'jogger'] },
    { id: 'cpp',         parentId: 'gamedev',    label: 'C++',             proficiency: 'ACTIVE',       projectLinks: ['pantheon'] },

    // AI
    { id: 'scikit',        parentId: 'ai', label: 'scikit-learn',  proficiency: 'PRODUCTION',   projectLinks: ['predictinator-5000'] },
    { id: 'pytorch',       parentId: 'ai', label: 'PyTorch',       proficiency: 'PROFESSIONAL', projectLinks: ['architect'] },
    { id: 'opencv',        parentId: 'ai', label: 'OpenCV',        proficiency: 'PROFESSIONAL', projectLinks: ['architect'] },
    { id: 'llm-workflows', parentId: 'ai', label: 'LLM Workflows', proficiency: 'PRODUCTION',   projectLinks: [] },
    { id: 'ml-pipelines',  parentId: 'ai', label: 'ML Pipelines',  proficiency: 'PROFESSIONAL', projectLinks: ['predictinator-5000'] },

    // Content
    { id: 'youtube',          parentId: 'content', label: 'YouTube',          proficiency: 'ACTIVE',       projectLinks: [] },
    { id: 'video-editing',    parentId: 'content', label: 'Video Editing',    proficiency: 'PROFESSIONAL', projectLinks: [] },
    { id: 'thumbnail-design', parentId: 'content', label: 'Thumbnail Design', proficiency: 'PROFESSIONAL', projectLinks: [] },
    { id: 'devlogs',          parentId: 'content', label: 'Devlogs',          proficiency: 'ACTIVE',       projectLinks: [] },
  ],

  specializations: [
    // ── Mechanical ──
    { id: 'reverse-engineering', parentId: 'fdm', label: 'Reverse Engineering',
      projectLinks: ['fresh-prints-prototypes'],
      projectUsage: { 'fresh-prints-prototypes': 'Rebuilds clean CAD from scanned or measured legacy parts for reproduction and improvement.' } },
    { id: 'functional-prototyping', parentId: 'fdm', label: 'Functional Prototyping',
      projectLinks: ['fresh-prints-prototypes'],
      projectUsage: { 'fresh-prints-prototypes': 'Prints test-fit and load-bearing prototypes to validate designs before manufacturing.' } },
    { id: 'production-parts', parentId: 'fdm', label: 'Production-Ready Parts',
      projectLinks: ['fresh-prints-prototypes'],
      projectUsage: { 'fresh-prints-prototypes': 'Produces end-use components in production-grade filament for small-batch runs.' } },
    { id: 'parametric-modeling', parentId: 'fusion360', label: 'Parametric Modeling',
      projectLinks: ['fresh-prints-prototypes'],
      projectUsage: { 'fresh-prints-prototypes': 'Builds fully parametric models so dimensions flex cleanly across client revisions.' } },
    { id: 'assembly-design', parentId: 'siemens-nx', label: 'Assembly Design',
      projectLinks: ['fresh-prints-prototypes'],
      projectUsage: { 'fresh-prints-prototypes': 'Models multi-part assemblies with mating constraints for production tooling and fixtures.' } },
    { id: 'tolerance-analysis', parentId: 'gdt', label: 'Tolerance Analysis',
      projectLinks: ['fresh-prints-prototypes'],
      projectUsage: { 'fresh-prints-prototypes': 'Specifies datums and tolerances so parts assemble correctly across manufacturing variation.' } },
    { id: 'dfm-review', parentId: 'dfm', label: 'Manufacturability Review',
      projectLinks: ['fresh-prints-prototypes'],
      projectUsage: { 'fresh-prints-prototypes': 'Reviews geometry for moldability and printability to cut cost and failure rate before production.' } },
    { id: 'mesh-reconstruction', parentId: 'scanning', label: 'Mesh Reconstruction',
      projectLinks: ['fresh-prints-prototypes'],
      projectUsage: { 'fresh-prints-prototypes': 'Converts 3D-scan point clouds into clean, editable surfaces ready for CAD.' } },

    // ── Software ──
    { id: 'data-processing', parentId: 'python', label: 'Data Processing',
      projectLinks: ['predictinator-5000', 'plutus', 'architect'],
      projectUsage: {
        'predictinator-5000': 'Cleans and feature-engineers raw game data into the model-ready datasets the engine trains on.',
        'plutus': 'Powers the backtesting harness that replays historical market data against trading strategies.',
        'architect': 'Pre-processes scanned drawings into normalized inputs before they reach the validation models.' } },
    { id: 'rest-apis', parentId: 'fastapi', label: 'REST API Design',
      projectLinks: ['predictinator-5000', 'plutus', 'architect'],
      projectUsage: {
        'predictinator-5000': 'Serves prediction and model-scoring endpoints the React dashboard polls for live forecasts.',
        'plutus': 'Exposes the trade-execution and portfolio endpoints bridging the strategy engine and the UI.',
        'architect': 'Provides the upload-and-validate API that returns drawing-compliance results to the client.' } },
    { id: 'state-management', parentId: 'react', label: 'State Management',
      projectLinks: ['predictinator-5000', 'plutus'],
      projectUsage: {
        'predictinator-5000': 'Manages the live prediction feed and filter state so league views update without full reloads.',
        'plutus': 'Coordinates real-time portfolio, order, and simulation state across the trading dashboard.' } },
    { id: 'build-tooling', parentId: 'vite', label: 'Build Tooling',
      projectLinks: ['predictinator-5000', 'plutus'],
      projectUsage: {
        'predictinator-5000': 'Drives the fast dev server and optimized production bundle for the analytics dashboard.',
        'plutus': 'Handles HMR and code-splitting so the data-heavy trading UI stays responsive in development.' } },
    { id: 'schema-design', parentId: 'postgresql', label: 'Schema Design',
      projectLinks: ['predictinator-5000', 'plutus'],
      projectUsage: {
        'predictinator-5000': 'Stores historical games, model outputs, and accuracy tracking across all four leagues.',
        'plutus': 'Persists trade history, strategy configs, and simulation runs for later analysis.' } },
    { id: 'realtime-systems', parentId: 'websockets', label: 'Realtime Systems',
      projectLinks: ['plutus'],
      projectUsage: { 'plutus': 'Streams live price ticks and order-fill events to the dashboard with sub-second latency.' } },

    // ── Game Dev ──
    { id: 'matchmaking', parentId: 'roblox', label: 'Matchmaking Systems',
      projectLinks: ['hot-potato'],
      projectUsage: { 'hot-potato': 'Places players into rounds and balances live lobbies for the 2,000+ monthly active players.' } },
    { id: 'gameplay-scripting', parentId: 'luau', label: 'Gameplay Scripting',
      projectLinks: ['hot-potato'],
      projectUsage: { 'hot-potato': 'Implements the round timer, hot-potato pass mechanic, and elimination logic server-side.' } },
    { id: 'multiplayer-netcode', parentId: 'unreal', label: 'Multiplayer Netcode',
      projectLinks: ['pantheon'],
      projectUsage: { 'pantheon': 'Replicates player movement and combat state across clients in the UE5 build.' } },
    { id: 'gameplay-systems', parentId: 'unreal', label: 'Gameplay Systems',
      projectLinks: ['pantheon', 'jogger'],
      projectUsage: {
        'pantheon': 'Builds the core combat, ability, and progression loops in UE5.',
        'jogger': 'Drives the endless-runner spawn, scoring, and difficulty-ramp systems.' } },
    { id: 'visual-scripting', parentId: 'blueprint', label: 'Visual Scripting',
      projectLinks: ['pantheon', 'jogger'],
      projectUsage: {
        'pantheon': 'Prototypes UI flows and ability logic visually before porting hot paths to C++.',
        'jogger': 'Wires up input, scoring, and game-over flow without leaving the editor.' } },
    { id: 'engine-programming', parentId: 'cpp', label: 'Engine Programming',
      projectLinks: ['pantheon'],
      projectUsage: { 'pantheon': 'Implements performance-critical combat and networking systems beneath the Blueprint layer.' } },

    // ── AI ──
    { id: 'classification', parentId: 'scikit', label: 'Classification Models',
      projectLinks: ['predictinator-5000'],
      projectUsage: { 'predictinator-5000': 'Trains the win/loss classifiers that produce per-game probabilities across four leagues.' } },
    { id: 'model-training', parentId: 'pytorch', label: 'Model Training',
      projectLinks: ['architect'],
      projectUsage: { 'architect': 'Trains the neural models that detect and classify features in engineering drawings.' } },
    { id: 'computer-vision', parentId: 'opencv', label: 'Computer Vision',
      projectLinks: ['architect'],
      projectUsage: { 'architect': 'Extracts dimensions, symbols, and geometry from drawing images for downstream validation.' } },
    { id: 'pipeline-orchestration', parentId: 'ml-pipelines', label: 'Pipeline Orchestration',
      projectLinks: ['predictinator-5000'],
      projectUsage: { 'predictinator-5000': 'Automates the ingest → train → evaluate → deploy cycle that keeps models current weekly.' } },
    { id: 'prompt-engineering', parentId: 'llm-workflows', label: 'Prompt Engineering',
      projectLinks: [],
      projectUsage: {} },

    // ── Content ──
    { id: 'channel-production', parentId: 'youtube', label: 'Channel Production',
      projectLinks: [], projectUsage: {} },
    { id: 'post-production', parentId: 'video-editing', label: 'Post-Production',
      projectLinks: [], projectUsage: {} },
    { id: 'thumbnail-craft', parentId: 'thumbnail-design', label: 'Thumbnail Craft',
      projectLinks: [], projectUsage: {} },
    { id: 'devlog-production', parentId: 'devlogs', label: 'Devlog Production',
      projectLinks: [], projectUsage: {} },
  ],
}

export function getToolsForDiscipline(disciplineId) {
  return skillTiers.tools.filter(t => t.parentId === disciplineId)
}

export function getSpecializationsForTool(toolId) {
  return skillTiers.specializations.filter(s => s.parentId === toolId)
}

export function getDiscipline(id) {
  return skillTiers.disciplines.find(d => d.id === id)
}

export function getSpecialization(id) {
  return skillTiers.specializations.find(s => s.id === id)
}

export function getProjectsForSpec(specId) {
  const spec = skillTiers.specializations.find(s => s.id === specId)
  return spec ? spec.projectLinks : []
}
