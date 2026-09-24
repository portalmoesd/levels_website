import type { I18nText, Price } from './types';

export interface SummerSchool {
  slug: string;
  country: 'usa' | 'uk' | 'georgia';
  city: I18nText;
  institution: I18nText;
  price: Price;
  /** English tuition hours per week, as stated on the destination page. */
  hoursPerWeek?: number;
  durationWeeks: number;
  /** Fixed dates where the destination page publishes them. */
  dates?: string;
  location?: I18nText;
  excursions?: I18nText;
  /** False for the two Georgian camps, which have no page of their own. */
  hasPage: boolean;
}

/**
 * Summer school destinations.
 *
 * PRICES ARE TAKEN FROM THE LISTING PAGE (/summer-schools), not the detail
 * pages, which contradict it for five of the seven destinations. The listing is
 * treated as canonical because it is demonstrably the newer of the two: it uses
 * the struck-through discount format throughout, and the only two detail pages
 * that use that same newer format (New York and Kingston) agree with it
 * exactly. The five that disagree still carry old-style prose prices
 * ("GBP 2,950 for two weeks"), i.e. they were not updated in the last price
 * revision. See docs/content-conflicts.md — this one needs confirming before
 * launch, since it is the difference between quoting £2,350 and £3,600.
 */
export const summerSchools: SummerSchool[] = [
  // ------------------------------------------------------------------- USA
  {
    slug: 'summer-school-california',
    country: 'usa',
    city: { en: 'Los Angeles', ka: 'ლოს ანჯელესი' },
    institution: { en: 'California State University', ka: 'კალიფორნიის სახელმწიფო უნივერსიტეტი' },
    price: { now: 5300, unit: 'course', currency: 'USD' },
    hoursPerWeek: 15,
    durationWeeks: 2,
    location: {
      en: 'Northridge, about 20 minutes from Beverly Hills',
      ka: 'ბევერლი ჰილსიდან 20 წუთი',
    },
    excursions: {
      en: 'Hollywood, San Francisco, Las Vegas, Grand Canyon',
      ka: 'ჰოლივუდი, სან-ფრანცისკო, ლას-ვეგასი, გრანდ-კანიონი',
    },
    hasPage: true,
  },
  {
    slug: 'summer-school-new-york-st-johns',
    country: 'usa',
    city: { en: 'New York', ka: 'ნიუ-იორკი' },
    institution: { en: "St. John's University", ka: 'წმინდა ჯონის უნივერსიტეტი' },
    price: { was: 5200, now: 4650, unit: 'course', currency: 'USD' },
    hoursPerWeek: 15,
    durationWeeks: 2,
    dates: '01.07 – 15.07',
    location: {
      en: 'Queens campus, with Manhattan reachable by public transport',
      ka: 'ქუინსის კამპუსი, მანჰეტენამდე საზოგადოებრივი ტრანსპორტით მარტივი მისვლა',
    },
    excursions: {
      en: 'New York City, Washington DC, Niagara Falls',
      ka: 'ნიუ-იორკი, ვაშინგტონი, ნიაგარას ჩანჩქერი',
    },
    hasPage: true,
  },
  {
    slug: 'summer-school-miami-barry',
    country: 'usa',
    city: { en: 'Miami', ka: 'მაიამი' },
    institution: { en: 'Barry University', ka: 'ბარის უნივერსიტეტი' },
    price: { now: 5100, unit: 'course', currency: 'USD' },
    durationWeeks: 2,
    excursions: {
      en: 'NASA Center, South Beach, Disney Springs',
      ka: 'NASA-ს ცენტრი, საუთ ბიჩი, Disney Springs',
    },
    hasPage: true,
  },

  // -------------------------------------------------------------------- UK
  {
    slug: 'london-kingston-summer-school',
    country: 'uk',
    city: { en: 'London', ka: 'ლონდონი' },
    institution: { en: 'Kingston University', ka: 'კინგსტონის უნივერსიტეტი' },
    price: { was: 3450, now: 3100, unit: 'course', currency: 'GBP' },
    hoursPerWeek: 16,
    durationWeeks: 2,
    dates: '11.07 – 25.07',
    location: {
      en: 'University campus with easy access to central London',
      ka: 'საუნივერსიტეტო კამპუსი ცენტრალურ ლონდონთან მარტივი კავშირით',
    },
    hasPage: true,
  },
  {
    slug: 'summer-school-london-brunel',
    country: 'uk',
    city: { en: 'London', ka: 'ლონდონი' },
    institution: { en: 'Brunel University', ka: 'ბრუნელის უნივერსიტეტი' },
    price: { now: 3800, unit: 'course', currency: 'GBP' },
    hoursPerWeek: 16,
    durationWeeks: 2,
    location: { en: 'London, with easy access to central London', ka: 'ლონდონი, ლონდონის ცენტრში მარტივი წვდომით' },
    excursions: {
      en: 'National Gallery, British Museum, Science Museum, London Eye, Madame Tussauds',
      ka: 'ეროვნული გალერეა, ბრიტანეთის მუზეუმი, მეცნიერების მუზეუმი, ლონდონის თვალი, მადამ ტიუსოს მუზეუმი',
    },
    hasPage: true,
  },
  {
    slug: 'summer-school-uk-ellesmere',
    country: 'uk',
    city: { en: 'Ellesmere', ka: 'ელსმირი' },
    institution: { en: 'Ellesmere College', ka: 'ელსმირის კოლეჯი' },
    price: { now: 3600, unit: 'course', currency: 'GBP' },
    hoursPerWeek: 16,
    durationWeeks: 2,
    location: {
      en: 'About 100 km from both Manchester and Birmingham',
      ka: 'მანჩესტერიდან და ბირმინგემიდან დაახლოებით 100 კმ-ში',
    },
    excursions: {
      en: 'Wales, Chester, Shrewsbury, Liverpool, London',
      ka: 'უელსი, ჩესტერი, შრიუსბერი, ლივერპული, ლონდონი',
    },
    hasPage: true,
  },
  {
    slug: 'summer-school-london-hertfordshire',
    country: 'uk',
    city: { en: 'London', ka: 'ლონდონი' },
    institution: { en: 'University of Hertfordshire', ka: 'ჰერტფორდშირის უნივერსიტეტი' },
    price: { now: 3600, unit: 'course', currency: 'GBP' },
    hoursPerWeek: 16,
    durationWeeks: 2,
    location: { en: 'Hatfield, about 90 minutes from London', ka: 'ლონდონიდან დაახლოებით 90 წუთის სავალზე' },
    excursions: {
      en: 'St Albans, Brighton, Oxford, Cambridge, London',
      ka: 'სენტ-ოლბანსი, ბრაიტონი, ოქსფორდი, კემბრიჯი, ლონდონი',
    },
    hasPage: true,
  },

  // --------------------------------------------------------------- Georgia
  {
    slug: 'bakuriani',
    country: 'georgia',
    city: { en: 'Bakuriani', ka: 'ბაკურიანი' },
    institution: { en: 'Levels Academy camp', ka: 'ლეველს აკადემიის ბანაკი' },
    price: { now: 1680, unit: 'course', currency: 'GEL' },
    durationWeeks: 2,
    hasPage: false,
  },
  {
    slug: 'akhaltsikhe',
    country: 'georgia',
    city: { en: 'Akhaltsikhe', ka: 'ახალციხე' },
    institution: { en: 'Levels Academy camp', ka: 'ლეველს აკადემიის ბანაკი' },
    price: { now: 780, unit: 'course', currency: 'GEL' },
    durationWeeks: 2,
    hasPage: false,
  },
];

export const countryLabels = {
  usa: { en: 'USA', ka: 'აშშ' },
  uk: { en: 'UK', ka: 'დიდი ბრიტანეთი' },
  georgia: { en: 'Georgia', ka: 'საქართველო' },
} as const;

export const summerSchoolBySlug = (slug: string): SummerSchool | undefined =>
  summerSchools.find((s) => s.slug === slug);

export const summerSchoolsByCountry = (country: SummerSchool['country']): SummerSchool[] =>
  summerSchools.filter((s) => s.country === country);
