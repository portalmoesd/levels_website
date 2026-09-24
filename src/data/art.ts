import type { Course } from './types';

/**
 * Levels Art Academy courses.
 *
 * As with the English catalogue, the live site states the schedule and price of
 * the drawing courses differently on /art, /home and each detail page. The
 * detail page wins here; see docs/content-conflicts.md.
 */
export const artCourses: Course[] = [
  {
    slug: 'drawing-kids',
    audiences: ['children'],
    title: { en: 'Drawing Course', ka: 'ხატვის კურსი' },
    summary: {
      en: 'An introduction to drawing and painting for ages 5–8 across 32 sessions, ending in an exhibition and a certificate.',
      ka: 'ხატვისა და ფერწერის შესავალი 5–8 წლისთვის, 32 შეხვედრა, გამოფენითა და სერტიფიკატით.',
    },
    ageLabel: { en: 'Age: 5–8', ka: 'ასაკი: 5–8' },
    ageRange: { min: 5, max: 8 },
    duration: { en: '1 academic year', ka: '1 აკადემიური წელი' },
    lessonLength: { en: '60 mins', ka: '60 წუთი' },
    perWeek: { en: 'Once a week', ka: 'ერთხელ კვირაში' },
    price: { was: 125, now: 100, unit: 'month' },
    about: { en: [], ka: [] },
    learn: { en: [], ka: [] },
  },
  {
    slug: 'drawing-9-12',
    audiences: ['children'],
    title: { en: 'Drawing Course', ka: 'ხატვის კურსი' },
    summary: {
      en: 'Composition, perspective, colour and personal style for ages 9–12, guided by practising artists.',
      ka: 'კომპოზიცია, პერსპექტივა, ფერი და პირადი სტილი 9–12 წლისთვის, მოქმედ ხელოვანებთან ერთად.',
    },
    ageLabel: { en: 'Age: 9–12', ka: 'ასაკი: 9–12' },
    ageRange: { min: 9, max: 12 },
    duration: { en: '1 academic year', ka: '1 აკადემიური წელი' },
    lessonLength: { en: '90 mins', ka: '90 წუთი' },
    perWeek: { en: 'Twice a week', ka: 'კვირაში ორჯერ' },
    price: { was: 200, now: 160, unit: 'month' },
    about: { en: [], ka: [] },
    learn: { en: [], ka: [] },
  },
  {
    slug: 'drawing-13-18',
    audiences: ['teenagers'],
    title: { en: 'Drawing Course', ka: 'ხატვის კურსი' },
    summary: {
      en: 'Fundamentals and technique for teenagers developing their own artistic style, ending in a final exhibition.',
      ka: 'ხატვის საფუძვლები და ტექნიკა მოზარდებისთვის, რომლებიც საკუთარ სტილს იმუშავებენ, დასკვნითი გამოფენით.',
    },
    ageLabel: { en: 'Age: 13–18', ka: 'ასაკი: 13–18' },
    ageRange: { min: 13, max: 18 },
    duration: { en: '1 academic year', ka: '1 აკადემიური წელი' },
    lessonLength: { en: '90 mins', ka: '90 წუთი' },
    perWeek: { en: 'Twice a week', ka: 'კვირაში ორჯერ' },
    price: { was: 200, now: 160, unit: 'month' },
    about: { en: [], ka: [] },
    learn: { en: [], ka: [] },
  },
  {
    slug: 'portfolio-creation',
    audiences: ['teenagers', 'adults'],
    title: { en: 'Portfolio Creation', ka: 'პორტფოლიოს შექმნა' },
    summary: {
      en: 'One-to-one mentoring to build a competitive art portfolio for studying abroad, with free admission support for partner universities.',
      ka: 'ინდივიდუალური მენტორობა საზღვარგარეთ სასწავლებლად კონკურენტული პორტფოლიოს შესაქმნელად, პარტნიორ უნივერსიტეტებში ჩაბარების უფასო მხარდაჭერით.',
    },
    ageLabel: { en: 'Age: from 16', ka: 'ასაკი: 16-დან' },
    ageRange: { min: 16 },
    duration: { en: 'From 1 month', ka: '1 თვიდან' },
    lessonLength: { en: 'Tailored', ka: 'მორგებული' },
    perWeek: { en: 'Tailored schedule', ka: 'მორგებული განრიგი' },
    price: { unit: 'individual' },
    about: { en: [], ka: [] },
    learn: { en: [], ka: [] },
  },
  {
    // Listed on /art with a price but has no detail page on the Wix site.
    slug: 'contemporary-art',
    audiences: ['adults'],
    title: { en: 'Contemporary Art Course', ka: 'თანამედროვე ხელოვნების კურსი' },
    summary: {
      en: 'A course in contemporary art practice for ages 16 and over.',
      ka: 'თანამედროვე ხელოვნების კურსი 16 წლიდან.',
    },
    ageLabel: { en: 'Age: from 16', ka: 'ასაკი: 16-დან' },
    ageRange: { min: 16 },
    duration: { en: 'Course', ka: 'კურსი' },
    lessonLength: { en: '120 mins', ka: '120 წუთი' },
    perWeek: { en: 'Once a week', ka: 'ერთხელ კვირაში' },
    price: { was: 1300, now: 800, unit: 'course' },
    about: { en: [], ka: [] },
    learn: { en: [], ka: [] },
  },
];

/** The four things the Art Academy promotes on its landing page. */
export const artHighlights = [
  {
    id: 'artists',
    title: { en: 'Professional artists', ka: 'პროფესიონალი ხელოვანები' },
    body: {
      en: 'Drawing courses are led by practising artists who have taken part in dozens of exhibitions in Georgia and abroad.',
      ka: 'ხატვის კურსებს უძღვებიან მოქმედი ხელოვანები, რომლებიც ათეულობით გამოფენაში მონაწილეობდნენ საქართველოსა და საზღვარგარეთ.',
    },
  },
  {
    id: 'lessons',
    title: { en: 'Interactive lessons', ka: 'ინტერაქტიული გაკვეთილები' },
    body: {
      en: 'Dynamic, practice-focused classes where every lesson is centred on creating real artwork.',
      ka: 'დინამიური, პრაქტიკაზე ორიენტირებული გაკვეთილები, სადაც ყოველი შეხვედრა რეალური ნამუშევრის შექმნას ეთმობა.',
    },
  },
  {
    id: 'exhibitions',
    title: { en: 'Exhibitions', ka: 'გამოფენები' },
    body: {
      en: 'Take part in the annual Levels Art Exhibition and show your work to the public as part of a real creative community.',
      ka: 'მიიღე მონაწილეობა ყოველწლიურ Levels-ის გამოფენაში და წარადგინე ნამუშევრები რეალური შემოქმედებითი საზოგადოების ნაწილად.',
    },
  },
  {
    id: 'certificate',
    title: { en: 'Certificate', ka: 'სერტიფიკატი' },
    body: {
      en: 'Receive an official certificate on completion, recognising your progress and achievement.',
      ka: 'კურსის დასრულებისას მიიღე ოფიციალური სერტიფიკატი, რომელიც შენს პროგრესსა და მიღწევას ადასტურებს.',
    },
  },
] as const;

/** Partner universities that portfolio students get free admission support for. */
export const artPartners = ['Istituto Marangoni', 'Nuova Accademia di Belle Arti (NABA)'] as const;

export const artCourseBySlug = (slug: string): Course | undefined =>
  artCourses.find((c) => c.slug === slug);
