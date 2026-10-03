// Every project card on the site comes from this file. The home page shows
// `featured`; the projects page shows `featured` and then `earlier`.

export type Cover =
  | { kind: 'qa-mock' }
  | { kind: 'art'; title: string; subtitle: string; warm?: boolean }
  | { kind: 'image'; src: string };

export interface Stat {
  value: string;
  label: string;
}

export interface Project {
  title: string;
  description: string;
  href: string;
  external?: boolean;
  cover: Cover;
  tags: string[];
  stats?: Stat[];
}

export const featured: Project[] = [
  {
    title: 'Shopify Migration QA Platform',
    description: 'Works with large CSV files, tells whether data will be accepted or rejected by Shopify bulk upload. Streamlines product / customer migration.',
    href: '/qa-platform',
    cover: { kind: 'qa-mock' },
    stats: [
      { value: '4h → 1h', label: 'per migration' },
      { value: '200k+', label: 'SKUs' },
      { value: '50k+', label: 'Customers' },
    ],
    tags: ['TypeScript', 'React', 'Node', 'PostgreSQL', 'Shopify API', 'Docker'],
  },
  {
    title: 'Rewards Platform',
    description: 'A loyalty app where members redeem points for partner rewards, with every redemption in one database transaction.',
    href: '/rewards-platform',
    cover: { kind: 'art', title: 'Points → Rewards', subtitle: 'Angular · Spring Boot · PostgreSQL' },
    tags: ['Angular', 'Spring Boot', 'PostgreSQL', 'Docker', 'GitHub Actions'],
  },
  {
    title: 'Floor is Lava: AR Game',
    description: 'A mobile augmented reality game that detects the real floor and turns it into lava. My college capstone.',
    href: '/floor-is-lava',
    cover: { kind: 'art', title: 'Floor is Lava', subtitle: 'Unity · AR Foundation', warm: true },
    tags: ['Unity', 'AR Foundation', 'C#', 'Firebase'],
  },
];

export const earlier: Project[] = [
  {
    title: 'Banks Branch Manager',
    description: 'Map-based branch manager with geolocation and sorting.',
    href: 'https://ronnie-atm-manager.netlify.app/',
    external: true,
    cover: { kind: 'image', src: '/img/banks-branch-manager.jpg' },
    tags: ['JavaScript', 'Leaflet', 'Geolocation API'],
  },
  {
    title: 'Restaurant Reviews Manager',
    description: 'Spring Boot app to add and review restaurants, built with MVC and Thymeleaf views.',
    href: 'https://github.com/ostrovsrr/restaurant-reviews-manager',
    external: true,
    cover: { kind: 'image', src: '/img/restaurant-reviews.jpg' },
    tags: ['Spring Boot', 'Java', 'H2', 'Thymeleaf'],
  },
  {
    title: 'Bankist',
    description: 'Banking app UI with transfers, loans and sorting.',
    href: 'https://ostrovsrr.github.io/bankist/',
    external: true,
    cover: { kind: 'image', src: '/img/bankist.jpg' },
    tags: ['JavaScript', 'DOM'],
  },
  {
    title: 'Titanic Predictor',
    description: 'Model for the Kaggle Titanic challenge that predicts which passengers survived. Scored 76%.',
    href: 'https://github.com/ostrovsrr/titanic',
    external: true,
    cover: { kind: 'image', src: '/img/titanic-predictor.jpg' },
    tags: ['Machine learning', 'Kaggle'],
  },
];
