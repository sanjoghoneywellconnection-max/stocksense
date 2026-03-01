import { useNavigate } from 'react-router-dom'

export default function PrivacyPolicy() {
  const navigate = useNavigate()

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
          <div style={{
            width: '34px', height: '34px', borderRadius: '10px',
            background: '#d63683',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{color: 'white', fontWeight: '800', fontSize: '16px', fontFamily: 'Sora, sans-serif'}}>I</span>
          </div>
          <span style={{color: 'white', fontWeight: '700', fontSize: '18px', fontFamily: 'Sora, sans-serif'}}>
            InventSight
          </span>
        </div>
        <button onClick={() => navigate('/')}
          style={{
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            color: 'white', padding: '8px 18px', borderRadius: '10px',
            fontSize: '14px', fontWeight: '500', cursor: 'pointer',
          }}>
          ← Back to Home
        </button>
      </nav>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #1e2b71 0%, #2d3e9e 100%)',
        padding: '60px 24px',
        textAlign: 'center',
      }}>
        <h1 style={{
          fontFamily: 'Sora, sans-serif', fontSize: '2.4rem',
          fontWeight: '800', color: 'white', marginBottom: '12px',
        }}>
          Privacy Policy
        </h1>
        <p style={{color: 'rgba(255,255,255,0.6)', fontSize: '15px'}}>
          Last updated: March 2026 · Effective immediately
        </p>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: 'rgba(15,155,88,0.2)', border: '1px solid rgba(15,155,88,0.4)',
          borderRadius: '100px', padding: '8px 20px', marginTop: '20px',
        }}>
          <span style={{fontSize: '16px'}}>🔒</span>
          <span style={{color: '#86efac', fontSize: '14px', fontWeight: '500'}}>
            Your data is encrypted end-to-end and never sold to third parties
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{maxWidth: '780px', margin: '0 auto', padding: '60px 24px'}}>

        {/* Trust badges */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px', marginBottom: '56px',
        }}>
          {[
            { icon: '🔐', title: 'End-to-End Encrypted', desc: 'All data transmitted over HTTPS/TLS' },
            { icon: '🚫', title: 'Never Sold', desc: 'Your data is never sold to advertisers' },
            { icon: '🏠', title: 'You Own Your Data', desc: 'Export or delete anytime you want' },
            { icon: '🇮🇳', title: 'India Compliant', desc: 'Follows IT Act 2000 guidelines' },
          ].map(({ icon, title, desc }) => (
            <div key={title} style={{
              background: 'white', borderRadius: '16px',
              border: '1px solid #e8e5f0', padding: '20px',
              textAlign: 'center',
            }}>
              <div style={{fontSize: '28px', marginBottom: '8px'}}>{icon}</div>
              <p style={{fontWeight: '600', color: '#1e2b71', fontSize: '14px', marginBottom: '4px'}}>{title}</p>
              <p style={{color: '#7880a4', fontSize: '12px'}}>{desc}</p>
            </div>
          ))}
        </div>

        {/* Sections */}
        {[
          {
            title: '1. Who We Are',
            content: `InventSight is an inventory intelligence platform built for Indian D2C brands. We are operated by InventSight ("we", "our", "us"). By using our platform at stocksense-sigma.vercel.app, you agree to the terms of this Privacy Policy.

For any privacy-related questions, contact us at: hello@inventsight.in`,
          },
          {
            title: '2. What Data We Collect',
            content: `We collect only what is necessary to provide the service:

- Account Information — Your name, email address, and business name when you sign up
- Inventory Data — SKU details, stock levels, warehouse information, and sales data that you enter into the platform
- Usage Data — How you interact with the platform (pages visited, features used) to improve the product
- Payment Information — When you subscribe, payment is processed by our payment partner. We do not store your card details on our servers

We do not collect sensitive personal information such as Aadhaar numbers, PAN, or bank account details.`,
          },
          {
            title: '3. How We Use Your Data',
            content: `Your data is used exclusively to:

- Provide the InventSight service — calculate metrics, generate alerts, and display your inventory intelligence
- Improve the product — understand how features are used to make them better
- Send important service notifications — subscription renewals, critical stock alerts, security updates
- Respond to your support requests

We do not use your data for advertising. We do not profile you for third-party marketing purposes.`,
          },
          {
            title: '4. Data Encryption & Security',
            content: `We take security seriously:

- All data is transmitted over HTTPS with TLS 1.2 or higher encryption
- Your database is hosted on Supabase, which provides enterprise-grade security with AES-256 encryption at rest
- Passwords are hashed using bcrypt — we cannot see your password
- Access to production data is restricted to authorised personnel only
- We perform regular security reviews

While we implement industry-standard security measures, no system is 100% immune to breaches. In the event of a data breach affecting your information, we will notify you within 72 hours.`,
          },
          {
            title: '5. Data Sharing',
            content: `We do not sell your data. Ever.

We share data only with:

- Supabase — our database and authentication provider (data stored in their secure cloud)
- Vercel — our hosting provider (serves the application, does not store your inventory data)
- Razorpay — payment processing only (we share only what is required to process your subscription)

All third-party providers are bound by their own privacy policies and data processing agreements. We do not share your data with any advertising networks, data brokers, or marketing companies.`,
          },
          {
            title: '6. Your Rights',
            content: `You have full control over your data:

- Right to Access — Request a copy of all data we hold about you
- Right to Correction — Ask us to correct inaccurate data
- Right to Deletion — Request deletion of your account and all associated data. We will process this within 7 business days
- Right to Export — Export your inventory and sales data at any time from within the platform
- Right to Withdraw Consent — You can close your account at any time

To exercise any of these rights, email us at hello@inventsight.in`,
          },
          {
            title: '7. Data Retention',
            content: `We retain your data for as long as your account is active.

If you cancel your subscription:
- Your data remains accessible for 30 days in case you reactivate
- After 30 days of account closure, your data is permanently deleted from our servers
- Backups are purged within 90 days

You can request immediate deletion by emailing hello@inventsight.in`,
          },
          {
            title: '8. Cookies',
            content: `We use minimal cookies:

- Authentication cookies — to keep you logged in during your session
- Preference cookies — to remember your language and display settings

We do not use tracking cookies or advertising cookies. You can disable cookies in your browser settings but this may affect your ability to log in.`,
          },
          {
            title: '9. Children\'s Privacy',
            content: `InventSight is a business tool intended for adults. We do not knowingly collect data from anyone under the age of 18. If you believe a minor has created an account, please contact us at hello@inventsight.in and we will delete the account immediately.`,
          },
          {
            title: '10. Changes to This Policy',
            content: `We may update this Privacy Policy as the product evolves. When we make significant changes:

- We will notify you by email at least 7 days before the changes take effect
- We will display a notice inside the app
- The "Last updated" date at the top of this page will be revised

Continued use of InventSight after changes take effect constitutes acceptance of the updated policy.`,
          },
          {
            title: '11. Contact Us',
            content: `For any privacy concerns, data requests, or questions about this policy:

Email: hello@inventsight.in
Response time: Within 2 business days

We take every privacy concern seriously and will respond promptly.`,
          },
        ].map(({ title, content }) => (
          <div key={title} style={{marginBottom: '40px'}}>
            <h2 style={{
              fontFamily: 'Sora, sans-serif', fontSize: '1.1rem',
              fontWeight: '700', color: '#1e2b71',
              marginBottom: '12px', paddingBottom: '10px',
              borderBottom: '2px solid #f0edf8',
            }}>
              {title}
            </h2>
            <div style={{color: '#374151', fontSize: '15px', lineHeight: '1.8', whiteSpace: 'pre-line'}}>
              {content}
            </div>
          </div>
        ))}

        {/* Bottom CTA */}
        <div style={{
          background: '#1e2b71', borderRadius: '20px',
          padding: '32px', textAlign: 'center', marginTop: '40px',
        }}>
          <p style={{color: 'white', fontWeight: '600', fontSize: '16px', marginBottom: '8px'}}>
            Questions about your privacy?
          </p>
          <p style={{color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '20px'}}>
            We respond to all privacy queries within 2 business days.
          </p>
          <a href="mailto:hello@inventsight.in"
            style={{
              display: 'inline-block',
              background: '#d63683', color: 'white',
              padding: '12px 28px', borderRadius: '12px',
              fontSize: '14px', fontWeight: '600',
              textDecoration: 'none',
            }}>
            Contact us → hello@inventsight.in
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        background: '#111827', padding: '24px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexWrap: 'wrap', gap: '16px',
      }}>
        <p style={{color: 'rgba(255,255,255,0.3)', fontSize: '13px', textAlign: 'center'}}>
          © 2026 InventSight · Inventory Intelligence for Indian Brands
        </p>
      </footer>
    </div>
  )
}