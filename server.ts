import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Body parser with 50mb limit for video/audio data
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// In-memory data store for persistent user sessions, projects and exports
interface UserRecord {
  id: string;
  email: string;
  phone: string;
  full_name: string;
  tier: 'free' | 'pro' | 'business' | 'unlimited';
  is_admin: boolean;
  is_blocked: boolean;
  role: 'owner' | 'admin' | 'user';
  exports_today: number;
  exports_today_date: string;
  created_at: string;
}

interface SystemSettings {
  monetization_mode: 'free' | 'paid';
  watermark_on_free_tier: boolean;
  daily_export_limit_free: number;
  allow_registration: boolean;
  updated_at: string;
}

let systemSettings: SystemSettings = {
  monetization_mode: 'free', // 1-Click Free vs Paid master switch
  watermark_on_free_tier: false,
  daily_export_limit_free: 99999,
  allow_registration: true,
  updated_at: new Date().toISOString(),
};

interface ProjectRecord {
  id: string;
  user_id: string;
  title: string;
  video_url: string;
  video_name: string;
  duration: number;
  status: 'draft' | 'transcribing' | 'ready' | 'exporting';
  template_id: string;
  frame: '9:16' | '1:1' | '16:9';
  position: 'top' | 'center' | 'bottom';
  text_case: 'none' | 'uppercase' | 'capitalize' | 'lowercase';
  font_family: string;
  font_size: number;
  font_weight: number;
  text_color: string;
  highlight_color: string;
  captions: any[];
  created_at: string;
  updated_at: string;
}

interface ExportRecord {
  id: string;
  user_id: string;
  project_id: string;
  project_title: string;
  format: 'mp4' | 'srt' | 'vtt';
  duration: number;
  has_watermark: boolean;
  created_at: string;
}

const users: Record<string, UserRecord> = {};
const projects: Record<string, ProjectRecord> = {};
const exportsList: ExportRecord[] = [];

// Seed Owner User: Vineet Rajput (Permanent Master Access, No Login Required)
users['demo-user'] = {
  id: 'demo-user',
  email: 'alexxrajput964@gmail.com',
  phone: '9876543210',
  full_name: 'Vineet Rajput (Founder & Owner)',
  tier: 'unlimited',
  is_admin: true,
  is_blocked: false,
  role: 'owner',
  exports_today: 0,
  exports_today_date: new Date().toISOString().split('T')[0],
  created_at: new Date().toISOString(),
};

// Seed Master Admin User
users['admin-user'] = {
  id: 'admin-user',
  email: 'admin@captivox.app',
  phone: '9999999999',
  full_name: 'Captivox Master Admin',
  tier: 'unlimited',
  is_admin: true,
  is_blocked: false,
  role: 'admin',
  exports_today: 0,
  exports_today_date: new Date().toISOString().split('T')[0],
  created_at: new Date().toISOString(),
};

// Seed sample users for testing user data section and blocking
users['user-rohan'] = {
  id: 'user-rohan',
  email: 'rohan.sharma@gmail.com',
  phone: '9811122233',
  full_name: 'Rohan Sharma (Reels Creator)',
  tier: 'free',
  is_admin: false,
  is_blocked: false,
  role: 'user',
  exports_today: 2,
  exports_today_date: new Date().toISOString().split('T')[0],
  created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
};

users['user-priya'] = {
  id: 'user-priya',
  email: 'priya.verma@creatorhub.in',
  phone: '9877766554',
  full_name: 'Priya Verma (YouTube Shorts)',
  tier: 'pro',
  is_admin: false,
  is_blocked: false,
  role: 'user',
  exports_today: 14,
  exports_today_date: new Date().toISOString().split('T')[0],
  created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
};

users['user-blocked-demo'] = {
  id: 'user-blocked-demo',
  email: 'abusive_bot@tempmail.com',
  phone: '9123456789',
  full_name: 'Suspended Account Example',
  tier: 'free',
  is_admin: false,
  is_blocked: true,
  role: 'user',
  exports_today: 0,
  exports_today_date: new Date().toISOString().split('T')[0],
  created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
};

