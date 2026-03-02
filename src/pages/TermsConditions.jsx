import { useNavigate } from 'react-router-dom'

export default function TermsConditions() {
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
        <button onClick={() => navigate(-1)}
          style={{
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            color: 'white', padding: '8px 18px', borderRadius: '10px',
            fontSize: '14px', fontWeight: '500', cursor: 'pointer',
          }}>
          ← Back
        </button>
      </nav>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #1e2b71 0%, #2d3e9e 100%)',
        padding: '60px 24px', textAlign: 'center',
      }}>
        <h1 style={{
          fontFamily: 'Sora, sans-serif', fontSize: '2.4rem',
          fontWeight: '800', color: 'white', marginBottom: '12px',
        }}>
          Terms & Conditions
        </h1>
        <p style={{color: 'rgba(255,255,255,0.6)', fontSize: '15px'}}>
          Last updated: March 2026 · Please read carefully before signing up
        </p>
      </div>

      {/* Content */}
      <div style={{maxWidth: '780px', margin: '0 auto', padding: '60px 24px'}}>

        {[
          {
            title: '1. Acceptance of Terms',
            content: `By creating an account on InventSight ("the Platform"), you agree to be bound by these Terms & Conditions. If you do not agree to these terms, please do not use the Platform.\n\nThese terms apply to all users including brand owners, data operators, and any team members added to an account.`,
          },
          {
            title: '2. Description of Service',
            content: `InventSight is an inventory intelligence platform that helps Indian D2C brands track stock levels, monitor sales velocity, plan reorders, and analyse portfolio performance.\n\nThe Platform includes:\n• Daily sales tracking and stock management\n• SKU-level metrics — Days of Cover (DOC), Daily Run Rate (DRR)\n• Reorder planning and deadline alerts\n• Portfolio classification and trend analysis\n• Warehouse-level stock visibility\n• Returns and category contribution analysis`,
          },
          {
            title: '3. Account Registration',
            content: `To use InventSight you must:\n• Be at least 18 years of age\n• Provide accurate and complete information during signup\n• Verify your email address before accessing the Platform\n• Keep your login credentials confidential\n\nYou are responsible for all activity that occurs under your account. Notify us immediately at hello@inventsight.in if you suspect unauthorised access.`,
          },
          {
            title: '4. Free Trial',
            content: `New accounts receive a 14-day free trial with full access to all features.\n\n• No credit card is required to start the trial\n• The trial begins from the date your email is verified\n• After 14 days, access to paid features will be locked until a subscription is activated\n• Free features — Daily Sales Entry and Master Data — remain accessible after trial expiry`,
          },
          {
            title: '5. Subscription & Payments',
            content: `After the free trial, continued access requires a paid subscription at Rs. 4,999 per month.\n\n• Subscriptions are billed monthly from the date of first payment\n• Promo codes may be applied at checkout for discounts on the first month only\n• Payments are processed securely by Razorpay\n• We do not store your card or bank account details on our servers\n• Subscriptions do not auto-renew currently — you must manually renew each month\n• No refunds are provided for partial months`,
          },
          {
            title: '6. Your Data',
            content: `You own all inventory data, sales data, and business information you enter into InventSight.\n\nWe will:\n• Never sell your data to third parties\n• Never use your business data for advertising\n• Encrypt all data in transit using HTTPS/TLS\n• Store your data on secure, encrypted servers\n\nWe will not:\n• Share your data with competitors\n• Access your account without your permission except for technical support when explicitly requested\n• Use your sales or inventory data for any purpose other than providing the service\n\nFull details are in our Privacy Policy at /privacy`,
          },
          {
            title: '7. Data Security',
            content: `We implement industry-standard security measures including:\n• End-to-end encryption for all data in transit (TLS 1.2+)\n• AES-256 encryption for data at rest\n• Secure password hashing — we cannot see your password\n• Email verification required for all new accounts\n\nWhile we take every precaution, no online service can guarantee 100% security. In the event of a data breach affecting your account, we will notify you within 72 hours.`,
          },
          {
            title: '8. Acceptable Use',
            content: `You agree not to:\n• Use InventSight for any unlawful purpose\n• Enter false, misleading, or fraudulent data\n• Attempt to reverse engineer, hack, or disrupt the Platform\n• Share your account credentials with unauthorised users\n• Use the Platform to harm, defame, or harass any person\n\nViolation of these terms may result in immediate account termination without refund.`,
          },
          {
            title: '9. Account Termination',
            content: `You may cancel your account at any time by emailing hello@inventsight.in.\n\nUpon cancellation:\n• Your data remains accessible for 30 days\n• After 30 days, all your data is permanently deleted\n• You may request immediate deletion if preferred\n\nWe reserve the right to terminate accounts that violate these Terms & Conditions without prior notice.`,
          },
          {
            title: '10. Limitation of Liability',
            content: `InventSight provides inventory intelligence tools to assist your decision-making. We are not responsible for:\n\n• Business decisions made based on data shown in the Platform\n• Loss of revenue, profit, or stock resulting from reliance on Platform data\n• Inaccuracies caused by incorrect data entered by the user\n• Service interruptions due to maintenance, updates, or technical issues\n\nThe Platform is provided "as is". Our maximum liability to you shall not exceed the amount paid by you in the last 30 days.`,
          },
          {
            title: '11. Intellectual Property',
            content: `All content, design, code, and features of InventSight are the intellectual property of InventSight. You may not copy, reproduce, or distribute any part of the Platform without written permission.\n\nYour data remains yours. We claim no ownership over the inventory or sales data you enter.`,
          },
          {
            title: '12. Changes to Terms',
            content: `We may update these Terms & Conditions as the product evolves. When we make significant changes:\n• We will notify you by email at least 7 days before changes take effect\n• We will display a notice inside the app\n• Continued use of the Platform after changes take effect constitutes acceptance\n\nIf you disagree with updated terms, you may cancel your account before the changes take effect.`,
          },
          {
            title: '13. Governing Law',
            content: `These Terms & Conditions are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts of India.\n\nThis agreement is subject to the Information Technology Act, 2000 and rules made thereunder.`,
          },
          {
            title: '14. Contact',
            content: `For any questions about these Terms & Conditions:\n\nEmail: hello@inventsight.in\nResponse time: Within 2 business days`,
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
            Questions about these terms?
          </p>
          <p style={{color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '20px'}}>
            We are happy to explain anything in plain language.
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
        gap: '24px', flexWrap: 'wrap',
      }}>
        <p style={{color: 'rgba(255,255,255,0.3)', fontSize: '13px'}}>
          © 2026 InventSight · Inventory Intelligence for Indian Brands
        </p>
        <button onClick={() => navigate('/privacy')}
          style={{
            background: 'transparent', border: 'none',
            color: 'rgba(255,255,255,0.4)', fontSize: '13px',
            cursor: 'pointer', textDecoration: 'underline',
          }}>
          Privacy Policy
        </button>
      </footer>
    </div>
  )
}