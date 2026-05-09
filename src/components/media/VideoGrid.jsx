import { AnimatePresence, motion } from 'framer-motion'
import VideoCard from './VideoCard'

export default function VideoGrid({ videos, onPlay }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 'var(--space-6)',
      }}
      className="video-grid"
    >
      <AnimatePresence mode="popLayout">
        {videos.map(video => (
          <motion.div
            key={video.id}
            layout
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <VideoCard video={video} onPlay={onPlay} />
          </motion.div>
        ))}
      </AnimatePresence>

      <style>{`
        @media (max-width: 900px) {
          .video-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 540px) {
          .video-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