// Seed 2 High Impact Sample Projects with Hinglish & Hindi captions
projects['proj-hinglish-viral'] = {
  id: 'proj-hinglish-viral',
  user_id: 'demo-user',
  title: 'Consistent Effort Secret (Hinglish Reel)',
  // Sample reliable direct mp4 stream for testing
  video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  video_name: 'creator_talk_hinglish.mp4',
  duration: 15,
  status: 'ready',
  template_id: 'saas-gradient',
  frame: '9:16',
  position: 'bottom',
  text_case: 'uppercase',
  font_family: 'Outfit',
  font_size: 5,
  font_weight: 800,
  text_color: '#FFFFFF',
  highlight_color: '#FF8C1A',
  created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  updated_at: new Date().toISOString(),
  captions: [
    {
      id: 'cap-1',
      idx: 1,
      start_time: 0.2,
      end_time: 2.5,
      text: 'Yeh secret koi nahi batata',
      words: [
        { text: 'Yeh', start: 0.2, end: 0.6 },
        { text: 'secret', start: 0.6, end: 1.1 },
        { text: 'koi', start: 1.1, end: 1.5 },
        { text: 'nahi', start: 1.5, end: 1.9 },
        { text: 'batata', start: 1.9, end: 2.5 },
      ],
    },
    {
      id: 'cap-2',
      idx: 2,
      start_time: 2.6,
      end_time: 5.1,
      text: 'Consistency beats talent every time',
      words: [
        { text: 'Consistency', start: 2.6, end: 3.3 },
        { text: 'beats', start: 3.3, end: 3.8 },
        { text: 'talent', start: 3.8, end: 4.4 },
        { text: 'every', start: 4.4, end: 4.7 },
        { text: 'time', start: 4.7, end: 5.1 },
      ],
    },
    {
      id: 'cap-3',
      idx: 3,
      start_time: 5.3,
      end_time: 8.0,
      text: 'Jab aap roz video upload karte ho',
      words: [
        { text: 'Jab', start: 5.3, end: 5.7 },
        { text: 'aap', start: 5.7, end: 6.1 },
        { text: 'roz', start: 6.1, end: 6.6 },
        { text: 'video', start: 6.6, end: 7.2 },
        { text: 'upload', start: 7.2, end: 7.6 },
        { text: 'karte ho', start: 7.6, end: 8.0 },
      ],
    },
    {
      id: 'cap-4',
      idx: 4,
      start_time: 8.2,
      end_time: 11.2,
      text: 'Algorithm aapko reward karta hai',
      words: [
        { text: 'Algorithm', start: 8.2, end: 9.0 },
        { text: 'aapko', start: 9.0, end: 9.6 },
        { text: 'reward', start: 9.6, end: 10.3 },
        { text: 'karta', start: 10.3, end: 10.7 },
        { text: 'hai', start: 10.7, end: 11.2 },
      ],
    },
    {
      id: 'cap-5',
      idx: 5,
      start_time: 11.4,
      end_time: 14.5,
      text: 'Subscribe for daily creator tips',
      words: [
        { text: 'Subscribe', start: 11.4, end: 12.1 },
        { text: 'for', start: 12.1, end: 12.5 },
        { text: 'daily', start: 12.5, end: 13.1 },
        { text: 'creator', start: 13.1, end: 13.8 },
        { text: 'tips', start: 13.8, end: 14.5 },
      ],
    },
  ],
};

projects['proj-hindi-hormozi'] = {
  id: 'proj-hindi-hormozi',
  user_id: 'demo-user',
  title: 'Hormozi Style Yellow (Roman Hinglish Short)',
  video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  video_name: 'growth_mindset_hinglish.mp4',
  duration: 15,
  status: 'ready',
  template_id: 'yellow-hormozi',
  frame: '9:16',
  position: 'bottom',
  text_case: 'uppercase',
  font_family: 'Archivo Black',
  font_size: 6,
  font_weight: 900,
  text_color: '#FFFFFF',
  highlight_color: '#FFE600',
  created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  updated_at: new Date().toISOString(),
  captions: [
    {
      id: 'h-1',
      idx: 1,
      start_time: 0.5,
      end_time: 3.0,
      text: 'Pehla kadam sabse mushkil hota hai',
      words: [
        { text: 'Pehla', start: 0.5, end: 1.0 },
        { text: 'kadam', start: 1.0, end: 1.5 },
        { text: 'sabse', start: 1.5, end: 2.1 },
        { text: 'mushkil', start: 2.1, end: 2.6 },
        { text: 'hota hai', start: 2.6, end: 3.0 },
      ],
    },
    {
      id: 'h-2',
      idx: 2,
      start_time: 3.2,
      end_time: 6.2,
      text: 'Lekin rukna koi option nahi',
      words: [
        { text: 'Lekin', start: 3.2, end: 3.9 },
        { text: 'rukna', start: 3.9, end: 4.6 },
        { text: 'koi', start: 4.6, end: 5.2 },
        { text: 'option', start: 5.2, end: 5.8 },
        { text: 'nahi', start: 5.8, end: 6.2 },
      ],
    },
    {
      id: 'h-3',
      idx: 3,
      start_time: 6.5,
      end_time: 9.8,
      text: 'Apne sapno par vishwas rakho',
      words: [
        { text: 'Apne', start: 6.5, end: 7.2 },
        { text: 'sapno', start: 7.2, end: 8.0 },
        { text: 'par', start: 8.0, end: 8.5 },
        { text: 'vishwas', start: 8.5, end: 9.2 },
        { text: 'rakho', start: 9.2, end: 9.8 },
      ],
    },
  ],
};

