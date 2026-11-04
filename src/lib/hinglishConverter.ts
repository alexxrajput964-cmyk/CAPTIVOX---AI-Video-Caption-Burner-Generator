/**
 * Utility for Roman Hinglish conversion, detection, and viral creator presets
 */

// Devanagari to Roman transliteration mapping dictionary for natural phonetic Hinglish
const DEVANAGARI_MAP: Record<string, string> = {
  'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo', 'ऋ': 'ri',
  'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au', 'अं': 'an', 'अः': 'ah',
  'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ng',
  'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'ny',
  'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
  'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
  'प': 'p', 'फ': 'f', 'ब': 'b', 'भ': 'bh', 'म': 'm',
  'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v', 'श': 'sh', 'ष': 'sh', 'स': 's', 'ह': 'h',
  'क्ष': 'ksh', 'त्र': 'tra', 'ज्ञ': 'gya',
  'ा': 'aa', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'oo', 'ृ': 'ri',
  'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au', 'ं': 'n', 'ँ': 'n', 'ः': 'h',
  '्': '', // halant
  '़': '', // nukta
  '।' : '.', '॥': '.'
};

// Common direct Hindi word replacements to natural creator Roman Hinglish
const COMMON_WORD_DICTIONARY: Record<string, string> = {
  'यह': 'Yeh',
  'ये': 'Ye',
  'वह': 'Woh',
  'वो': 'Wo',
  'है': 'Hai',
  'हैं': 'Hain',
  'था': 'Tha',
  'थे': 'The',
  'थी': 'Thee',
  'होगा': 'Hoga',
  'होगी': 'Hogi',
  'होना': 'Hona',
  'चाहिए': 'Chahiye',
  'करो': 'Karo',
  'करेगा': 'Karega',
  'करेंगे': 'Karenge',
  'करना': 'Karna',
  'सकते': 'Sakte',
  'सकता': 'Sakta',
  'सकती': 'Sakti',
  'नहीं': 'Nahi',
  'मत': 'Mat',
  'अगर': 'Agar',
  'लेकिन': 'Lekin',
  'क्योंकि': 'Kyunki',
  'इसलिए': 'Isliye',
  'क्योकि': 'Kyunki',
  'क्यों': 'Kyun',
  'कैसे': 'Kaise',
  'कब': 'Kab',
  'कहाँ': 'Kahan',
  'कहा': 'Kaha',
  'क्या': 'Kya',
  'कौन': 'Kaun',
  'आप': 'Aap',
  'आपका': 'Aapka',
  'आपकी': 'Aapki',
  'आपके': 'Aapke',
  'तुम': 'Tum',
  'तुम्हारा': 'Tumhara',
  'हम': 'Hum',
  'हमारा': 'Humara',
  'मैं': 'Main',
  'मेरा': 'Mera',
  'मेरी': 'Meri',
  'मेरे': 'Mere',
  'वीडियो': 'Video',
  'फॉलो': 'Follow',
  'सब्सक्राइब': 'Subscribe',
  'शेयर': 'Share',
  'लाइक': 'Like',
  'पैसा': 'Paisa',
  'पैसे': 'Paise',
  'सीखो': 'Seekho',
  'सिखाओ': 'Sikhao',
  'सफलता': 'Success',
  'जिंदगी': 'Zindagi',
  'दोस्त': 'Dost',
  'लोग': 'Log',
  'काम': 'Kaam',
  'समय': 'Waqt',
  'आज': 'Aaj',
  'कल': 'Kal',
  'अभी': 'Abhi',
  'हमेशा': 'Hamesha',
  'बहुत': 'Bahut',
  'ज्यादा': 'Zyada',
  'कम': 'Kam',
  'अच्छा': 'Achha',
  'बुरा': 'Bura',
  'सच': 'Sach',
  'झूठ': 'Jhooth',
};

/**
 * Checks if a string contains Devanagari characters
 */
export function hasDevanagari(text: string): boolean {
  return /[\u0900-\u097F]/.test(text);
}

/**
 * Converts Devanagari Hindi text into natural Roman Hinglish
 */
export function convertDevanagariToHinglish(text: string): string {
  if (!text) return '';

  // First replace whole known words
  const words = text.split(/\s+/);
  const convertedWords = words.map((w) => {
    // Strip trailing punctuation
    const cleanWord = w.replace(/[.,!?।॥]+$/, '');
    const punct = w.slice(cleanWord.length);

    if (COMMON_WORD_DICTIONARY[cleanWord]) {
      return COMMON_WORD_DICTIONARY[cleanWord] + (punct === '।' || punct === '॥' ? '.' : punct);
    }

    if (!hasDevanagari(cleanWord)) {
      return w;
    }

    // Character by character fallback phonetic transliteration
    let out = '';
    for (let i = 0; i < cleanWord.length; i++) {
      const char = cleanWord[i];
      if (DEVANAGARI_MAP[char] !== undefined) {
        out += DEVANAGARI_MAP[char];
      } else {
        out += char;
      }
    }
    // Clean double vowels and edge cases
    out = out.replace(/aaaa/g, 'aa').replace(/eeee/g, 'ee');
    return (out || cleanWord) + (punct === '।' || punct === '॥' ? '.' : punct);
  });

  return convertedWords.join(' ');
}

/**
 * Curated Roman Hinglish Viral Hooks & Presets for Creators
 */
export const VIRAL_HINGLISH_PRESETS = [
  {
    title: '🔥 Retention Hook: 99% Log Ye Galti Karte Hain',
    category: 'Viral Hook',
    text: '99% log ye sabse badi galti karte hain jo unko kabhi aage nahi badhne deti. Agar aap bhi ye kar rahe ho, toh abhi stop karo!',
  },
  {
    title: '⚡ Secret Formula: Consistency Beats Talent',
    category: 'Mindset',
    text: 'Yeh secret koi nahi batata. Consistency beats talent har single time. Jab aap roz mehnat karte ho toh algorithm reward karega.',
  },
  {
    title: '💎 Money Rule: Paise Ko Kaam Pe Lagao',
    category: 'Finance',
    text: 'Sirf paise bachane se koi ameer nahi banta. Apne paise ko smart tareeke se invest karna seekho aur compounding ka magic dekho.',
  },
  {
    title: '🚀 0 to 100k Followers Strategy',
    category: 'Creator Growth',
    text: 'Pehle 3 seconds mein strong hook do, story short rakho, aur subtitles itne clear hon ki log bina sound ke bhi pura video dekhein.',
  },
  {
    title: '🧠 Deep Focus & No Distraction',
    category: 'Productivity',
    text: 'Phone ko silent pe daalo, distraction ko eliminate karo aur apne goal par laser focus rakho. Har din ek naya mouka hai.',
  },
];
