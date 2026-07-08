import { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// Extracted from Hub.jsx so the three.js chunk loads async (lazy import in Hub)
// instead of riding in the Hub route chunk's synchronous graph.

function CameraInit() {
  const { camera } = useThree()
  useEffect(() => { camera.lookAt(0, 0, 0) }, [camera])
  return null
}

function WireframeGrid({ reduced }) {
  const meshRef = useRef()

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(44, 44, 28, 28)
    const pos = geo.attributes.position.array
    for (let i = 0; i < pos.length / 3; i++) {
      pos[i * 3 + 2] = Math.sin(pos[i * 3] * 0.38) * Math.cos(pos[i * 3 + 1] * 0.38) * 0.7
    }
    geo.computeVertexNormals()
    return geo
  }, [])

  useFrame((_, delta) => {
    if (!meshRef.current || reduced) return
    meshRef.current.rotation.z += (delta * Math.PI * 2) / 60
  })

  return (
    <mesh ref={meshRef} geometry={geometry} rotation={[-Math.PI / 2.3, 0, 0]} position={[0, -5, 0]}>
      <meshBasicMaterial color={0x00C8FF} wireframe transparent opacity={0.09} />
    </mesh>
  )
}

export default function HubBackground({ reduced }) {
  return (
    <Canvas
      style={{ position: 'fixed', inset: 0, zIndex: 0 }}
      camera={{ position: [0, 8, 14], fov: 50 }}
      frameloop={reduced ? 'demand' : 'always'}
      gl={{ antialias: false, alpha: true }}
    >
      <CameraInit />
      <WireframeGrid reduced={reduced} />
    </Canvas>
  )
}
