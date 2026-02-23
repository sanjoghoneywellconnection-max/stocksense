import { supabase } from '../supabaseClient'

export default function Dashboard() {
  async function handleLogout() {
    await supabase.auth.signOut()
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-pink rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-2xl">S</span>
        </div>
        <h1 className="text-3xl font-bold text-navy mb-2">StockSense</h1>
        <p className="text-lg mb-8" style={{color: '#7880a4'}}>
          Dashboard coming soon — you are logged in!
        </p>
        <button
          onClick={handleLogout}
          className="px-6 py-3 rounded-xl font-semibold text-white"
          style={{background: '#d63683'}}
        >
          Log Out
        </button>
      </div>
    </div>
  )
}