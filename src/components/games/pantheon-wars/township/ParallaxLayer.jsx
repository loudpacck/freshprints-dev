export default function ParallaxLayer({ src, speed, pan, zIndex }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex,
        backgroundImage: `url("${src}")`,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: `calc(50% + ${pan * speed}px) bottom`,
        willChange: 'background-position',
      }}
    />
  )
}
