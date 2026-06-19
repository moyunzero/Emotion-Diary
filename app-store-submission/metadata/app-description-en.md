# App Store Connect Metadata — English (U.S.)

> **Version**: 1.3.0 · **Updated**: 2026-06-19  
> **Bundle ID**: `com.moyunzero.emotiondiary`  
> **App Store listing**: [心晴MO on the App Store](https://apps.apple.com/us/app/%E5%BF%83%E6%99%B4mo/id6759703686)  
> **Display name on device**: 心晴MO · English marketing name: **MoodMO**

Use this file when editing the **English (U.S.)** localization in App Store Connect. Primary app name may remain 心晴MO; English subtitle, description, and keywords apply to the English storefront.

---

## Field checklist

| Field | Limit | Section below |
| --- | --- | --- |
| Name | 30 chars | 心晴MO (store primary name) |
| Subtitle | 30 chars | Subtitle |
| Promotional Text | 170 chars | Promotional Text (editable without new build) |
| Description | 4000 chars | Description |
| Keywords | 100 chars | Keywords |
| What’s New in This Version | 4000 chars | `whats-new-1.3.0-en.md` |
| Support URL | required | Support URL |
| Marketing URL | optional | Marketing URL |
| Privacy Policy URL | required | Privacy Policy URL |

---

## Subtitle (max 30 characters)

Mood journal & mind garden

(29 characters)

---

## Promotional Text (max 170 characters, optional)

MoodMO 1.3: Full English & Chinese UI. Follow system language or pick your locale in Profile—record moods, grow your Mind Garden, export weekly reviews.

(149 characters)

---

## Keywords (max 100 characters; comma-separated, no space after commas)

mood,diary,journal,emotion,mental health,wellness,self care,mindfulness,tracker,voice notes

(99 characters)

---

## Description

MoodMO (心晴MO) is a healing-focused mood diary that turns emotional self-care into tending a mind garden.

🌤 **Emotion Weather Station**  
See relationship and mood health as weather—sunny, cloudy, or stormy skies that make patterns easier to notice.

✍️ **Warm, low-friction logging**  
Five mood levels, people and trigger tags, gentle deadlines, and voice notes. Drafts save automatically; edit history shows how feelings evolved.

🌱 **Mind Garden (Insights)**  
Weekly mood weather, healing progress, relationship pots for people who matter, trigger insights with gardening advice, and shareable weekly/monthly review images saved to Photos.

🔥 **Vent & Release**  
A calming burn animation for heated words, plus a release archive to revisit what you let go.

🤖 **Optional AI companion** (bring your own Groq API key)  
Mood forecasts, AI-generated emotional podcasts, trigger “prescriptions,” and an optional closing line on review exports—with thoughtful on-device fallbacks when AI is unavailable.

☁️ **Your data, your choice**  
Offline-first local storage by default. Optional Supabase sync across devices. Deletes are soft by default—entries move to a recycle bin before permanent removal.

🌍 **English & Chinese (new in 1.3)**  
Full bilingual interface. Follow system language or choose Simplified Chinese or English in Profile → Language.

MoodMO is for anyone who wants to understand their emotions without judgment. It is not a substitute for professional mental health care. If you are in crisis, please contact a qualified professional or local emergency services.

---

## What’s New in Version 1.3.0

See [`whats-new-1.3.0-en.md`](./whats-new-1.3.0-en.md) for paste-ready release notes.

---

## Support URL

https://github.com/moyunzero/Emotion-Diary/issues

---

## Marketing URL (optional)

https://apps.apple.com/us/app/%E5%BF%83%E6%99%B4mo/id6759703686

---

## Privacy Policy URL

https://github.com/moyunzero/Emotion-Diary/blob/master/PRIVACY.md

---

## Copyright (example)

2026 moyunzero

---

## Categories (suggested)

- **Primary**: Health & Fitness  
- **Secondary**: Lifestyle

---

## Age rating notes

No restricted content; user-generated diary text; optional account for cloud sync; optional third-party AI (Groq) when user supplies API key.

---

## App Review notes (optional, for Review Notes field)

- **Login**: Optional; guest mode works offline. Cloud sync uses Supabase email/password in Profile.  
- **Microphone**: Only when user taps record on a mood entry.  
- **Photo library**: Only when user saves a review export image.  
- **Notifications**: Local reminders only; off by default; no diary content in notification body.  
- **AI**: Groq API calls only when user configures API key in environment / build; otherwise local fallback text.  
- **Languages**: 1.3 adds in-app English UI; system permission dialogs localized via iOS native strings.

---

## Screenshot captions (optional, for marketing)

1. **Dashboard** — Your emotion weather at a glance  
2. **Record** — Log mood, tags, and voice in seconds  
3. **Mind Garden** — Healing progress and trigger insights  
4. **Review export** — Share a weekly mood recap image  
5. **Profile** — Language, sync, and gentle reminders  

See [`screenshot-guide.md`](./screenshot-guide.md) for sizes and capture tips.
