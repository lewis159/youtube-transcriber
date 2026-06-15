export type KBRole = 'user' | 'admin'
export type KBCategory =
  | 'getting-started'
  | 'features'
  | 'account'
  | 'troubleshooting'
  | 'admin-users'
  | 'admin-system'
  | 'admin-architecture'

export interface KBStep {
  heading: string
  body: string // plain text; bullet points as \n- item
}

export interface KBArticle {
  slug: string
  title: string
  description: string
  category: KBCategory
  role: KBRole
  videoId: string | null // YouTube video ID, null = coming soon
  readTime: number // minutes
  tags: string[] // flat, combinable: topic/feature + audience:* + difficulty:* + type:*
  lastUpdated: string // ISO date (YYYY-MM-DD)
  steps: KBStep[]
}

export const KB_ARTICLES: KBArticle[] = [
  // ─── USER ARTICLES ────────────────────────────────────────────────────────

  {
    slug: 'getting-started',
    title: 'Getting started — transcribe your first video in 60 seconds',
    description:
      'New to YT Transcriber? Follow these five steps to go from sign-up to a searchable transcript in under a minute.',
    category: 'getting-started',
    role: 'user',
    videoId: null,
    readTime: 2,
    tags: ['transcription', 'audience:user', 'difficulty:getting-started', 'type:how-to'],
    lastUpdated: '2026-06-15',
    steps: [
      {
        heading: 'Create your account',
        body: 'Visit the YT Transcriber homepage and click "Start Free". Enter your email address and choose a password, or sign up instantly with Google or GitHub. Confirm your email if prompted — the confirmation link expires after 24 hours.',
      },
      {
        heading: 'Paste a YouTube URL into the dashboard',
        body: 'Once signed in you will land on your Dashboard. Find the large input field at the top labelled "Paste a YouTube URL". Copy any YouTube video URL from your browser address bar (e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ) and paste it into the field.',
      },
      {
        heading: 'Click Transcribe',
        body: 'Press the red "Transcribe" button. YT Transcriber will validate the URL, fetch the video metadata, and add the job to the processing queue. You will see the video card appear on your dashboard immediately with a "Processing" badge.',
      },
      {
        heading: 'Wait for processing to complete',
        body: 'Most videos complete within a minute or two, though it varies with video length and how busy the queue is. The card badge will change from "Processing" to "Ready" when the transcript is available. You do not need to keep the page open — you will see the updated status the next time you visit.',
      },
      {
        heading: 'View your transcript',
        body: 'Click the video card or the "View Transcript" button to open the full transcript. You will see the complete text with timestamps on the left, a search bar at the top, and export options in the toolbar. Congratulations — your first transcript is ready!',
      },
    ],
  },

  {
    slug: 'search-and-timestamps',
    title: 'How to search within a transcript and jump to timestamps',
    description:
      'Use the built-in search to find any word or phrase in a transcript, then jump directly to that moment in the YouTube video.',
    category: 'features',
    role: 'user',
    videoId: null,
    readTime: 2,
    tags: ['search', 'audience:user', 'difficulty:getting-started', 'type:how-to'],
    lastUpdated: '2026-06-15',
    steps: [
      {
        heading: 'Open a video detail page',
        body: 'From your Dashboard, click any video card that has the "Ready" status. This opens the video detail page which shows the full transcript alongside the video metadata.',
      },
      {
        heading: 'Use the search box',
        body: 'At the top of the transcript panel you will find a search box labelled "Search transcript…". Type any word or phrase you are looking for. Results update instantly as you type — no need to press Enter.',
      },
      {
        heading: 'Review highlighted matches',
        body: 'Every occurrence of your search term is highlighted in yellow within the transcript text. A small counter in the search box shows how many matches were found (e.g. "4 of 4"). Use the up/down arrows beside the counter to jump between matches.',
      },
      {
        heading: 'Click a timestamp to open that moment in YouTube',
        body: 'Each transcript segment has a timestamp on the left side (e.g. [01:23]). Click any timestamp to open YouTube in a new tab with the video cued to that exact moment. This is especially useful for jumping to a specific section of a long lecture or podcast.',
      },
    ],
  },

  {
    slug: 'export-formats',
    title: 'Exporting your transcript — TXT, PDF, SRT explained',
    description:
      'Download your transcript in the format that fits your workflow — plain text for editing, PDF for sharing, or SRT for adding subtitles to a video.',
    category: 'features',
    role: 'user',
    videoId: null,
    readTime: 3,
    tags: ['export', 'audience:user', 'difficulty:getting-started', 'type:reference'],
    lastUpdated: '2026-06-15',
    steps: [
      {
        heading: 'Open the video detail page',
        body: 'Navigate to your Dashboard and click on the video you want to export. The video detail page will open, showing the full transcript.',
      },
      {
        heading: 'Click the Export button',
        body: 'In the toolbar at the top of the transcript panel, click the "Export" button (it looks like a download arrow icon). A dropdown menu will appear with the available format options.',
      },
      {
        heading: 'Choose your format',
        body: 'Select one of the available formats:\n- TXT — Plain text file. Best for copying the transcript into a word processor, notes app, or AI prompt. No formatting, just the words.\n- PDF — Formatted document with the video title, thumbnail, and timestamps. Best for sharing with colleagues or archiving.\n- SRT — SubRip Subtitle file. Best for video editors who want to burn captions into a video or upload subtitles to YouTube/Vimeo.\n- ZIP — A bundle of multiple transcripts (and/or formats) packaged into a single archive. Best when you want to download a whole folder of transcripts at once rather than one file at a time.',
      },
      {
        heading: 'Download your file',
        body: 'After selecting a format, your browser will download the file automatically. The filename will be based on the video title. For PDF exports, the download may take a second or two to generate.',
      },
    ],
  },

  {
    slug: 'folders',
    title: 'Organising videos with folders',
    description:
      'Keep your transcript library tidy by grouping related videos into folders — great for projects, courses, or clients.',
    category: 'features',
    role: 'user',
    videoId: null,
    readTime: 2,
    tags: ['folders', 'audience:user', 'difficulty:getting-started', 'type:how-to'],
    lastUpdated: '2026-06-15',
    steps: [
      {
        heading: 'Create a new folder',
        body: 'From your Dashboard, click the "New Folder" button in the left sidebar or at the top of the video grid. A dialog will appear asking you to name the folder. Type a descriptive name (e.g. "Client Project — ACME" or "Python Course") and click Create.',
      },
      {
        heading: 'Add videos to a folder by dragging',
        body: 'On the Dashboard grid view, click and drag a video card onto a folder in the left sidebar. The folder will highlight in red to indicate it is ready to accept the drop. Release to move the video into the folder.',
      },
      {
        heading: 'Add videos using the folder dropdown',
        body: 'Alternatively, hover over a video card and click the three-dot menu (⋯) in the top-right corner of the card. Select "Move to Folder" from the menu, then pick the destination folder from the list. This method also works on the video detail page.',
      },
      {
        heading: 'Browse and manage folders',
        body: 'Click any folder in the left sidebar to view only the videos inside it. To rename or delete a folder, right-click the folder name in the sidebar and choose the action you want. Deleting a folder does not delete the videos — they are moved back to the root of your library.',
      },
    ],
  },

  {
    slug: 'share-links',
    title: 'Creating and sharing a share link',
    description:
      'Share a transcript with anyone — even people without a YT Transcriber account — using a secure, expiring share link.',
    category: 'features',
    role: 'user',
    videoId: null,
    readTime: 3,
    tags: ['share-links', 'audience:user', 'difficulty:intermediate', 'type:how-to'],
    lastUpdated: '2026-06-15',
    steps: [
      {
        heading: 'Open the video detail page',
        body: 'Go to your Dashboard and click the video you want to share. The video detail page will open with the full transcript visible.',
      },
      {
        heading: 'Click Share',
        body: 'In the toolbar, click the "Share" button (it shows a chain-link icon). A Share Link dialog will appear.',
      },
      {
        heading: 'Configure expiry and download permissions',
        body: 'In the dialog, set two options:\n- Link expiry — choose how long the link stays active: 24 hours, 7 days, 30 days, or Never expires.\n- Allow download — toggle this on if you want the recipient to be able to export the transcript as TXT, PDF, or SRT. Leave it off to make the link read-only.',
      },
      {
        heading: 'Copy the link',
        body: 'Click "Generate Link". A shareable URL will appear in the dialog. Click "Copy Link" to copy it to your clipboard. You can also click "Regenerate" at any time to invalidate the old link and create a fresh one.',
      },
      {
        heading: 'Share it — no account required for recipients',
        body: 'Paste the link into an email, Slack message, or anywhere else. The recipient will be able to view and search the transcript in their browser without creating a YT Transcriber account. If you enabled download permissions, they will also see export buttons. Your account settings and other transcripts remain completely private.',
      },
    ],
  },

  {
    slug: 'plan-limits',
    title: 'Understanding your plan limits and upgrading',
    description:
      'Learn what each plan includes, how to check your current usage, and how to upgrade when you need more.',
    category: 'account',
    role: 'user',
    videoId: null,
    readTime: 3,
    tags: ['billing', 'account', 'audience:user', 'difficulty:getting-started', 'type:reference'],
    lastUpdated: '2026-06-15',
    steps: [
      {
        heading: 'View your current usage',
        body: 'Click your avatar in the top-right corner and select "Settings". On the Settings page, choose the "Plan & Usage" tab. You will see a summary of your current plan, how many transcripts you have used this month, and your remaining allowance.',
      },
      {
        heading: 'Understand the Starter plan',
        body: 'Starter is the free tier. It includes:\n- 5 transcripts total\n- TXT export only\n- No folder organisation\nIdeal for casual users who want to try the product.',
      },
      {
        heading: 'Understand the Pro plan',
        body: 'Pro is designed for content creators and students. It includes:\n- 10 transcripts per month\n- TXT and PDF export\n- Folder organisation\n- Unlimited transcript retention\n- Share links',
      },
      {
        heading: 'Understand the Studio plan',
        body: 'Studio is for power users and small teams. It includes:\n- 40 transcripts per month\n- TXT, PDF, and SRT export\n- Folder organisation and sharing\n- Notes on transcripts\n- Share links with all expiry options including Never\n- Priority processing queue',
      },
      {
        heading: 'Understand the Enterprise plan',
        body: 'Enterprise is for organisations and large teams. It includes unlimited transcripts, all features, team management, SSO, custom retention policies, and a dedicated support contact. Contact us via Settings > Plan to get an Enterprise quote.',
      },
      {
        heading: 'Upgrade your plan',
        body: 'On the "Plan & Usage" settings tab, click the "Upgrade" button next to the plan you want. You will be taken to a secure Stripe checkout page. After payment, your new limits are active immediately.',
      },
    ],
  },

  {
    slug: 'notes',
    title: 'How to add notes to a video',
    description:
      'Attach private notes to any transcript — handy for summarising key points, action items, or research context.',
    category: 'features',
    role: 'user',
    videoId: null,
    readTime: 2,
    tags: ['notes', 'audience:user', 'difficulty:getting-started', 'type:how-to'],
    lastUpdated: '2026-06-15',
    steps: [
      {
        heading: 'Open the video detail page',
        body: 'From your Dashboard, click the video you want to annotate. The video detail page will open.',
      },
      {
        heading: 'Scroll to the Notes panel',
        body: 'Below the transcript panel you will find a "Notes" section. If you do not see it, make sure your plan includes Notes (Studio and above). On smaller screens the Notes panel may be in a collapsible drawer — look for a "Notes" tab at the bottom of the page.',
      },
      {
        heading: 'Type your notes',
        body: 'Click inside the Notes text area and start typing. You can write free-form text, paste in bullet points, or jot down timestamps manually. The Notes field supports basic line breaks and paragraph spacing.',
      },
      {
        heading: 'Save your notes',
        body: 'Click the "Save Notes" button below the text area. A confirmation message will briefly appear to confirm the save was successful. Notes auto-save after 30 seconds of inactivity as well.',
      },
      {
        heading: 'Notes are private to your account',
        body: 'Notes are never included in share links and are never visible to other users. Even if you share a transcript with someone, your notes remain completely private.',
      },
    ],
  },

  {
    slug: 'missing-transcript',
    title: 'What to do if a transcript is missing or incorrect',
    description:
      'Troubleshoot common transcription problems — from missing captions to garbled text — and find out when to contact support.',
    category: 'troubleshooting',
    role: 'user',
    videoId: null,
    readTime: 3,
    tags: ['transcription', 'captions', 'audience:user', 'difficulty:intermediate', 'type:troubleshooting'],
    lastUpdated: '2026-06-15',
    steps: [
      {
        heading: 'Check if the video has captions on YouTube',
        body: 'YT Transcriber relies on caption data from YouTube. Open the video directly on YouTube.com, click the CC (Closed Captions) button on the player, and check if captions are available. If the CC button is greyed out or not present, the video does not have captions and cannot be transcribed at this time.',
      },
      {
        heading: 'Check that the video is public',
        body: 'YT Transcriber can only process public videos. Private and unlisted videos will return an error. If the video was recently made public, wait a few minutes and try again as YouTube sometimes takes a moment to update its metadata.',
      },
      {
        heading: 'Try re-transcribing the video',
        body: 'Open the video on your Dashboard, click the three-dot menu (⋯) on the video card, and select "Re-transcribe". This will submit a fresh transcription job, which may succeed if a previous attempt failed due to a temporary network issue.',
      },
      {
        heading: 'Check for auto-generated vs manual captions',
        body: 'YouTube\'s auto-generated captions can sometimes be low quality for videos with strong accents, background noise, or technical vocabulary. If the transcript looks garbled, this is usually why. Manual captions (uploaded by the creator) tend to be more accurate.',
      },
      {
        heading: 'Contact support if the problem persists',
        body: 'If re-transcribing does not help and the video has valid captions on YouTube, please contact our support team. Go to Settings > Help & Support and submit a ticket with the YouTube URL of the video. Our team will investigate and respond within one business day.',
      },
    ],
  },

  {
    slug: 'why-didnt-my-video-transcribe',
    title: "Why didn't my video transcribe? (captions required)",
    description:
      'YT Transcriber works from a video’s YouTube captions — it does not listen to the audio. If a video has no captions, it cannot be transcribed. Here’s how to tell, and what to do about it.',
    category: 'troubleshooting',
    role: 'user',
    videoId: null,
    readTime: 3,
    tags: ['transcription', 'captions', 'audience:user', 'difficulty:getting-started', 'type:troubleshooting'],
    lastUpdated: '2026-06-15',
    steps: [
      {
        heading: 'How YT Transcriber actually works',
        body: 'YT Transcriber pulls the existing caption track from YouTube — it does NOT perform speech-to-text on the audio. This makes transcription fast and accurate, but it has one hard requirement: the video must already have captions on YouTube. If a video has no caption track at all, there is nothing for us to fetch, and the job will fail with a "no captions available" error. This is the single most common reason a video does not transcribe.',
      },
      {
        heading: 'Check whether the video has captions',
        body: 'Open the video directly on YouTube.com and click the CC (Closed Captions) button on the player. If captions appear, the video can be transcribed. If the CC button is greyed out or missing, the video has no captions and cannot be transcribed at this time. Both creator-uploaded (manual) captions and YouTube’s auto-generated captions work — you just need one of them to exist.',
      },
      {
        heading: 'Make sure the video is public',
        body: 'We can only read captions from public videos. Private and unlisted videos return an error even if they have captions. If the video was only just made public, wait a minute or two and try again — YouTube sometimes takes a moment to expose the caption track.',
      },
      {
        heading: 'Try again or pick a different source',
        body: 'If the video genuinely has captions but still failed, open it on your Dashboard, click the three-dot menu (⋯) and choose "Re-transcribe" to submit a fresh job — this clears up transient network failures. If the video simply has no captions, there is no workaround within YT Transcriber today (we do not generate captions from audio). Look for a captioned version of the same content, or ask the creator to enable captions.',
      },
      {
        heading: 'Still stuck? Contact support',
        body: 'If a public, captioned video repeatedly fails, go to Settings > Help & Support and submit a ticket with the YouTube URL. Our team will investigate and reply within one business day.',
      },
    ],
  },

  {
    slug: 'supported-languages',
    title: 'What languages are supported?',
    description:
      'Because YT Transcriber reads YouTube’s caption track rather than transcribing audio, the languages we support are whatever caption languages a given video already provides on YouTube.',
    category: 'getting-started',
    role: 'user',
    videoId: null,
    readTime: 2,
    tags: ['transcription', 'captions', 'audience:user', 'difficulty:getting-started', 'type:reference'],
    lastUpdated: '2026-06-15',
    steps: [
      {
        heading: 'Language support follows YouTube captions',
        body: 'YT Transcriber does not translate or transcribe audio — it fetches the caption track YouTube already has. That means the languages available for any given video are exactly the caption languages that video offers on YouTube. If a video has English captions, you get an English transcript; if it has Spanish captions, you get a Spanish transcript.',
      },
      {
        heading: 'How to see which languages a video offers',
        body: 'On YouTube, open the video, click the gear (Settings) icon on the player, then "Subtitles/CC". The list shows every caption language available for that video, including any auto-translated tracks YouTube provides. Whatever appears there is what YT Transcriber can pull.',
      },
      {
        heading: 'Auto-generated vs manual captions',
        body: 'Many videos only have YouTube’s auto-generated captions, which exist for a wide range of spoken languages but can be lower quality for strong accents, background noise, or technical vocabulary. Creator-uploaded (manual) captions are usually more accurate. Both work with YT Transcriber.',
      },
      {
        heading: 'What we do not do (yet)',
        body: 'We do not transcribe audio that has no captions, and we do not translate a transcript into a language the video does not already provide captions for. If you need a language that YouTube does not offer captions for on that video, YT Transcriber cannot produce it today.',
      },
    ],
  },

  {
    slug: 'privacy-and-data-handling',
    title: 'Your privacy & how we handle your data',
    description:
      'A plain-English summary of what data YT Transcriber stores, how it is protected, who can see your transcripts, and the controls you have over your own data.',
    category: 'account',
    role: 'user',
    videoId: null,
    readTime: 4,
    tags: ['privacy', 'account', 'security', 'audience:user', 'difficulty:getting-started', 'type:concept'],
    lastUpdated: '2026-06-15',
    steps: [
      {
        heading: 'What we store',
        body: 'We store the data needed to run your account and your library:\n- Your account details (email and authentication identity, handled by our auth provider Clerk).\n- The videos you transcribe: the YouTube URL/ID, video metadata (title, thumbnail), and the transcript text we fetched from YouTube’s captions.\n- Anything you create in the app: folders, notes, and share links.\nWe do not store your payment card details — those are held by Stripe, our payment processor, never by YT Transcriber.',
      },
      {
        heading: 'Your transcripts are private by default',
        body: 'Your library is visible only to you. Other users cannot see your transcripts, folders, or notes. A transcript only becomes viewable by someone else if YOU create a share link for it — and even then your notes are never included in a share link. You stay in control of what, if anything, you share.',
      },
      {
        heading: 'How your data is protected',
        body: 'Data is stored in our managed database (Supabase) with Row Level Security, so the system enforces that you can only ever read your own rows — even if there were a bug in the application layer. Traffic is encrypted in transit over HTTPS. Authentication is handled by Clerk, and sensitive server secrets are kept out of the browser and out of the database.',
      },
      {
        heading: 'Sharing and third parties',
        body: 'To provide the service we rely on a small number of processors: YouTube (to fetch captions), Clerk (authentication), Supabase (database/storage) and Stripe (payments, for paid plans only). We do not sell your data or your transcripts to advertisers.',
      },
      {
        heading: 'Your controls',
        body: 'You can delete individual videos, folders, notes and share links at any time from the app. You can export your transcripts (TXT, PDF, SRT, ZIP) whenever you like. You can also delete your entire account and the data attached to it — see the article "Deleting your account and exporting your data" for how.',
      },
    ],
  },

  {
    slug: 'free-tier-limit',
    title: 'What happens when you hit your free-tier limit',
    description:
      'The free Starter plan includes a fixed number of transcripts. Here’s exactly what happens when you reach the limit, what stays available, and how to get more.',
    category: 'account',
    role: 'user',
    videoId: null,
    readTime: 3,
    tags: ['billing', 'account', 'audience:user', 'difficulty:getting-started', 'type:concept'],
    lastUpdated: '2026-06-15',
    steps: [
      {
        heading: 'What the Starter limit is',
        body: 'Starter is the free tier and includes 5 transcripts. Once you have used your full allowance, you have reached the free-tier limit. You can always see how many you have used and how many remain on the Plan & Usage tab in Settings.',
      },
      {
        heading: 'What happens when you hit the limit',
        body: 'New transcription jobs are paused. When you try to transcribe another video, instead of starting a job the app shows a message telling you that you have reached your Starter limit and offers an upgrade. Nothing is charged and nothing breaks — you simply cannot start new transcripts until you have more capacity.',
      },
      {
        heading: 'Your existing transcripts stay available',
        body: 'Hitting the limit never deletes anything. Every transcript you have already created remains fully available to view, search, and export (TXT, PDF, SRT, ZIP). The only thing the limit affects is creating NEW transcripts.',
      },
      {
        heading: 'How to get more',
        body: 'You have two options:\n- Upgrade to a paid plan. Pro and Studio have much higher monthly allowances, and upgrading raises your limit immediately so you can keep transcribing straight away. Go to the Pricing or Plan & Usage page and choose a plan.\n- Wait for your cycle to reset, if the plan you are on has a recurring monthly allowance.\nStarter’s allowance is a total, so if you need ongoing capacity, upgrading is the way forward.',
      },
    ],
  },

  {
    slug: 'delete-account-and-export-data',
    title: 'Deleting your account and exporting your data',
    description:
      'How to take your transcripts with you before you go, and how to permanently delete your YT Transcriber account and the data attached to it.',
    category: 'account',
    role: 'user',
    videoId: null,
    readTime: 3,
    tags: ['account', 'privacy', 'export', 'audience:user', 'difficulty:getting-started', 'type:how-to'],
    lastUpdated: '2026-06-15',
    steps: [
      {
        heading: 'Export your transcripts first',
        body: 'Deletion is permanent, so export anything you want to keep before you start. Open each video and use the Export button to download it as TXT, PDF or SRT, or use ZIP export to download multiple transcripts at once. Once your account is deleted these are gone, so make sure you have local copies of anything important.',
      },
      {
        heading: 'Cancel any paid subscription',
        body: 'If you are on a paid plan, cancel your subscription before deleting your account so you are not billed again. You can cancel from your billing settings; your paid features remain until the end of the period you have already paid for. See the billing articles for details.',
      },
      {
        heading: 'Delete your account',
        body: 'Go to Settings and open the account/danger-zone section, then choose to delete your account. You will be asked to confirm, because this cannot be undone. Deleting your account removes your profile and the data associated with it — your transcripts, folders, notes and share links — and signs you out.',
      },
      {
        heading: 'What deletion removes',
        body: 'Account deletion removes your YT Transcriber data: your account record, your transcripts and their metadata, your folders, notes, and any share links you created (which immediately stop working). Your authentication record with Clerk and any payment history retained by Stripe for legal/accounting reasons are handled by those providers under their own policies.',
      },
      {
        heading: 'Need help?',
        body: 'If you would like a copy of your data prepared for you, or you have a question about what is retained, go to Settings > Help & Support and submit a request before deleting your account, and our team will assist.',
      },
    ],
  },

  // ─── ADMIN: USERS & BILLING ──────────────────────────────────────────────

  {
    slug: 'manage-users',
    title: 'Managing users — changing tiers, suspending, resetting passwords',
    description:
      'Step-by-step guide for admin staff to manage user accounts via the Admin panel.',
    category: 'admin-users',
    role: 'admin',
    videoId: null,
    readTime: 4,
    tags: ['account', 'billing', 'audit', 'audience:admin', 'difficulty:intermediate', 'type:how-to'],
    lastUpdated: '2026-06-15',
    steps: [
      {
        heading: 'Navigate to Admin > Users',
        body: 'Sign in with your admin account and click "Admin" in the top navigation bar. Select "Users" from the admin sidebar. The Users list shows all accounts sorted by registration date by default.',
      },
      {
        heading: 'Search for a user',
        body: 'Use the search box at the top of the Users list to find a specific user by email address, name, or Clerk user ID. The list filters in real time as you type.',
      },
      {
        heading: 'Open the user record',
        body: 'Click the user\'s row in the table to open their profile. You will see their subscription tier, usage statistics, account status, and action buttons.',
      },
      {
        heading: 'Change the user\'s tier',
        body: 'In the user profile, locate the "Subscription Tier" dropdown. Select the new tier (Starter, Pro, Studio, or Enterprise) and click "Save". The change takes effect immediately. An audit log entry is created automatically recording who made the change and when.',
      },
      {
        heading: 'Suspend a user',
        body: 'To suspend an account, toggle the "Account Active" switch to Off. Suspended users cannot sign in and will see a "Your account has been suspended" message. Their data is preserved. Toggle it back On to reinstate the account.',
      },
      {
        heading: 'Send a password reset',
        body: 'Click "Send Password Reset Email". This triggers Clerk to send an email to the user\'s address with a secure password reset link. The link expires after one hour. Note: this action is also recorded in the audit log.',
      },
    ],
  },

  {
    slug: 'refunds-credits',
    title: 'How to manually grant credits or issue a refund',
    description:
      'Admin guide for processing refunds through Stripe and granting bonus credits directly to a user account.',
    category: 'admin-users',
    role: 'admin',
    videoId: null,
    readTime: 3,
    tags: ['billing', 'audit', 'audience:admin', 'difficulty:intermediate', 'type:how-to'],
    lastUpdated: '2026-06-15',
    steps: [
      {
        heading: 'Navigate to Admin > Billing',
        body: 'From the Admin panel, click "Billing" in the sidebar. This page shows all recent transactions, subscription changes, and refund history.',
      },
      {
        heading: 'Find the user',
        body: 'Use the search box to find the user by email address or transaction ID. Click on the relevant transaction row to expand the details.',
      },
      {
        heading: 'Issue a refund via Stripe',
        body: 'Click the "Issue Refund" button on the transaction detail view. A dialog will ask you to confirm the refund amount (it defaults to the full transaction amount, but you can enter a partial amount). Click "Confirm Refund". This action calls the Stripe API in real time — the refund will appear on the customer\'s bank statement within 5–10 business days. The refund is logged in both the audit log and Stripe\'s dashboard.',
      },
      {
        heading: 'Grant bonus credits to an account',
        body: 'To add credits without a refund (for example, as a goodwill gesture after a service disruption), click "Grant Credits" on the user\'s billing page. Enter the number of credits to add and optionally a reason. Click "Grant". The credits are added to the user\'s account immediately and appear in their Plan & Usage settings page.',
      },
      {
        heading: 'Verify the change',
        body: 'After issuing a refund or granting credits, the user\'s billing summary will update to reflect the new balance. You can also check Admin > Audit Log and filter by the user\'s email to see a full history of billing actions taken on their account.',
      },
    ],
  },

  {
    slug: 'docker-monitoring',
    title: 'Understanding the Docker monitoring panel and container health',
    description:
      'Learn how to read the Admin container health dashboard, understand status indicators, and respond to unhealthy containers.',
    category: 'admin-system',
    role: 'admin',
    videoId: null,
    readTime: 4,
    tags: ['docker', 'scaling', 'audience:admin', 'difficulty:intermediate', 'type:reference'],
    lastUpdated: '2026-06-15',
    steps: [
      {
        heading: 'Navigate to Admin > Containers',
        body: 'From the Admin panel, click "Containers" in the sidebar. The monitoring panel shows the real-time health of all Docker containers that power the platform.',
      },
      {
        heading: 'Understand the four container groups',
        body: 'Containers are organised into four groups:\n- Nginx — The load balancer. Usually one or two instances. Routes incoming traffic to app containers.\n- App — The Next.js application servers. Multiple instances run in parallel. These handle user requests.\n- Redis — The primary Redis cache / message queue. One master, one or more replicas.\n- Sentinel — The Redis Sentinel monitors that watch the Redis cluster and manage failover.',
      },
      {
        heading: 'Read the health status badges',
        body: 'Each container shows one of three status badges:\n- Healthy (green) — The container is running and passing its health check. Normal operation.\n- Starting (amber) — The container has just started and is waiting for its health check to pass. This is expected briefly after a deployment.\n- Unhealthy (red) — The container is running but failing its health check, or has exited unexpectedly. This requires investigation.',
      },
      {
        heading: 'Read the CPU and memory usage bars',
        body: 'Below each container name you will see CPU % and memory usage bars. A CPU bar above 80% (shown in amber) indicates the container is under heavy load. A bar above 95% (shown in red) means the container is at risk of becoming unresponsive. If multiple app containers are all above 80%, the autoscaler should have already triggered a new instance — check the Containers log for scale-up events.',
      },
      {
        heading: 'Respond to an unhealthy container',
        body: 'If a container turns red, first click on it to expand the logs panel. Review the last 50 log lines for error messages. Common causes include:\n- Database connection timeout — check Supabase status\n- Out of memory — the container may need its memory limit increased\n- Application crash — check the app logs for unhandled exceptions\nIf you cannot resolve the issue from the logs, use the "Restart Container" button to force a clean restart.',
      },
    ],
  },

  {
    slug: 'manage-organisations',
    title: 'Setting up and managing organisations',
    description:
      'Create organisation accounts for teams, assign admins, add members, and set organisation-level subscription tiers.',
    category: 'admin-users',
    role: 'admin',
    videoId: null,
    readTime: 4,
    tags: ['organisations', 'account', 'audience:admin', 'difficulty:intermediate', 'type:how-to'],
    lastUpdated: '2026-06-15',
    steps: [
      {
        heading: 'Navigate to Admin > Organisations',
        body: 'From the Admin panel, click "Organisations" in the sidebar. This page lists all existing organisations and a button to create a new one.',
      },
      {
        heading: 'Create a new organisation',
        body: 'Click "New Organisation". Enter the organisation name and optionally a billing email address. Click "Create". The organisation is created with a Studio tier by default — you can change this in the next step.',
      },
      {
        heading: 'Assign an organisation admin',
        body: 'Once the org is created, open its detail page and click "Add Member". Search for a user by email address and select the role "Org Admin". The org admin can manage members and settings from within the app without needing a platform admin account.',
      },
      {
        heading: 'Add members to the organisation',
        body: 'Click "Add Member" again to add additional users. Select the "Member" role for standard users. Members share the organisation\'s transcript quota but have separate workspaces — they cannot see each other\'s transcripts unless explicitly shared.',
      },
      {
        heading: 'Set the organisation tier',
        body: 'On the organisation detail page, use the "Subscription Tier" dropdown to assign the org\'s plan (Starter, Pro, Studio, or Enterprise). The tier applies to all members of the organisation. Individual members\' personal plan tiers are overridden by the org tier while they are active members.',
      },
    ],
  },

  {
    slug: 'feature-flag-overrides',
    title: 'Feature flag overrides — unlocking features per user or org',
    description:
      'Grant or restrict individual features for specific users or organisations without changing their subscription tier.',
    category: 'admin-users',
    role: 'admin',
    videoId: null,
    readTime: 3,
    tags: ['account', 'audit', 'audience:admin', 'difficulty:intermediate', 'type:how-to'],
    lastUpdated: '2026-06-15',
    steps: [
      {
        heading: 'Navigate to Admin > Feature Flags',
        body: 'From the Admin panel, click "Feature Flags" in the sidebar. The Feature Flags page shows a matrix of all features and the tiers they are included in by default.',
      },
      {
        heading: 'Select a user or organisation to override',
        body: 'Use the search box at the top to find a specific user by email or an organisation by name. Alternatively, select a tier from the "Tier Defaults" dropdown to view or edit the default feature set for all users on that tier.',
      },
      {
        heading: 'Toggle individual features',
        body: 'Each feature is listed as a row with a toggle switch. The switch shows one of three states:\n- Inherited (grey) — The user gets whatever their tier provides. No override.\n- Enabled (green) — The feature is turned on for this user regardless of their tier.\n- Disabled (red) — The feature is turned off for this user regardless of their tier.',
      },
      {
        heading: 'Understand override vs tier default',
        body: 'An override only affects the specific user or organisation you selected. It does not change the tier default for anyone else. For example, you can give a single Pro-tier user access to SRT exports without upgrading their account. Overrides are recorded in the audit log.',
      },
      {
        heading: 'Remove an override',
        body: 'To return a feature to its tier default, click the toggle until it is back in the grey "Inherited" state. The feature will then follow the user\'s tier again. Changes take effect immediately — no restart required.',
      },
    ],
  },

  {
    slug: 'audit-log',
    title: 'Reading the audit log and tracking admin actions',
    description:
      'The audit log records every admin action taken on the platform. Learn how to search, filter, and interpret the log.',
    category: 'admin-users',
    role: 'admin',
    videoId: null,
    readTime: 3,
    tags: ['audit', 'security', 'audience:admin', 'difficulty:intermediate', 'type:reference'],
    lastUpdated: '2026-06-15',
    steps: [
      {
        heading: 'Navigate to Admin > Audit Log',
        body: 'From the Admin panel, click "Audit Log" in the sidebar. The log shows all admin actions in reverse chronological order (most recent first).',
      },
      {
        heading: 'Filter by user',
        body: 'Use the "User" filter at the top to search for actions affecting a specific user. Enter their email address and the log will narrow to only rows where that user was the subject of an action.',
      },
      {
        heading: 'Filter by action type',
        body: 'Use the "Action" dropdown to filter by action type. Available action types include:\n- tier_change — A user\'s subscription tier was modified by an admin\n- refund — A refund was issued via Stripe\n- credit_grant — Bonus credits were added to an account\n- login — An admin signed in to the admin panel\n- feature_override — A feature flag was overridden for a user or org\n- suspension — A user account was suspended or reinstated\n- password_reset — A password reset email was sent to a user',
      },
      {
        heading: 'Filter by date range',
        body: 'Use the "From" and "To" date pickers to narrow the log to a specific time window. This is useful for investigating incidents or preparing compliance reports.',
      },
      {
        heading: 'Read the log entries',
        body: 'Each log entry shows: the timestamp, the admin who performed the action, the action type, the affected user or organisation, and a brief description. Click "Details" on any entry to expand the full payload, which includes the before and after state for changes like tier_change.',
      },
    ],
  },

  {
    slug: 'platform-setup',
    title: 'Setting up the platform for the first time — env vars and secrets',
    description:
      'First-time setup guide for engineers deploying YT Transcriber: environment variables, secrets, and getting Docker running.',
    category: 'admin-system',
    role: 'admin',
    videoId: null,
    readTime: 5,
    tags: ['deployment', 'secrets', 'docker', 'audience:admin', 'difficulty:advanced', 'type:how-to'],
    lastUpdated: '2026-06-15',
    steps: [
      {
        heading: 'Clone the repository and copy the env file',
        body: 'Clone the repository to your server. In the project root, copy the example environment file:\n\n  cp .env.example .env\n\nOpen .env in your editor. You will fill in each variable in the following steps.',
      },
      {
        heading: 'Add Clerk authentication keys',
        body: 'Sign in to your Clerk dashboard at dashboard.clerk.com. Create a new application or open an existing one. Copy the following values into your .env file:\n- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY — found on the API Keys page\n- CLERK_SECRET_KEY — also on the API Keys page (treat this as a password, never commit it)\n- NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in\n- NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up',
      },
      {
        heading: 'Add Supabase credentials',
        body: 'Sign in to your Supabase project at app.supabase.com. Go to Settings > API. Copy these values into your .env:\n- NEXT_PUBLIC_SUPABASE_URL — the project URL (e.g. https://abc123.supabase.co)\n- NEXT_PUBLIC_SUPABASE_ANON_KEY — the anon/public key\n- SUPABASE_SERVICE_ROLE_KEY — the service_role key (server-side only, never expose to the browser)',
      },
      {
        heading: 'Add the Redis URL',
        body: 'If you are running Redis locally via Docker (the default), set:\n  REDIS_URL=redis://redis-master:6379\n\nIf using an external Redis provider such as Redis Cloud or Upstash, paste the full connection URL provided by your Redis provider, including the password (e.g. redis://:password@host:6379).',
      },
      {
        heading: 'Start the stack with Docker Compose',
        body: 'Run the following command in the project root:\n  docker compose up -d\n\nThis will pull all required images and start the Nginx, App, Redis, and Sentinel containers. The first startup may take a few minutes. Once complete, visit http://localhost on port 80 to confirm the app is running. Check the Admin > Containers panel to verify all containers show as Healthy.',
      },
    ],
  },

  // ─── ADMIN: ARCHITECTURE ─────────────────────────────────────────────────

  {
    slug: 'system-architecture',
    title: 'System architecture overview — how all components connect',
    description:
      'A high-level explanation of the three-tier architecture powering YT Transcriber and how data flows through the system.',
    category: 'admin-architecture',
    role: 'admin',
    videoId: null,
    readTime: 5,
    tags: ['architecture', 'nginx', 'redis', 'docker', 'audience:admin', 'difficulty:advanced', 'type:concept'],
    lastUpdated: '2026-06-15',
    steps: [
      {
        heading: 'The three-tier architecture at a glance',
        body: 'YT Transcriber is built on a three-tier architecture:\n- Tier 1: Nginx — The reverse proxy and load balancer. All internet traffic enters here.\n- Tier 2: App — One or more Next.js application containers. Handle web requests, API calls, and business logic.\n- Tier 3: Data — Redis (cache and queue) + Supabase (PostgreSQL database). Persist all application state.',
      },
      {
        heading: 'How a transcript request flows through the system',
        body: 'When a user pastes a YouTube URL and clicks Transcribe:\n1. The browser sends a POST request to /api/transcribe\n2. Nginx receives the request and routes it to the least-busy app container\n3. The app container validates the URL and checks the user\'s credit balance in Supabase\n4. If valid, the job is pushed onto a Redis queue\n5. A background worker (also inside the app container) picks up the job and calls the YouTube captions API\n6. The completed transcript is stored in Supabase\n7. The job status in Redis is updated to "complete"\n8. The user\'s dashboard polls /api/status and sees the "Ready" badge',
      },
      {
        heading: 'What the Nginx layer does',
        body: 'Nginx acts as the single entry point for all traffic. It:\n- Terminates SSL (HTTPS)\n- Routes requests across multiple app containers using round-robin with health checks\n- Serves static assets directly from disk (faster than hitting the app)\n- Provides rate limiting to protect against abuse',
      },
      {
        heading: 'What the App layer does',
        body: 'Each app container runs Next.js in production mode. The containers are stateless — they hold no user data themselves. Any data they need comes from Redis (for fast in-memory lookups) or Supabase (for persistent storage). Because the app tier is stateless, new containers can be added or removed without any user impact.',
      },
      {
        heading: 'What the Data layer does',
        body: 'Redis stores session data, job queues, and rate-limit counters. Supabase (PostgreSQL) stores all persistent data: user accounts, transcripts, folders, share links, billing records, and audit logs. Supabase also provides Row Level Security (RLS) policies so that even if the application layer has a bug, users cannot access each other\'s data.',
      },
    ],
  },

  {
    slug: 'docker-container-map',
    title: 'Docker container map — Nginx / App / Redis / Sentinel and their roles',
    description:
      'A complete reference for every Docker container in the stack: their names, ports, responsibilities, and how they talk to each other.',
    category: 'admin-architecture',
    role: 'admin',
    videoId: null,
    readTime: 4,
    tags: ['docker', 'architecture', 'nginx', 'redis', 'scaling', 'audience:admin', 'difficulty:advanced', 'type:reference'],
    lastUpdated: '2026-06-15',
    steps: [
      {
        heading: 'Nginx containers',
        body: 'Service names: nginx-ha-1, nginx-ha-2\nPort: 80 (HTTP), 443 (HTTPS)\nRole: Reverse proxy and load balancer. Receives all external traffic and forwards it to app containers. Reads the upstream config dynamically so it can add or remove app containers without restarting.',
      },
      {
        heading: 'App containers',
        body: 'Service names: app-ha-1, app-ha-2 (Swarm replicas, scaled as needed)\nPort: 3000 (internal only, not exposed externally)\nRole: Runs the Next.js application. Each instance is identical and stateless. Nginx routes traffic across all healthy app containers. Docker Swarm can spin up additional replicas when load is high.',
      },
      {
        heading: 'Redis containers',
        body: 'Container names: redis-master, redis-replica-1 (and optionally redis-replica-2)\nPorts: 6379 (internal only)\nRole: redis-master accepts all read and write operations. redis-replica-1 replicates from master asynchronously and acts as a hot standby. If master fails, Sentinel promotes a replica to master automatically.',
      },
      {
        heading: 'Redis Sentinel containers',
        body: 'Container names: redis-sentinel-1, redis-sentinel-2, redis-sentinel-3\nPort: 26379 (internal only)\nRole: Each Sentinel process independently monitors the Redis master. If a quorum (2 of 3) agrees the master is unreachable, they trigger a failover. The app connects to Sentinel rather than directly to Redis master, so it automatically follows the new master after a failover.',
      },
      {
        heading: 'Docker network communication',
        body: 'All containers are attached to a shared Docker Swarm overlay network. Containers communicate with each other by service name (e.g. the app connects to Redis using the hostname redis-master:6379). No container ports are exposed to the internet except Nginx ports 80 and 443. This network isolation is a core security boundary.',
      },
    ],
  },

  {
    slug: 'redis-sentinel',
    title: 'How the Redis Sentinel cluster works and what happens on failover',
    description:
      'Understand the master/replica replication model, how Sentinel monitors Redis health, and what the automatic failover process looks like.',
    category: 'admin-architecture',
    role: 'admin',
    videoId: null,
    readTime: 5,
    tags: ['redis', 'architecture', 'audience:admin', 'difficulty:advanced', 'type:concept'],
    lastUpdated: '2026-06-15',
    steps: [
      {
        heading: 'Master / replica replication',
        body: 'The Redis cluster runs one master and one or more replicas. All writes go to the master. The master asynchronously replicates every write to the replicas. Replicas serve read traffic, which reduces load on the master. In normal operation the master and replicas are in sync within milliseconds.',
      },
      {
        heading: 'What Sentinel does during normal operation',
        body: 'Three Sentinel processes run continuously, each in its own container. Every second, each Sentinel pings the Redis master and replicas. As long as the master responds, Sentinels report it as healthy and do nothing.',
      },
      {
        heading: 'Sentinel quorum and subjective / objective failure',
        body: 'When a Sentinel cannot reach the master for more than the configured timeout (default 5 seconds), it marks the master as subjectively down (SDOWN). It then broadcasts this to the other Sentinels. When a quorum of Sentinels (2 out of 3) agree the master is unreachable, it is declared objectively down (ODOWN) and a failover is triggered.',
      },
      {
        heading: 'What happens during a failover',
        body: 'One Sentinel is elected leader for the failover. The leader:\n1. Picks the most up-to-date replica as the new master\n2. Sends a REPLICAOF NO ONE command to promote it\n3. Updates the other replicas to replicate from the new master\n4. Broadcasts the new master\'s address to all Sentinels\n5. Adds the old master (if it recovers) as a replica of the new master\n\nThis entire process typically takes 10–30 seconds.',
      },
      {
        heading: 'How the app reconnects after failover',
        body: 'The app does not connect directly to the Redis master\'s IP address. Instead it connects to a Sentinel node and asks "who is the current master?". After a failover, the Sentinel responds with the new master\'s address. The Redis client library handles this automatically using the Sentinel protocol — no app restart is required.',
      },
    ],
  },

  {
    slug: 'nginx-load-balancer',
    title: 'How the nginx load balancer routes traffic between app containers',
    description:
      'Understand the Nginx upstream configuration, round-robin routing, health checks, and how Nginx handles a failed app container.',
    category: 'admin-architecture',
    role: 'admin',
    videoId: null,
    readTime: 4,
    tags: ['nginx', 'architecture', 'scaling', 'audience:admin', 'difficulty:advanced', 'type:concept'],
    lastUpdated: '2026-06-15',
    steps: [
      {
        heading: 'The upstream block',
        body: 'In the Nginx config, an upstream block defines the pool of app containers that can receive traffic. Each container\'s internal address (e.g. app-ha-1:3000, app-ha-2:3000) is listed as a server directive. Nginx automatically adds or removes servers from this list when the autoscaler updates the config and sends a SIGHUP reload signal.',
      },
      {
        heading: 'Round-robin load balancing',
        body: 'By default, Nginx distributes incoming requests across app containers in round-robin order: request 1 goes to app-ha-1, request 2 to app-ha-2, request 3 back to app-ha-1, and so on. Because the app containers are stateless, any container can handle any request without needing to share session data.',
      },
      {
        heading: 'Active health checks',
        body: 'Nginx runs active health checks against each upstream server by periodically sending a GET request to /api/health on each app container. A 200 response means the container is healthy. Two consecutive failures (configurable) cause Nginx to mark the container as unavailable and stop routing traffic to it.',
      },
      {
        heading: 'What happens when an app container goes down',
        body: 'If an app container crashes or stops responding:\n1. Nginx\'s health check fails for that container\n2. After the failure threshold is reached, Nginx removes the container from the routing pool\n3. All new requests are sent only to the remaining healthy containers\n4. The failed container is still listed in the config but receives no traffic\n5. When the container recovers and passes health checks, Nginx automatically adds it back to the pool',
      },
      {
        heading: 'Zero-downtime config reloads',
        body: 'When the autoscaler adds or removes containers, it updates the Nginx config file and sends SIGHUP to the Nginx master process. Nginx reloads the config gracefully — in-flight requests on the old worker processes complete normally before those workers exit. New requests are handled by new workers with the updated config. Users experience no interruption.',
      },
    ],
  },

  {
    slug: 'ha-stack',
    title: 'Understanding the HA stack — what happens when a container goes down',
    description:
      'Walk through failure scenarios for each part of the stack and understand what users experience during each type of outage.',
    category: 'admin-architecture',
    role: 'admin',
    videoId: null,
    readTime: 5,
    tags: ['architecture', 'docker', 'redis', 'nginx', 'scaling', 'audience:admin', 'difficulty:advanced', 'type:concept'],
    lastUpdated: '2026-06-15',
    steps: [
      {
        heading: 'Scenario 1: An app container fails',
        body: 'Impact: None for users (assuming at least one other healthy app container is running).\nWhat happens: Nginx detects the failed health check within seconds and stops routing to the failed container. Traffic is redistributed to the remaining containers. The autoscaler notices a container is down and may spin up a replacement if total capacity is below threshold.\nUser experience: No error. Some in-flight requests may need to be retried by the browser, which Nginx handles transparently.',
      },
      {
        heading: 'Scenario 2: All app containers fail simultaneously',
        body: 'Impact: The site is down. Users see a 502 Bad Gateway or 503 Service Unavailable error from Nginx.\nWhat happens: Nginx has no healthy upstreams and returns an error. The autoscaler should detect this and restart containers. Docker Swarm\'s restart policy will also reschedule failed replicas automatically.\nRecovery: Usually within 30–60 seconds as containers restart and pass health checks.',
      },
      {
        heading: 'Scenario 3: The Nginx container fails',
        body: 'Impact: The site is completely unreachable from the internet — all traffic enters via Nginx.\nWhat happens: Docker Swarm\'s restart policy kicks in immediately and reschedules the nginx replica. The stack already runs two nginx replicas (nginx-ha-1 and nginx-ha-2), so the second instance continues serving traffic while the failed one is replaced.\nRecovery: Usually within 10–20 seconds. For even higher availability, place the nginx replicas behind a hardware or cloud load balancer (e.g. AWS ALB or Cloudflare).',
      },
      {
        heading: 'Scenario 4: The Redis master fails',
        body: 'Impact: Briefly degraded — users may see errors on actions that require the job queue (new transcriptions) for 10–30 seconds during failover.\nWhat happens: Redis Sentinel detects the master is down, reaches quorum, and promotes a replica to master. The app\'s Redis client library discovers the new master via Sentinel and reconnects.\nUser experience: An error may appear if the user submits a transcription during the failover window. Refreshing and retrying will work once the new master is elected.',
      },
      {
        heading: 'Scenario 5: The Supabase database is unavailable',
        body: 'Impact: Significant. Most user-facing features require the database (loading transcripts, authentication checks, billing validation).\nWhat happens: The app cannot serve most requests and will return error pages. Redis-only operations (e.g. checking if a job is in progress) may still work briefly.\nRecovery: Supabase runs on managed infrastructure with its own HA setup. If Supabase is unavailable, monitor their status page at status.supabase.com. There is no self-recovery action available on our side.',
      },
    ],
  },

  {
    slug: 'container-scaling',
    title: 'Container scaling — how drain mode works and when containers spin up/down',
    description:
      'Understand the autoscaling thresholds, what drain mode does, and how the system gracefully removes containers without dropping user requests.',
    category: 'admin-architecture',
    role: 'admin',
    videoId: null,
    readTime: 4,
    tags: ['scaling', 'docker', 'architecture', 'audience:admin', 'difficulty:advanced', 'type:concept'],
    lastUpdated: '2026-06-15',
    steps: [
      {
        heading: 'Scale-up trigger: the 70% CPU threshold',
        body: 'The autoscaler monitors CPU utilisation across all running app containers every 15 seconds. If the average CPU usage across all containers exceeds 70% for two consecutive checks (30 seconds), the autoscaler spins up a new app container. The new container is started, waits for its health check to pass, and is then added to Nginx\'s upstream pool.',
      },
      {
        heading: 'Scale-down trigger: the 40% CPU threshold',
        body: 'If average CPU usage drops below 40% across all containers for five consecutive checks (75 seconds), the autoscaler selects one container to remove. The container with the lowest current active request count is chosen first. A minimum of two containers always remains running regardless of CPU — the system never scales below two.',
      },
      {
        heading: 'What drain mode is',
        body: 'Before removing a container, the autoscaler puts it into drain mode. In drain mode:\n- Nginx stops routing new requests to the container\n- Existing in-flight requests are allowed to complete\n- The container continues running and processing its current workload\nDrain mode ensures no user request is abruptly terminated when a container is shut down.',
      },
      {
        heading: 'How drain mode knows when it is safe to shut down',
        body: 'The draining container exposes an active request counter at /api/health which includes the current in-flight request count. The autoscaler polls this endpoint every 5 seconds. When the count reaches zero (meaning all requests have completed), the autoscaler sends a SIGTERM to the container. The container performs a graceful shutdown and exits.',
      },
      {
        heading: 'Viewing scale events in the Admin panel',
        body: 'All scale-up and scale-down events are recorded and visible in Admin > Containers under the "Events" tab. Each event shows the timestamp, which container was added or removed, and the CPU usage that triggered the event. This log is useful for capacity planning and for diagnosing unexpected scaling behaviour.',
      },
    ],
  },

  {
    slug: 'rolling-deployments',
    title: 'Rolling deployments — how updates go live with zero downtime',
    description:
      'Learn how new code versions are deployed to the app containers one at a time so users never experience downtime during a release.',
    category: 'admin-architecture',
    role: 'admin',
    videoId: null,
    readTime: 4,
    tags: ['deployment', 'docker', 'architecture', 'nginx', 'audience:admin', 'difficulty:advanced', 'type:concept'],
    lastUpdated: '2026-06-15',
    steps: [
      {
        heading: 'What a rolling deployment is',
        body: 'A rolling deployment replaces containers one at a time rather than all at once. At any point during the deployment, some containers are running the old version and some are running the new version. Because the app is stateless and both versions can serve requests simultaneously, users experience no downtime.\n\nThis article explains the concept of how zero-downtime rollouts work. For the concrete step-by-step commands to ship a build to production, see "Deploying a new build to production", which is the operational runbook.',
      },
      {
        heading: 'Step 1: New container spins up',
        body: 'The deployment script builds a new Docker image with the updated code. It starts a new container from this image alongside the existing containers. The new container is not yet in Nginx\'s upstream pool — it receives no traffic yet.',
      },
      {
        heading: 'Step 2: Health check passes',
        body: 'The deployment script waits for the new container to pass its health check at /api/health. This confirms the new version has started successfully, connected to Redis and Supabase, and is ready to serve requests. If the health check does not pass within the timeout (default 60 seconds), the deployment is aborted and the new container is removed.',
      },
      {
        heading: 'Step 3: Added to Nginx, old container drained',
        body: 'Once healthy, the new container is added to Nginx\'s upstream pool. The deployment script then puts one of the old containers into drain mode. It waits for the drain to complete (active requests → zero), then shuts down the old container. This process repeats for each old container until all have been replaced.',
      },
      {
        heading: 'Zero-downtime confirmed',
        body: 'At no point during the deployment are all containers replaced simultaneously. There is always at least one healthy container serving traffic. If a newly deployed container fails health checks, the rollout stops and the remaining old containers continue serving users. The failed new container is removed automatically. To roll back, re-run the deployment pipeline with the previous image tag.',
      },
    ],
  },

  {
    slug: 'cdn-caching-cloudflare',
    title: 'Configuring Cloudflare cache rules to speed up the site',
    description:
      'Set up Cloudflare cache rules so static assets are served from the edge instead of round-tripping to the OVH server on every request.',
    category: 'admin-system',
    role: 'admin',
    videoId: null,
    readTime: 5,
    tags: ['caching', 'nginx', 'security', 'audience:admin', 'difficulty:advanced', 'type:how-to'],
    lastUpdated: '2026-06-15',
    steps: [
      {
        heading: 'Why cache at the edge',
        body: 'Without edge caching, every request for a JavaScript bundle, font, or image travels all the way to the OVH origin server, gets served, and travels back. This is slow for users far from the server and wastes origin bandwidth. Cloudflare sits in front of the origin and can serve static assets directly from its global edge network — the request never reaches OVH at all after the first hit. The goal is to cache everything that is safe to cache (immutable static assets) while never caching anything user-specific.',
      },
      {
        heading: 'Cache Rule 1: Next.js static assets',
        body: 'In the Cloudflare dashboard, go to Caching > Cache Rules and create a new rule. Set the matcher to: URI Path starts with "/_next/static/". For the action, choose "Eligible for cache", then set Edge TTL to 1 year and Browser TTL to 1 year. This is safe because Next.js fingerprints every file in /_next/static/ with a content hash — when the content changes, the filename changes, so a stale cached copy can never be served by mistake. These files are effectively immutable.',
      },
      {
        heading: 'Cache Rule 2: static file extensions',
        body: 'Create a second rule to cover other static assets that are not under /_next/static/. Match on the URI path using the regex:\n\n  \\.(js|css|woff2|woff|ttf|svg|png|jpg|jpeg|gif|ico|webp)$\n\nSet the action to "Eligible for cache" with an Edge TTL of 1 month. These assets are not content-hashed, so a shorter (but still long) TTL of one month balances cache efficiency against the ability to push updates.',
      },
      {
        heading: 'Cache Rule 3: the CRITICAL bypass rule',
        body: 'This rule MUST be set to the HIGHEST priority so it is evaluated before the two caching rules above. Create a bypass rule that matches when any of the following is true:\n- URI Path starts with "/api/"\n- URI Path starts with "/admin"\n- URI Path starts with "/dashboard"\n- URI Path starts with "/settings"\n- the request Cookie contains "__session" (the Clerk session cookie)\nSet the action to "Bypass cache". Without this rule, Cloudflare could cache a logged-in user\'s personalised page (their dashboard, their settings) and then serve that exact page to a different user. The Clerk cookie check is the catch-all: any authenticated request carries __session, so it is never cached regardless of path.',
      },
      {
        heading: 'Enable Brotli and Tiered Cache',
        body: 'Two final optimisations in the Cloudflare dashboard:\n- Brotli — go to Speed > Optimization and enable Brotli compression. Brotli compresses text assets (JS, CSS, HTML) more efficiently than gzip.\n- Tiered Cache — go to Caching > Tiered Cache and enable it. Tiered Cache uses Cloudflare\'s larger regional data centres as an upper tier, so a cache miss in a small edge location is filled from a nearby Cloudflare tier rather than going all the way back to OVH. This dramatically reduces origin load.',
      },
    ],
  },

  {
    slug: 'nginx-static-caching',
    title: 'The nginx caching and compression layer',
    description:
      'Understand the gzip compression and cache-control headers configured in nginx-ha/nginx.conf, and how to safely change them.',
    category: 'admin-system',
    role: 'admin',
    videoId: null,
    readTime: 4,
    tags: ['caching', 'nginx', 'audience:admin', 'difficulty:advanced', 'type:reference'],
    lastUpdated: '2026-06-15',
    steps: [
      {
        heading: 'Gzip compression',
        body: 'The nginx config at nginx-ha/nginx.conf enables gzip compression for text-based responses. The relevant directives are:\n- gzip on — turns compression on\n- gzip_vary on — adds a "Vary: Accept-Encoding" header so caches store compressed and uncompressed copies separately\n- gzip_comp_level 6 — a balanced compression level (CPU cost vs ratio)\n- gzip_min_length 1024 — only compress responses larger than 1 KB (compressing tiny responses wastes CPU)\n- gzip_types — the list of MIME types to compress, including text/css, application/javascript, application/json, image/svg+xml, and font/woff2',
      },
      {
        heading: 'Caching Next.js static assets',
        body: 'A "location /_next/static/" block adds the header:\n\n  Cache-Control: public, max-age=31536000, immutable\n\nThis tells browsers (and any proxy in front, including Cloudflare) that these files can be cached for a year and are immutable — the browser will not even revalidate them. This is safe because Next.js content-hashes every filename in /_next/static/.',
      },
      {
        heading: 'Caching other static file types',
        body: 'A regex location block "location ~* \\.(js|css|woff2|...)$" adds the header:\n\n  Cache-Control: public, max-age=2592000\n\nThat is 30 days. This covers static assets that live outside /_next/static/ and are not content-hashed, so a 30-day TTL is used instead of the immutable one-year policy.',
      },
      {
        heading: 'Dynamic and HTML routes are deliberately not cached',
        body: 'There is no caching applied to dynamic pages or HTML responses. This is intentional: every HTML page is rendered per-user behind Clerk authentication. Caching an HTML route could leak one user\'s authenticated page to another. Only static assets (JS, CSS, fonts, images) are cached — never the per-request HTML.',
      },
      {
        heading: 'Validating and reloading after a config change',
        body: 'After editing nginx.conf, always validate the syntax before reloading:\n\n  nginx -t\n\nIf it reports "syntax is ok" and "test is successful", reload nginx to apply the change (nginx -s reload, or restart the nginx container). Remember that nginx matches regex location blocks (the ~* ones) before the prefix "location /" block, so the static-asset rules take precedence over the catch-all even though the catch-all appears to match everything.',
      },
    ],
  },

  {
    slug: 'secrets-management-strategy',
    title: 'How secrets and API keys are organised across three tiers',
    description:
      'A reference for where each kind of secret lives — public keys, bootstrap secrets, and third-party integration keys — and why.',
    category: 'admin-architecture',
    role: 'admin',
    videoId: null,
    readTime: 5,
    tags: ['secrets', 'security', 'architecture', 'audience:admin', 'difficulty:advanced', 'type:concept'],
    lastUpdated: '2026-06-15',
    steps: [
      {
        heading: 'Tier 1: Public keys',
        body: 'These are the NEXT_PUBLIC_* variables: the Clerk publishable key, the Supabase anon key, and the Google Analytics measurement ID. They are shipped to the browser by design — any user can open dev tools and read them, and that is fine because they are meant to be public and are protected by other mechanisms (Clerk\'s domain restrictions, Supabase Row Level Security). Because Next.js inlines NEXT_PUBLIC_* values at build time, they are passed as Docker build args when the image is built. There is no point trying to hide them.',
      },
      {
        heading: 'Tier 2: Bootstrap secrets',
        body: 'These are the secrets the app needs simply to start: SUPABASE_SERVICE_ROLE_KEY, the encryption key, CLERK_SECRET_KEY, and CLERK_WEBHOOK_SECRET. They must live in Docker / Swarm secrets — never baked into the image and never stored in the database. The reason is a chicken-and-egg problem: the Supabase service-role key and the encryption key are exactly the things you need in order to read and decrypt the encrypted secrets table. If you stored them in that table, you would need them to read them — an impossible loop. So these foundational secrets are injected at the infrastructure layer via Swarm secrets, mounted into the container at runtime.',
      },
      {
        heading: 'Tier 3: Third-party integration keys',
        body: 'These are keys for services that are wired up or rotated while the app is already running: Stripe, Resend (email), and OpenAI. Because they are not needed to boot the app and may change during normal operation, they suit an encrypted table in Supabase, managed through an admin page. The admin UI is write-only and masked — you can paste a new key but never read an existing one back. The keys are decrypted only server-side, using the Tier 2 encryption key, at the moment they are needed for an API call.',
      },
      {
        heading: 'The rule of thumb',
        body: 'When deciding where a new secret belongs, ask one question: is this secret needed to START the app, or only fetched WHILE the app is running?\n- Needed to start running → Swarm secret (Tier 2). Anything required to read/decrypt the encrypted table itself must be here.\n- Fetched while already running → encrypted Supabase table (Tier 3), managed via the admin page.\nPublic, browser-shipped values are Tier 1 and need no protection at all.',
      },
    ],
  },

  {
    slug: 'deploying-an-update',
    title: 'Deploying a new build to production',
    description:
      'How a merged change becomes a live deployment — from the CI image build to rolling the running Swarm service onto the new image.',
    category: 'admin-system',
    role: 'admin',
    videoId: null,
    readTime: 3,
    tags: ['deployment', 'docker', 'audience:admin', 'difficulty:advanced', 'type:how-to'],
    lastUpdated: '2026-06-15',
    steps: [
      {
        heading: 'CI builds and pushes the image',
        body: 'When a change is merged, the CI pipeline automatically builds a fresh Docker image and pushes it to the GitHub Container Registry as:\n\n  ghcr.io/lewis159/youtube-transcriber:latest\n\nNo manual build step is required — by the time the merge completes, the new "latest" image is available in the registry.',
      },
      {
        heading: 'Roll the running service onto the new image',
        body: 'To make the running service pick up the new image, run the following on the Swarm manager (or trigger it via Portainer):\n\n  docker service update --image ghcr.io/lewis159/youtube-transcriber:latest --force yt-transcriber_app\n\nThe --force flag ensures Swarm re-pulls and re-deploys even though the image tag ("latest") has not changed. Swarm then performs a rolling update of the service tasks.',
      },
      {
        heading: 'Why there is no downtime',
        body: 'The app runs as two replicas (app-ha-1 and app-ha-2) behind the nginx load balancer. During the rolling update, Swarm replaces one replica at a time: the first replica is updated and must come back healthy before the second is touched. At every moment at least one replica is serving traffic via nginx, so users experience no downtime.',
      },
      {
        heading: 'Verify the deployment',
        body: 'After the rollout completes, hard-refresh your browser (Ctrl+Shift+R / Cmd+Shift+R) to bypass any cached assets and pull the new bundle. Then confirm the deploy succeeded by checking the changelog or version indicator in the app — it should show the version you just shipped. If anything looks wrong, roll back by updating the service to the previous image tag.',
      },
    ],
  },

  // ─── USER: BILLING ────────────────────────────────────────────────────────

  {
    slug: 'billing-plans-and-subscriptions',
    title: 'Billing, plans & subscriptions — upgrade, downgrade and manage your plan',
    description:
      'Everything you need to know about YT Transcriber plans: how the four tiers work, how to upgrade through secure checkout, how to cancel or downgrade, where to find invoices, and what happens to your account when a subscription ends.',
    category: 'account',
    role: 'user',
    videoId: null,
    readTime: 7,
    tags: ['billing', 'account', 'audience:user', 'difficulty:intermediate', 'type:reference'],
    lastUpdated: '2026-06-15',
    steps: [
      {
        heading: 'Understand the four plans',
        body: 'YT Transcriber offers four tiers, each unlocking more capacity and features:\n- Starter — free forever. The default tier for every new account. Ideal for trying the product and light personal use.\n- Pro — paid monthly subscription. Higher usage limits and additional features for regular users.\n- Studio — paid monthly subscription. The highest self-serve tier, for power users and small teams who transcribe at volume.\n- Enterprise — custom pricing, arranged by talking to our team. Designed for organisations needing higher limits, security reviews, or invoicing.\nYour current tier is always shown on your Plan & Usage settings page. Starter, Pro and Studio are self-serve — you can move between them yourself. Enterprise is contact-sales only (see the final step).',
      },
      {
        heading: 'How upgrading works (Stripe Checkout)',
        body: 'When you choose to upgrade to Pro or Studio, YT Transcriber creates a secure Stripe Checkout session and redirects your browser to Stripe\'s hosted payment page. You enter your card details directly on Stripe — YT Transcriber never sees or stores your card number. The button shows "Redirecting..." while the session is created. Once payment succeeds, Stripe sends you back to your dashboard with the upgrade applied, and you will see your new tier reflected on the Plan & Usage page.',
      },
      {
        heading: 'Upgrade step by step',
        body: 'To upgrade:\n- Open the Pricing page (or the Upgrade button on your dashboard / Plan & Usage page).\n- Click "Upgrade to Pro" or "Upgrade to Studio".\n- You will be taken to Stripe\'s secure checkout. Enter your email, card details and billing address.\n- Confirm the subscription. Stripe charges your card and sets up a recurring monthly subscription.\n- You are redirected back to your dashboard. Your account tier updates automatically within a few seconds once Stripe confirms the payment.\nNote: billing is currently being rolled out. If you see "Payments coming soon." after clicking upgrade, the live payment system has not been switched on yet for your account — your plan is unchanged and you were not charged.',
      },
      {
        heading: 'What happens behind the scenes',
        body: 'After a successful checkout, Stripe notifies YT Transcriber that the payment completed. We then update your account record to the new tier and link it to your Stripe customer profile so future billing and changes are tracked automatically. This means your higher limits and features unlock without any manual step on your part. If your tier has not changed a minute or two after paying, refresh the page; if it still has not updated, contact support and we will reconcile it.',
      },
      {
        heading: 'Changing plans (upgrade or downgrade mid-cycle)',
        body: 'You can switch between Pro and Studio at any time from the Pricing or Plan & Usage page. When you change plans, Stripe automatically prorates the difference: if you upgrade mid-month you are charged only for the remaining days at the higher rate, and if you downgrade you receive a prorated credit applied to your next invoice. Your new limits take effect as soon as the change is confirmed. You do not lose your transcripts when changing plans.',
      },
      {
        heading: 'Cancelling or downgrading to Starter',
        body: 'To stop a paid subscription, cancel it from your billing settings. When you cancel, your paid features remain active until the end of the period you have already paid for — you are not cut off immediately. At the end of that billing period the subscription ends and your account automatically returns to the free Starter tier. You will not be charged again. You can re-subscribe at any time.',
      },
      {
        heading: 'Managing your payment method',
        body: 'Your card details are held securely by Stripe, not by YT Transcriber. To update an expiring or replacement card, use the billing management option in your account settings, which opens Stripe\'s secure portal. From there you can change your card, update your billing address, and view your subscription. Keeping a valid card on file ensures your subscription renews without interruption.',
      },
      {
        heading: 'Finding invoices and receipts',
        body: 'Every successful payment and renewal generates an invoice/receipt from Stripe. Stripe automatically emails a receipt to the email address on your account after each charge. You can also download past invoices (useful for expense claims and accounting) from the Stripe billing portal linked in your account settings. Each invoice shows the plan, the amount, any proration, and applicable tax.',
      },
      {
        heading: 'What happens at the free-tier limit',
        body: 'Starter accounts have a monthly usage allowance. When you reach it, new transcription jobs are paused until your allowance resets at the start of your next cycle, or until you upgrade. Your existing transcripts always remain available to view, search and export regardless of your remaining allowance — hitting the limit never deletes anything. Upgrading to Pro or Studio immediately raises your limit so you can keep transcribing straight away.',
      },
      {
        heading: 'What happens to your data when a subscription ends',
        body: 'Cancelling or letting a subscription lapse moves you back to the Starter tier — it does not delete your account or your transcripts. Your transcripts stay in your library and remain viewable, searchable and exportable. The only change is that your usage limits and feature access return to Starter levels. If your library exceeds what Starter normally allows, existing items remain readable; you simply cannot add new ones beyond the free allowance until you upgrade again.',
      },
      {
        heading: 'Enterprise is contact sales',
        body: 'The Enterprise tier is not purchased through self-serve checkout — it has no online price or "buy" button. Instead, contact our team via the "Contact Sales" option on the Pricing page to discuss custom limits, security and compliance needs, team management, and invoicing. We will tailor a plan and set your account up directly. If you click an Enterprise upgrade action, the system will simply direct you to contact sales rather than charging you.',
      },
    ],
  },

  {
    slug: 'billing-faq-and-troubleshooting',
    title: 'Billing FAQ & troubleshooting — payments, charges and refunds',
    description:
      'Answers to the most common billing questions: declined cards, unexpected charges, refunds, mid-cycle changes, failed renewals, payment security, and tax and currency.',
    category: 'account',
    role: 'user',
    videoId: null,
    readTime: 6,
    tags: ['billing', 'account', 'audience:user', 'difficulty:intermediate', 'type:troubleshooting'],
    lastUpdated: '2026-06-15',
    steps: [
      {
        heading: 'My payment was declined — what do I do?',
        body: 'A decline almost always comes from the card issuer, not from YT Transcriber. Common causes are insufficient funds, an expired card, an incorrect billing address or postcode, or your bank blocking an unfamiliar online charge. Try again, double-checking the card number, expiry, CVC and billing address. If it still fails, use a different card or contact your bank — they may need to approve the payment. Because checkout is hosted by Stripe, no failed-card details are ever stored by us.',
      },
      {
        heading: 'Why was I charged?',
        body: 'Paid plans are recurring monthly subscriptions, so you are charged once when you first subscribe and then automatically on the same date each month until you cancel. A charge usually corresponds to either your initial upgrade or an automatic renewal. Stripe emails a receipt for every charge — check that email for the exact plan and amount. If you change plans mid-cycle you may also see a smaller prorated charge for the difference. If a charge looks wrong, contact support with the date and amount and we will investigate.',
      },
      {
        heading: 'What is your refund policy?',
        body: 'If you believe you were charged in error — for example a renewal you intended to cancel, or a duplicate charge — contact support and we will review it. Approved refunds are issued back to your original payment method through Stripe and typically appear on your statement within 5–10 business days. We cannot refund to a different card than the one charged, as the refund is processed by Stripe against the original payment.',
      },
      {
        heading: 'Changing tiers mid-cycle',
        body: 'You can move between Pro and Studio at any point. Stripe prorates the change automatically: upgrading mid-cycle charges only the prorated difference for the rest of the period, and downgrading credits the unused portion against your next invoice. You keep all your transcripts when you change tiers — only your limits and features adjust.',
      },
      {
        heading: 'A renewal failed — am I downgraded immediately?',
        body: 'If an automatic renewal fails (for example your card expired), Stripe will retry the payment over a short period and email you to update your card. Your access is not cut off the instant a single attempt fails. To avoid any interruption, update your card promptly via the billing portal in your account settings. If all retries fail, the subscription ends and your account returns to the free Starter tier — your transcripts remain intact.',
      },
      {
        heading: 'How do I update my card?',
        body: 'Open your account billing settings and choose the option to manage billing, which opens Stripe\'s secure portal. There you can replace the card on file, fix an expiry date, or update your billing address. Updating your card before the next renewal date prevents failed-payment emails and keeps your subscription active.',
      },
      {
        heading: 'Is payment secure? Do you see my card details?',
        body: 'Yes, it is secure, and no, we never see your full card details. All payments go through Stripe\'s PCI-compliant hosted checkout. You enter your card directly on Stripe\'s page, not on a YT Transcriber form. We only receive confirmation from Stripe that a payment succeeded plus a reference to your Stripe customer record — never your card number, CVC or full PAN. This is why all card changes happen in Stripe\'s portal rather than in our app.',
      },
      {
        heading: 'VAT, tax and currency',
        body: 'Prices shown at checkout are the subscription price. Any applicable VAT or sales tax is calculated and displayed by Stripe during checkout based on your billing location, and itemised on the invoice/receipt Stripe emails you. The charge appears in the currency configured for the plan. If you need a tax invoice for your business or a VAT number added, you can enter your business details in Stripe\'s checkout/portal, or contact support for help.',
      },
      {
        heading: 'I paid but my plan did not change',
        body: 'After a successful payment your tier normally updates within a few seconds. If it has not, first refresh your dashboard or Plan & Usage page. If it still shows the old tier after a couple of minutes, contact support with your account email and the date/time of payment — we can confirm the payment with Stripe and reconcile your tier manually. You will not be double-charged for this.',
      },
      {
        heading: 'I saw "Payments coming soon."',
        body: 'Billing is being introduced gradually. If you click upgrade and see "Payments coming soon.", live payments have not yet been switched on for your account. You were not charged and your plan is unchanged. Check back later, or contact us if you need a paid plan enabled sooner.',
      },
    ],
  },

  // ─── ADMIN: STRIPE & BILLING OPERATIONS ──────────────────────────────────

  {
    slug: 'admin-stripe-integration',
    title: 'Stripe integration & billing operations — how the payment system works',
    description:
      'Operator reference for the Stripe integration: the end-to-end checkout → webhook → tier-update flow, every required environment variable, switching between TEST and LIVE mode, configuring the webhook and products, and how the admin Billing page fits in.',
    category: 'admin-system',
    role: 'admin',
    videoId: null,
    readTime: 8,
    tags: ['billing', 'secrets', 'deployment', 'audience:admin', 'difficulty:advanced', 'type:reference'],
    lastUpdated: '2026-06-15',
    steps: [
      {
        heading: 'The end-to-end flow',
        body: 'Billing follows a single, well-defined path:\n- A signed-in user clicks Upgrade (UpgradeButton), which POSTs the chosen tier to /api/stripe/checkout.\n- The checkout route authenticates the user via Clerk, looks up their email and stripe_customer_id in Supabase, and creates a Stripe Checkout Session (mode: subscription) with the tier\'s Price ID. The user\'s Clerk ID and tier are stored in the session metadata.\n- The user is redirected to Stripe\'s hosted checkout and pays. On success Stripe returns them to /dashboard?upgraded=1.\n- Stripe sends a webhook to /api/stripe/webhook, which verifies the signature and updates the user\'s tier (and stripe_customer_id) in Supabase.\nThe tier in Supabase is the source of truth the rest of the app reads — Stripe events drive it.',
      },
      {
        heading: 'Required environment variables',
        body: 'The integration is fully env-driven; no keys or price IDs are hardcoded. Set these (names only — never commit the values):\n- STRIPE_SECRET_KEY — server-side secret key (sk_test_… in test, sk_live_… in live). Its presence is what isStripeConfigured() checks; without it every billing endpoint returns 503.\n- STRIPE_WEBHOOK_SECRET — the webhook signing secret (whsec_…) used to verify incoming webhook signatures. The webhook route also returns 503 if this is missing.\n- STRIPE_PRICE_PRO — the Stripe Price ID for the Pro tier.\n- STRIPE_PRICE_STUDIO — the Stripe Price ID for the Studio tier.\n- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY — the publishable key (pk_test_… / pk_live_…), safe to expose to the browser.\nAlso ensure NEXT_PUBLIC_APP_URL is set, as the checkout route builds the success and cancel URLs from it. Enterprise has no Price ID by design — it is contact-sales and has no checkout.',
      },
      {
        heading: 'Graceful degradation when unconfigured',
        body: 'Nothing Stripe-related runs at import time, so the app always builds and boots even with no keys set. isStripeConfigured() returns true only when STRIPE_SECRET_KEY is present. When it is absent, /api/stripe/checkout returns 503 and the UpgradeButton shows "Payments coming soon." The webhook route additionally requires STRIPE_WEBHOOK_SECRET and returns 503 without it. This is intentional so you can ship the code before enabling billing.',
      },
      {
        heading: 'TEST vs LIVE mode and how to switch',
        body: 'Stripe has fully separate Test and Live environments, each with its own keys, products, prices and webhook endpoints. Billing is being introduced in TEST mode first. To operate in test mode, use the sk_test_…, pk_test_… keys and the test-mode Price IDs and webhook secret. To go live, swap every value to its live equivalent: STRIPE_SECRET_KEY → sk_live_…, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY → pk_live_…, STRIPE_PRICE_PRO / STRIPE_PRICE_STUDIO → the live-mode Price IDs, and STRIPE_WEBHOOK_SECRET → the signing secret of the live-mode webhook endpoint. Test and live objects are never interchangeable — a test Price ID will not work with a live key. Switch all of them together and redeploy.',
      },
      {
        heading: 'Set up the webhook endpoint and signing secret',
        body: 'In the Stripe dashboard (in the correct mode — Test or Live), go to Developers > Webhooks and add an endpoint pointing at https://YOUR_DOMAIN/api/stripe/webhook. Subscribe it to at least these events: checkout.session.completed, customer.subscription.updated, and customer.subscription.deleted. After creating the endpoint, copy its Signing secret (whsec_…) into STRIPE_WEBHOOK_SECRET. The webhook route reads the raw request body and calls stripe.webhooks.constructEvent to verify the signature — a wrong or missing secret yields a 400 "Invalid signature" and the tier will never update.',
      },
      {
        heading: 'Create Products and Prices and wire the IDs',
        body: 'In Stripe, create a Product for Pro and a Product for Studio, each with a recurring monthly Price. Copy each Price ID (price_…) into STRIPE_PRICE_PRO and STRIPE_PRICE_STUDIO respectively. The app maps tier → Price ID purely from these env vars (getStripePrices / getPriceForTier), and the webhook reverse-maps an incoming Price ID back to a tier (tierFromPriceId) to know which tier a subscription update corresponds to. Do not create a Price for Enterprise — it is contact-sales and intentionally has no Price ID, so attempting Enterprise checkout returns a 400.',
      },
      {
        heading: 'What each handled webhook event does',
        body: 'The webhook switches on event.type:\n- checkout.session.completed — reads clerk_user_id and tier from the session metadata and sets the user\'s tier plus stripe_customer_id in Supabase. This is what applies the upgrade right after the first payment.\n- customer.subscription.updated — reads clerk_user_id from the subscription metadata, derives the tier from the subscription\'s current Price ID, and updates the user\'s tier and stripe_customer_id. This handles plan changes (e.g. Pro → Studio).\n- customer.subscription.deleted — reads clerk_user_id and resets the user\'s tier to "starter". This handles cancellations and lapsed subscriptions, returning the user to the free tier.\nAny other event type is acknowledged with { received: true } but ignored.',
      },
      {
        heading: 'How tier updates are written to Supabase',
        body: 'All tier writes go through a single helper that updates the users table where clerk_user_id matches, setting tier (and, for the two active events, stripe_customer_id). The Supabase admin client is used so the write happens with service privileges from the server. Because tier lives in Supabase, the rest of the app — limits, feature gating, the user\'s Plan & Usage page — reads a single source of truth that Stripe keeps in sync via webhooks.',
      },
      {
        heading: 'How the admin Billing page relates (currently mock)',
        body: 'The Admin > Billing page in the panel currently shows mock transaction, subscription and refund data — it is a UI placeholder and is not yet wired to live Stripe data. Until it is connected, treat the Stripe dashboard as the authoritative record for payments, invoices, subscriptions and refunds, and use Supabase as the source of truth for a user\'s current tier. When the admin Billing page is later wired to Stripe, it will surface this same data in-app.',
      },
      {
        heading: 'Quick verification checklist',
        body: 'After configuring or switching modes, verify end to end:\n- Confirm all five env vars (plus NEXT_PUBLIC_APP_URL) are set for the running environment and the app was redeployed.\n- Run a test checkout (Stripe test card 4242 4242 4242 4242 in test mode) and confirm you are redirected to /dashboard?upgraded=1.\n- In Stripe > Webhooks, confirm checkout.session.completed was delivered with a 200 response.\n- Confirm the user\'s tier and stripe_customer_id updated in the Supabase users table.\n- Test a cancellation and confirm the tier resets to starter via customer.subscription.deleted.',
      },
    ],
  },

  // ─── ADMIN: PAYMENT ISSUES & REFUNDS ─────────────────────────────────────

  {
    slug: 'admin-payment-issues-and-refunds',
    title: 'Handling payment issues & refunds — support runbook',
    description:
      'Support runbook for billing problems: diagnosing failed payments, issuing refunds, handling disputes, manually fixing a tier in Supabase, reconciling a tier that did not update, and what to tell a user whose payment failed.',
    category: 'admin-users',
    role: 'admin',
    videoId: null,
    readTime: 7,
    tags: ['billing', 'account', 'audience:admin', 'difficulty:advanced', 'type:troubleshooting'],
    lastUpdated: '2026-06-15',
    steps: [
      {
        heading: 'Where to look first',
        body: 'Two systems hold the truth. Stripe (in the correct Test/Live mode) is authoritative for payments, charges, subscriptions, invoices, disputes and refunds. The Supabase users table is authoritative for a user\'s current tier and their stripe_customer_id. Most billing tickets are resolved by cross-checking these two: find the customer in Stripe by email, and find the user row in Supabase by clerk_user_id or email. The Admin > Billing page is currently mock data, so do not rely on it for live figures yet.',
      },
      {
        heading: 'Diagnosing a failed payment',
        body: 'In the Stripe dashboard, open the customer and review their Payments and the failure reason Stripe records (e.g. card_declined, insufficient_funds, expired_card, incorrect_cvc). For a failed renewal, check the subscription\'s status and upcoming/past-due invoices and whether Stripe\'s automatic retries are still in progress. The decline reason tells you what to advise the user — most are card-issuer issues the user resolves by updating their card or contacting their bank.',
      },
      {
        heading: 'Issuing a refund',
        body: 'Refunds are issued from the Stripe dashboard (the admin Billing page is not yet wired to live Stripe). In Stripe, open the relevant Payment/charge and click Refund. Choose a full or partial amount and confirm. The refund returns to the customer\'s original payment method and typically settles in 5–10 business days. Note that refunding a charge does not by itself change the user\'s tier or cancel their subscription — if they should also lose access, cancel the subscription in Stripe (which fires customer.subscription.deleted and resets them to starter) or adjust the tier in Supabase.',
      },
      {
        heading: 'Handling a disputed charge (chargeback)',
        body: 'If a customer disputes a charge with their bank, Stripe notifies you and provisionally reverses the funds. Respond inside the Stripe dashboard before the deadline, submitting evidence (subscription history, usage, receipts). Do not also issue a manual refund for a charge that is already under dispute — that can result in paying twice. While the dispute is open, decide whether to suspend access; if appropriate, cancel the subscription in Stripe or downgrade the tier in Supabase.',
      },
      {
        heading: 'Manually adjusting a user\'s tier in Supabase',
        body: 'When you need to set a tier directly — for goodwill, a comp account, or to fix a sync gap — update the users table in Supabase: set tier to one of starter, pro, studio (or enterprise for contact-sales accounts) on the row matching the user\'s clerk_user_id. This is exactly what the webhook helper does. Use this sparingly: a manual tier change does not create or cancel a Stripe subscription, so a user manually set to pro will not be billed, and a manual change can be overwritten the next time a Stripe webhook fires for that user. For paying customers, prefer changing the subscription in Stripe and letting the webhook update Supabase.',
      },
      {
        heading: 'Reconciling a tier that did not update',
        body: 'If a user paid but their tier did not change, the payment succeeded in Stripe but the webhook did not apply it. Check, in order:\n- Stripe > Webhooks: was checkout.session.completed delivered, and did it return 200? A non-2xx or no delivery points at a bad endpoint URL or signing secret.\n- That STRIPE_WEBHOOK_SECRET matches the endpoint\'s signing secret (a mismatch yields 400 "Invalid signature").\n- That the session/subscription metadata actually carried clerk_user_id and tier.\n- That a Supabase users row exists with that clerk_user_id.\nOnce you understand why it missed, fix the root cause, then manually set the correct tier (and stripe_customer_id) in Supabase so the user is unblocked immediately. You can also resend the event from the Stripe webhook log.',
      },
      {
        heading: 'What to tell a user whose payment failed',
        body: 'Reassure them first: a failed payment does not delete their account or transcripts, and access is not cut off the moment one attempt fails — Stripe retries and emails them. Ask them to update their card via the billing portal in their account settings (cards are managed in Stripe, never entered into our app). If the decline reason was issuer-side (insufficient funds, bank block), suggest they contact their bank or try another card. Confirm that if all retries fail the subscription ends and they return to the free Starter tier with their data intact, and they can re-subscribe any time. Never ask a user to send card details over email or chat — all card handling stays in Stripe\'s hosted portal.',
      },
    ],
  },
]