// Seed 3: Classy Luxury & Smooth ("Smoad & Light") Roman Hinglish Project
projects['proj-classy-luxury'] = {
  id: 'proj-classy-luxury',
  user_id: 'demo-user',
  title: 'Quiet Luxury Classy Reel (Smoad & Light)',
  video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  video_name: 'luxury_aesthetic_hinglish.mp4',
  duration: 15,
  status: 'ready',
  template_id: 'premium',
  frame: '9:16',
  position: 'center',
  text_case: 'capitalize',
  font_family: 'Playfair Display',
  font_size: 5,
  font_weight: 400,
  text_color: '#FDFBF7',
  highlight_color: '#D4AF37',
  created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  updated_at: new Date().toISOString(),
  captions: [
    {
      id: 'lux-1',
      idx: 1,
      start_time: 0.4,
      end_time: 3.2,
      text: 'Aapka content classy dikhega',
      words: [
        { text: 'Aapka', start: 0.4, end: 1.1 },
        { text: 'content', start: 1.1, end: 1.9 },
        { text: 'classy', start: 1.9, end: 2.5 },
        { text: 'dikhega', start: 2.5, end: 3.2 },
      ],
    },
    {
      id: 'lux-2',
      idx: 2,
      start_time: 3.4,
      end_time: 6.8,
      text: 'Simple text aur smooth flow',
      words: [
        { text: 'Simple', start: 3.4, end: 4.2 },
        { text: 'text', start: 4.2, end: 5.0 },
        { text: 'aur', start: 5.0, end: 5.7 },
        { text: 'smooth', start: 5.7, end: 6.3 },
        { text: 'flow', start: 6.3, end: 6.8 },
      ],
    },
    {
      id: 'lux-3',
      idx: 3,
      start_time: 7.0,
      end_time: 10.5,
      text: 'Khud se edit karo ek click mein',
      words: [
        { text: 'Khud', start: 7.0, end: 7.8 },
        { text: 'se', start: 7.8, end: 8.3 },
        { text: 'edit', start: 8.3, end: 9.1 },
        { text: 'karo', start: 9.1, end: 9.7 },
        { text: 'ek click mein', start: 9.7, end: 10.5 },
      ],
    },
  ],
};

// Seed an export record
exportsList.push({
  id: 'exp-1',
  user_id: 'demo-user',
  project_id: 'proj-hinglish-viral',
  project_title: 'Consistent Effort Secret (Hinglish Reel)',
  format: 'mp4',
  duration: 15,
  has_watermark: true,
  created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
});

// Helper to check and reset daily quota
function checkDailyQuota(user: UserRecord) {
  const today = new Date().toISOString().split('T')[0];
  if (user.exports_today_date !== today) {
    user.exports_today = 0;
    user.exports_today_date = today;
  }
}

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    name: 'CAPTIVOX API',
    hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY),
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    monetization_mode: systemSettings.monetization_mode,
  });
});

// System Settings
app.get('/api/settings', (req: Request, res: Response) => {
  res.json({ settings: systemSettings });
});

