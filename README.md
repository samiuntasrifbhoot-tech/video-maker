# Islamic Reels & Story Creator (Mobile App & PWA Ready)

একটি আধুনিক, সিনেমেটিক ইসলামিক শর্ট স্টোরি ও ফেসবুক রিলস অ্যানিমেটেড মেকার অ্যাপ।

## 📱 মোবাইল অ্যাপ ইনস্টল ও ব্যবহার নিয়ম (PWA)

এই অ্যাপটি **Progressive Web App (PWA)** হিসেবে তৈরি। যেকোনো স্মার্টফোনে কোনো প্লে-স্টোর ছাড়াই ইনস্টল করা যায়:

### Android (Chrome / Edge):
1. ফোনের Chrome ব্রাউজারে অ্যাপটির লিংকটি ওপেন করুন।
2. ওপরের ডানপাশের ৩-ডট (⋮) মেনুতে চাপ দিন।
3. **"Add to Home Screen"** অথবা **"Install App"** অপশনে ট্যাপ করুন।
4. অ্যাপ আইকনটি আপনার ফোনের হোম স্ক্রিনে সেভ হয়ে যাবে।

### iPhone / iOS (Safari):
1. Safari ব্রাউজারে লিংকটি খুলুন।
2. নিচের **Share** আইকনে চাপ দিন।
3. **"Add to Home Screen"** সিলেক্ট করুন।

---

## 🛠️ GitHub / Local Developer Build & APK Guide

আপনি AI Studio-এর **Export to GitHub** বা **Download ZIP** সুবিধা দিয়ে সম্পূর্ণ কোড ডাউনলোড করতে পারেন।

### প্রজেক্ট রান করার নিয়ম:
```bash
# ১. ডিপেনডেন্সি ইনস্টল
npm install

# ২. ডেভেলপমেন্ট সার্ভার চালু
npm run dev

# ৩. প্রডাকশন বিল্ড
npm run build
```

### Capacitor দিয়ে Android APK তৈরি করা:
```bash
# Capacitor যুক্ত করা
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Islamic Reels Creator" "com.islamicreels.app" --web-dir dist

# Android প্ল্যাটফর্ম যোগ ও সিঙ্ক
npx cap add android
npm run build
npx cap sync

# Android Studio-তে ওপেন করে APK তৈরি
npx cap open android
```

---

## 🎨 ফিচারসমূহ:
- 📱 **PWA & Mobile Ready**: ৫১২x৫১২ কাস্টম অ্যাপ আইকন, ম্যানিফেস্ট ও অফলাইন সার্ভিস ওয়ার্কার সহ।
- 🎬 **১-ক্লিক ডাইরেক্ট রিলস ভিডিও ডাউনলোড**: কোন ব্রাউজার মিডিয়া পারমিশন ছাড়া ক্যানভাস টেকনোলজিতে সরাসরি ভিডিও জেনারেট ও ডাউনলোড।
- 🎙️ **Gemini 3.1 AI Voiceovers**: Kore, Zephyr, Puck, Charon, Fenrir ভয়েস কাস্টমাইজেশন।
- ✍️ **বাংলা ফন্ট সাপোর্ট**: Hind Siliguri, Noto Serif Bengali, Anek Bangla, Tiro Bangla।
- 🎵 **অটো সিঙ্ক সাবটাইটেল গ্লো**: TikTok & Facebook Reels স্টাইল ওয়ার্ড-বাই-ওয়ার্ড সাবটাইটেল।
