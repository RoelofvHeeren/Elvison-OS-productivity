// Gender-tagged transformation images — 6 male + 6 female pairs
// Landing page filters these based on coach's target audience

export interface TransformationImage {
  before: string;
  after: string;
  name: string;
  result: string;
  gender: 'male' | 'female';
}

const TRANSFORMATION_IMAGES_ALL: TransformationImage[] = [
  // Male
  { before: '/assets/images/transformations/m1_before.jpg', after: '/assets/images/transformations/m1_after.jpg', name: 'Jake M.',   result: '-22 lbs · 24 weeks',          gender: 'male' },
  { before: '/assets/images/transformations/m2_before.jpg', after: '/assets/images/transformations/m2_after.jpg', name: 'Marcus J.', result: '+18 lbs lean muscle · 24 weeks', gender: 'male' },
  { before: '/assets/images/transformations/m3_before.jpg', after: '/assets/images/transformations/m3_after.jpg', name: 'David K.',  result: 'Body recomp · 24 weeks',        gender: 'male' },
  { before: '/assets/images/transformations/m4_before.jpg', after: '/assets/images/transformations/m4_after.jpg', name: 'Chris L.',  result: '-30 lbs · 24 weeks',            gender: 'male' },
  { before: '/assets/images/transformations/m5_before.jpg', after: '/assets/images/transformations/m5_after.jpg', name: 'James R.',  result: '+14 lbs muscle · 24 weeks',     gender: 'male' },
  { before: '/assets/images/transformations/m6_before.jpg', after: '/assets/images/transformations/m6_after.jpg', name: 'Ryan T.',   result: 'Lean recomp · 24 weeks',        gender: 'male' },
  // Female
  { before: '/assets/images/transformations/f1_before.jpg', after: '/assets/images/transformations/f1_after.jpg', name: 'Priya S.',  result: '-18 lbs · 24 weeks',            gender: 'female' },
  { before: '/assets/images/transformations/f2_before.jpg', after: '/assets/images/transformations/f2_after.jpg', name: 'Sarah K.',  result: 'Body recomp · 24 weeks',        gender: 'female' },
  { before: '/assets/images/transformations/f3_before.jpg', after: '/assets/images/transformations/f3_after.jpg', name: 'Demi C.',   result: '-26 lbs · 24 weeks',            gender: 'female' },
  { before: '/assets/images/transformations/f4_before.jpg', after: '/assets/images/transformations/f4_after.jpg', name: 'Aisha T.',  result: 'Glute & tone build · 24 weeks', gender: 'female' },
  { before: '/assets/images/transformations/f5_before.jpg', after: '/assets/images/transformations/f5_after.jpg', name: 'Lisa M.',   result: '-20 lbs · 24 weeks',            gender: 'female' },
  { before: '/assets/images/transformations/f6_before.jpg', after: '/assets/images/transformations/f6_after.jpg', name: 'Nina R.',   result: 'Post-baby recomp · 24 weeks',   gender: 'female' },
];

const MALE_KEYWORDS = ['men', 'male', 'guys', 'fathers', 'dads', 'husbands', 'boys', 'gentlemen'];
const FEMALE_KEYWORDS = ['women', 'female', 'ladies', 'mothers', 'moms', 'wives', 'girls', 'menopause', 'postpartum', 'post-baby'];

export function getTransformationsForAudience(targetAudience?: string): TransformationImage[] {
  const ta = (targetAudience || '').toLowerCase();
  const isMale = MALE_KEYWORDS.some(k => ta.includes(k));
  const isFemale = FEMALE_KEYWORDS.some(k => ta.includes(k));

  if (isMale && !isFemale) return TRANSFORMATION_IMAGES_ALL.filter(t => t.gender === 'male');
  if (isFemale && !isMale) return TRANSFORMATION_IMAGES_ALL.filter(t => t.gender === 'female');

  // Mixed or unspecified: 3 male + 3 female
  return [
    ...TRANSFORMATION_IMAGES_ALL.filter(t => t.gender === 'male').slice(0, 3),
    ...TRANSFORMATION_IMAGES_ALL.filter(t => t.gender === 'female').slice(0, 3),
  ];
}
