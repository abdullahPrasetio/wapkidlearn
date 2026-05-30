# Stitch Design Prompt — WapKidLearn

> Paste seluruh isi dokumen ini ke Stitch untuk menghasilkan desain lengkap semua halaman dan komponen WapKidLearn.

---

Design a complete **responsive PWA** called **WapKidLearn** — a math learning platform for children, used by 3 roles: Child (ages 6–12), Parent, and Admin. The app runs on a home set-top box accessed via phone, tablet, or laptop browser.

Design must be **fully responsive** across 3 breakpoints:
- **Mobile** (390px) — primary target, touch-first
- **Tablet** (768px) — iPad / Android tablet
- **Laptop/Desktop** (1280px) — for parents and admins managing from PC

---

## RESPONSIVE LAYOUT RULES

### Mobile (< 768px)
- Single column layout
- Full-width cards and buttons
- Bottom-friendly tap targets (min 48×48px)
- Thumb-reachable primary actions (bottom half of screen)
- Font size: body 14–16px, headings 20–24px

### Tablet (768px – 1279px)
- 2-column grid for card lists (children list, video list, question list)
- Sidebar navigation replaces back-arrow drill-down for parent/admin
- Forms remain centered with max-width 600px
- Font size: body 15–16px, headings 22–28px
- Child game interface stays centered max-width 600px (no point stretching game UI)

### Laptop/Desktop (≥ 1280px)
- Fixed sidebar navigation (240px) for parent and admin roles
- Main content area max-width 960px, centered
- 3-column grids where appropriate (analytics cards, stat cards)
- Child interface stays mobile-centered (max-width 480px, centered horizontally) — kids use phone not laptop
- Font size: body 16px, headings 24–32px
- Hover states on all interactive elements

### Responsive Component Behaviors
- **Navigation**: bottom-bar on mobile → left sidebar on tablet+ (parent/admin only)
- **Cards**: stack vertically on mobile → 2-col on tablet → 3-col on desktop
- **Modals / Bottom sheets**: bottom sheet on mobile → centered modal on tablet+
- **Charts (analytics)**: full width on mobile → 50% side-by-side on desktop
- **Video player**: full screen on mobile → contained 16:9 centered on desktop with sidebar controls
- **Game interface**: always centered, max-width 480px, never stretches wide

---

## BRAND & DESIGN SYSTEM

**App name:** WapKidLearn
**Tagline:** Belajar Matematika Seru!

### Color Palette
| Token | Hex | Usage |
|-------|-----|-------|
| Primary Orange | `#F97316` | Main CTA, child accent, earn points |
| Primary Blue | `#3B82F6` | Watch time, info states |
| Yellow/Gold | `#EAB308` | Achievements, streaks, rewards |
| Green | `#22C55E` | Correct answer, success, earned |
| Red | `#EF4444` | Wrong answer, locked, error, danger |
| Background | `#F9FAFB` | Page background |
| Surface | `#FFFFFF` | Cards, inputs |
| Text Primary | `#111827` | Headings, labels |
| Text Secondary | `#6B7280` | Subtitles, placeholders |
| Border | `#E5E7EB` | Card borders, dividers |
| Orange Light | `#FFF7ED` | Orange card backgrounds |
| Blue Light | `#EFF6FF` | Blue card backgrounds |
| Yellow Light | `#FEFCE8` | Achievement card backgrounds |

### Typography Scale
| Name | Size | Weight | Usage |
|------|------|--------|-------|
| Display | 32–40px | ExtraBold | Score, points display |
| H1 | 24–28px | Bold | Page titles |
| H2 | 20–22px | Bold | Section headings |
| H3 | 16–18px | SemiBold | Card titles |
| Body | 14–16px | Regular | Content text |
| Small | 12–13px | Regular | Labels, badges, timestamps |
| Tiny | 11px | Medium | Meta info |

Font family: **Nunito** (rounded, friendly) for child UI; **Inter** for parent/admin UI.

### Component Style Tokens
- **Border radius**: 4px (inputs) / 8px (small chips) / 12px (buttons) / 16px (cards) / 24px (large cards, banners)
- **Shadow**: `0 1px 3px rgba(0,0,0,0.08)` (sm) / `0 4px 12px rgba(0,0,0,0.10)` (md)
- **Transition**: 150ms ease for hover, 200ms for expand/collapse
- **Touch target**: minimum 44×44px for all interactive elements

