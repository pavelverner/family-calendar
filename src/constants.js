export const MEMBERS = {
  pavel:   { name: 'Pavel',   color: '#16A34A', light: '#DCFCE7' },
  eliska:  { name: 'Eliška',  color: '#EA580C', light: '#FFEDD5' },
  filip:   { name: 'Filip',   color: '#CA8A04', light: '#FEF9C3' },
  vsichni: { name: 'Všichni', color: '#64748B', light: '#F1F5F9' },
};

// Firebase Auth emails for Pavel and Eliška
export const USER_EMAILS = {
  pavel:  'pavel@familycal.app',
  eliska: 'eliska@familycal.app',
};

export const DAYS_CZ = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];

export const MONTHS_CZ = [
  'Leden','Únor','Březen','Duben','Květen','Červen',
  'Červenec','Srpen','Září','Říjen','Listopad','Prosinec',
];

export const CATEGORIES = {
  none:    { label: 'Obecné',   icon: '📌' },
  prace:   { label: 'Práce',    icon: '💼' },
  skola:   { label: 'Škola',    icon: '🏫' },
  sport:   { label: 'Sport',    icon: '🎾' },
  doktor:  { label: 'Doktor',   icon: '🏥' },
  rodina:  { label: 'Rodina',   icon: '👨‍👩‍👧' },
  hlidani: { label: 'Hlídání',  icon: '🧸' },
  zabava:  { label: 'Zábava',   icon: '🎉' },
};

export const REPEAT_OPTIONS = [
  { value: 'none',    label: 'Neopakovat' },
  { value: 'weekly',  label: 'Každý týden' },
  { value: 'monthly', label: 'Každý měsíc' },
];
