import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const BRAND_COLORS = {
    navy: '#1e2b71',
    pink: '#d63683',
    peach: '#ffc7a3',
    cream: '#fefefd',
}

// ✏️ ADD YOUR ARTICLES HERE — just add a new object to this array
export const BLOG_POSTS = [
    {
        id: 1,
        slug: 'what-is-days-of-cover',
        category: 'Inventory Management',
        categoryColor: '#7c3aed',
        title: 'What is Days of Cover — and why every D2C brand needs to track it',
        excerpt: 'Days of Cover tells you exactly how long your current stock will last at your current selling rate. It is the single most important number in inventory management — yet most brands never track it.',
        author: 'InventSight Team',
        date: 'March 2026',
        readTime: '4 min read',
        emoji: '📦',
    },
    {
        id: 2,
        slug: 'amazon-flipkart-stockout-cost',
        category: 'Amazon & Flipkart',
        categoryColor: '#d97706',
        title: 'The hidden cost of going out of stock on Amazon — it is worse than you think',
        excerpt: 'Most sellers think a stockout just means lost sales for a few days. The reality is far more painful — Amazon penalises your organic ranking, your BSR drops, and recovery takes weeks.',
        author: 'InventSight Team',
        date: 'March 2026',
        readTime: '5 min read',
        emoji: '🚨',
    },
    {
        id: 3,
        slug: 'drr-vs-excel',
        category: 'D2C Brand Growth',
        categoryColor: '#0891b2',
        title: 'Why your Excel inventory sheet will eventually break your business',
        excerpt: 'Every founder starts with Excel. It works until it does not. The moment you have 50+ SKUs across 3 warehouses and 2 channels, Excel becomes the biggest risk in your supply chain.',
        author: 'InventSight Team',
        date: 'February 2026',
        readTime: '6 min read',
        emoji: '📊',
    },
    {
        id: 4,
        slug: 'reorder-point-formula',
        category: 'Inventory Management',
        categoryColor: '#7c3aed',
        title: 'The reorder point formula every Indian D2C seller should know',
        excerpt: 'Reorder point = (Average Daily Sales × Lead Time) + Safety Stock. Simple formula. Most brands get it wrong because they use the wrong daily sales number.',
        author: 'InventSight Team',
        date: 'February 2026',
        readTime: '5 min read',
        emoji: '🧮',
    },
    {
        id: 5,
        slug: 'festive-season-inventory',
        category: 'Amazon & Flipkart',
        categoryColor: '#d97706',
        title: 'How to prepare your inventory for Diwali and festive season on Amazon',
        excerpt: 'Diwali is the single biggest sales event for Indian e-commerce. Brands that prepare 60 days in advance win. Brands that scramble 15 days before miss the spike entirely.',
        author: 'InventSight Team',
        date: 'January 2026',
        readTime: '7 min read',
        emoji: '🪔',
    },
    {
        id: 6,
        slug: 'bcg-matrix-skus',
        category: 'D2C Brand Growth',
        categoryColor: '#0891b2',
        title: 'Using BCG matrix to decide which SKUs to scale and which to kill',
        excerpt: 'Not every SKU deserves equal attention. The BCG matrix helps you classify your portfolio into Fast Movers, Steady Earners, Rising SKUs, and Slow Movers — so you invest in winners and cut losers.',
        author: 'InventSight Team',
        date: 'January 2026',
        readTime: '6 min read',
        emoji: '🚀',
    },
    {
        id: 7,
        slug: 'your-article-url',
        category: 'Inventory Management',
        categoryColor: '#7c3aed',
        title: 'Your article title here',
        excerpt: 'Two sentence summary of the article.',
        author: 'InventSight Team',
        date: 'March 2026',
        readTime: '5 min read',
        emoji: '📦',
    }
]

const CATEGORIES = ['All', 'Inventory Management', 'Amazon & Flipkart', 'D2C Brand Growth', 'Product Updates']

