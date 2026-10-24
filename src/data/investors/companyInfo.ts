// Company Information for Nuren Group Limited (NSX: NRN), ported verbatim from
// the Nuren investor site's companyInfo.js (including source quirks such as
// "Little Colins Street"). These values change rarely; edit here when they do.

export interface CompanyField {
  label?: string;
  value: string | string[];
  href?: string;
  subValue?: string;
  subHref?: string;
  /** People block: the name is the value and the role is a caption beneath it. */
  caption?: string;
}

export interface CompanyBlock {
  title: string;
  fields: CompanyField[];
}

export const companyInfo: Record<'company' | 'contact' | 'corporate' | 'people', CompanyBlock> = {
  company: {
    title: 'Company',
    fields: [
      { label: 'Company', value: 'Nuren Group Limited' },
      { label: 'ACN/ARBN', value: '673015597' },
      { label: 'Ticker Symbol', value: 'NRN' },
      { label: 'Principal Activities', value: 'Media Advertising, SuperApp, AI' },
      { label: 'Industry Class', value: 'Consumer Discretionary' },
    ],
  },
  contact: {
    title: 'Contact',
    fields: [
      { label: 'Corporate Address', value: ['Level 9, 505 Little Colins Street,', 'Melbourne VIC 3000.'] },
      { label: 'Corporate Headquarter', value: 'Australia' },
      { label: 'Other Operating Countries', value: 'Malaysia, Singapore, Thailand' },
      { label: 'Website', value: 'www.nurengroup.com', href: 'https://www.nurengroup.com' },
      { label: 'Email', value: 'admin@nurengroup.com', href: 'mailto:admin@nurengroup.com' },
    ],
  },
  corporate: {
    title: 'Corporate',
    fields: [
      { label: 'Share Registry', value: ['Automic Group', 'Level 5, 126 Phillip Street', 'Sydney NSW 2000.'] },
      { label: 'Auditor', value: ['Kingston & Knight Audit Pty Ltd', 'PO Box 33151', 'Melbourne VIC 3004.'] },
      {
        label: 'Company Secretary',
        value: 'James Stephen Barrie',
        subValue: 'jamesbarrie@fernvillegroup.com.au',
        subHref: 'mailto:jamesbarrie@fernvillegroup.com.au',
      },
      { label: 'Solicitors', value: ['Carter Newell Lawyers', 'Level 13, 215 Adelaide Street,', 'Brisbane Qld 4000.'] },
      {
        label: 'Nominated Advisers',
        value: ['ACTP Sdn Bhd', '39, Jalan Kenari 17C,', 'Bandar Puchong Jaya,', '47100 Puchong,', 'Selangor, Malaysia.'],
      },
    ],
  },
  people: {
    title: 'People',
    fields: [
      { value: 'Prof Dr Kong Yew Wong', caption: 'Chairman, Non Executive Director' },
      { value: 'Shze Yinn Goh', caption: 'Founder, Group CEO, Executive Director' },
      { value: 'Wee Keat Leow', caption: 'Group CTO, Executive Director' },
      { value: 'Datuk Rashidi Hasbullah', caption: 'Advisor, Advisory Council' },
      { value: 'Dato Yee Koon Eng', caption: 'Independent, Non Executive Director' },
      { value: 'Paul Yee Fong', caption: 'Independent, Non Executive Director' },
    ],
  },
};

// Render order matches the NSX source layout: 2 columns, 2 rows.
export const companyInfoOrder = ['company', 'contact', 'corporate', 'people'] as const;
