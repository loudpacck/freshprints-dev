// CAD models for the Lab CAD Viewer experiment.
// To add a new model: drop the .glb into public/3d_files/, then add an entry here.

export const cadModels = [
  {
    id: '1986-subaru-brat-door-handle',
    name: '1986 Subaru Brat Passenger Internal Door Handle',
    description: 'Description coming soon. CAD model exported from Fusion 360.',
    file: '/3d_files/1986 Subaru Brat Passenger Internal Door Handle.glb',
    source: 'Fusion 360',
    relatedProjectSlug: null,
    thumbnail: null,
  },
  {
    id: 'evergreens-7-iron',
    name: 'EverGreens 7 Iron',
    description: 'Description coming soon. CAD model exported from Fusion 360.',
    file: '/3d_files/EverGreens7Iron.glb',
    source: 'Fusion 360',
    relatedProjectSlug: null,
    thumbnail: null,
  },
  {
    id: 'mighty-max-audio-box',
    name: 'Mitsubishi Mighty Max Behind Seat Audio System Box',
    description: 'Description coming soon. CAD model exported from Fusion 360.',
    file: '/3d_files/Mitsubishi Mighty Max Behind Seat Audio System Box.glb',
    source: 'Fusion 360',
    relatedProjectSlug: null,
    thumbnail: null,
  },
  {
    id: 'touch-led-art',
    name: 'Touch Activated 3.7v LED with Changable Art',
    description: 'Description coming soon. CAD model exported from Fusion 360.',
    file: '/3d_files/Touch Activated 3.7v Rechargable LED with Changable Art.glb',
    source: 'Fusion 360',
    relatedProjectSlug: null,
    thumbnail: null,
  },
  {
    id: 'touch-led-pcb-compact',
    name: 'Touch Activated Compact 3.7v LED PCB',
    description: 'Description coming soon. CAD model exported from KiCAD.',
    file: '/3d_files/Touch Activated Compact 3.7v Rechargable LED PCB with Indicator Lighting.glb',
    source: 'KiCAD',
    relatedProjectSlug: null,
    thumbnail: null,
  },
  {
    id: 'touch-led-pcb-square',
    name: 'Touch Activated Square 3.7v LED PCB',
    description: 'Description coming soon. CAD model exported from KiCAD.',
    file: '/3d_files/Touch Activated Square 3.7v Rechargable LED PCB with Indicator Lighting.glb',
    source: 'KiCAD',
    relatedProjectSlug: null,
    thumbnail: null,
  },
]

export function getModelById(id) {
  return cadModels.find(m => m.id === id)
}
