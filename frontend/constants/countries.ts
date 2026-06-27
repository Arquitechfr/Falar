export interface Country {
  iso2: string;
  name: string;
  dialCode: string;
  flag: string;
  format: string;
}

export const COUNTRIES: Country[] = [
  { iso2: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷', format: '6 12 34 56 78' },
  { iso2: 'BE', name: 'Belgique', dialCode: '+32', flag: '🇧🇪', format: '4 12 34 56 78' },
  { iso2: 'CH', name: 'Suisse', dialCode: '+41', flag: '🇨🇭', format: '78 123 45 67' },
  { iso2: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦', format: '514 123 4567' },
  { iso2: 'US', name: 'États-Unis', dialCode: '+1', flag: '🇺🇸', format: '514 123 4567' },
  { iso2: 'GB', name: 'Royaume-Uni', dialCode: '+44', flag: '🇬🇧', format: '7123 456789' },
  { iso2: 'DE', name: 'Allemagne', dialCode: '+49', flag: '🇩🇪', format: '151 23456789' },
  { iso2: 'IT', name: 'Italie', dialCode: '+39', flag: '🇮🇹', format: '312 345 6789' },
  { iso2: 'ES', name: 'Espagne', dialCode: '+34', flag: '🇪🇸', format: '612 34 56 78' },
  { iso2: 'NL', name: 'Pays-Bas', dialCode: '+31', flag: '🇳🇱', format: '6 12345678' },
  { iso2: 'PT', name: 'Portugal', dialCode: '+351', flag: '🇵🇹', format: '912 345 678' },
  { iso2: 'MA', name: 'Maroc', dialCode: '+212', flag: '🇲🇦', format: '6 12 34 56 78' },
  { iso2: 'DZ', name: 'Algérie', dialCode: '+213', flag: '🇩🇿', format: '6 12 34 56 78' },
  { iso2: 'TN', name: 'Tunisie', dialCode: '+216', flag: '🇹🇳', format: '12 345 678' },
  { iso2: 'SN', name: 'Sénégal', dialCode: '+221', flag: '🇸🇳', format: '77 123 45 67' },
  { iso2: 'CI', name: "Côte d'Ivoire", dialCode: '+225', flag: '🇨🇮', format: '07 12 34 56 78' },
  { iso2: 'CM', name: 'Cameroun', dialCode: '+237', flag: '🇨🇲', format: '6 12 34 56 78' },
  { iso2: 'ML', name: 'Mali', dialCode: '+223', flag: '🇲🇱', format: '65 12 34 56' },
  { iso2: 'BF', name: 'Burkina Faso', dialCode: '+226', flag: '🇧🇫', format: '6 12 34 56' },
  { iso2: 'GN', name: 'Guinée', dialCode: '+224', flag: '🇬🇳', format: '612 34 56 78' },
  { iso2: 'CG', name: 'Congo', dialCode: '+242', flag: '🇨🇬', format: '06 12 34 56 78' },
  { iso2: 'CD', name: 'RD Congo', dialCode: '+243', flag: '🇨🇩', format: '0812 345 678' },
  { iso2: 'TG', name: 'Togo', dialCode: '+228', flag: '🇹🇬', format: '90 12 34 56' },
  { iso2: 'BJ', name: 'Bénin', dialCode: '+229', flag: '🇧🇯', format: '90 12 34 56' },
  { iso2: 'NG', name: 'Nigéria', dialCode: '+234', flag: '🇳🇬', format: '802 123 4567' },
  { iso2: 'GH', name: 'Ghana', dialCode: '+233', flag: '🇬🇭', format: '24 123 4567' },
  { iso2: 'SA', name: 'Arabie Saoudite', dialCode: '+966', flag: '🇸🇦', format: '50 123 4567' },
  { iso2: 'AE', name: 'Émirats Arabes Unis', dialCode: '+971', flag: '🇦🇪', format: '50 123 4567' },
  { iso2: 'EG', name: 'Égypte', dialCode: '+20', flag: '🇪🇬', format: '10 123 45678' },
  { iso2: 'TR', name: 'Turquie', dialCode: '+90', flag: '🇹🇷', format: '512 345 6789' },
  { iso2: 'CN', name: 'Chine', dialCode: '+86', flag: '🇨🇳', format: '131 2345 6789' },
  { iso2: 'IN', name: 'Inde', dialCode: '+91', flag: '🇮🇳', format: '91234 56789' },
  { iso2: 'JP', name: 'Japon', dialCode: '+81', flag: '🇯🇵', format: '90 1234 5678' },
  { iso2: 'KR', name: 'Corée du Sud', dialCode: '+82', flag: '🇰🇷', format: '10 1234 5678' },
  { iso2: 'BR', name: 'Brésil', dialCode: '+55', flag: '🇧🇷', format: '11 91234 5678' },
  { iso2: 'MX', name: 'Mexique', dialCode: '+52', flag: '🇲🇽', format: '55 1234 5678' },
  { iso2: 'RU', name: 'Russie', dialCode: '+7', flag: '🇷🇺', format: '912 345 67 89' },
  { iso2: 'AU', name: 'Australie', dialCode: '+61', flag: '🇦🇺', format: '412 345 678' },
  { iso2: 'ZA', name: 'Afrique du Sud', dialCode: '+27', flag: '🇿🇦', format: '71 123 4567' },
];

export const DEFAULT_COUNTRY = COUNTRIES[0];

export function findCountryByIso2(iso2: string): Country | undefined {
  return COUNTRIES.find((c) => c.iso2 === iso2);
}
