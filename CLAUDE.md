# Stoop

## What is Stoop?

Stoop is a web app that helps neighbors throw block parties — handling the logistics that actually stop people from doing it. It is the first step in a broader platform for neighborhood community building.

The core insight: most people don't know their neighbors and almost all of them want to. Existing platforms (Nextdoor, Meetup, Facebook Groups) ask people to organize around a shared interest before any trust exists. Stoop lowers the bar to a single afternoon with no recurring commitment. Once neighbors know each other, everything else follows naturally.

Stoop is built in partnership with Hearth, a VC-backed civic tech organization rebuilding associational life in America.

---

## The User Journey

### Host flow
1. **Address entry** — first screen, single field, no auth yet
2. **Party size** — intimate / whole block / close the street (this quietly determines permit requirement)
3. **Auth** — Google or Apple sign-in after step 2, framed as "save your party"
4. **Date + time** — calendar biased toward weekend afternoons
5. **Vibe** — BBQ, wine on the porch, block cookout, pizza party, bring a dish, something else
6. **About you** — household builder: partner name, kids with age ranges, pets with name and type, a single sentence about the family, optional note on why they want to meet their neighbors. Ends with a photo upload prompt.
7. **Flyer** — generated flyer with family photo, personal note synthesized from step 6, event details, QR code. Editable. Print 20 flyers (PDF) or share the link.

### Manage event (host)
- Full width family photo header
- Live RSVP count with momentum — "14 neighbors coming"
- Nudge for people who opened but haven't RSVPd — "6 neighbors opened the invite · Send a reminder →"
- Quick actions: Edit, Message all, Share flyer, Cancel
- Tasks — default tasks based on vibe/event type, guests can claim or add tasks, host can add or remove
- Guest list — name, family detail, what they're bringing
- Day-of checklist (expands closer to event date)
- Post-party state — transforms after event date passes: summary, "what do you want to do next?"

### Recipient flow (neighbor scans QR code)
- Lands directly on RSVP screen — flyer already did the selling, no need to repeat it
- Small family photo at top as context
- "Let your neighbors know who's coming" — name/family name, email or phone, who's joining (partner/kids/dog/just me)
- Confirmation screen — optional family photo upload, optional one-sentence family note
- Guest event page — read-only event details, task list (can claim or add), who's coming list

---

## Design System

### Philosophy
Warm, approachable, unhurried. Every screen has one job. Every prompt sounds like a person wrote it. No corporate language, no feature explanations, no app jargon. The product should feel like a neighbor talking to you, not an app onboarding you.

### Colors
```css
:root {
  --color-primary: #E8521A;        /* burnt orange — CTAs, highlights, links */
  --color-primary-dark: #C8401A;   /* hover states */
  --color-primary-light: #FDF0E8;  /* backgrounds, card tints */
  --color-text-primary: #1A1A1A;   /* headings, body */
  --color-text-secondary: #666666; /* sublines, muted text */
  --color-text-tertiary: #999999;  /* captions, labels */
  --color-border: #E8E8E8;         /* card borders, dividers */
  --color-background: #FFFFFF;     /* page background */
  --color-background-secondary: #F9F6F3; /* warm off-white for sections */
  --color-success: #3B6D11;        /* confirmations */
  --color-success-light: #EAF3DE;  /* success backgrounds */
}
```

### Typography
- **Display / headings:** Georgia, serif. Bold. Used for hero text, section headers, flyer titles.
- **Body / UI:** Calibri or system-ui, sans-serif. Used for all functional text, labels, inputs.
- **Heading scale:** 36px hero, 28px h1, 22px h2, 18px h3
- **Body:** 16px regular, 14px small, 12px caption
- **Weight:** 400 regular, 500 medium, 700 bold only for display
- **Line height:** 1.6 for body, 1.2 for headings

### Spacing
- Page padding: 20px horizontal on mobile, 24px on desktop
- Section gap: 48px between major sections
- Component gap: 16px between cards/items
- Internal card padding: 16px

### Components

**Buttons**
```css
/* Primary */
background: #E8521A;
color: white;
border-radius: 10px;
padding: 14px 24px;
font-size: 16px;
font-weight: 500;
width: 100%; /* full width on mobile */

/* Ghost */
background: transparent;
border: 0.5px solid #E8E8E8;
color: #666666;
border-radius: 10px;
padding: 13px 24px;

/* Text link CTA */
color: #E8521A;
font-weight: 500;
no border, no background
```

**Cards**
```css
background: #FFFFFF;
border: 0.5px solid #E8E8E8;
border-radius: 12px;
padding: 16px;
```

**Inputs**
```css
border: 0.5px solid #E8E8E8;
border-radius: 8px;
padding: 12px 14px;
font-size: 15px;
background: #FFFFFF;
```

**Selected state (chips, cards)**
```css
border: 2px solid #E8521A;
background: #FDF0E8;
color: #E8521A;
```

**Task cards**
```css
border-left: 3px solid #E8521A; /* claimed */
border-left: 3px solid #E8E8E8; /* unclaimed */
border-radius: 8px;
padding: 14px;
```

### Flyer design
The flyer is the most important artifact in the product. It should feel like it was made by a person, not generated by software.

Structure:
- Family photo: full width, dominant, rounded top corners
- Event name: bold, Georgia, large
- Category tag: small, muted, above the title (e.g. "Backyard BBQ")
- Date, time, address: with small icons
- Personal note: italic, synthesized from host's step 6 inputs
- Signed: "— The Miller Family & Biscuit"
- QR code: small, bottom corner
- Stoop logo: bottom left

The personal note is generated by Claude (Anthropic API) based on:
- How long they've lived there
- Who's in the household (partner name, kids ages, pet name and type)
- Their one-sentence family description
- Their optional "why I want to meet my neighbors" note