---

## ROLE 1: CHILD INTERFACE

> Child UI = playful, emoji-heavy, large touch targets, Nunito font, orange-dominant.

### Screen C1 — Child Login (PIN Pad)

**Mobile:**
- Full screen orange-to-yellow gradient background
- Large mascot emoji (🦉 or ⭐) centered top third
- "Halo! Siapa kamu?" heading (white, 28px bold)
- Horizontal scrollable child avatar row — circular avatars (64px) with name below
- Selected avatar: white ring highlight + slight scale up
- 6-dot PIN input display centered (dots fill as user types, orange filled / gray empty)
- 3×4 numeric keypad (large rounded square buttons, white with soft shadow)
- Backspace (⌫) bottom-right, Submit bottom-center (disabled/gray until 4 digits)

**Tablet:**
- Same layout, keypad centered max-width 400px, avatar row shows more avatars

**Desktop:**
- Split layout: left half decorative illustration / right half login form centered vertically

---

### Screen C2 — Child Home

**Mobile:**
- Top bar: "Halo, [Name]! 👋" left, circular avatar right (tap = logout)
- Horizontal scroll banner cards (snap):
  - Orange card: 🪙 Poin [N] + 🔥 Streak [N] hari
  - Blue card: ⏱ Waktu Nonton [H:MM] tersisa
- 2×2 navigation grid (large cards, gradient backgrounds):
  - 🎮 Main Game (orange gradient)
  - 📺 Nonton Video (blue gradient)
  - 🏆 Pencapaian (yellow gradient)
  - 🎁 Tukar Poin (purple gradient)
- Bottom motivational strip: "🔥 Streak 3 hari! Terus semangat!"

**Tablet:**
- Banner cards side by side (2-col)
- 2×2 nav grid with larger cards

**Desktop:**
- Max-width 480px, centered horizontally on white card over gray background
- Feels like a phone screen embedded in desktop — intentional (kids use phone)

---

### Screen C3 — Game Loading / Session Start

**All breakpoints:** Centered, max-width 480px
- Bouncing math symbols animation (+, −, ×, ÷)
- "Siap Bermain?" heading
- Grade badge (e.g. "Kelas 3") in rounded chip
- Last 3 session scores as small horizontal cards
- Large orange "Mulai!" button

---

### Screen C4 — Game Question

**Mobile:**
- Top: linear progress bar (question X/N) + countdown timer bar (turns red <10s)
- Topic chip + streak badge (🔥×N) on same row
- Question text: centered, 26–30px bold, 2–4 lines max
- 4 answer buttons in 2×2 grid (large, 56px tall, white rounded cards)
- Answer feedback: green fill + ✓ for correct, red fill + ✗ for wrong, reveal correct with green border
- Floating "+15 ⭐" animation on correct

**Tablet/Desktop:**
- Centered max-width 560px, answer buttons in 2×2 with more padding

---

### Screen C5 — Game Session End / Summary

**All breakpoints:** Centered max-width 480px
- 🏆 trophy + confetti burst animation
- "Hebat!" or "Coba Lagi!" heading (condition-based)
- 4 stat tiles in 2×2: Soal | Benar | Poin | Akurasi
- Accuracy: circular progress ring (green fill)
- "Main Lagi" (orange) + "Kembali ke Home" (text link)
- Bonus banner if new watch time unlocked: "🎉 +10 menit nonton!"

---

### Screen C6 — Watch Library

**Mobile:**
- Watch time balance banner (blue)
- No-balance warning card (orange) with convert CTA
- 2-column video grid: thumbnail (16:9, rounded top) + title below
- Play overlay on each thumbnail
- Disabled overlay if no balance

**Tablet:**
- 3-column video grid

**Desktop:**
- Centered max-width 600px, 2-column grid

---

### Screen C7 — Video Player

**Mobile:**
- Full screen black
- Top bar: ✕ exit | title (truncated) | ⏱ timer
- Video fills remaining height (iframe 16:9)
- Yellow warning strip bottom when <5 min

**Tablet/Desktop:**
- 16:9 video centered with black letterbox side bars
- Controls bar below video (not overlaid)
- Timer displayed as large badge bottom-right of video

---

