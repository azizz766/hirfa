'use client'

import { useMemo } from 'react'
import { Country } from 'country-state-city'
import { ChevronDown } from 'lucide-react'
import { useAppSettings } from '@/lib/theme'

const MAJOR_CITIES_AR: Record<string, string[]> = {
  SA: ['الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'الدمام', 'الخبر', 'الطائف', 'تبوك', 'أبها', 'بريدة', 'حائل', 'نجران', 'جازان', 'ينبع', 'الجبيل', 'الأحساء', 'القطيف', 'خميس مشيط', 'الباحة', 'عرعر'],
  AE: ['دبي', 'أبوظبي', 'الشارقة', 'عجمان', 'رأس الخيمة', 'الفجيرة', 'أم القيوين', 'العين'],
  KW: ['الكويت', 'حولي', 'السالمية', 'الفروانية', 'الأحمدي', 'الجهراء'],
  QA: ['الدوحة', 'الريان', 'الوكرة', 'الخور', 'لوسيل'],
  BH: ['المنامة', 'المحرق', 'الرفاع', 'مدينة حمد', 'مدينة عيسى'],
  OM: ['مسقط', 'صلالة', 'صحار', 'نزوى', 'صور', 'عبري'],
  JO: ['عمان', 'الزرقاء', 'إربد', 'العقبة', 'مادبا', 'جرش'],
  EG: ['القاهرة', 'الإسكندرية', 'الجيزة', 'شرم الشيخ', 'الغردقة', 'الأقصر', 'أسوان', 'المنصورة'],
  MA: ['الدار البيضاء', 'الرباط', 'فاس', 'مراكش', 'طنجة', 'أكادير', 'مكناس', 'وجدة'],
  IQ: ['بغداد', 'البصرة', 'الموصل', 'أربيل', 'النجف', 'كربلاء'],
}

const MAJOR_CITIES_EN: Record<string, string[]> = {
  SA: ['Riyadh', 'Jeddah', 'Makkah', 'Madinah', 'Dammam', 'Khobar', 'Taif', 'Tabuk', 'Abha', 'Buraidah', 'Hail', 'Najran', 'Jizan', 'Yanbu', 'Jubail', 'Al Ahsa', 'Qatif', 'Khamis Mushait', 'Al Baha', 'Arar'],
  AE: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain', 'Al Ain'],
  KW: ['Kuwait City', 'Hawalli', 'Salmiya', 'Farwaniya', 'Ahmadi', 'Jahra'],
  QA: ['Doha', 'Al Rayyan', 'Al Wakrah', 'Al Khor', 'Lusail'],
  BH: ['Manama', 'Muharraq', 'Riffa', 'Hamad Town', 'Isa Town'],
  OM: ['Muscat', 'Salalah', 'Sohar', 'Nizwa', 'Sur', 'Ibri'],
  JO: ['Amman', 'Zarqa', 'Irbid', 'Aqaba', 'Madaba', 'Jerash'],
  EG: ['Cairo', 'Alexandria', 'Giza', 'Sharm El Sheikh', 'Hurghada', 'Luxor', 'Aswan', 'Mansoura'],
  MA: ['Casablanca', 'Rabat', 'Fes', 'Marrakech', 'Tangier', 'Agadir', 'Meknes', 'Oujda'],
  IQ: ['Baghdad', 'Basra', 'Mosul', 'Erbil', 'Najaf', 'Karbala'],
  GB: ['London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow', 'Liverpool', 'Bristol', 'Edinburgh'],
  US: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Francisco', 'Seattle', 'Miami', 'Boston', 'Washington DC'],
  DE: ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Stuttgart', 'Düsseldorf'],
  FR: ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Bordeaux', 'Strasbourg'],
  CA: ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa'],
  AU: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Canberra'],
  TR: ['Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Antalya', 'Gaziantep'],
  PK: ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Peshawar'],
  IN: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad'],
}

type Location = {
  country: string
  countryName: string
  state: string
  stateName: string
  city: string
}

interface Props {
  value: Partial<Location>
  onChange: (loc: Partial<Location>) => void
  placeholder?: string
}

export function LocationPicker({ value, onChange }: Props) {
  const { lang } = useAppSettings()

  const countries = useMemo(() => Country.getAllCountries(), [])
  const cities = useMemo(() => {
    if (!value.country) return []
    const list = lang === 'ar' ? MAJOR_CITIES_AR : MAJOR_CITIES_EN
    return list[value.country] ?? []
  }, [value.country, lang])

  const hasCuratedCities = value.country ? !!(lang === 'ar' ? MAJOR_CITIES_AR[value.country] : MAJOR_CITIES_EN[value.country]) : false

  function onCountryChange(code: string) {
    const country = countries.find(c => c.isoCode === code)
    onChange({ country: code, countryName: country?.name ?? '', state: '', stateName: '', city: '' })
  }

  function onCityChange(name: string) {
    onChange({ ...value, city: name })
  }

  const selectStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--bg-page)',
    border: '1.5px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: '12px 14px',
    paddingLeft: 36,
    fontSize: 14,
    color: 'var(--ink-primary)',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'Cairo, sans-serif',
    cursor: 'pointer',
    appearance: 'none',
    transition: 'border-color 0.15s',
  }

  const countryLabel = lang === 'en' ? 'Country' : 'الدولة'
  const cityLabel = lang === 'en' ? 'City' : 'المدينة'
  const selectCountryPlaceholder = lang === 'en' ? 'Select country' : 'اختر الدولة'
  const selectCityPlaceholder = lang === 'en' ? 'Select city' : 'اختر المدينة'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Country */}
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink-primary)', marginBottom: 6, textAlign: 'right' }}>
          {countryLabel} <span style={{ color: 'var(--accent)' }}>*</span>
        </label>
        <div style={{ position: 'relative' }}>
          <select
            value={value.country ?? ''}
            onChange={e => onCountryChange(e.target.value)}
            style={{ ...selectStyle, direction: 'rtl' }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          >
            <option value="">{selectCountryPlaceholder}</option>
            {countries.map(c => (
              <option key={c.isoCode} value={c.isoCode}>{c.name}</option>
            ))}
          </select>
          <ChevronDown size={16} color="var(--ink-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        </div>
      </div>

      {/* City — disabled placeholder when no country; select or text input depending on curated list */}
      {!value.country ? (
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink-primary)', marginBottom: 6, textAlign: 'right' }}>
            {cityLabel} <span style={{ color: 'var(--accent)' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <select disabled style={{ ...selectStyle, direction: 'rtl', opacity: 0.5, cursor: 'not-allowed' }}>
              <option>{lang === 'en' ? 'Select country first' : 'اختر الدولة أولاً'}</option>
            </select>
            <ChevronDown size={16} color="var(--ink-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          </div>
        </div>
      ) : (
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink-primary)', marginBottom: 6, textAlign: 'right' }}>
            {cityLabel} <span style={{ color: 'var(--accent)' }}>*</span>
          </label>
          {hasCuratedCities ? (
            <div style={{ position: 'relative' }}>
              <select
                value={value.city ?? ''}
                onChange={e => onCityChange(e.target.value)}
                style={{ ...selectStyle, direction: 'rtl' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              >
                <option value="">{selectCityPlaceholder}</option>
                {cities.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <ChevronDown size={16} color="var(--ink-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>
          ) : (
            <input
              type="text"
              value={value.city ?? ''}
              onChange={e => onCityChange(e.target.value)}
              placeholder={lang === 'en' ? 'Enter your city...' : 'اكتب اسم مدينتك...'}
              style={{ ...selectStyle }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          )}
        </div>
      )}

    </div>
  )
}