// 1-Click Toggle Monetization (Free vs Paid) - Owner / Master Admin only
app.post('/api/admin/toggle-monetization', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || 'demo-user';
  const user = users[userId];

  // Allow Vineet Rajput (Owner) or Master Admin
  if (!user || (!user.is_admin && user.role !== 'owner')) {
    return res.status(403).json({ error: 'Master Admin or Owner access required' });
  }

  const { mode } = req.body;
  if (mode && (mode === 'free' || mode === 'paid')) {
    systemSettings.monetization_mode = mode;
  } else {
    systemSettings.monetization_mode = systemSettings.monetization_mode === 'free' ? 'paid' : 'free';
  }

  if (systemSettings.monetization_mode === 'free') {
    systemSettings.watermark_on_free_tier = false;
    systemSettings.daily_export_limit_free = 99999;
  } else {
    systemSettings.watermark_on_free_tier = true;
    systemSettings.daily_export_limit_free = 3;
  }
  systemSettings.updated_at = new Date().toISOString();

  res.json({
    success: true,
    settings: systemSettings,
    message: `Platform switched to ${systemSettings.monetization_mode.toUpperCase()} mode successfully`,
  });
});

// Auth Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { phone, email, otp, isGoogle } = req.body;

  // Founder / Owner Direct Login (Vineet Rajput)
  if (
    email === 'alexxrajput964@gmail.com' ||
    (phone === '9876543210' && (otp === '123456' || otp === '999999' || isGoogle))
  ) {
    const owner = users['demo-user'];
    checkDailyQuota(owner);
    return res.json({ success: true, user: owner });
  }

  // Admin Login Check
  if (
    (phone === '9999999999' && otp === '999999') ||
    (email === 'admin@captivox.app' && (otp === '999999' || isGoogle))
  ) {
    const admin = users['admin-user'];
    checkDailyQuota(admin);
    return res.json({ success: true, user: admin });
  }

  // Public User Phone + OTP Check
  if (otp === '123456' || isGoogle) {
    const cleanPhone = phone || '9876543210';
    let user = Object.values(users).find(u => u.phone === cleanPhone || (email && u.email === email));
    
    if (user && user.is_blocked) {
      return res.status(403).json({
        error: 'Aapka account admin (Vineet Rajput) dwara temporarily suspended kar diya gaya hai. Kripya support se sampark karein.',
        is_blocked: true,
      });
    }

    if (!user) {
      const newId = 'user-' + Date.now();
      user = {
        id: newId,
        email: email || `user_${cleanPhone.slice(-4)}@example.com`,
        phone: cleanPhone,
        full_name: email ? email.split('@')[0] : `Creator ${cleanPhone.slice(-4)}`,
        tier: systemSettings.monetization_mode === 'free' ? 'unlimited' : 'free',
        is_admin: false,
        is_blocked: false,
        role: 'user',
        exports_today: 0,
        exports_today_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
      };
      users[newId] = user;
    }

    checkDailyQuota(user);
    return res.json({ success: true, user });
  }

  return res.status(400).json({ error: 'Invalid OTP. For demo use 123456 or Admin: 999999' });
});

// Auth Me
app.get('/api/auth/me', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || 'demo-user';
  const user = users[userId] || users['demo-user'];
  checkDailyQuota(user);
  res.json({ user, settings: systemSettings });
});

// Upgrade Tier
app.post('/api/auth/upgrade', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || 'demo-user';
  const { tier } = req.body;

  if (!['free', 'pro', 'business', 'unlimited'].includes(tier)) {
    return res.status(400).json({ error: 'Invalid tier specified' });
  }

  const user = users[userId] || users['demo-user'];
  user.tier = tier;
  res.json({ success: true, user });
});

// List Projects
app.get('/api/projects', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || 'demo-user';
  const user = users[userId];

  // Admin can see all projects; regular users see their own
  const list = Object.values(projects).filter(
    (p) => (user?.is_admin ? true : p.user_id === userId || p.user_id === 'demo-user')
  );

  res.json({ projects: list.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()) });
});