### Screen C8 — Emergency Lock Screen

**All breakpoints:** Full screen, centered
- Solid orange background
- 🔒 emoji (96px, bouncing loop animation)
- "Layar Dikunci" (bold, white, 32px)
- "Orang tua kamu mengunci layar ini" (white, 16px)
- Pulsing dot indicator "Menunggu orang tua membuka..."
- No navigation elements whatsoever

---

### Screen C9 — Rewards / Convert Points

**Mobile:**
- 2-col balance row: Poin (orange) | Waktu Tersisa (blue)
- Conversion slider (labeled steps: 10, 20, 50, 100 poin)
- Live preview below slider: "10 poin → 1 menit nonton"
- Orange "Tukar Sekarang" full-width button
- "📋 Riwayat Transaksi →" link card

**Tablet/Desktop:**
- Slider section max-width 480px centered

---

### Screen C10 — Transaction History

**Mobile:** Full-width list
**Tablet/Desktop:** Max-width 600px centered

- Filter tabs: Semua | Poin Masuk | Poin Keluar
- Transaction rows:
  - Earn (green left border): +N poin, description, date
  - Spend (orange left border): -N poin, description, date
- Empty state: 📭 "Belum ada transaksi"

---

### Screen C11 — Achievements

**Mobile:** Single column list
**Tablet:** 2-column grid
**Desktop:** 2-column grid, max-width 700px

- Yellow summary banner: "N Badge Diraih 🏆"
- Unlocked section: full-color emoji badge cards (yellow bg)
- Locked section: greyed out, 🔒 emoji, 50% opacity
- Each card: large emoji (48px) | title | description | unlock date

---

## ROLE 2: PARENT INTERFACE

> Parent UI = clean, professional, data-focused, Inter font, white/gray dominant with orange accents.

### Screen P1 — Parent Login

**Mobile:** Full-width form, stacked
**Tablet:** Centered card (max-width 440px)
**Desktop:** Split — left brand panel (orange, logo + illustration) / right login form

- WapKidLearn logo + "Panel Orang Tua" subtext
- Email input + Password input (show/hide toggle)
- "Masuk" orange full-width button
- "Masuk sebagai Anak →" bottom link

---

### Screen P2 — Parent Dashboard

**Mobile:**
- Header: greeting + logout
- Children cards (full width, stacked):
  - Avatar + name, points badge, watch time badge, lock status
- "Tambah Anak" dashed card at bottom

**Tablet:**
- Children cards in 2-column grid

**Desktop:**
- Left sidebar (240px): logo, "Dashboard" active, "Anak-anak" nav item, logout bottom
- Main area: children in 2–3 column grid

---

### Screen P3 — Child Detail

**Mobile:** Stacked sections
**Tablet/Desktop:** Left sidebar + main content

- Child avatar (64px) + name + grade as page hero
- Quick lock/unlock pill toggle (red=locked, green=unlocked) — prominent
- Stats row: Total Poin | Watch Used Today | Current Streak
- 4 action cards (2×2 on mobile, horizontal row on desktop):
  - 📊 Analitik
  - ⚙️ Pengaturan
  - 🎬 Video
  - 📋 Aktivitas

---

### Screen P4 — Parent Settings (per child)

**Mobile:** Single column form
**Tablet/Desktop:** Form max-width 560px, 2-column layout for number inputs

- Section "Keamanan": Emergency Lock toggle (red, large) + Change PIN button
- Section "Batas Harian":
  - Daily watch limit: number stepper input + "menit/hari" label
  - Conversion rate: number stepper + "poin per menit" label + "?" tooltip
- Section "Jam Menonton":
  - 24 hour checkboxes (0–23) in grid:
    - Mobile: 6×4 grid
    - Desktop: 12×2 grid
  - "Pilih Semua" / "Hapus Semua" text links
- Sticky "Simpan Pengaturan" button at bottom (orange)

---

### Screen P5 — Child Analytics

**Mobile:** Stacked full-width charts
**Tablet:** Charts side by side (2-col)
**Desktop:** 2-col charts, max-width 960px

- Streak card: 🔥 Current streak | 🏅 Longest streak (side by side)
- Bar chart "Poin per Hari" (7 days, orange bars, day labels X-axis)
- Bar chart "Waktu Nonton per Hari" (7 days, blue bars, minute labels)
- Horizontal bar chart "Akurasi per Topik":
  - Topic name | filled bar (color per topic) | percentage
