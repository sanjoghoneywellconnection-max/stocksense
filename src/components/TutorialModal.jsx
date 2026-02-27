import { useState } from 'react'
import { X, PlayCircle } from 'lucide-react'

const VIDEOS = {
  english: 'dQw4w9WgXcQ',
  hindi: 'dQw4w9WgXcQ',
}

export default function TutorialModal({ onClose, title = 'Dashboard Training' }) {
  const [lang, setLang] = useState('english')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{background: 'rgba(30,43,113,0.7)', backdropFilter: 'blur(4px)'}}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b"
          style={{borderColor: '#e8e5f0'}}>
          <div className="flex items-center gap-2">
            <PlayCircle size={18} style={{color: '#d63683'}} />
            <h3 className="font-semibold text-navy">{title}</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex rounded-xl overflow-hidden border" style={{borderColor: '#e8e5f0'}}>
              <button onClick={() => setLang('english')}
                className="px-4 py-1.5 text-sm font-semibold transition-all"
                style={{
                  background: lang === 'english' ? '#1e2b71' : 'white',
                  color: lang === 'english' ? 'white' : '#7880a4',
                }}>
                English
              </button>
              <button onClick={() => setLang('hindi')}
                className="px-4 py-1.5 text-sm font-semibold transition-all"
                style={{
                  background: lang === 'hindi' ? '#1e2b71' : 'white',
                  color: lang === 'hindi' ? 'white' : '#7880a4',
                }}>
                हिंदी
              </button>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100">
              <X size={16} style={{color: '#7880a4'}} />
            </button>
          </div>
        </div>

        <div style={{position: 'relative', paddingBottom: '56.25%', height: 0, background: '#000'}}>
          <iframe
            key={lang}
            src={`https://www.youtube.com/embed/${VIDEOS[lang]}?autoplay=1&rel=0`}
            title={`InventSight Tutorial - ${lang}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{
              position: 'absolute', top: 0, left: 0,
              width: '100%', height: '100%', border: 'none',
            }}
          />
        </div>

        <div className="px-5 py-3 flex items-center justify-between"
          style={{background: '#f8f7fc'}}>
          <p className="text-xs" style={{color: '#7880a4'}}>
            Need more help? Contact us at hello@inventsight.in
          </p>
          <button onClick={onClose}
            className="text-xs font-medium px-4 py-2 rounded-xl"
            style={{background: '#e8e5f0', color: '#7880a4'}}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}