import type { Locale } from '../data/site';

/** Interface strings. Georgian taken from the existing /ka pages. */
export const ui = {
  'nav.english':       { en: 'English',        ka: 'ინგლისური' },
  'nav.art':           { en: 'Art',            ka: 'ხელოვნება' },
  'nav.summer':        { en: 'Summer School',  ka: 'საზაფხულო სკოლები' },
  'nav.studyAbroad':   { en: 'Study Abroad',   ka: 'სწავლა საზღვარგარეთ' },
  'nav.about':         { en: 'About',          ka: 'ჩვენ შესახებ' },
  'nav.contact':       { en: 'Contact',        ka: 'კონტაქტი' },
  'nav.team':          { en: 'Our Team',       ka: 'ჩვენი გუნდი' },
  'nav.quiz':          { en: 'Quiz',           ka: 'ქვიზი' },
  'nav.menu':          { en: 'Menu',           ka: 'მენიუ' },
  'nav.close':         { en: 'Close',          ka: 'დახურვა' },
  'nav.skipToContent': { en: 'Skip to content', ka: 'გადასვლა ძირითად შიგთავსზე' },

  'cta.enroll':        { en: 'Enroll',            ka: 'რეგისტრაცია' },
  'cta.enrollNow':     { en: 'Enroll now',        ka: 'დარეგისტრირდი ახლავე' },
  'cta.signUp':        { en: 'Sign up',           ka: 'რეგისტრაცია' },
  'cta.learnMore':     { en: 'Learn more',        ka: 'გაიგე მეტი' },
  'cta.bookConsult':   { en: 'Book a free consultation', ka: 'დაჯავშნე უფასო კონსულტაცია' },
  'cta.takeQuiz':      { en: 'Take the quiz',     ka: 'გაიარე ქვიზი' },
  'cta.apply':         { en: 'Apply',             ka: 'განაცხადის გაგზავნა' },
  'cta.viewCourses':   { en: 'View courses',      ka: 'კურსების ნახვა' },

  'course.duration':      { en: 'Duration',          ka: 'ხანგრძლივობა' },
  'course.lessonLength':  { en: 'Lesson duration',   ka: 'გაკვეთილი' },
  'course.perWeek':       { en: 'Lessons per week',  ka: 'გაკვეთილები' },
  'course.age':           { en: 'Age',               ka: 'ასაკი' },
  'course.price':         { en: 'Price',             ka: 'ფასი' },
  'course.about':         { en: 'About the course',  ka: 'კურსის შესახებ' },
  'course.learn':         { en: 'What will students learn?', ka: 'რას მოიცავს კურსი?' },
  'course.materials':     { en: 'Learning materials', ka: 'სასწავლო მასალები' },
  'course.start':         { en: 'When does the course start?', ka: 'როდის იწყება კურსი?' },
  'course.groups':        { en: 'How are groups formed?', ka: 'როგორ კომპლექტდება ჯგუფები?' },
  'course.perMonth':      { en: '/month',            ka: '/თვე' },
  'course.perCourse':     { en: '/course',           ka: '/კურსი' },
  'course.individual':    { en: 'Individual pricing', ka: 'ინდ. ფასი' },
  'course.tailored':      { en: 'Tailored schedule', ka: 'მორგებული განრიგი' },

  'group.children':   { en: 'Children',   ka: 'ბავშვები' },
  'group.teenagers':  { en: 'Teenagers',  ka: 'თინეიჯერები' },
  'group.adults':     { en: 'Adults',     ka: 'ზრდასრულები' },
  'group.corporate':  { en: 'Corporate',  ka: 'კორპორაციული' },
  'group.forCompanies': { en: 'For companies', ka: 'კომპანიებისთვის' },

  'quiz.title':  { en: 'Test your English skills', ka: 'შეამოწმე შენი ინგლისური' },
  'quiz.body':   {
    en: 'Take our quick and free English language quiz to assess your proficiency level and discover the right course for you.',
    ka: 'გაიარე ჩვენი სწრაფი და უფასო ტესტი, შეაფასე შენი დონე და აღმოაჩინე შენთვის შესაფერისი კურსი.',
  },

  'form.firstName': { en: 'First name', ka: 'სახელი' },
  'form.lastName':  { en: 'Last name',  ka: 'გვარი' },
  'form.phone':     { en: 'Phone',      ka: 'ტელეფონი' },
  'form.email':     { en: 'Email',      ka: 'ელ. ფოსტა' },
  'form.message':   { en: 'Message',    ka: 'შეტყობინება' },
  'form.course':    { en: 'Course',     ka: 'კურსი' },
  'form.birthday':  { en: 'Date of birth', ka: 'დაბადების თარიღი' },
  'form.resume':    { en: 'Upload CV',  ka: 'ატვირთე CV' },
  'form.submit':    { en: 'Submit',     ka: 'გაგზავნა' },
  'form.sending':   { en: 'Sending…',   ka: 'იგზავნება…' },
  'form.required':  { en: 'This field is required', ka: 'ველის შევსება სავალდებულოა' },
  'form.invalidEmail': { en: 'Enter a valid email address', ka: 'შეიყვანე სწორი ელ. ფოსტა' },
  'form.success':   {
    en: 'Thank you — we have received your message and will be in touch shortly.',
    ka: 'გმადლობთ — თქვენი შეტყობინება მიღებულია და მალე დაგიკავშირდებით.',
  },
  'form.error': {
    en: 'Something went wrong. Please try again, or call us on 032 2 18 06 05.',
    ka: 'დაფიქსირდა შეცდომა. სცადე ხელახლა ან დაგვირეკე: 032 2 18 06 05.',
  },

  'footer.rights':  { en: 'All rights reserved.', ka: 'ყველა უფლება დაცულია.' },
  'footer.privacy': { en: 'Privacy Policy', ka: 'კონფიდენციალურობის პოლიტიკა' },
  'footer.workWithUs': { en: 'Work with us', ka: 'შემოუერთდი ჩვენს გუნდს' },

  'cambridge.partner': {
    en: 'Levels Academy is an official Cambridge English Educational Partner.',
    ka: 'ლეველს აკადემია კემბრიჯის ოფიციალური საგანმანათლებლო პარტნიორია.',
  },

  'verify.title':     { en: 'Certificate verification', ka: 'სერტიფიკატის ვერიფიკაცია' },
  'verify.checking':  { en: 'Checking…', ka: 'მოწმდება…' },
  'verify.valid':     { en: 'This certificate is valid.', ka: 'სერტიფიკატი ნამდვილია.' },
  'verify.notFound':  {
    en: 'No certificate matches this code.',
    ka: 'ამ კოდით სერტიფიკატი ვერ მოიძებნა.',
  },
  'verify.number':    { en: 'Certificate No.', ka: 'სერტიფიკატის №' },
  'verify.issued':    { en: 'Issued', ka: 'გაცემის თარიღი' },

  'error.404.title': { en: 'Page not found', ka: 'გვერდი ვერ მოიძებნა' },
  'error.404.body': {
    en: 'The page you are looking for does not exist or has moved.',
    ka: 'გვერდი, რომელსაც ეძებთ, არ არსებობს ან გადატანილია.',
  },
  'error.backHome': { en: 'Back to home', ka: 'მთავარ გვერდზე' },
} as const;

export type UiKey = keyof typeof ui;

/** Returns a translator bound to `locale`. */
export function useTranslations(locale: Locale) {
  return function t(key: UiKey): string {
    return ui[key][locale] ?? ui[key].en;
  };
}
