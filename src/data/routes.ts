import { courses } from './courses';
import { artCourses } from './art';
import { summerSchools, type SummerSchool } from './summer';
import type { Course } from './types';
import type { Locale } from './site';

/**
 * The detail pages generated at the site root.
 *
 * One manifest drives both locale route files, so English and Georgian can
 * never drift apart in which pages exist.
 */

export interface CourseRoute {
  kind: 'course';
  slug: string;
  course: Course;
  parent: { slug: string; label: Record<Locale, string> };
}

export interface SummerRoute {
  kind: 'summer';
  slug: string;
  school: SummerSchool;
}

export type DetailRoute = CourseRoute | SummerRoute;

const ENGLISH_PARENT = {
  slug: 'english',
  label: { en: 'English', ka: 'ინგლისური' },
} as const;

const ART_PARENT = {
  slug: 'art',
  label: { en: 'Art Academy', ka: 'ხელოვნების აკადემია' },
} as const;

export const detailRoutes: DetailRoute[] = [
  ...courses.map(
    (course): CourseRoute => ({
      kind: 'course',
      slug: course.slug,
      course,
      parent: ENGLISH_PARENT,
    })
  ),
  ...artCourses
    // Contemporary Art is listed on /art with a price but has no page of its
    // own on the Wix site, and there is no copy for one.
    .filter((course) => course.slug !== 'contemporary-art')
    .map(
      (course): CourseRoute => ({
        kind: 'course',
        slug: course.slug,
        course,
        parent: ART_PARENT,
      })
    ),
  ...summerSchools
    .filter((school) => school.hasPage)
    .map((school): SummerRoute => ({ kind: 'summer', slug: school.slug, school })),
];

/** Every slug that has a page, used by the redirect map to spot gaps. */
export const detailSlugs = detailRoutes.map((route) => route.slug);
