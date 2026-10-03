// Experience and skills shown on the home page. Keep in sync with the resume.

export interface Job {
  dates: string;
  title: string;
  org: string;
  summary: string;
}

export const experience: Job[] = [
  {
    dates: 'Mar 2026 – Present',
    title: 'Shopify Solutions Engineer',
    org: 'Helios Technology Solutions',
    summary: 'Built internal tools. Worked closely with merchants on integrations / website development / data migrations',
  },
  {
    dates: 'May – Aug 2025',
    title: 'Co-op Developer',
    org: 'Ontario Public Service',
    summary: 'ASP.NET Core and SQL Server, Azure DevOps CI/CD, Playwright tests, and WCAG 2.0 AA screen reader testing.',
  },
  {
    dates: 'Sep – Dec 2024',
    title: 'Co-op Jr. Programmer',
    org: 'Ontario Public Service',
    summary: 'Enterprise application work from analysis to release, across DEV, QA, UAT and PROD.',
  },
  {
    dates: 'Jan – Apr 2024',
    title: 'Co-op Jr. Software Developer',
    org: 'Skill Squirrel',
    summary: 'Led a subscription Portfolio Maker feature for a SaaS platform (React, Node, Express).',
  },
  {
    dates: '2022 – 2025',
    title: 'Software Development & Network Engineering',
    org: 'Sheridan College',
    summary: 'Advanced Diploma, Honours, 3.89 GPA. 1st place, Cloud Computing Competition (AWS).',
  },
];

export const skills: { name: string; items: string }[] = [
  { name: 'Shopify', items: 'Hydrogen, Liquid, Admin GraphQL and Storefront API, theme and app development' },
  { name: 'Frontend', items: 'TypeScript, JavaScript, React, Next.js, Angular, HTML, CSS' },
  { name: 'Backend', items: 'Node.js, Express, ASP.NET, C#, Java, Spring Boot, PostgreSQL, SQL Server, MySQL, MongoDB' },
  { name: 'Testing & DevOps', items: 'Jest, Vitest, Playwright, CI/CD with GitHub Actions and Azure DevOps, Docker, AWS, WCAG 2.0 AA' },
];
