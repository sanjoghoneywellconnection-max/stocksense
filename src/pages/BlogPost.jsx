import { useNavigate, useParams } from 'react-router-dom'
import { BLOG_POSTS } from './Blog'

export default function BlogPost() {
  const navigate = useNavigate()
  const { slug } = useParams()
  const post = BLOG_POSTS.find(p => p.slug === slug)

  if (!post) return (
    <div style={{fontFamily: "'DM Sans', sans-serif", minHeight: '100vh', background: '#fefefd', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{textAlign: 'center'}}>
        <p style={{fontSize: '48px', marginBottom: '16px'}}>📭</p>
        <h2 style={{fontFamily: 'Sora, sans-serif', color: '#1e2b71', marginBottom: '12px'}}>Article not found</h2>
        <button onClick={() => navigate('/blog')}
          style={{background: '#d63683', border: 'none', color: 'white', padding: '12px 24px', borderRadius: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer'}}>
          ← Back to Blog
        </button>
      </div>
    </div>
  )

  return (
    <div style={{fontFamily: "'DM Sans', sans-serif", background: '#fefefd', minHeight: '100vh'}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      {/* Navbar */}
      <nav style={{
        background: '#1e2b71', padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: '68px', position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer'}}
          onClick={() => navigate('/')}>
          <div style={{width: '34px', height: '34px', borderRadius: '10px', background: '#d63683', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <span style={{color: 'white', fontWeight: '800', fontSize: '16px', fontFamily: 'Sora, sans-serif'}}>I</span>
          </div>
          <span style={{color: 'white', fontWeight: '700', fontSize: '18px', fontFamily: 'Sora, sans-serif'}}>InventSight</span>
        </div>
        <div style={{display: 'flex', gap: '12px'}}>
          <button onClick={() => navigate('/blog')}
            style={{background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px 18px', borderRadius: '10px', fontSize: '14px', cursor: 'pointer'}}>
            ← Blog
          </button>
          <button onClick={() => navigate('/login')}
            style={{background: '#d63683', border: 'none', color: 'white', padding: '8px 18px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer'}}>
            Free trial
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #1e2b71 0%, #2d3e9e 100%)',
        padding: '60px 24px', textAlign: 'center',
      }}>
        <div style={{fontSize: '64px', marginBottom: '20px'}}>{post.emoji}</div>
        <span style={{
          background: `rgba(255,255,255,0.1)`, color: 'rgba(255,255,255,0.8)',
          padding: '6px 14px', borderRadius: '100px',
          fontSize: '12px', fontWeight: '600', marginBottom: '20px', display: 'inline-block',
        }}>
          {post.category}
        </span>
        <h1 style={{
          fontFamily: 'Sora, sans-serif', fontSize: '2rem', fontWeight: '800',
          color: 'white', maxWidth: '720px', margin: '16px auto 20px', lineHeight: '1.3',
        }}>
          {post.title}
        </h1>
        <p style={{color: 'rgba(255,255,255,0.5)', fontSize: '13px'}}>
          {post.author} · {post.date} · {post.readTime}
        </p>
      </div>

      {/* Content area */}
      <div style={{maxWidth: '720px', margin: '0 auto', padding: '56px 24px'}}>

        {/* Coming soon placeholder */}
        <div style={{
          background: '#fff0f7', borderRadius: '20px',
          border: '1px solid #f9a8d4', padding: '40px', textAlign: 'center',
          marginBottom: '40px',
        }}>
          <p style={{fontSize: '32px', marginBottom: '12px'}}>✍️</p>
          <p style={{fontWeight: '700', color: '#1e2b71', fontSize: '18px', marginBottom: '8px'}}>
            Full article coming soon
          </p>
          <p style={{color: '#7880a4', fontSize: '14px', lineHeight: '1.7'}}>
            {post.excerpt}
          </p>
        </div>

        {/* CTA */}
        <div style={{
          background: '#1e2b71', borderRadius: '20px',
          padding: '36px', textAlign: 'center',
        }}>
          <p style={{color: 'white', fontWeight: '700', fontSize: '18px', marginBottom: '8px', fontFamily: 'Sora, sans-serif'}}>
            Stop guessing. Start knowing exactly what to stock.
          </p>
          <p style={{color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '24px'}}>
            Try InventSight free for 14 days — no credit card required.
          </p>
          <button onClick={() => navigate('/login')}
            style={{
              background: '#d63683', border: 'none', color: 'white',
              padding: '14px 32px', borderRadius: '12px',
              fontSize: '15px', fontWeight: '600', cursor: 'pointer',
            }}>
            Start free trial →
          </button>
        </div>

        {/* Back to blog */}
        <div style={{textAlign: 'center', marginTop: '32px'}}>
          <button onClick={() => navigate('/blog')}
            style={{background: 'transparent', border: 'none', color: '#7880a4', fontSize: '14px', cursor: 'pointer'}}>
            ← Back to all articles
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer style={{background: '#111827', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', flexWrap: 'wrap'}}>
        <p style={{color: 'rgba(255,255,255,0.3)', fontSize: '13px'}}>© 2026 InventSight</p>
        <button onClick={() => navigate('/privacy')} style={{background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline'}}>Privacy Policy</button>
        <button onClick={() => navigate('/terms')} style={{background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline'}}>Terms & Conditions</button>
      </footer>
    </div>
  )
}