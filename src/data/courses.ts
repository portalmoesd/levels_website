import type { Course } from './types';

/**
 * The course catalogue.
 *
 * Structured facts (price, age, schedule) are curated here rather than read out
 * of the Wix extraction, because the live site states several of them
 * inconsistently between its listing pages and its detail pages — see
 * docs/content-conflicts.md for the full list. Where the two disagree the
 * detail page is treated as canonical, since it is the more specific page and
 * the one a prospective student actually reads before enrolling.
 *
 * Long-form copy (about/learn/materials/...) is NOT duplicated here. It lives
 * in src/content/pages/<slug>.json, generated from the crawl by
 * scripts/build-content.mjs, and is looked up by slug at build time.
 */
export const courses: Course[] = [
  // ---------------------------------------------------------------- children
  {
    slug: 'sunday-school',
    audiences: ['children'],
    title: { en: 'Sunday School', ka: 'საკვირაო სკოლა' },
    kicker: { en: 'Fun. Interactive.', ka: 'სახალისო. ინტერაქტიული.' },
    summary: {
      en: 'A full academic year of English for ages 6–10, once a week on Sundays, with Georgian and native-speaker teachers.',
      ka: 'ინგლისური 6–10 წლის ბავშვებისთვის, კვირაში ერთხელ, კვირა დღეს, ქართველი და ნეითივ პედაგოგებთან ერთად.',
    },
    ageLabel: { en: 'Age: 6–10', ka: 'ასაკი: 6–10' },
    ageRange: { min: 6, max: 10 },
    duration: { en: '1 academic year', ka: '1 აკადემიური წელი' },
    lessonLength: { en: '120 mins', ka: '120 წუთი' },
    perWeek: { en: 'Once, on Sunday', ka: 'ერთხელ, კვირას' },
    price: { was: 185, now: 165, unit: 'month' },
    cambridge: true,
    about: { en: [], ka: [] },
    learn: { en: [], ka: [] },
  },
  {
    slug: 'saturday-school',
    audiences: ['children'],
    title: { en: 'Saturday School', ka: 'საშაბათო სკოლა' },
    kicker: { en: 'Fun. Interactive.', ka: 'სახალისო. ინტერაქტიული.' },
    summary: {
      en: 'A full academic year of English for ages 6–10, once a week on Saturdays, with Georgian and native-speaker teachers.',
      ka: 'ინგლისური 6–10 წლის ბავშვებისთვის, კვირაში ერთხელ, შაბათს, ქართველი და ნეითივ პედაგოგებთან ერთად.',
    },
    ageLabel: { en: 'Age: 6–10', ka: 'ასაკი: 6–10' },
    ageRange: { min: 6, max: 10 },
    duration: { en: '1 academic year', ka: '1 აკადემიური წელი' },
    lessonLength: { en: '120 mins', ka: '120 წუთი' },
    perWeek: { en: 'Once, on Saturday', ka: 'ერთხელ, შაბათს' },
    price: { was: 185, now: 165, unit: 'month' },
    cambridge: true,
    about: { en: [], ka: [] },
    learn: { en: [], ka: [] },
  },
  {
    slug: 'english-for-children',
    audiences: ['children'],
    title: { en: 'General English', ka: 'ზოგადი ინგლისური' },
    kicker: { en: 'Skills. Activities.', ka: 'უნარები. აქტივობები.' },
    summary: {
      en: 'General English for ages 6–10 across a full academic year, twice a week, built on Cambridge methodology.',
      ka: 'ზოგადი ინგლისური 6–10 წლისთვის, აკადემიური წლის განმავლობაში, კვირაში ორჯერ, კემბრიჯის მეთოდოლოგიით.',
    },
    ageLabel: { en: 'Age: 6–10', ka: 'ასაკი: 6–10' },
    ageRange: { min: 6, max: 10 },
    duration: { en: '1 academic year', ka: '1 აკადემიური წელი' },
    lessonLength: { en: '60 mins', ka: '60 წუთი' },
    perWeek: { en: 'Twice a week', ka: 'კვირაში ორჯერ' },
    price: { was: 185, now: 165, unit: 'month' },
    cambridge: true,
    about: { en: [], ka: [] },
    learn: { en: [], ka: [] },
  },

  // --------------------------------------------------------------- teenagers
  {
    slug: 'english-for-teens',
    audiences: ['teenagers'],
    title: { en: 'General English', ka: 'ზოგადი ინგლისური' },
    summary: {
      en: 'Academic English and speaking practice for ages 11–17, with a scholarship competition for a funded week in the UK.',
      ka: 'აკადემიური ინგლისური და სასაუბრო პრაქტიკა 11–17 წლისთვის, დიდ ბრიტანეთში დაფინანსებული კვირის სტიპენდიის კონკურსით.',
    },
    ageLabel: { en: 'Age: 11–17', ka: 'ასაკი: 11–17' },
    ageRange: { min: 11, max: 17 },
    duration: { en: '4 months', ka: '4 თვე' },
    lessonLength: { en: '90 mins', ka: '90 წუთი' },
    perWeek: { en: 'Three times a week', ka: 'სამჯერ კვირაში' },
    price: { was: 285, now: 255, unit: 'month' },
    cambridge: true,
    about: { en: [], ka: [] },
    learn: { en: [], ka: [] },
  },

  // ------------------------------------------------------------------ adults
  {
    slug: 'english-for-adults',
    audiences: ['adults'],
    title: { en: 'General English', ka: 'ზოგადი ინგლისური' },
    kicker: { en: 'Academic. Dynamic.', ka: 'აკადემიური. დინამიური.' },
    summary: {
      en: 'General English for adults in groups of no more than six, online or at the Academy, with Georgian, American and British teachers.',
      ka: 'ზოგადი ინგლისური ზრდასრულებისთვის მაქსიმუმ ექვსკაციან ჯგუფებში, ონლაინ ან აკადემიაში, ქართველ, ამერიკელ და ბრიტანელ პედაგოგებთან.',
    },
    ageLabel: { en: 'Age: from 18', ka: 'ასაკი: 18-დან' },
    ageRange: { min: 18 },
    duration: { en: '4 months', ka: '4 თვე' },
    lessonLength: { en: '120 mins', ka: '120 წუთი' },
    perWeek: { en: 'Twice a week', ka: 'კვირაში ორჯერ' },
    price: { was: 350, now: 295, unit: 'month' },
    cambridge: true,
    about: { en: [], ka: [] },
    learn: { en: [], ka: [] },
  },

  // -------------------------------------------------- exams (all age groups)
  {
    slug: 'ielts',
    audiences: ['teenagers', 'adults'],
    title: { en: 'IELTS', ka: 'IELTS' },
    kicker: { en: 'Exam focused.', ka: 'გამოცდაზე ორიენტირებული.' },
    summary: {
      en: 'Five weeks of IELTS preparation ending in a full simulation test with scores and detailed feedback.',
      ka: 'IELTS-ის ხუთკვირიანი მომზადება, რომელიც სრული სიმულაციური ტესტით და დეტალური უკუკავშირით სრულდება.',
    },
    ageLabel: { en: 'All age groups', ka: 'ყველა ასაკისთვის' },
    duration: { en: '5 weeks', ka: '5 კვირა' },
    lessonLength: { en: '120 mins', ka: '120 წუთი' },
    perWeek: { en: 'Three times a week', ka: 'სამჯერ კვირაში' },
    price: { was: 700, now: 560, unit: 'course' },
    about: { en: [], ka: [] },
    learn: { en: [], ka: [] },
  },
  {
    slug: 'fce-pet-cae',
    audiences: ['teenagers', 'adults'],
    title: { en: 'FCE · PET · CAE', ka: 'FCE · PET · CAE' },
    summary: {
      en: 'Cambridge exam preparation with CELTA-certified teachers, regular mock exams and personalised feedback.',
      ka: 'კემბრიჯის გამოცდებისთვის მომზადება CELTA-სერტიფიცირებულ პედაგოგებთან, რეგულარული საცდელი გამოცდებითა და უკუკავშირით.',
    },
    ageLabel: { en: 'All age groups', ka: 'ყველა ასაკისთვის' },
    duration: { en: '1.5 months', ka: '1.5 თვე' },
    lessonLength: { en: '90 mins', ka: '90 წუთი' },
    perWeek: { en: 'Twice a week', ka: 'კვირაში ორჯერ' },
    price: { was: 350, now: 300, unit: 'month' },
    cambridge: true,
    about: { en: [], ka: [] },
    learn: { en: [], ka: [] },
  },
  {
    slug: 'business-english',
    audiences: ['adults'],
    title: { en: 'Professional English', ka: 'პროფესიული ინგლისური' },
    summary: {
      en: 'Workplace English with industry-specific tracks, built around real professional scenarios.',
      ka: 'სამუშაო გარემოს ინგლისური ინდუსტრიულ მიმართულებებად, რეალურ პროფესიულ სცენარებზე აგებული.',
    },
    ageLabel: { en: 'For adults', ka: 'ზრდასრულებისთვის' },
    ageRange: { min: 18 },
    duration: { en: '4 months', ka: '4 თვე' },
    lessonLength: { en: '120 mins', ka: '120 წუთი' },
    perWeek: { en: 'Three times a week', ka: 'სამჯერ კვირაში' },
    price: { was: 350, now: 320, unit: 'month' },
    about: { en: [], ka: [] },
    learn: { en: [], ka: [] },
  },

  // ------------------------------------------------------- flexible formats
  {
    slug: 'private-lessons',
    audiences: ['children', 'teenagers', 'adults'],
    title: { en: 'Private Lessons', ka: 'ინდივიდუალური გაკვეთილები' },
    summary: {
      en: 'One-to-one lessons at your own pace, online or at the Academy, available for every course.',
      ka: 'ინდივიდუალური გაკვეთილები შენს ტემპში, ონლაინ ან აკადემიაში, ყველა კურსისთვის.',
    },
    ageLabel: { en: 'All age groups', ka: 'ყველა ასაკისთვის' },
    duration: { en: 'Individual', ka: 'ინდივიდუალური' },
    lessonLength: { en: 'From 60 mins', ka: '60 წუთიდან' },
    perWeek: { en: 'Tailored schedule', ka: 'მორგებული განრიგი' },
    price: { unit: 'individual' },
    about: { en: [], ka: [] },
    learn: { en: [], ka: [] },
  },
  {
    slug: 'corporate-english',
    audiences: ['corporate'],
    title: { en: 'Corporate English', ka: 'კორპორაციული ინგლისური' },
    summary: {
      en: 'Tailored English training for companies and teams, delivered at your office, at our centre, or online, with monthly progress reports.',
      ka: 'კომპანიებსა და გუნდებზე მორგებული ინგლისურის ტრენინგი — თქვენს ოფისში, ჩვენს ცენტრში ან ონლაინ, ყოველთვიური ანგარიშებით.',
    },
    ageLabel: { en: 'For companies', ka: 'კომპანიებისთვის' },
    duration: { en: 'Tailored', ka: 'მორგებული' },
    lessonLength: { en: 'Tailored', ka: 'მორგებული' },
    perWeek: { en: 'Tailored schedule', ka: 'მორგებული განრიგი' },
    price: { unit: 'individual' },
    about: { en: [], ka: [] },
    learn: { en: [], ka: [] },
  },
];

/** The four corporate tracks, which have no pages of their own. */
export const corporateTracks = [
  { id: 'general',       en: 'General English',      ka: 'ზოგადი ინგლისური' },
  { id: 'conversational',en: 'Conversational English', ka: 'სასაუბრო ინგლისური' },
  { id: 'professional',  en: 'Professional English', ka: 'პროფესიული ინგლისური' },
  { id: 'industries',    en: 'English of Industries', ka: 'ინდუსტრიების ინგლისური' },
] as const;

export const courseBySlug = (slug: string): Course | undefined =>
  courses.find((c) => c.slug === slug);

export const coursesFor = (audience: Course['audiences'][number]): Course[] =>
  courses.filter((c) => c.audiences.includes(audience));
