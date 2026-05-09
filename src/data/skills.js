export const skillTiers = {
  disciplines: [
    {
      id: 'mechanical',
      label: 'Mechanical Design',
      color: '#A0A0B8',
      description: 'CAD modeling, manufacturability, prototyping, and end-to-end product design.',
      toolIds: ['solidworks', 'fusion360', 'fdm', 'gdt', 'dfm', 'scanning'],
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
    { id: 'solidworks',  parentId: 'mechanical', label: 'SolidWorks',      proficiency: 'PRODUCTION',   projectLinks: ['fresh-prints-prototypes'] },
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
    { id: 'roblox',      parentId: 'gamedev',    label: 'Roblox',          proficiency: 'PRODUCTION',   projectLinks: ['roblox-arena'] },
    { id: 'luau',        parentId: 'gamedev',    label: 'Luau',            proficiency: 'PRODUCTION',   projectLinks: ['roblox-arena'] },
    { id: 'unreal',      parentId: 'gamedev',    label: 'Unreal Engine 5', proficiency: 'ACTIVE',       projectLinks: ['pantheon'] },
    { id: 'blueprint',   parentId: 'gamedev',    label: 'Blueprint',       proficiency: 'ACTIVE',       projectLinks: ['pantheon'] },
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
    { id: 'reverse-engineering',     parentId: 'fdm',        label: 'Reverse Engineering' },
    { id: 'functional-prototyping',  parentId: 'fdm',        label: 'Functional Prototyping' },
    { id: 'production-parts',        parentId: 'fdm',        label: 'Production-Ready Parts' },
    { id: 'parametric-modeling',     parentId: 'fusion360',  label: 'Parametric Modeling' },
    { id: 'assembly-design',         parentId: 'solidworks', label: 'Assembly Design' },
    { id: 'rest-apis',               parentId: 'fastapi',    label: 'REST API Design' },
    { id: 'realtime-systems',        parentId: 'websockets', label: 'Realtime Systems' },
    { id: 'state-management',        parentId: 'react',      label: 'State Management' },
    { id: 'multiplayer-netcode',     parentId: 'unreal',     label: 'Multiplayer Netcode' },
    { id: 'matchmaking',             parentId: 'roblox',     label: 'Matchmaking Systems' },
    { id: 'classification',          parentId: 'scikit',     label: 'Classification Models' },
    { id: 'computer-vision',         parentId: 'opencv',     label: 'Computer Vision' },
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
