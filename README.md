# ☁ MobileCloud — Android Cloud Platform Control Panel

A full cloud platform control panel Android APK built with pure React Native 0.73 + Expo standalone components.

## Features
- 🔐 Supabase Auth with session persistence (MMKV)
- 🖥 Server management with real-time status via Supabase Realtime
- 🚀 One-tap Cloudflare Workers deployment from GitHub repos
- 📊 Live monitoring dashboard (CPU, RAM, Network, Disk)
- 📋 Real-time streaming logs (color coded by level)
- 🌐 Custom domain management with SSL tracking
- 🔑 AES-encrypted Credentials Vault
- ⚙️ Background Android Foreground Service (survives reboot)
- 📱 Dark premium UI (#080C14 background, #3B82F6 accent)

---

## Step 1 — Set up Supabase

1. Go to [supabase.com](https://supabase.com) → your project
2. Open **SQL Editor**
3. Paste the contents of `supabase_schema.sql` and click **Run**
4. All tables, RLS policies, realtime, and billing trigger are created

---

## Step 2 — Push to GitHub (from Termux or PC)

### From Termux
```bash
bash termux_setup.sh
# Then follow the printed instructions
```

### From PC
```bash
git clone https://github.com/segz7448/MobileSever.git
# Copy all project files into the cloned folder
cd MobileSever
git add .
git commit -m "Initial MobileCloud project"
git push origin main
```

---

## Step 3 — GitHub Actions builds the APK

1. Push triggers the workflow at `.github/workflows/build.yml`
2. Monitor at: `https://github.com/segz7448/MobileSever/actions`
3. Build takes ~10-15 minutes
4. **Download APK** from:
   - Actions → latest run → **Artifacts** → `MobileCloud-APK`
   - OR: `https://github.com/segz7448/MobileSever/releases`

---

## Step 4 — Install APK

```bash
# On Android: enable "Install from unknown sources"
# Transfer APK to phone via cable, ADB, or Google Drive
adb install MobileCloud-release.apk
```

---

## Architecture

```
src/
├── App.tsx                    # Root component
├── navigation/AppNavigator    # Stack + Bottom Tab navigator
├── screens/
│   ├── auth/                  # Login, Register
│   ├── dashboard/             # Overview + stats
│   ├── servers/               # Server list + detail (deploy/logs/env)
│   ├── monitoring/            # Live metrics
│   ├── logs/                  # Real-time log viewer
│   ├── domains/               # Domain management
│   ├── credentials/           # Encrypted credentials vault
│   └── settings/              # Profile, security, billing
├── services/
│   ├── supabase.ts            # Supabase client + admin
│   ├── cloudflare.ts          # Cloudflare Workers API
│   ├── github.ts              # GitHub API
│   ├── credentials.ts         # AES encryption
│   └── server.ts              # Supabase CRUD
├── store/
│   ├── authStore.ts           # Zustand auth state
│   └── serverStore.ts         # Zustand servers + realtime
└── theme/colors.ts            # Design tokens

android/
├── app/src/main/java/com/mobilecloud/
│   ├── MainActivity.kt        # Starts foreground service
│   ├── MainApplication.kt     # RN + Expo modules
│   ├── CloudBackgroundService.kt  # WakeLock foreground service
│   └── BootReceiver.kt        # Auto-restart after reboot
└── app/src/main/AndroidManifest.xml
```

---

## Credentials Wired In

| Service | Value |
|---------|-------|
| Supabase URL | https://xhifuiswgololhnqforr.supabase.co |
| Cloudflare Account | 8061e1ef74fb3dcda702068da41bb949 |
| GitHub User | segz7448 |

---

## Permissions
- `INTERNET` — API calls
- `FOREGROUND_SERVICE` + `FOREGROUND_SERVICE_DATA_SYNC` — background service
- `RECEIVE_BOOT_COMPLETED` — auto-start after reboot
- `WAKE_LOCK` — keeps CPU awake for monitoring
- `POST_NOTIFICATIONS` — service notifications
- `VIBRATE` — haptic feedback