- All charts: clean axes, no legend, values on bars

---

### Screen P6 — Child Activity Feed

**Mobile:** Full-width timeline list
**Desktop:** Max-width 640px centered (or right panel in 2-col layout)

- Date separator chips between days
- Game activity row: 🎮 | "Main Matematika" | "+N poin" badge | time
- Watch activity row: ▶️ | video title (truncated) | duration | time
- Loading: 3 skeleton rows (shimmer animation)
- Empty: 📭 "Belum ada aktivitas"

---

### Screen P7 — Child Videos Management

**Mobile:** Stacked full-width video cards
**Tablet/Desktop:** 2-column grid

- "Tambah Video" orange button (top right, or FAB on mobile)
- Video card: thumbnail (16:9) + title + status badge + submitter + delete icon
- Status badges: `pending` (yellow) | `active` (green) | `rejected` (red)
- Rejection reason text below rejected badge

**Add Video Modal:**
- Mobile: bottom sheet (slides up)
- Desktop: centered modal (max-width 480px)
- Fields: Title | URL input (paste YouTube/Vimeo link) | auto-thumbnail preview
- Submit button

---

## ROLE 3: ADMIN INTERFACE

> Admin UI = utilitarian, dense, table-oriented. Inter font. Clean white/gray.

### Screen A1 — Admin Dashboard

**Mobile:** Stacked cards
**Tablet/Desktop:** Sidebar + content area

**Sidebar (tablet+):** Logo | Dashboard | Soal | Video | User | — Keluar

- 3 stat cards (row on mobile, row on desktop):
  - Total Soal (blue accent)
  - Total User (green accent)
  - Video Pending (yellow accent, highlighted if > 0)
- Navigation cards (full-width list):
  - 📝 Soal Matematika → "Kelola bank soal" subtext
  - 🎬 Video Global → "N video menunggu review" subtext if pending > 0
  - 👥 User → "Kelola akun pengguna"

---

### Screen A2 — Question Management

**Mobile:** Full-width list cards
**Tablet:** 2-column card grid
**Desktop:** Table layout (question text | grade | topic | difficulty | actions)

- Filter bar: Grade chips (1-6) + Topic dropdown + Difficulty filter
- "Tambah Soal" button (top right)
- Question card/row: text preview | Grade badge | Topic chip | ⭐⭐⭐ difficulty | Edit | Delete

**Add/Edit Question — Mobile (bottom sheet) / Desktop (modal, max-width 560px):**
- Grade level: pill selector (1 2 3 4 5 6)
- Topic: text input with autocomplete suggestions
- Difficulty: 5-star tap selector
- Question text: textarea (3 rows)
- Correct answer: input
- Options A / B / C / D: 4 inputs in 2×2 grid
- Explanation: textarea (optional, collapsible)
- Save button (orange)

---

### Screen A3 — Video Review (Global Videos)

**Mobile:** Stacked cards
**Tablet/Desktop:** List with thumbnail left + info right (horizontal card)

- Filter tabs: Pending | Active | Rejected | Semua
- Video card: thumbnail (80×45px) | title | submitter email | date | status badge
- Pending card actions: ✓ Approve (green button) | ✗ Reject (red button)
- Active card: Delete button
- Reject reason modal: text input + "Konfirmasi Tolak" button

---

### Screen A4 — User Management

**Mobile:** Stacked user cards
**Tablet/Desktop:** Table layout

- Search bar (full width)
- User row: avatar initial (colored circle) | name | email | role badge | status toggle | date
- Role badges: `parent` (blue) | `super_admin` (purple)
- Status toggle: green = active, red = inactive

---

## SHARED COMPONENTS LIBRARY

### Navigation Components
- **Mobile bottom sheet** (slides up from bottom, dark overlay, drag handle)
- **Desktop sidebar** (240px fixed, logo top, nav items with active state, logout bottom)
- **Back arrow header** (mobile top bar with title + optional action button right)
- **Breadcrumb** (desktop only, e.g. Anak-anak > Budi > Pengaturan)

