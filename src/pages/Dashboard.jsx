import Layout from '../components/Layout'
import { useOrg } from '../hooks/useOrg'
import { Package, AlertTriangle, TrendingUp, Warehouse } from 'lucide-react'

export default function Dashboard() {
  const { org } = useOrg()

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy">
            Welcome to InventSight
          </h1>
          <p className="text-sm mt-1" style={{color: '#7880a4'}}>
            {org?.name} · Dashboard is being built. Master data and sales entry are ready.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-5 mb-8">
          {[
            { icon: Package, label: 'SKUs', desc: 'Go to Settings to add your SKUs', color: '#d63683', link: '/settings' },
            { icon: AlertTriangle, label: 'Reorder Planner', desc: 'Coming in Session 9', color: '#f97316', link: '#' },
            { icon: TrendingUp, label: 'Trends', desc: 'Coming in Session 11', color: '#0f9b58', link: '#' },
            { icon: Warehouse, label: 'Warehouse Map', desc: 'Coming in Session 12', color: '#1e2b71', link: '#' },
          ].map(({ icon: Icon, label, desc, color, link }) => (
            <a key={label} href={link}
              className="bg-white rounded-2xl border p-6 flex items-start gap-4 hover:shadow-md transition-shadow"
              style={{borderColor: '#e8e5f0'}}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{background: color + '15'}}>
                <Icon size={22} style={{color}} />
              </div>
              <div>
                <p className="font-semibold text-navy">{label}</p>
                <p className="text-xs mt-1" style={{color: '#7880a4'}}>{desc}</p>
              </div>
            </a>
          ))}
        </div>

        <div className="bg-white rounded-2xl border p-6" style={{borderColor: '#e8e5f0'}}>
          <h2 className="font-semibold text-navy mb-4">Quick Links</h2>
          <div className="flex gap-3 flex-wrap">
            <a href="/settings" className="px-4 py-2 rounded-xl text-sm font-medium text-white" style={{background: '#d63683'}}>
              → Master Data Setup
            </a>
            <a href="/sales" className="px-4 py-2 rounded-xl text-sm font-medium text-white" style={{background: '#1e2b71'}}>
              → Daily Sales Entry
            </a>
          </div>
        </div>
      </div>
    </Layout>
  )
}