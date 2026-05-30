# WapKidLearn: Implement Design from Stitch

Use this skill when the user asks to **implement a screen or component** from the `design/` folder into the frontend.

## Design Folder Mapping

| Folder | Frontend Path | Role |
|--------|--------------|------|
| `child_login_pin_pad` | `app/(child)/child/login/` | Child |
| `child_home_dashboard` | `app/(child)/child/home/` | Child |
| `game_question_interface_1` / `_2` | `app/(child)/child/game/` | Child |
| `game_session_summary` | `app/(child)/child/game/summary/` | Child |
| `watch_library` | `app/(child)/child/watch/` | Child |
| `video_player_interface` | `app/(child)/child/watch/[sessionId]/` | Child |
| `emergency_lock_screen` | `app/(child)/child/locked/` | Child |
| `tukar_poin_rewards` | `app/(child)/child/rewards/` | Child |
| `transaction_history` | `app/(child)/child/rewards/transactions/` | Child |
| `achievements_badges` | `app/(child)/child/achievements/` | Child |
| `child_activity_feed` | `app/(parent)/parent/children/[id]/activity/` | Parent |
| `parent_login` | `app/(auth)/login/` | Parent |
| `parent_dashboard` | `app/(parent)/parent/dashboard/` | Parent |
| `child_detail_management` | `app/(parent)/parent/children/[id]/` | Parent |
| `child_analytics_dashboard` | `app/(parent)/parent/children/[id]/analytics/` | Parent |
| `child_settings_limits` | `app/(parent)/parent/children/[id]/settings/` | Parent |
| `video_management` | `app/(parent)/parent/children/[id]/videos/` | Parent |
| `admin_dashboard` | `app/(admin)/admin/dashboard/` | Admin |
| `question_management` | `app/(admin)/admin/questions/` | Admin |
| `user_management_portal` | `app/(admin)/admin/users/` | Admin |
| `belajar_matematika_seru` | Splash/marketing page | Shared |
| `wapkidlearn_logo` | Logo component | Shared |

## Steps to Follow

### 1. Baca design asset
```
design/<folder_name>/screen.png   ← referensi visual
design/<folder_name>/code.html    ← referensi HTML/CSS dari Stitch
```

Baca `screen.png` dengan Read tool (image) untuk memahami layout.
Baca `code.html` untuk mengekstrak warna, spacing, dan struktur HTML.

### 2. Map ke Tailwind + komponen existing
- Gunakan color tokens dari `docs/stitch-prompt.md` → konversikan ke Tailwind class
- Periksa `components/` apakah ada komponen yang bisa dipakai ulang
- Child UI: font `font-nunito` / Parent-Admin UI: `font-sans` (Inter)

### 3. Implementasi
- Buat atau update file di path yang sesuai (lihat tabel di atas)
- Gunakan komponen existing: `ChildLockGuard`, `VideoPlayer`, dsb.
- Pastikan data binding ke API lewat `lib/api.ts` (jangan hardcode data)
- Responsive: mobile-first Tailwind (`sm:` tablet, `lg:` desktop)

### 4. Responsive checklist
- [ ] Mobile (default): single column, full-width button, 48px touch targets
- [ ] `sm:` (768px+): 2-col grid, sidebar nav untuk parent/admin
- [ ] `lg:` (1280px+): sidebar 240px fixed, max-w-screen-md content
- [ ] Child game/watch: selalu max-w-sm centered, tidak pernah full-width desktop

### 5. Verifikasi visual
Setelah implementasi, bandingkan dengan `screen.png`:
- Layout dan spacing sudah mendekati design
- Warna sesuai token (orange `#F97316`, blue `#3B82F6`, dll.)
- Loading skeleton ada untuk setiap halaman yang fetch data
- Empty state ada jika data kosong

### 6. Jangan lupa
- Loading + error state (gunakan pola `if (isLoading) return <Skeleton/>`)
- API sudah terdaftar di `lib/api.ts` sebelum dipakai di page
- Tidak ada hardcoded `localhost:8080` — gunakan `NEXT_PUBLIC_API_URL`

## Contoh Perintah User

- "implement design child home" → buka `design/child_home_dashboard/`
- "implement semua screen parent" → implement P1–P7 urut
- "update tampilan achievements sesuai design" → buka `design/achievements_badges/`
