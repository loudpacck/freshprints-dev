import { tracker } from './Tracker'

export function useTracker() {
  return { track: tracker.track.bind(tracker), flush: tracker.flush.bind(tracker) }
}
