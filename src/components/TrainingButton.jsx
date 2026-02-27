import { useState } from 'react'
import { PlayCircle } from 'lucide-react'
import TutorialModal from './TutorialModal'

export default function TrainingButton({ title = 'Dashboard Training' }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all hover:shadow-sm"
        style={{
          borderColor: '#e8e5f0', color: '#7880a4',
          background: 'white', whiteSpace: 'nowrap',
        }}>
        <PlayCircle size={15} style={{color: '#d63683'}} />
        {title}
      </button>
      {open && <TutorialModal onClose={() => setOpen(false)} title={title} />}
    </>
  )
}