### Data Display
- **Stat card** — icon/emoji | value (large bold) | label (small gray)
- **Badge/chip** — small rounded pill, color variants: orange/blue/green/red/yellow/gray
- **Progress bar** — linear (game timer, accuracy) + circular (accuracy ring)
- **Bar chart** — custom SVG, labeled axes, orange/blue color variants
- **Horizontal bar chart** — topic accuracy, labeled rows
- **Timeline item** — icon left | content | meta right (date/amount)
- **Avatar** — circular, emoji or letter initial, 3 sizes: sm(32px) md(48px) lg(64px)

### Form Components
- **Text input** — rounded-lg, gray bg, orange focus ring, error state (red border + message below)
- **Number stepper** — minus button | value | plus button, inline compact
- **Toggle switch** — animated pill, green=on/red=off variants
- **Checkbox grid** — hour picker, compact 11px labels
- **Slider** — custom track with labeled tick marks, animated thumb
- **Star rating** — 5 tappable stars, filled orange
- **Pill selector** — inline multi-select (grade level picker)
- **Search input** — icon left, clear button right

### Feedback Components
- **Toast notification** — top-center slide-down, green/red/orange variants, auto-dismiss 3s
- **Loading skeleton** — shimmer animation, shapes matching content (card, text line, avatar)
- **Empty state** — centered emoji (64px) | heading | subtext | optional CTA button
- **Error state** — ⚠️ emoji | "Gagal memuat" heading | retry button
- **Confirm modal** — title | message | Cancel (gray) + Confirm (red/orange) buttons
- **Points earned float** — "+N ⭐" green text, floats upward and fades, triggered on correct answer

### Button Variants
| Variant | Background | Text | Border |
|---------|-----------|------|--------|
| Primary | Orange `#F97316` | White | None |
| Secondary | White | Gray | `#E5E7EB` |
| Danger | Red `#EF4444` | White | None |
| Ghost | Transparent | Orange | None |
| Disabled | `#E5E7EB` | `#9CA3AF` | None |

All buttons: rounded-xl (12px), padding 12–16px vertical, font semibold, min-height 44px.

### Interactive States
Every interactive element must show:
- **Rest** — default appearance
- **Hover** (desktop) — slight background darken or lift shadow
- **Active/Pressed** — scale 95%, darken
- **Focus** (keyboard) — orange outline ring 2px offset
- **Disabled** — 50% opacity, no pointer cursor

---

## SPECIAL SCREENS & FLOWS

### PIN Setup Screen (parent creating child PIN)
- 4 large digit input boxes (64px each, rounded-xl)
- Numeric keypad same style as C1
- Step 1: "Buat PIN baru" + 4 boxes
- Step 2: "Konfirmasi PIN" + 4 boxes
- Mismatch error: boxes shake + red border + "PIN tidak cocok"
- Success: green checkmark animation + "PIN berhasil dibuat!"

### Add Child Flow (parent)
- Step 1: Name input
- Step 2: Avatar picker (emoji grid, 3×4)
- Step 3: Grade level selector (1–6 large buttons)
- Step 4: PIN setup (above)
- Step indicator at top (1 2 3 4 dots)
- Next/Back buttons

### Onboarding Empty State (no children yet)
- Illustration of parent and child
- "Belum ada anak terdaftar"
- "Tambah Anak Pertama" orange button

---

## DESIGN DELIVERABLES REQUESTED

For **each screen** listed above, design:
1. **Default state** — data loaded, normal usage
2. **Loading skeleton** state — shimmer placeholders shaped like content
3. **Empty state** — no data available
4. **Error state** — failed to load, with retry
5. **All 3 responsive breakpoints**: Mobile (390px) | Tablet (768px) | Desktop (1280px)
6. **Key interactive states** for primary components on that screen

Organize into **5 Stitch frames/sections**:
1. **Child Screens** — C1 through C11
2. **Parent Screens** — P1 through P7
3. **Admin Screens** — A1 through A4
4. **Shared Components** — full component library with all variants and states
5. **Design Tokens** — color swatches, typography scale, spacing scale, shadow scale, border radius scale

**Frame sizes:**
- Mobile frames: 390×844px
- Tablet frames: 768×1024px
- Desktop frames: 1280×800px

**Naming convention:** `[Role]-[Number]-[ScreenName]-[Breakpoint]-[State]`
Example: `Child-C4-GameQuestion-Mobile-Default`, `Parent-P5-Analytics-Desktop-Loading`
