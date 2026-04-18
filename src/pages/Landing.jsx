import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const BRAND_COLORS = {
  navy: '#1e2b71',
  pink: '#d63683',
  peach: '#ffc7a3',
  cream: '#fefefd',
}

function CountUp({ target, suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        const start = performance.now()
        const animate = (now) => {
          const elapsed = now - start
          const progress = Math.min(elapsed / duration, 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          setCount(Math.floor(eased * target))
          if (progress < 1) requestAnimationFrame(animate)
          else setCount(target)
        }
        requestAnimationFrame(animate)
      }
    }, { threshold: 0.5 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target, duration])

  return <span ref={ref}>{count.toLocaleString('en-IN')}{suffix}</span>
}

export default function Landing() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // ── Capture affiliate ref code from URL ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    if (ref) {
      localStorage.setItem('inventsight_ref', ref)
    }
  }, [])

  const features = [
    {
      icon: '📦',
      title: 'Days of Cover',
      desc: 'Know exactly how many days your stock will last — colour coded green, amber, red, black. No spreadsheet needed.',
    },
    {
      icon: '📈',
      title: 'Daily Run Rate',
      desc: 'See your actual selling velocity across 7, 30, and 90 day windows. Spot acceleration before your competitors do.',
    },
    {
      icon: '🚨',
      title: 'Reorder Planner',
      desc: 'Get told exactly when to place an order — down to the day. Never miss a reorder deadline again.',
    },
    {
      icon: '🚀',
      title: 'Portfolio Mix',
      desc: 'Every SKU classified as Fast Mover, Steady Earner, Rising SKU, or Slow Mover. Know where to invest and what to wind down.',
    },
    {
      icon: '📊',
      title: 'Inventory Trends',
      desc: 'Visual charts showing which SKUs are gaining momentum and which are cooling down — updated daily.',
    },
    {
      icon: '🏭',
      title: 'Warehouse Map',
      desc: 'Multi-warehouse stock visibility in one screen. Delhi FC, Mumbai 3PL, FBA — see them all at once.',
    },
  ]

  const pains = [
    'You ordered too much of a slow SKU — now Rs. 2 lakh is stuck in dead inventory',
    'Your best seller ran out of stock on Amazon — you lost ranking and revenue',
    'You are managing stock on Excel — and you know it is going to break',
    'You have no idea which SKU is actually making you money vs which one is burning cash',
  ]

  const steps = [
    {
      number: '01',
      title: 'Add your SKUs',
      desc: 'Enter your products, warehouses, and opening stock. Takes 10 minutes.',
    },
    {
      number: '02',
      title: 'Enter daily sales',
      desc: 'Log units sold per channel every day. Stock updates automatically.',
    },
    {
      number: '03',
      title: 'Let InventSight think',
      desc: 'The engine calculates DRR, DOC, reorder dates, and portfolio classification — every single day.',
    },
  ]

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: BRAND_COLORS.cream }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Sora:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .hero-grid {
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 60px 60px;
        }

        .fade-in {
          opacity: 0;
          transform: translateY(24px);
          animation: fadeIn 0.8s ease forwards;
        }
        .fade-in-1 { animation-delay: 0.1s; }
        .fade-in-2 { animation-delay: 0.3s; }
        .fade-in-3 { animation-delay: 0.5s; }
        .fade-in-4 { animation-delay: 0.7s; }

        @keyframes fadeIn {
          to { opacity: 1; transform: translateY(0); }
        }

        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(30,43,113,0.12);
        }
        .feature-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }

        .cta-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(214,54,131,0.4); }
        .cta-btn { transition: transform 0.2s ease, box-shadow 0.2s ease; }

        .nav-link:hover { color: #d63683 !important; }
        .nav-link { transition: color 0.2s ease; }

        .nav-links { display: flex; align-items: center; gap: 28px; }
        .nav-cta-secondary { display: flex !important; }
        .nav-login-mobile { display: none; }

        .affiliate-earn-card:hover {
          transform: translateY(-2px);
          background: rgba(255,255,255,0.12) !important;
        }
        .affiliate-earn-card { transition: transform 0.2s ease, background 0.2s ease; }

        @media (max-width: 768px) {
          .nav-links { display: none !important; }
          .nav-cta-secondary { display: none !important; }
          .nav-login-mobile { display: flex !important; }
          .hero-headline { font-size: 2.2rem !important; line-height: 1.15 !important; }
          .hero-sub { font-size: 1rem !important; }
          .hero-buttons { flex-direction: column; align-items: center; }
          .hero-buttons button { width: 100% !important; max-width: 340px; }
          .stats-grid { grid-template-columns: 1fr 1fr !important; gap: 20px !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .steps-grid { grid-template-columns: 1fr !important; }
          .pricing-header { padding: 24px !important; }
          .pricing-body { padding: 20px 24px !important; }
          .affiliate-grid { grid-template-columns: 1fr !important; }
          footer { flex-direction: column !important; text-align: center; align-items: center !important; }
          .pain-section { padding: 60px 20px !important; }
          .features-section { padding: 60px 20px !important; }
          .steps-section { padding: 60px 20px !important; }
          .pricing-section { padding: 60px 20px !important; }
          .affiliate-section { padding: 60px 20px !important; }
          .final-cta { padding: 60px 20px !important; }
          .final-cta h2 { font-size: 1.8rem !important; }
          .section-title { font-size: 1.6rem !important; }
          .footer-links { flex-direction: column; gap: 12px !important; align-items: center; }
        }
      `}</style>

      {/* Navbar */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 24px',
        background: scrolled ? 'rgba(30,43,113,0.97)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : 'none',
        transition: 'all 0.3s ease',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: '68px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '10px',
            background: BRAND_COLORS.pink,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: 'white', fontWeight: '800', fontSize: '16px', fontFamily: 'Sora, sans-serif' }}>I</span>
          </div>
          <span style={{ color: 'white', fontWeight: '700', fontSize: '18px', fontFamily: 'Sora, sans-serif' }}>
            InventSight
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="nav-links">
            <a href="#features" className="nav-link" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>Features</a>
            <a href="#how-it-works" className="nav-link" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>How it works</a>
            <a href="#pricing" className="nav-link" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>Pricing</a>
            <a href="#affiliate" className="nav-link" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>Affiliate</a>
          </div>
          <button onClick={() => navigate('/login')} className="nav-login-mobile"
            style={{
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              color: 'white', padding: '8px 18px', borderRadius: '10px',
              fontSize: '14px', fontWeight: '500', cursor: 'pointer', display: 'none',
            }}>
            Log in
          </button>
          <button onClick={() => navigate('/login')} className="nav-cta-secondary"
            style={{
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              color: 'white', padding: '8px 18px', borderRadius: '10px',
              fontSize: '14px', fontWeight: '500', cursor: 'pointer',
            }}>
            Log in
          </button>
          <button onClick={() => navigate('/login')} className="cta-btn"
            style={{
              background: BRAND_COLORS.pink, border: 'none',
              color: 'white', padding: '8px 18px', borderRadius: '10px',
              fontSize: '14px', fontWeight: '600', cursor: 'pointer',
            }}>
            Free trial
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero-grid" style={{
        background: BRAND_COLORS.navy,
        minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
        padding: '100px 24px 80px',
      }}>
        <div style={{
          position: 'absolute', top: '10%', right: '5%',
          width: '400px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(214,54,131,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', left: '5%',
          width: '300px', height: '300px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,199,163,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '820px', textAlign: 'center', position: 'relative', zIndex: 1, width: '100%' }}>
          <div className="fade-in fade-in-1" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(214,54,131,0.15)', border: '1px solid rgba(214,54,131,0.3)',
            borderRadius: '100px', padding: '6px 16px', marginBottom: '32px',
          }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: BRAND_COLORS.pink }} />
            <span style={{ color: BRAND_COLORS.peach, fontSize: '13px', fontWeight: '500' }}>
              Built for Indian D2C brands selling on Amazon & Flipkart
            </span>
          </div>

          <h1 className="fade-in fade-in-2 hero-headline" style={{
            fontFamily: 'Sora, sans-serif',
            fontSize: '3.6rem', fontWeight: '800', lineHeight: '1.1',
            color: 'white', marginBottom: '24px', letterSpacing: '-0.02em',
          }}>
            Stop guessing.{' '}
            <span style={{ color: BRAND_COLORS.pink }}>Start knowing</span>{' '}
            exactly what to stock.
          </h1>

          <p className="fade-in fade-in-3 hero-sub" style={{
            fontSize: '1.15rem', color: 'rgba(255,255,255,0.65)',
            lineHeight: '1.7', maxWidth: '620px', margin: '0 auto 40px',
          }}>
            InventSight turns your inventory data into clear decisions — telling you
            what to produce, when to produce it, and how much,{' '}
            <span style={{ color: BRAND_COLORS.peach, fontWeight: '500' }}>
              before you lose money to overstock or OOS.
            </span>
          </p>

          <div className="fade-in fade-in-4 hero-buttons" style={{
            display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap',
          }}>
            <button onClick={() => navigate('/login')} className="cta-btn"
              style={{
                background: BRAND_COLORS.pink, border: 'none',
                color: 'white', padding: '16px 32px', borderRadius: '14px',
                fontSize: '16px', fontWeight: '600', cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif',
              }}>
              Start 14-day free trial →
            </button>
            <button
              onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })}
              style={{
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                color: 'white', padding: '16px 32px', borderRadius: '14px',
                fontSize: '16px', fontWeight: '500', cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif',
              }}>
              See how it works
            </button>
          </div>

          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', marginTop: '16px' }}>
            No credit card required · 14 days free · Cancel anytime
          </p>
        </div>
      </section>

      {/* Stats bar */}
      <section style={{ background: BRAND_COLORS.pink, padding: '40px 24px' }}>
        <div className="stats-grid" style={{
          maxWidth: '900px', margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '24px', textAlign: 'center',
        }}>
          {[
            { value: 19, suffix: '.6/day', label: 'units tracked per SKU' },
            { value: 90, suffix: '+', label: 'days of history analysed' },
            { value: 14, suffix: ' days', label: 'free trial, no card needed' },
            { value: 9999, suffix: '', label: 'Rs. /month after trial' },
          ].map(({ value, suffix, label }, i) => (
            <div key={i}>
              <p style={{
                fontFamily: 'Sora, sans-serif', fontSize: '2rem',
                fontWeight: '800', color: 'white', lineHeight: 1,
              }}>
                <CountUp target={value} suffix={suffix} />
              </p>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '13px', marginTop: '6px' }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pain section */}
      <section className="pain-section" style={{ background: '#f8f7fc', padding: '80px 24px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <p style={{
            color: BRAND_COLORS.pink, fontSize: '13px', fontWeight: '600',
            textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', marginBottom: '16px',
          }}>
            Sound familiar?
          </p>
          <h2 className="section-title" style={{
            fontFamily: 'Sora, sans-serif', fontSize: '2rem', fontWeight: '800',
            color: BRAND_COLORS.navy, textAlign: 'center', marginBottom: '48px',
          }}>
            Every D2C founder has lost money to these
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {pains.map((pain, i) => (
              <div key={i} style={{
                background: 'white', borderRadius: '16px', padding: '20px 24px',
                border: '1px solid #ede9f8',
                display: 'flex', alignItems: 'flex-start', gap: '16px',
              }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '10px',
                  background: '#fef2f2', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '16px',
                }}>😞</div>
                <p style={{ color: '#374151', fontSize: '15px', lineHeight: '1.6' }}>{pain}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <p style={{
              color: BRAND_COLORS.navy, fontSize: '18px', fontWeight: '600',
              fontFamily: 'Sora, sans-serif',
            }}>
              InventSight fixes all of this. Automatically.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="features-section" style={{ background: 'white', padding: '80px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <p style={{
            color: BRAND_COLORS.pink, fontSize: '13px', fontWeight: '600',
            textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', marginBottom: '16px',
          }}>
            What's inside
          </p>
          <h2 className="section-title" style={{
            fontFamily: 'Sora, sans-serif', fontSize: '2rem', fontWeight: '800',
            color: BRAND_COLORS.navy, textAlign: 'center', marginBottom: '56px',
          }}>
            Six screens. Every decision covered.
          </h2>
          <div className="features-grid" style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px',
          }}>
            {features.map((f, i) => (
              <div key={i} className="feature-card" style={{
                background: '#faf9fd', borderRadius: '20px',
                border: '1px solid #ede9f8', padding: '28px',
              }}>
                <div style={{
                  fontSize: '32px', marginBottom: '16px',
                  width: '56px', height: '56px', borderRadius: '16px',
                  background: 'white', display: 'flex', alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 12px rgba(30,43,113,0.08)',
                }}>
                  {f.icon}
                </div>
                <h3 style={{
                  fontFamily: 'Sora, sans-serif', fontSize: '17px', fontWeight: '700',
                  color: BRAND_COLORS.navy, marginBottom: '10px',
                }}>{f.title}</h3>
                <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.7' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="steps-section" style={{ background: '#f8f7fc', padding: '80px 24px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <p style={{
            color: BRAND_COLORS.pink, fontSize: '13px', fontWeight: '600',
            textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', marginBottom: '16px',
          }}>
            Simple to start
          </p>
          <h2 className="section-title" style={{
            fontFamily: 'Sora, sans-serif', fontSize: '2rem', fontWeight: '800',
            color: BRAND_COLORS.navy, textAlign: 'center', marginBottom: '56px',
          }}>
            Up and running in under 30 minutes
          </h2>
          <div className="steps-grid" style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px',
          }}>
            {steps.map((step, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '20px',
                  background: BRAND_COLORS.navy, margin: '0 auto 20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{
                    fontFamily: 'Sora, sans-serif', fontSize: '20px',
                    fontWeight: '800', color: BRAND_COLORS.pink,
                  }}>{step.number}</span>
                </div>
                <h3 style={{
                  fontFamily: 'Sora, sans-serif', fontSize: '17px',
                  fontWeight: '700', color: BRAND_COLORS.navy, marginBottom: '10px',
                }}>{step.title}</h3>
                <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.7' }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="pricing-section" style={{ background: 'white', padding: '80px 24px' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{
            color: BRAND_COLORS.pink, fontSize: '13px', fontWeight: '600',
            textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px',
          }}>
            Simple pricing
          </p>
          <h2 className="section-title" style={{
            fontFamily: 'Sora, sans-serif', fontSize: '2rem', fontWeight: '800',
            color: BRAND_COLORS.navy, marginBottom: '40px',
          }}>
            One plan. Everything included.
          </h2>

          <div style={{
            borderRadius: '24px', overflow: 'hidden',
            boxShadow: '0 24px 64px rgba(30,43,113,0.15)',
            border: '1px solid #ede9f8',
          }}>
            <div className="pricing-header" style={{ background: BRAND_COLORS.navy, padding: '32px' }}>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '12px' }}>
                InventSight Pro
              </p>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', justifyContent: 'center' }}>
                <span style={{
                  fontFamily: 'Sora, sans-serif', fontSize: '3rem',
                  fontWeight: '800', color: 'white', lineHeight: 1,
                }}>Rs. 9,999</span>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '15px', paddingBottom: '6px' }}>/month</span>
              </div>
              <p style={{ color: BRAND_COLORS.peach, fontSize: '14px', marginTop: '12px' }}>
                14 days free — no credit card required
              </p>
            </div>

            <div className="pricing-body" style={{ background: '#faf9fd', padding: '28px 32px' }}>
              {[
                'Full SKU Explorer with DOC & DRR',
                'Reorder Planner with deadline alerts',
                'Portfolio Analysis — plain English',
                'Inventory Trends with visual charts',
                'Warehouse Map — multi-location ready',
                'Returns & Category Analysis',
                'Daily Sales Entry — always free',
                'Unlimited SKUs and warehouses',
              ].map((f, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px 0',
                  borderBottom: i < 7 ? '1px solid #ede9f8' : 'none',
                }}>
                  <div style={{
                    width: '20px', height: '20px', borderRadius: '50%',
                    background: '#fff0f7', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ color: BRAND_COLORS.pink, fontSize: '11px', fontWeight: '700' }}>✓</span>
                  </div>
                  <span style={{ color: '#374151', fontSize: '14px', textAlign: 'left' }}>{f}</span>
                </div>
              ))}

              <button onClick={() => navigate('/login')} className="cta-btn"
                style={{
                  width: '100%', padding: '16px', borderRadius: '14px',
                  background: BRAND_COLORS.pink, border: 'none',
                  color: 'white', fontSize: '16px', fontWeight: '600',
                  cursor: 'pointer', marginTop: '24px',
                  fontFamily: 'DM Sans, sans-serif',
                }}>
                Start free trial →
              </button>

              <p style={{ color: '#9ca3af', fontSize: '12px', marginTop: '12px', textAlign: 'center' }}>
                Have a promo code? Apply it after signing up.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── AFFILIATE SECTION ── */}
      <section id="affiliate" className="affiliate-section" style={{
        background: BRAND_COLORS.navy, padding: '80px 24px',
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <p style={{
              color: BRAND_COLORS.pink, fontSize: '13px', fontWeight: '600',
              textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px',
            }}>
              Affiliate Program
            </p>
            <h2 style={{
              fontFamily: 'Sora, sans-serif', fontSize: '2.2rem', fontWeight: '800',
              color: 'white', marginBottom: '16px',
            }}>
              Know D2C founders?{' '}
              <span style={{ color: BRAND_COLORS.pink }}>Earn by introducing them.</span>
            </h2>
            <p style={{
              color: 'rgba(255,255,255,0.6)', fontSize: '16px',
              maxWidth: '520px', margin: '0 auto', lineHeight: '1.7',
            }}>
              Every brand you refer earns you Rs. 2,000 in the first month
              and Rs. 500 every month they stay active. No cap, no expiry.
            </p>
          </div>

          <div className="affiliate-grid" style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px',
            alignItems: 'center',
          }}>

            {/* Left — earning cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                {
                  emoji: '🎯',
                  title: 'First paid month',
                  amount: 'Rs. 2,000',
                  desc: 'One-time flat commission when they subscribe',
                },
                {
                  emoji: '🔄',
                  title: 'Every month after',
                  amount: 'Rs. 500',
                  desc: 'Recurring as long as they stay active',
                },
                {
                  emoji: '📈',
                  title: '10 active users',
                  amount: 'Rs. 7,000/mo',
                  desc: 'Passive income every single month',
                },
                {
                  emoji: '🏆',
                  title: 'No earnings cap',
                  amount: 'Unlimited',
                  desc: 'The more you refer, the more you earn',
                },
              ].map(({ emoji, title, amount, desc }) => (
                <div key={title} className="affiliate-earn-card"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '16px',
                    padding: '16px 20px', borderRadius: '16px',
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    cursor: 'default',
                  }}>
                  <span style={{ fontSize: '24px', flexShrink: 0 }}>{emoji}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>{title}</p>
                    <p style={{ color: 'white', fontSize: '13px', marginTop: '2px' }}>{desc}</p>
                  </div>
                  <p style={{
                    fontFamily: 'Sora, sans-serif', fontWeight: '800',
                    color: BRAND_COLORS.pink, fontSize: '15px',
                    flexShrink: 0, textAlign: 'right',
                  }}>{amount}</p>
                </div>
              ))}
            </div>

            {/* Right — CTA card */}
            <div style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '24px', padding: '40px',
              textAlign: 'center',
            }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '20px',
                background: BRAND_COLORS.pink,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 24px', fontSize: '28px',
              }}>
                🤝
              </div>

              <h3 style={{
                fontFamily: 'Sora, sans-serif', fontSize: '1.4rem',
                fontWeight: '800', color: 'white', marginBottom: '12px',
              }}>
                Join the Program
              </h3>
              <p style={{
                color: 'rgba(255,255,255,0.55)', fontSize: '14px',
                lineHeight: '1.7', marginBottom: '32px',
              }}>
                Apply in 2 minutes. We review within 24 hours.
                Once approved, you get your unique link and start earning immediately.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button onClick={() => navigate('/affiliate/apply')} className="cta-btn"
                  style={{
                    width: '100%', padding: '14px', borderRadius: '12px',
                    background: BRAND_COLORS.pink, border: 'none',
                    color: 'white', fontSize: '15px', fontWeight: '600',
                    cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                  }}>
                  Apply to Join →
                </button>
                <button onClick={() => navigate('/affiliate/login')}
                  style={{
                    width: '100%', padding: '14px', borderRadius: '12px',
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'rgba(255,255,255,0.7)', fontSize: '15px', fontWeight: '500',
                    cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                  }}>
                  Already an affiliate? Login
                </button>
              </div>

              <div style={{
                display: 'flex', gap: '20px', justifyContent: 'center',
                marginTop: '24px',
              }}>
                {[
                  { value: 'Rs. 2K', label: 'First month' },
                  { value: 'Rs. 500', label: 'Per month' },
                  { value: '∞', label: 'No cap' },
                ].map(({ value, label }) => (
                  <div key={label} style={{ textAlign: 'center' }}>
                    <p style={{
                      fontFamily: 'Sora, sans-serif', fontWeight: '800',
                      color: 'white', fontSize: '16px',
                    }}>{value}</p>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginTop: '2px' }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blog preview */}
      <section style={{ background: 'white', padding: '80px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: '16px', marginBottom: '40px',
          }}>
            <div>
              <p style={{
                color: BRAND_COLORS.pink, fontSize: '13px', fontWeight: '600',
                textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px',
              }}>
                From the blog
              </p>
              <h2 style={{
                fontFamily: 'Sora, sans-serif', fontSize: '1.8rem',
                fontWeight: '800', color: BRAND_COLORS.navy,
              }}>
                Inventory insights for D2C founders
              </h2>
            </div>
            <button onClick={() => navigate('/blog')}
              style={{
                background: 'transparent', border: `2px solid ${BRAND_COLORS.navy}`,
                color: BRAND_COLORS.navy, padding: '10px 24px', borderRadius: '12px',
                fontSize: '14px', fontWeight: '600', cursor: 'pointer',
              }}>
              View all articles →
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
          }}>
            {[
              {
                emoji: '📦',
                category: 'Inventory Management',
                categoryColor: '#7c3aed',
                title: 'What is Days of Cover — and why every D2C brand needs to track it',
                readTime: '4 min read',
                slug: 'what-is-days-of-cover',
              },
              {
                emoji: '🚨',
                category: 'Amazon & Flipkart',
                categoryColor: '#d97706',
                title: 'The hidden cost of going out of stock on Amazon',
                readTime: '5 min read',
                slug: 'amazon-flipkart-stockout-cost',
              },
              {
                emoji: '📊',
                category: 'D2C Brand Growth',
                categoryColor: '#0891b2',
                title: 'Why your Excel inventory sheet will eventually break your business',
                readTime: '6 min read',
                slug: 'drr-vs-excel',
              },
            ].map((post, i) => (
              <div key={i}
                onClick={() => navigate(`/blog/${post.slug}`)}
                style={{
                  background: '#faf9fd', borderRadius: '20px',
                  border: '1px solid #ede9f8', overflow: 'hidden',
                  cursor: 'pointer', transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(30,43,113,0.1)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}>
                <div style={{
                  background: 'linear-gradient(135deg, #1e2b71 0%, #2d3e9e 100%)',
                  padding: '28px', textAlign: 'center', fontSize: '40px',
                }}>
                  {post.emoji}
                </div>
                <div style={{ padding: '20px' }}>
                  <span style={{
                    background: `${post.categoryColor}15`, color: post.categoryColor,
                    padding: '4px 10px', borderRadius: '100px',
                    fontSize: '11px', fontWeight: '600',
                  }}>
                    {post.category}
                  </span>
                  <h3 style={{
                    fontFamily: 'Sora, sans-serif', fontSize: '15px', fontWeight: '700',
                    color: BRAND_COLORS.navy, margin: '12px 0 16px', lineHeight: '1.5',
                  }}>
                    {post.title}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <p style={{ fontSize: '12px', color: '#7880a4' }}>{post.readTime}</p>
                    <span style={{ color: BRAND_COLORS.pink, fontSize: '13px', fontWeight: '600' }}>Read →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta" style={{
        background: BRAND_COLORS.navy, padding: '80px 24px', textAlign: 'center',
      }}>
        <h2 style={{
          fontFamily: 'Sora, sans-serif', fontSize: '2.4rem', fontWeight: '800',
          color: 'white', marginBottom: '16px', maxWidth: '600px', margin: '0 auto 16px',
        }}>
          Your next stockout is preventable.
        </h2>
        <p style={{
          color: 'rgba(255,255,255,0.6)', fontSize: '16px',
          maxWidth: '480px', margin: '0 auto 40px', lineHeight: '1.7',
        }}>
          Start your free 14-day trial today. No spreadsheets. No guesswork. Just clarity.
        </p>
        <button onClick={() => navigate('/login')} className="cta-btn"
          style={{
            background: BRAND_COLORS.pink, border: 'none',
            color: 'white', padding: '18px 40px', borderRadius: '14px',
            fontSize: '17px', fontWeight: '600', cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif',
          }}>
          Start free trial — it's free →
        </button>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', marginTop: '16px' }}>
          No credit card · 14 days free · Cancel anytime
        </p>
      </section>

      {/* Footer */}
      <footer style={{
        background: '#111827', padding: '32px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '8px',
            background: BRAND_COLORS.pink,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: 'white', fontWeight: '800', fontSize: '13px', fontFamily: 'Sora, sans-serif' }}>I</span>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', fontWeight: '500' }}>
            InventSight
          </span>
        </div>

        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', textAlign: 'center' }}>
          © 2026 InventSight · Inventory Intelligence for Indian Brands
        </p>

        <div className="footer-links" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/privacy')}
            style={{
              background: 'transparent', border: 'none',
              color: 'rgba(255,255,255,0.5)', fontSize: '13px',
              cursor: 'pointer', textDecoration: 'underline',
            }}>
            Privacy Policy
          </button>
          <button onClick={() => navigate('/terms')}
            style={{
              background: 'transparent', border: 'none',
              color: 'rgba(255,255,255,0.5)', fontSize: '13px',
              cursor: 'pointer', textDecoration: 'underline',
            }}>
            Terms & Conditions
          </button>
          <button onClick={() => navigate('/blog')}
            style={{
              background: 'transparent', border: 'none',
              color: 'rgba(255,255,255,0.5)', fontSize: '13px',
              cursor: 'pointer', textDecoration: 'underline',
            }}>
            Blog
          </button>
          <button onClick={() => navigate('/affiliate/apply')}
            style={{
              background: 'transparent', border: 'none',
              color: 'rgba(255,255,255,0.5)', fontSize: '13px',
              cursor: 'pointer', textDecoration: 'underline',
            }}>
            Affiliate Program
          </button>
          <button onClick={() => navigate('/login')}
            style={{
              background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.6)', padding: '8px 20px', borderRadius: '10px',
              fontSize: '13px', cursor: 'pointer',
            }}>
            Log in →
          </button>
        </div>
      </footer>
    </div>
  )
}