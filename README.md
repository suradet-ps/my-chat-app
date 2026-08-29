# Real-time Chat Application

```
 ██████╗██╗  ██╗ █████╗ ████████╗ █████╗ ██████╗ ██████╗
██╔════╝██║  ██║██╔══██╗╚══██╔══╝██╔══██╗██╔══██╗██╔══██╗
██║     ███████║███████║   ██║   ███████║██████╔╝██████╔╝
██║     ██║  ██║██╔══██║   ██║   ██╔══██║██╔═══╝ ██╔═══╝
╚██████╗██║  ██║██║  ██║   ██║   ██║  ██║██║     ██║
 ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝╚═╝  ╚═╝╚═╝╚═╝
```

---

## ◆ PULSE

A message that waits for a page refresh is not a message; it is a
note. This is a real-time 1-on-1 chat built on Vue 3 and Supabase
Broadcast: messages arrive the moment they are sent, appear instantly
through optimistic UI, and settle into the database in the background.
Magic-link authentication opens the door without a password, a unified
search finds conversations and people alike, and the whole backend -
auth, profiles, messaging - is one Supabase project with nothing to
host.

| Broadcast ▣ | Optimistic ▣ | Magic link ▣ | 1-on-1 ▣ |
|---|---|---|---|

*The chat loop - sign in, find, send, receive - is sealed.*

> Built with Vue 3 + Vite + Pinia, powered by Supabase Broadcast and
> Row Level Security - the realtime is the feature, not the plugin.
>
> **suradet-ps**, artifact keeper

---

## ◆ IGNITION

One account, one schema, four commands.

```
⟫ git clone https://github.com/suradet-ps/my-chat-app.git
⟫ cd my-chat-app
⟫ npm install
⟫ npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

<details>
<summary>Supabase setup</summary>

1. Create a Supabase project.
2. Run `schema.sql` in the SQL Editor: the `profiles`,
   `conversations`, `participants`, and `messages` tables, RLS
   policies gating every row, and the `create_or_get_conversation`
   function that starts chats.
3. Copy the Project URL and anon key into `.env`:

```
VITE_SUPABASE_URL="YOUR_SUPABASE_PROJECT_URL"
VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
```

</details>

The release artifact: `⟫ npm run build` - `dist/` for any static
host.

---

## ◆ ANATOMY

One store, one broadcast channel, an honest optimistic screen.

- **Authenticates** - magic link via `signInWithOtp`: the email holds
  the key, no password to leak or forget.
- **Broadcasts** - Supabase Broadcast pushes messages straight to
  open clients - the round trip skips the database read, so latency
  stays low and reads stay rare.
- **Optimizes** - a sent message appears instantly, then settles in
  the background - the UI never waits to be told the truth.
- **Converses** - 1-on-1 threads: the conversation list, new chats
  with any registered user, and a unified search bar that filters
  existing chats and discovers new people with one query.
- **Profiles** - an account page for the display name; the profile
  travels with the conversation.
- **Guards** - Row Level Security keeps every conversation inside its
  participants - the schema answers only to the people in the chat.

---

## ◆ RITUALS

**The core ceremony** - the first conversation:

1. Sign in with the magic link; the email opens the door.
2. Search once: the bar filters existing conversations and finds new
   people in the same breath.
3. Send the first message - it appears instantly, broadcast to the
   other side, settled into the database in the background.
4. Reply when it arrives - the broadcast delivers it without a
   refresh, without a poll.

**The ceremony of the instant send** - the message shows itself
before the network confirms it. Optimistic UI trusts the user's
intent and lets the database catch up - the conversation never
stutters.

**The ceremony of the private row** - RLS decides who may read what,
row by row: a conversation belongs to its participants, and the
schema enforces what the feature promises.

---

## ◆ ECHOES

**Where this artifact is heading**

```
auth   ▸ magic-link passwordless sign-in ────────────────────────────── ▸ sealed
realtime ▸ Supabase Broadcast push ──────────────────────────────────── ▸ sealed
optimistic ▸ instant send, background sync ──────────────────────────── ▸ sealed
converse ▸ 1-on-1 threads, unified search ───────────────────────────── ▸ sealed
guard  ▸ RLS-gated conversations ────────────────────────────────────── ▸ sealed
```

**Raising the artifact** - the schema lives in `schema.sql`; the
state in Pinia stores. Open an issue first to discuss a change.

**Status** - dependencies are maintained through Renovate.

---

```
  ─────────────────────────────────────────
   A message sent is a message answered
   the moment the other side is ready.
  ─────────────────────────────────────────
```

Open source.