export default function Blog() {
    const navigate = useNavigate()
    const [activeCategory, setActiveCategory] = useState('All')

    const filtered = activeCategory === 'All'
        ? BLOG_POSTS
        : BLOG_POSTS.filter(p => p.category === activeCategory)

    const featured = BLOG_POSTS[0]
    const rest = filtered.slice(activeCategory === 'All' ? 1 : 0)

    return (
        <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#fefefd', minHeight: '100vh' }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Sora:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .blog-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(30,43,113,0.1); }
        .blog-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        @media (max-width: 768px) {
          .blog-grid { grid-template-columns: 1fr !important; }
          .hero-title { font-size: 1.8rem !important; }
          .featured-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

            {/* Navbar */}
            <nav style={{
                background: '#1e2b71', padding: '0 24px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                height: '68px', position: 'sticky', top: 0, zIndex: 100,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                    onClick={() => navigate('/')}>
                    <div style={{
                        width: '34px', height: '34px', borderRadius: '10px',
                        background: '#d63683',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <span style={{ color: 'white', fontWeight: '800', fontSize: '16px', fontFamily: 'Sora, sans-serif' }}>I</span>
                    </div>
                    <span style={{ color: 'white', fontWeight: '700', fontSize: '18px', fontFamily: 'Sora, sans-serif' }}>
                        InventSight
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button onClick={() => navigate('/')}
                        style={{
                            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                            color: 'white', padding: '8px 18px', borderRadius: '10px',
                            fontSize: '14px', fontWeight: '500', cursor: 'pointer',
                        }}>
                        ← Home
                    </button>
                    <button onClick={() => navigate('/login')}
                        style={{
                            background: '#d63683', border: 'none',
                            color: 'white', padding: '8px 18px', borderRadius: '10px',
                            fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                        }}>
                        Free trial
                    </button>
                </div>
            </nav>

            {/* Hero */}
            <div style={{
                background: 'linear-gradient(135deg, #1e2b71 0%, #2d3e9e 100%)',
                padding: '60px 24px 50px', textAlign: 'center',
            }}>
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    background: 'rgba(214,54,131,0.15)', border: '1px solid rgba(214,54,131,0.3)',
                    borderRadius: '100px', padding: '6px 16px', marginBottom: '20px',
                }}>
                    <span style={{ color: '#ffc7a3', fontSize: '13px', fontWeight: '500' }}>
                        Inventory Intelligence Blog
                    </span>
                </div>
                <h1 className="hero-title" style={{
                    fontFamily: 'Sora, sans-serif', fontSize: '2.4rem',
                    fontWeight: '800', color: 'white', marginBottom: '12px',
                }}>
                    Insights for Indian D2C Brands
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '15px', maxWidth: '500px', margin: '0 auto' }}>
                    Practical guides on inventory management, Amazon & Flipkart selling, and growing your D2C brand.
                </p>
            </div>

            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 24px' }}>

                {/* Category filter */}
                <div style={{
                    display: 'flex', gap: '10px', flexWrap: 'wrap',
                    marginBottom: '40px',
                }}>
                    {CATEGORIES.map(cat => (
                        <button key={cat}
                            onClick={() => setActiveCategory(cat)}
                            style={{
                                padding: '8px 18px', borderRadius: '100px',
                                border: '1px solid',
                                borderColor: activeCategory === cat ? '#1e2b71' : '#e8e5f0',
                                background: activeCategory === cat ? '#1e2b71' : 'white',
                                color: activeCategory === cat ? 'white' : '#7880a4',
                                fontSize: '13px', fontWeight: '500', cursor: 'pointer',
                                transition: 'all 0.15s ease',
                            }}>
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Featured post — only show on All */}
                {activeCategory === 'All' && (
                    <div className="blog-card featured-grid" style={{
                        display: 'grid', gridTemplateColumns: '1fr 1fr',
                        gap: '0', marginBottom: '40px',
                        background: 'white', borderRadius: '24px',
                        border: '1px solid #e8e5f0', overflow: 'hidden',
                        cursor: 'pointer',
                    }}
                        onClick={() => navigate(`/blog/${featured.slug}`)}>
                        {/* Left — visual */}
                        <div style={{
                            background: 'linear-gradient(135deg, #1e2b71 0%, #2d3e9e 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: '48px',
                            minHeight: '280px',
                        }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '72px', marginBottom: '16px' }}>{featured.emoji}</div>
                                <span style={{
                                    background: 'rgba(214,54,131,0.2)', color: '#f9a8d4',
                                    padding: '6px 14px', borderRadius: '100px',
                                    fontSize: '12px', fontWeight: '600',
                                }}>
                                    Featured
                                </span>
                            </div>
                        </div>
                        {/* Right — content */}
                        <div style={{ padding: '40px' }}>
                            <span style={{
                                background: '#f5f3ff', color: '#7c3aed',
                                padding: '4px 12px', borderRadius: '100px',
                                fontSize: '12px', fontWeight: '600',
                            }}>
                                {featured.category}
                            </span>
                            <h2 style={{
                                fontFamily: 'Sora, sans-serif', fontSize: '1.3rem',
                                fontWeight: '700', color: '#1e2b71',
                                margin: '16px 0 12px', lineHeight: '1.4',
                            }}>
                                {featured.title}
                            </h2>
                            <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.7', marginBottom: '24px' }}>
                                {featured.excerpt}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '32px', height: '32px', borderRadius: '50%',
                                        background: '#f0f1fa',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '14px', fontWeight: '700', color: '#1e2b71',
                                    }}>I</div>
                                    <div>
                                        <p style={{ fontSize: '13px', fontWeight: '600', color: '#1e2b71' }}>{featured.author}</p>
                                        <p style={{ fontSize: '11px', color: '#7880a4' }}>{featured.date} · {featured.readTime}</p>
                                    </div>
                                </div>
                                <span style={{ color: '#d63683', fontSize: '13px', fontWeight: '600' }}>
                                    Read →
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Blog grid */}
                <div className="blog-grid" style={{
                    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '24px',
                }}>
                    {rest.map(post => (
                        <div key={post.id} className="blog-card"
                            style={{
                                background: 'white', borderRadius: '20px',
                                border: '1px solid #e8e5f0', overflow: 'hidden',
                                cursor: 'pointer',
                            }}
                            onClick={() => navigate(`/blog/${post.slug}`)}>

                            {/* Card header */}
                            <div style={{
                                background: 'linear-gradient(135deg, #1e2b71 0%, #2d3e9e 100%)',
                                padding: '32px', textAlign: 'center',
                            }}>
                                <span style={{ fontSize: '48px' }}>{post.emoji}</span>
                            </div>

                            {/* Card body */}
                            <div style={{ padding: '24px' }}>
                                <span style={{
                                    background: `${post.categoryColor}15`,
                                    color: post.categoryColor,
                                    padding: '4px 12px', borderRadius: '100px',
                                    fontSize: '11px', fontWeight: '600',
                                }}>
                                    {post.category}
                                </span>
                                <h3 style={{
                                    fontFamily: 'Sora, sans-serif', fontSize: '15px',
                                    fontWeight: '700', color: '#1e2b71',
                                    margin: '12px 0 10px', lineHeight: '1.5',
                                }}>
                                    {post.title}
                                </h3>
                                <p style={{
                                    color: '#6b7280', fontSize: '13px',
                                    lineHeight: '1.7', marginBottom: '20px',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                }}>
                                    {post.excerpt}
                                </p>
                                <div style={{
                                    display: 'flex', alignItems: 'center',
                                    justifyContent: 'space-between',
                                    paddingTop: '16px',
                                    borderTop: '1px solid #f0edf8',
                                }}>
                                    <p style={{ fontSize: '12px', color: '#7880a4' }}>
                                        {post.date} · {post.readTime}
                                    </p>
                                    <span style={{ color: '#d63683', fontSize: '13px', fontWeight: '600' }}>
                                        Read →
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Coming soon */}
                <div style={{
                    textAlign: 'center', marginTop: '56px', padding: '40px',
                    background: 'white', borderRadius: '20px', border: '1px solid #e8e5f0',
                }}>
                    <p style={{ fontSize: '28px', marginBottom: '12px' }}>✍️</p>
                    <p style={{ fontWeight: '600', color: '#1e2b71', marginBottom: '8px' }}>
                        More articles coming soon
                    </p>
                    <p style={{ color: '#7880a4', fontSize: '14px', marginBottom: '24px' }}>
                        We publish weekly guides on inventory management and D2C growth.
                    </p>
                    <button onClick={() => navigate('/login')}
                        style={{
                            background: '#d63683', border: 'none',
                            color: 'white', padding: '12px 28px', borderRadius: '12px',
                            fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                        }}>
                        Try InventSight free →
                    </button>
                </div>
            </div>

            {/* Footer */}
            <footer style={{
                background: '#111827', padding: '24px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '24px', flexWrap: 'wrap', marginTop: '40px',
            }}>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>
                    © 2026 InventSight · Inventory Intelligence for Indian Brands
                </p>
                <button onClick={() => navigate('/privacy')}
                    style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}>
                    Privacy Policy
                </button>
                <button onClick={() => navigate('/terms')}
                    style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}>
                    Terms & Conditions
                </button>
            </footer>
        </div>
    )
}