The generated note should sound warm, specific, and human. Never generic. Always edit-able by the host.

---

## Tech Stack

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS — extend the config with the design tokens above
- **Auth:** Supabase Auth — Google and Apple sign-in
- **Database:** Supabase (Postgres)
- **Storage:** Supabase Storage — family photos, flyer assets
- **AI:** Anthropic API (claude-sonnet-4-20250514) — personal note generation from host inputs
- **PDF generation:** React-pdf or Puppeteer — printable flyer export
- **QR codes:** qrcode.react
- **Email/SMS:** Resend (email) + Twilio (SMS) — RSVP confirmations, reminders, day-of nudges

---

## Key Product Principles

1. **One job per screen** — never ask for more than one decision at a time
2. **Auth as late as possible** — after step 2 (party size), framed as "save your party" not "create an account"
3. **Address first** — the very first screen asks where you live, not your email. Grounds the experience in a real place immediately.
4. **The flyer is the distribution** — every flyer placed in a mailbox is an impression. The host's name and face on it is what makes neighbors read it.
5. **Physical-digital bridge** — QR code on a printed flyer is the core mechanic. Never lose sight of this.
6. **Warmth over efficiency** — prompts should sound like a neighbor, not a form. "Let your neighbors know who's coming" not "Enter attendee information."
7. **The family portrait matters** — the more specific the family details (kids' ages, dog's name and breed, how long they've lived there), the better the flyer note and the warmer the guest list feels.
8. **Tasks are collaborative, not assigned** — guests claim tasks, they aren't assigned them. The visibility of who's claimed what is the social mechanic.

---

## Database Schema (draft)

```sql
-- Users
users (
  id, 
  email, 
  phone,
  name,
  family_name,        -- "The Millers"
  partner_name,
  photo_url,
  family_note,        -- one sentence about the family
  why_note,           -- optional: why they want to meet neighbors
  address,
  years_at_address,
  created_at
)

-- Household members
household_members (
  id,
  user_id,
  type,               -- 'kid' | 'pet'
  name,               -- optional
  age_range,          -- 'baby' | 'toddler' | 'elementary' | 'teen' (kids)
  pet_type,           -- 'big dog' | 'small dog' | 'very opinionated dog' | 'cat' | 'other'
  created_at
)

-- Events
events (
  id,
  host_id,
  title,
  address,
  date,
  time,
  vibe,               -- 'bbq' | 'wine' | 'cookout' | 'pizza' | 'potluck' | 'other'
  size,               -- 'intimate' | 'whole_block' | 'street_closure'
  permit_required,    -- boolean, derived from size
  permit_status,      -- 'not_required' | 'pending' | 'approved'
  personal_note,      -- AI generated, editable
  photo_url,
  qr_code_url,
  flyer_url,
  status,             -- 'draft' | 'active' | 'completed' | 'cancelled'
  created_at
)

-- RSVPs
rsvps (
  id,
  event_id,
  user_id,            -- null if not registered yet
  family_name,
  email,
  phone,
  guest_count,
  has_partner,
  has_kids,
  has_dog,
  family_note,
  photo_url,
  status,             -- 'going' | 'not_going'
  created_at
)

-- Tasks
tasks (
  id,
  event_id,
  title,
  category,           -- 'essential' | 'drinks' | 'food' | 'atmosphere'
  is_default,         -- true if auto-generated from vibe
  claimed_by_rsvp_id,
  created_at
)
```

---

## File Structure

```
/app
  /page.tsx                    -- landing page (stoop.app)
  /host
    /page.tsx                  -- address entry (step 1)
    /size/page.tsx             -- party size (step 2)
    /auth/page.tsx             -- save your party (step 3)
    /date/page.tsx             -- date + time (step 4)
    /vibe/page.tsx             -- party vibe (step 5)
    /about/page.tsx            -- family portrait (step 6)
    /flyer/page.tsx            -- flyer preview (step 7)
  /event
    /[id]/page.tsx             -- host manage event page
    /[id]/guest/page.tsx       -- recipient event page
  /rsvp
    /[id]/page.tsx             -- recipient RSVP flow
/components
  /flyer                       -- flyer card component + PDF export
  /tasks                       -- task list, task card, claim mechanic
  /household                   -- household builder component
  /onboarding                  -- progress bar, step wrapper
/lib
  /supabase.ts                 -- supabase client
  /anthropic.ts                -- personal note generation
  /qr.ts                       -- QR code generation
  /pdf.ts                      -- flyer PDF export
/designs                       -- exported Figma/Stitch screens for reference
```

---

## Prompt for personal note generation

When generating the flyer personal note, use this system prompt:

```
You are helping a neighbor write a warm, personal note for a block party flyer. 
Write in first person, casual and warm. Sound like a real person, not a template. 
Be specific — use the details provided. Keep it to 3-4 sentences maximum.
Never use corporate or marketing language. The goal is to make a stranger 
feel like they already know this family before they show up.
```

User prompt structure:
```
Write a personal note for a block party flyer with these details:
- Family: [host name], [partner name if provided], [kids: number and ages], [pet: name and type]
- How long at address: [years]
- About the family: [their one sentence]
- Why they want to meet neighbors: [optional note]
- Party vibe: [BBQ / wine / etc]
```

---

## Design assets

Exported screen designs live in `/designs`. Three subfolders:

```
/designs
  /Small_Screens_Host_Flow      -- mobile screens for the host onboarding and manage event flow
  /Large_Screen_Example         -- desktop landing page reference
  /Small_Screen_Recipient_Flow  -- mobile screens for the neighbor RSVP and guest event flow
```

When building a screen, reference the relevant folder and describe which screen you're working on. Claude Code will look at the images in that folder for visual guidance.