// Create Project
app.post('/api/projects', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || 'demo-user';
  const { title, video_url, video_name, duration, captions, template_id, frame } = req.body;

  const id = 'proj-' + Date.now();
  const newProject: ProjectRecord = {
    id,
    user_id: userId,
    title: title || 'Untitled Caption Project',
    video_url: video_url || '',
    video_name: video_name || 'video.mp4',
    duration: Number(duration) || 10,
    status: 'ready',
    template_id: template_id || 'saas-gradient',
    frame: frame || '9:16',
    position: 'bottom',
    text_case: 'uppercase',
    font_family: 'Outfit',
    font_size: 5,
    font_weight: 800,
    text_color: '#FFFFFF',
    highlight_color: '#FF8C1A',
    captions: captions || [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  projects[id] = newProject;
  res.json({ project: newProject });
});

// Get Project
app.get('/api/projects/:id', (req: Request, res: Response) => {
  const proj = projects[req.params.id];
  if (!proj) {
    return res.status(404).json({ error: 'Project not found' });
  }
  res.json({ project: proj });
});

// Update Project
app.put('/api/projects/:id', (req: Request, res: Response) => {
  const proj = projects[req.params.id];
  if (!proj) {
    return res.status(404).json({ error: 'Project not found' });
  }

  Object.assign(proj, req.body, { updated_at: new Date().toISOString() });
  res.json({ project: proj });
});

// Autosave captions
app.post('/api/projects/:id/captions', (req: Request, res: Response) => {
  const proj = projects[req.params.id];
  if (!proj) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const { captions } = req.body;
  if (Array.isArray(captions)) {
    proj.captions = captions;
    proj.updated_at = new Date().toISOString();
  }
  res.json({ success: true, updated_at: proj.updated_at });
});

// Delete Project
app.delete('/api/projects/:id', (req: Request, res: Response) => {
  if (projects[req.params.id]) {
    delete projects[req.params.id];
    return res.json({ success: true });
  }
  res.status(404).json({ error: 'Project not found' });
});

// Resilient Gemini Generator with multiple model fallbacks
async function generateWithGeminiFallback(ai: GoogleGenAI, contents: any, mimeType = 'application/json') {
  const models = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
  let lastError: any = null;

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: mimeType === 'application/json' ? { responseMimeType: 'application/json' } : {},
      });
      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      console.warn(`Model ${model} failed, trying next fallback...`, err.message || err);
      lastError = err;
    }
  }
  throw lastError || new Error('All Gemini models unavailable');
}

