'use client'

import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { useTranslation, useAppSettings } from '@/lib/theme'

export default function TermsPage() {
  const router = useRouter()
  const t = useTranslation()
  const { lang } = useAppSettings()

  const isAr = lang !== 'en'

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', background: 'var(--bg-page)', minHeight: '100dvh', direction: isAr ? 'rtl' : 'ltr', fontFamily: 'Cairo, sans-serif', paddingBottom: 48 }}>

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-primary)', display: 'flex', alignItems: 'center', padding: 4 }}>
          <ArrowRight size={22} />
        </button>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-primary)' }}>
          {isAr ? 'الشروط والأحكام' : 'Terms & Conditions'}
        </span>
        <div style={{ width: 30 }} />
      </div>

      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Platform name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, background: 'var(--accent)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 20, flexShrink: 0 }}>ح</div>
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-primary)', margin: 0 }}>حِرفة · Hirfa</p>
            <p style={{ fontSize: 12, color: 'var(--ink-muted)', margin: 0 }}>{isAr ? 'سوق الحرف اليدوية والفنون' : 'Handcraft & Arts Marketplace'}</p>
          </div>
        </div>

        {/* Section helper */}
        {[
          {
            title: isAr ? 'قبول الشروط' : 'Acceptance of Terms',
            body: isAr
              ? 'باستخدامك لمنصة حِرفة فإنك توافق على هذه الشروط والأحكام. إذا كنت لا توافق على أي بند، يُرجى التوقف عن استخدام المنصة.'
              : 'By using Hirfa you agree to these Terms & Conditions. If you do not agree to any provision, please stop using the platform.',
          },
          {
            title: isAr ? 'رسوم المنصة' : 'Platform Commission',
            body: isAr
              ? 'تأخذ منصة حِرفة عمولة بنسبة 25% على كل طلب مكتمل. يعني ذلك أن العميل يدفع سعر الفنان مضافاً إليه 25% كرسوم للمنصة. يتلقى الفنان سعره الأصلي بالكامل.'
              : 'Hirfa charges a 25% commission on every completed order. Clients pay the artist\'s price plus 25% as a platform fee. Artists receive their full stated price.',
            highlight: true,
          },
          {
            title: isAr ? 'مسؤوليات الفنان' : 'Artist Responsibilities',
            body: isAr
              ? 'يلتزم الفنان بتسليم العمل في الوقت المحدد وبالجودة المتفق عليها. يجب أن تكون الأعمال أصيلة ومن إنتاج الفنان نفسه. يحق للمنصة إيقاف الحساب عند الإخلال بهذه الشروط.'
              : 'Artists commit to delivering work on time and at the agreed quality. Works must be original and created by the artist. The platform may suspend accounts for breach of these terms.',
          },
          {
            title: isAr ? 'مسؤوليات العميل' : 'Client Responsibilities',
            body: isAr
              ? 'يلتزم العميل بتقديم وصف واضح ودقيق لطلبه. يجب الدفع خلال المدة المحددة عند الموافقة على السعر. لا يُسمح باستخدام الأعمال المطلوبة لأغراض تجارية دون إذن صريح من الفنان.'
              : 'Clients must provide a clear and accurate description of their order. Payment is due within the specified period upon price acceptance. Works may not be used commercially without the artist\'s explicit permission.',
          },
          {
            title: isAr ? 'سياسة الإلغاء والاسترداد' : 'Cancellation & Refunds',
            body: isAr
              ? 'يمكن إلغاء الطلب قبل قبول الفنان له دون أي رسوم. بعد بدء التنفيذ، يتم تقييم كل حالة استرداد بشكل منفرد من قِبل فريق الدعم.'
              : 'Orders may be cancelled before the artist accepts them at no charge. Once work begins, each refund request is assessed individually by the support team.',
          },
          {
            title: isAr ? 'الخصوصية وحماية البيانات' : 'Privacy & Data Protection',
            body: isAr
              ? 'نحن نحترم خصوصيتك. يتم جمع البيانات الشخصية فقط لأغراض تشغيل المنصة ولا تُشارك مع أطراف ثالثة إلا عند الضرورة القانونية.'
              : 'We respect your privacy. Personal data is collected solely for platform operations and is not shared with third parties except when legally required.',
          },
          {
            title: isAr ? 'تعديل الشروط' : 'Changes to Terms',
            body: isAr
              ? 'تحتفظ منصة حِرفة بحق تعديل هذه الشروط في أي وقت. سيتم إشعار المستخدمين بأي تغييرات جوهرية عبر البريد الإلكتروني.'
              : 'Hirfa reserves the right to modify these terms at any time. Users will be notified of material changes by email.',
          },
        ].map(({ title, body, highlight }) => (
          <div key={title} style={{ background: highlight ? 'var(--warning-bg)' : 'var(--bg-surface)', border: `1px solid ${highlight ? 'var(--warning-bg)' : 'var(--border)'}`, borderRadius: 'var(--radius-lg)', padding: '16px 18px' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: highlight ? 'var(--warning)' : 'var(--ink-primary)', margin: '0 0 8px' }}>
              {highlight && '💡 '}{title}
            </p>
            <p style={{ fontSize: 13, color: 'var(--ink-secondary)', margin: 0, lineHeight: 1.75 }}>{body}</p>
          </div>
        ))}

        <p style={{ fontSize: 11, color: 'var(--ink-muted)', textAlign: 'center', margin: 0 }}>
          {isAr ? 'آخر تحديث: مايو 2026' : 'Last updated: May 2026'}
        </p>
      </div>
    </div>
  )
}
