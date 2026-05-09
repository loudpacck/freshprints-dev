import { useLocation } from 'react-router-dom'
import HubReturnButton from './HubReturnButton'

const HIDDEN_ON = ['/', '/hub']

export default function PageChrome() {
  const { pathname } = useLocation()
  if (HIDDEN_ON.includes(pathname)) return null
  return <HubReturnButton />
}
