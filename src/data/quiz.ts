import type { Locale } from './site';

/**
 * The free English placement quiz.
 *
 * The Wix site ran this through a third-party embed whose questions were not
 * recoverable from the page HTML, so the quiz is rebuilt here: 20 questions
 * graded from A1 to C1, scored in the browser so it works with no backend.
 *
 * Questions are grouped by the level they test. A learner's level is the
 * highest band in which they answered most questions correctly, which is a
 * more stable result than a raw percentage.
 */

export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export interface QuizQuestion {
  id: string;
  level: Level;
  /** The question is English-language regardless of interface locale — it is
   *  an English test — but the instructions around it are translated. */
  prompt: string;
  options: string[];
  /** Index into `options`. */
  answer: number;
}

export const quizQuestions: QuizQuestion[] = [
  // A1 ------------------------------------------------------------------
  { id: 'q1', level: 'A1', prompt: 'She ___ a teacher.', options: ['be', 'is', 'are', 'am'], answer: 1 },
  { id: 'q2', level: 'A1', prompt: 'They ___ to school every day.', options: ['goes', 'going', 'go', 'gone'], answer: 2 },
  { id: 'q3', level: 'A1', prompt: 'There ___ two books on the table.', options: ['is', 'be', 'was', 'are'], answer: 3 },
  { id: 'q4', level: 'A1', prompt: 'I have ___ apple.', options: ['a', 'an', 'the', '—'], answer: 1 },

  // A2 ------------------------------------------------------------------
  { id: 'q5', level: 'A2', prompt: 'Yesterday we ___ to the cinema.', options: ['go', 'goes', 'went', 'gone'], answer: 2 },
  { id: 'q6', level: 'A2', prompt: 'This book is ___ than that one.', options: ['interesting', 'more interesting', 'most interesting', 'interestinger'], answer: 1 },
  { id: 'q7', level: 'A2', prompt: 'I ___ play the piano when I was six.', options: ['can', 'could', 'will', 'must'], answer: 1 },
  { id: 'q8', level: 'A2', prompt: 'She is ___ dinner at the moment.', options: ['cook', 'cooks', 'cooking', 'cooked'], answer: 2 },

  // B1 ------------------------------------------------------------------
  { id: 'q9', level: 'B1', prompt: 'I ___ in Tbilisi since 2015.', options: ['live', 'lived', 'have lived', 'am living'], answer: 2 },
  { id: 'q10', level: 'B1', prompt: 'If it rains tomorrow, we ___ at home.', options: ['stay', 'will stay', 'stayed', 'would stay'], answer: 1 },
  { id: 'q11', level: 'B1', prompt: 'The email ___ yesterday morning.', options: ['sent', 'was sent', 'has sent', 'is sending'], answer: 1 },
  { id: 'q12', level: 'B1', prompt: 'He asked me where I ___ from.', options: ['come', 'came', 'coming', 'had come'], answer: 1 },

  // B2 ------------------------------------------------------------------
  { id: 'q13', level: 'B2', prompt: 'By the time we arrived, the film ___.', options: ['started', 'has started', 'had started', 'was starting'], answer: 2 },
  { id: 'q14', level: 'B2', prompt: 'I wish I ___ more time to prepare.', options: ['have', 'had', 'will have', 'would have'], answer: 1 },
  { id: 'q15', level: 'B2', prompt: 'She is used to ___ in front of large audiences.', options: ['speak', 'speaking', 'spoke', 'speaks'], answer: 1 },
  { id: 'q16', level: 'B2', prompt: 'Not only ___ late, but he also forgot the documents.', options: ['he was', 'was he', 'he is', 'is he'], answer: 1 },

  // C1 ------------------------------------------------------------------
  { id: 'q17', level: 'C1', prompt: 'Had I known about the delay, I ___ differently.', options: ['would plan', 'will have planned', 'would have planned', 'had planned'], answer: 2 },
  { id: 'q18', level: 'C1', prompt: 'The proposal was rejected on the ___ that it lacked detail.', options: ['grounds', 'reasons', 'causes', 'bases'], answer: 0 },
  { id: 'q19', level: 'C1', prompt: 'Rarely ___ such a compelling argument.', options: ['I have heard', 'have I heard', 'I heard', 'did I heard'], answer: 1 },
  { id: 'q20', level: 'C1', prompt: 'Her explanation, ___ convincing, left several questions open.', options: ['while', 'despite', 'although being', 'however'], answer: 0 },
];

export const levelDescriptions: Record<Level, { en: string; ka: string }> = {
  A1: {
    en: 'Beginner. You can understand and use simple everyday expressions and basic phrases.',
    ka: 'დამწყები. გესმის და იყენებ მარტივ ყოველდღიურ გამოთქმებსა და ფრაზებს.',
  },
  A2: {
    en: 'Elementary. You can communicate in simple, routine situations on familiar topics.',
    ka: 'ელემენტარული. შეგიძლია კომუნიკაცია მარტივ, ყოველდღიურ სიტუაციებში ნაცნობ თემებზე.',
  },
  B1: {
    en: 'Intermediate. You can handle most situations while travelling and describe experiences and plans.',
    ka: 'საშუალო. უმკლავდები სიტუაციების უმეტესობას მოგზაურობისას და აღწერ გამოცდილებასა და გეგმებს.',
  },
  B2: {
    en: 'Upper-intermediate. You can interact fluently and argue a point of view on a range of subjects.',
    ka: 'საშუალოზე მაღალი. თავისუფლად ურთიერთობ და შეგიძლია საკუთარი პოზიციის დასაბუთება სხვადასხვა თემაზე.',
  },
  C1: {
    en: 'Advanced. You can express yourself fluently and precisely, including in academic and professional contexts.',
    ka: 'მაღალი. თავისუფლად და ზუსტად გამოხატავ აზრს, მათ შორის აკადემიურ და პროფესიულ კონტექსტში.',
  },
};

/** Which course each level should lead to. */
export const levelRecommendation: Record<Level, { slug: string; label: Record<Locale, string> }> = {
  A1: { slug: 'english-for-adults', label: { en: 'General English', ka: 'ზოგადი ინგლისური' } },
  A2: { slug: 'english-for-adults', label: { en: 'General English', ka: 'ზოგადი ინგლისური' } },
  B1: { slug: 'fce-pet-cae', label: { en: 'Cambridge PET / FCE', ka: 'კემბრიჯი PET / FCE' } },
  B2: { slug: 'ielts', label: { en: 'IELTS preparation', ka: 'IELTS-ის მომზადება' } },
  C1: { slug: 'ielts', label: { en: 'IELTS preparation', ka: 'IELTS-ის მომზადება' } },
};

export const LEVEL_ORDER: Level[] = ['A1', 'A2', 'B1', 'B2', 'C1'];
