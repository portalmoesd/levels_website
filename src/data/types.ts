import type { Locale } from './site';

/** A string that exists in every locale. */
export type I18nText = Record<Locale, string>;
/** A list that exists in every locale. */
export type I18nList = Record<Locale, string[]>;

export type AudienceId = 'children' | 'teenagers' | 'adults' | 'corporate';

export interface Price {
  /** Original list price in GEL, shown struck through. Omit when there is no discount. */
  was?: number;
  /** Price actually charged, in GEL. Omit when pricing is individual. */
  now?: number;
  /** Billing unit. `individual` renders "Individual pricing" instead of a number. */
  unit: 'month' | 'course' | 'individual';
  /** Currency for the summer schools, which are priced in USD/GBP. */
  currency?: 'GEL' | 'USD' | 'GBP';
}

export interface Course {
  slug: string;
  /** Which audience blocks this course appears under on the homepage. */
  audiences: AudienceId[];
  title: I18nText;
  /** Two-word strapline above the title, e.g. "Exam focused." */
  kicker?: I18nText;
  summary: I18nText;
  ageLabel: I18nText;
  /** Structured age range for the Course JSON-LD. */
  ageRange?: { min: number; max?: number };
  duration: I18nText;
  lessonLength: I18nText;
  perWeek: I18nText;
  price: Price;
  about: I18nList;
  learn: I18nList;
  materials?: I18nList;
  start?: I18nList;
  groups?: I18nList;
  /** Extra sections that do not fit the standard shape (e.g. private lesson rates). */
  extra?: { heading: I18nText; items: I18nList }[];
  image?: string;
  /** Marks the course as Cambridge-aligned, which shows the partner badge. */
  cambridge?: boolean;
}
