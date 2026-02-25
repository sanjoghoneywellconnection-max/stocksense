import { useState } from 'react'
import Layout from '../components/Layout'
import { useOrg } from '../hooks/useOrg'
import CategoriesTab from '../components/settings/CategoriesTab'
import BrandsTab from '../components/settings/BrandsTab'
import WarehousesTab from '../components/settings/WarehousesTab'
import SkusTab from '../components/settings/SkusTab'

const tabs = [
  { id: 'categories', label: 'Categories' },
  { id: 'brands', label: 'Brands' },
  { id: 'warehouses', label: 'Warehouses' },
  { id: 'skus', label: 'SKUs' },
]

export default function Settings() {
  const [activeTab, setActiveTab] = useState('categories')
  const { org, loading } = useOrg()

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-pink border-t-transparent rounded-full animate-spin" />
      </div>
    </Layout>
  )

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-navy">Master Data</h1>
          <p className="text-sm mt-1" style={{color: '#7880a4'}}>
            Set up your categories, brands, warehouses, and SKUs. This data powers all your dashboards.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl mb-6 overflow-x-auto" style={{background: '#f0edf8'}}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-5 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: activeTab === tab.id ? '#1e2b71' : 'transparent',
                color: activeTab === tab.id ? '#fefefd' : '#7880a4',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {org && (
          <>
            {activeTab === 'categories' && <CategoriesTab orgId={org.id} />}
            {activeTab === 'brands' && <BrandsTab orgId={org.id} />}
            {activeTab === 'warehouses' && <WarehousesTab orgId={org.id} />}
            {activeTab === 'skus' && <SkusTab orgId={org.id} />}
          </>
        )}
      </div>
    </Layout>
  )
}