import Layout from '../../components/Layout'

export default function ComingSoon({ title }) {
  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{background: '#fff3ec'}}>
              <span className="text-3xl">🚧</span>
            </div>
            <h1 className="text-2xl font-bold text-navy mb-2">{title}</h1>
            <p style={{color: '#7880a4'}}>This screen is being built. Check back soon.</p>
          </div>
        </div>
      </div>
    </Layout>
  )
}