// AI Audio Transcription & Subtitle Generator endpoint
app.post('/api/transcribe', async (req: Request, res: Response) => {
  try {
    const {
      language = 'auto',
      textContext = '',
      audioBase64,
      topicPrompt,
      videoDuration = 15,
      speechOnset = 0.1,
      speechOffset,
      mode = 'transcribe', // 'transcribe' | 'generate_topic' | 'align_text'
    } = req.body;

    const openAiKey = process.env.OPENAI_API_KEY;
    const customKey = (req.headers['x-gemini-api-key'] as string) || req.body.customApiKey;
    const geminiKey = customKey || process.env.GEMINI_API_KEY;

    // Mode 1: Generate viral subtitles from Topic Prompt (e.g. for silent videos or instant viral scripts)
    if (mode === 'generate_topic' || (!audioBase64 && topicPrompt)) {
      if (!geminiKey) {
        return res.status(400).json({ error: 'AI key not available for subtitle generation' });
      }

      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const prompt = `You are India's top viral reel subtitle copywriter and audio timing engineer.
Topic: "${topicPrompt || textContext || 'Consistency and growth mindset for creators'}"
Language: ${language} (if hindi, write in natural Devanagari; if hinglish, write in Roman script English letters with Hindi words; if english, write crisp punchy English).
Target Reel Duration: ${Math.min(60, Number(videoDuration) || 15)} seconds.

Create a high-retention, viral short-form script with word-by-word timestamps matching the duration.
Output MUST be strict JSON in this exact structure:
{
  "text": "Full script dialogue...",
  "words": [
    { "text": "Word1", "start": 0.25, "end": 0.65 },
    { "text": "Word2", "start": 0.65, "end": 1.10 }
  ]
}
Rules:
- Keep phrases punchy, high energy, 4-6 words per sentence.
- Sequential start/end timestamps in seconds from 0.2s up to ${Math.min(60, Number(videoDuration) || 15)}s.
- Return ONLY valid raw JSON, no markdown formatting.`;

      try {
        const textResult = await generateWithGeminiFallback(ai, prompt);
        const parsed = JSON.parse(textResult || '{}');
        return res.json({
          success: true,
          source: 'gemini-generator',
          text: parsed.text || '',
          words: parsed.words || [],
        });
      } catch (geminiErr) {
        // High reliability local generator if cloud API has temporary 503 spike
        const sampleWords = (topicPrompt || textContext || 'Consistency beats talent every single time. Roz mehnat karo aur algorithm reward karega.')
          .split(/\s+/)
          .filter(Boolean);

        const dur = Math.min(60, Number(videoDuration) || 15);
        const wordTime = dur / Math.max(1, sampleWords.length);

        const timedWords = sampleWords.map((w: string, idx: number) => ({
          text: w,
          start: Number((idx * wordTime).toFixed(2)),
          end: Number(((idx + 1) * wordTime).toFixed(2)),
        }));

        return res.json({
          success: true,
          source: 'local-timed-generator',
          text: sampleWords.join(' '),
          words: timedWords,
        });
      }
    }

    // Mode 2: Transcribe Real Audio File (WAV/MP3)
    if (audioBase64) {
      const cleanBase64 = audioBase64.replace(/^data:audio\/\w+;base64,/, '');
      const audioBuffer = Buffer.from(cleanBase64, 'base64');

      // 1. If OpenAI Whisper is configured
      if (openAiKey) {
        try {
          const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
          const parts = [
            `--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\nwhisper-1\r\n`,
            `--${boundary}\r\nContent-Disposition: form-data; name="response_format"\r\n\r\nverbose_json\r\n`,
            `--${boundary}\r\nContent-Disposition: form-data; name="timestamp_granularities[]"\r\n\r\nword\r\n`,
            `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="audio.wav"\r\nContent-Type: audio/wav\r\n\r\n`,
          ];

          if (language && language !== 'auto' && language !== 'hinglish') {
            parts.splice(1, 0, `--${boundary}\r\nContent-Disposition: form-data; name="language"\r\n\r\n${language}\r\n`);
          }

          const headerBuffers = parts.map((p) => Buffer.from(p));
          const footerBuffer = Buffer.from(`\r\n--${boundary}--\r\n`);
          const bodyBuffer = Buffer.concat([...headerBuffers, audioBuffer, footerBuffer]);

          const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${openAiKey}`,
              'Content-Type': `multipart/form-data; boundary=${boundary}`,
            },
            body: bodyBuffer,
          });

          if (whisperResponse.ok) {
            const data: any = await whisperResponse.json();
            const words =
              data.words?.map((w: any) => ({
                text: w.word.trim(),
                start: Number(w.start),
                end: Number(w.end),
              })) || [];

            return res.json({
              success: true,
              source: 'openai-whisper',
              text: data.text || '',
              words,
            });
          }
        } catch (whisperErr) {
          console.warn('Whisper API call failed, falling back to Gemini multimodal audio', whisperErr);
        }
      }

      // 2. Multimodal Audio Speech Recognition with Gemini (gemini-3.8-flash / gemini-3.1-flash-lite)
      if (geminiKey) {
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const transcribeModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
        let lastAudioErr: any = null;

        for (const model of transcribeModels) {
          try {
            const config: any = {};
            if (model !== 'gemini-3.5-transcribe') {
              config.responseMimeType = 'application/json';
            }

            const response = await ai.models.generateContent({
              model,
              contents: [
                {
                  role: 'user',
                  parts: [
                    {
                      inlineData: {
                        mimeType: 'audio/wav',
                        data: cleanBase64,
                      },
                    },
                    {
                      text: `You are an expert audio speech-to-text subtitle transcription engine for social media video reels.
Target language preference: ${language || 'Auto (Hindi, Hinglish, English, or Indian regional languages)'}.
Detected acoustic envelope bounds: speech onset ~${speechOnset || 0.1}s, speech offset ~${speechOffset || videoDuration}s.

INSTRUCTIONS:
1. Listen carefully to the uploaded audio and transcribe every spoken word verbatim with 100% precision.
2. If spoken in Hindi, Hinglish, or mixed English, transcribe in natural ROMAN HINGLISH using the English/Latin alphabet (e.g. "Yeh video aapke content ko 10x viral kar degi", "Consistency beats talent har baar"). Do NOT translate to Devanagari script unless pure Hindi is explicitly requested.
3. CRITICAL WORD ACCURACY: DO NOT SKIP OR MISS THE FIRST WORD OR THE LAST WORD of the spoken audio dialogue. The first spoken word must be transcribed starting at the acoustic speech onset (~${speechOnset || 0.1}s), and the final spoken word must be fully captured until speech ends (~${speechOffset || videoDuration}s).
4. CRITICAL AUDIO ALIGNMENT: Extract word-level timestamps directly from the real spoken audio waveform. Do not estimate or divide timestamps equally across words from transcript text alone.
5. Provide timestamps in exact decimal seconds (e.g. 2.345) matching actual acoustic speech boundaries.
6. Output STRICT JSON in this exact structure:
{
  "text": "Full transcribed speech text",
  "words": [
    { "text": "Word1", "start": 0.250, "end": 0.650 },
    { "text": "Word2", "start": 0.650, "end": 1.100 }
  ]
}
If no speech is detected in the audio, return {"text": "", "words": []}.
Output raw JSON only.`,
                    },
                  ],
                },
              ],
              config,
            });

            const responseText = response.text || '{}';
            const cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanedText);

            if (parsed.words && parsed.words.length > 0) {
              // Ensure word timestamps are strictly monotonic and valid
              const sanitizedWords = parsed.words.map((w: any, idx: number, arr: any[]) => {
                const prevEnd = idx > 0 ? Number(arr[idx - 1].end) : (Number(speechOnset) || 0.1);
                let start = Math.max(0, Number(w.start));
                if (start < prevEnd - 0.05) start = prevEnd;
                let end = Math.max(start + 0.12, Number(w.end));
                return {
                  text: String(w.text || '').trim(),
                  start: Number(start.toFixed(3)),
                  end: Number(end.toFixed(3)),
                };
              });

              return res.json({
                success: true,
                source: `gemini-audio-transcription (${model})`,
                text: parsed.text || sanitizedWords.map((w: any) => w.text).join(' '),
                words: sanitizedWords,
              });
            }
          } catch (modelErr: any) {
            console.warn(`Transcribe model ${model} failed, trying next...`, modelErr.message || modelErr);
            lastAudioErr = modelErr;
          }
        }
      }
    }

    // Mode 3: Align custom text / fallback generator
    if (geminiKey) {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const prompt = `You are a subtitle timing engine.
Generate word-by-word timestamps for this script or topic for a ${Math.min(60, Number(videoDuration) || 15)}s reel:
Text: "${textContext || 'Consistency beats talent every time. Roz video upload karo aur algorithm aapko reward karega.'}"
Language: ${language}

Format strictly as JSON:
{
  "text": "Full speech...",
  "words": [
    { "text": "Word", "start": 0.2, "end": 0.6 }
  ]
}
Timestamps must be sequential and fit within ${Math.min(60, Number(videoDuration) || 15)} seconds.
Output raw JSON only.`;

      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({
        success: true,
        source: 'gemini-script-timing',
        text: parsed.text || '',
        words: parsed.words || [],
      });
    }

    return res.status(400).json({
      error: 'OpenAI API key not configured. Add it in project settings.',
      hasGeminiFallback: false,
    });
  } catch (error: any) {
    console.error('Transcription error:', error);
    return res.status(500).json({ error: error.message || 'Transcription failed' });
  }
});

// Record Export
app.post('/api/exports', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || 'demo-user';
  const { project_id, project_title, format = 'mp4', duration = 10, has_watermark = false } = req.body;

  const user = users[userId] || users['demo-user'];
  if (user && user.is_blocked) {
    return res.status(403).json({
      error: 'Aapka account admin (Vineet Rajput) dwara suspend kiya gaya hai.',
      is_blocked: true,
    });
  }

  checkDailyQuota(user);

  // Check limits in Paid Mode
  if (systemSettings.monetization_mode === 'paid') {
    if (user.tier === 'free' && user.exports_today >= 3) {
      return res.status(403).json({
        error: 'Daily export limit reached (3/3 on Free tier in Paid Mode). Upgrade to Pro for 50 exports/day.',
        upgradeRequired: true,
      });
    }
  }

  user.exports_today += 1;

  const newExport: ExportRecord = {
    id: 'exp-' + Date.now(),
    user_id: userId,
    project_id,
    project_title: project_title || 'Captivox Burned Video',
    format,
    duration: Number(duration) || 10,
    has_watermark: systemSettings.monetization_mode === 'paid' && user.tier === 'free' ? true : Boolean(has_watermark),
    created_at: new Date().toISOString(),
  };

  exportsList.unshift(newExport);

  res.json({
    success: true,
    export: newExport,
    exports_today: user.exports_today,
    settings: systemSettings,
  });
});

// Admin Stats
app.get('/api/admin/stats', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || 'demo-user';
  const user = users[userId];

  if (!user || (!user.is_admin && user.role !== 'owner')) {
    return res.status(403).json({ error: 'Admin / Owner access required' });
  }

  const userList = Object.values(users).map(u => ({
    ...u,
    totalProjects: Object.values(projects).filter(p => p.user_id === u.id).length,
    totalExports: exportsList.filter(e => e.user_id === u.id).length,
  }));
  const totalProjects = Object.keys(projects).length;
  const totalExports = exportsList.length;

  res.json({
    stats: {
      totalUsers: userList.length,
      totalProjects,
      totalExports,
      proUsers: userList.filter(u => u.tier !== 'free').length,
      blockedUsers: userList.filter(u => u.is_blocked).length,
      activeJobs: 0,
      uptimeSeconds: process.uptime(),
      whisperConfigured: Boolean(process.env.OPENAI_API_KEY),
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
      monetization_mode: systemSettings.monetization_mode,
    },
    users: userList,
    recentExports: exportsList.slice(0, 15),
    settings: systemSettings,
  });
});

// Admin User List (High-density User Data Section for Vineet Rajput)
app.get('/api/admin/users', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || 'demo-user';
  const user = users[userId];

  if (!user || (!user.is_admin && user.role !== 'owner')) {
    return res.status(403).json({ error: 'Owner access required' });
  }

  const userList = Object.values(users).map(u => ({
    ...u,
    totalProjects: Object.values(projects).filter(p => p.user_id === u.id).length,
    totalExports: exportsList.filter(e => e.user_id === u.id).length,
  }));

  res.json({
    users: userList,
    settings: systemSettings,
  });
});

// 1-Click Block / Unblock User ("Kisko chalana hai aur kisko nahi")
app.post('/api/admin/users/:id/toggle-block', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || 'demo-user';
  const user = users[userId];

  if (!user || (!user.is_admin && user.role !== 'owner')) {
    return res.status(403).json({ error: 'Owner access required' });
  }

  const targetId = req.params.id;
  const targetUser = users[targetId];

  if (!targetUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (targetUser.role === 'owner' || targetId === 'demo-user') {
    return res.status(400).json({ error: 'Founder / Owner (Vineet Rajput) cannot be blocked' });
  }

  targetUser.is_blocked = !targetUser.is_blocked;
  res.json({
    success: true,
    user: targetUser,
    message: targetUser.is_blocked ? `Blocked ${targetUser.full_name}` : `Unblocked ${targetUser.full_name}`,
  });
});

// 1-Click Change User Tier (Free / Pro / Unlimited)
app.post('/api/admin/users/:id/tier', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || 'demo-user';
  const user = users[userId];

  if (!user || (!user.is_admin && user.role !== 'owner')) {
    return res.status(403).json({ error: 'Owner access required' });
  }

  const targetId = req.params.id;
  const targetUser = users[targetId];

  if (!targetUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { tier } = req.body;
  if (!['free', 'pro', 'business', 'unlimited'].includes(tier)) {
    return res.status(400).json({ error: 'Invalid tier specified' });
  }

  targetUser.tier = tier;
  res.json({
    success: true,
    user: targetUser,
    message: `Updated ${targetUser.full_name} tier to ${tier.toUpperCase()}`,
  });
});

// Reset User Exports Counter
app.post('/api/admin/users/:id/reset-exports', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || 'demo-user';
  const user = users[userId];

  if (!user || (!user.is_admin && user.role !== 'owner')) {
    return res.status(403).json({ error: 'Owner access required' });
  }

  const targetId = req.params.id;
  const targetUser = users[targetId];

  if (!targetUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  targetUser.exports_today = 0;
  res.json({
    success: true,
    user: targetUser,
    message: `Reset export counter for ${targetUser.full_name}`,
  });
});

// Delete User Account
app.delete('/api/admin/users/:id', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || 'demo-user';
  const user = users[userId];

  if (!user || (!user.is_admin && user.role !== 'owner')) {
    return res.status(403).json({ error: 'Owner access required' });
  }

  const targetId = req.params.id;
  if (targetId === 'demo-user' || targetId === 'admin-user') {
    return res.status(400).json({ error: 'Cannot delete Owner or System Admin account' });
  }

  if (users[targetId]) {
    delete users[targetId];
    return res.json({ success: true, message: 'User account removed' });
  }

  res.status(404).json({ error: 'User not found' });
});

// Vite Middleware for SPA dev server
async function setupVite() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CAPTIVOX server running at http://0.0.0.0:${PORT}`);
  });
}

setupVite();
