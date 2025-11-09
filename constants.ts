import type { ProgressStep, VoiceOption, TopicCategory } from './types';

export const initialProgressSteps: ProgressStep[] = [
  { id: 'script', label: 'Ssenariy va Tavsif Yaratilmoqda', status: 'pending' },
  { id: 'image', label: 'Rasm Yaratilmoqda', status: 'pending' },
  { id: 'audio', label: 'Ovoz Yozilmoqda', status: 'pending' },
];

export const availableVoices: { id: VoiceOption, name: string }[] = [
  { id: 'Zephyr', name: 'Zephyr (Do\'stona va Tabiiy)' },
  { id: 'Kore', name: 'Kore (Yumshoq va Tiniq)' },
  { id: 'Fenrir', name: 'Fenrir (Aniq va Ishonchli)' },
  { id: 'Charon', name: 'Charon (Vazmin)' },
  { id: 'Achernar', name: 'Achernar (Serg\'ayrat)' },
  { id: 'Puck', name: 'Puck (Quvnoq)' },
  { id: 'Gacrux', name: 'Gacrux (Jiddiy)' },
];

export const curatedViralTopics: TopicCategory[] = [
  {
    category: '💡 Texnologiya va AI',
    topics: [
      'Sun’iy intellekt 5 yil ichida hayotni qanday o‘zgartiradi?',
      'Telefoningiz siz haqingizda biladigan 5 qo‘rqinchli narsa',
      'AI bilan yaratilgan mashhur odamlarning “soxta” intervyulari (deepfake)',
      'Oddiy odamlar AI orqali boy bo‘lyapti – qanday qilib?',
      '2025-yilda chiqadigan eng kutilgan texnologiyalar',
    ],
  },
  {
    category: '🌍 Hayot tarzi va psixologiya',
    topics: [
      'Sizni kuchsiz qilib qo‘yadigan 5 kundalik odat',
      'Telefonni kam ishlatish hayotingizni qanday o‘zgartiradi?',
      'Tongi odatlar – muvaffaqiyatli insonlarning siri',
      'Hech kimga aytilmagan: introvertlarning yashirin kuchi',
      'Boshqalar fikridan qo‘rqishni to‘xtatish usullari',
    ],
  },
  {
    category: '💸 Pul, biznes va motivatsiya',
    topics: [
      'Yoshlar qanday qilib 0 dan onlayn daromad topishyapti?',
      'Passiv daromad tushunchasi – 1 marta qilasiz, doim foyda',
      'Boy odamlar o‘ylaydigan, kambag‘allar o‘ylamaydigan 5 narsa',
      'Bir so‘m sarmoyasiz boshlanadigan 3 internet biznes',
      'Motivatsiya emas – tizim! Shunday yashang',
    ],
  },
  {
    category: '⚽ Sport va mashhurlar',
    topics: [
      'Eng shov-shuvli sport lahzalari (ko‘rganingda “vau” deysan)',
      'Messi va Ronaldoning so‘nggi 10 yildagi real farqi',
      'Bokschilarning mashg‘ulotdan keyingi psixologik sirlar',
      '“Undan kuchliroq yo‘q” – tarixdagi eng epik sport momentlar',
      'Sportchilar motivatsiyasi: qanday qilib yengishni o‘rganishadi',
    ],
  },
  {
    category: '🤯 Faktlar va bilim',
    topics: [
      'Inson tanasidagi siz bilmagan 5 g‘aroyib narsa',
      'Dunyodagi eng noodatiy qonunlar',
      'Ko‘pchilik bilmaydigan tarixiy sirlar',
      'Eng uzoq umr ko‘rgan odamning sirlari',
      'Eng g‘alati ilmiy kashfiyotlar',
    ],
  },
  {
    category: '🎬 Trend, kino va pop-madaniyat',
    topics: [
      'Netflix’da hozir eng ko‘p tomosha qilinayotgan seriallar',
      'AI bilan qayta yaratilgan mashhur kinokadrlar',
      'Mashhurlar AI versiyasida qanday ko‘rinadi?',
      '2025-yil musiqasida trend bo‘layotgan yangi yo‘nalishlar',
      '“Realityni buzadigan” mashhur odamlar haqida faktlar',
    ],
  },
];
