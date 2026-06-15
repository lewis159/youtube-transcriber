export type KBRole = 'user' | 'admin'
export type KBCategory =
  | 'getting-started'
  | 'features'
  | 'account'
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
        body: 'Most videos complete in 30–90 seconds depending on length. The card badge will change from "Processing" to "Ready" when the transcript is available. You do not need to keep the page open — you will see the updated status the next time you visit.',
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
    steps: [
      {
        heading: 'Open the video detail page',
        body: 'Navigate to your Dashboard and click on the video you want to export. The video detail page will open, showing the full transcript.',
      },
      {
        heading: 'Click the Export button',
        body: 'In the toolbar at the top of the transcript panel, click the "Export" button (it looks like a download arrow icon). A dropdown menu will appear with three format options.',
      },
      {
        heading: 'Choose your format',
        body: 'Select one of the three available formats:\n- TXT — Plain text file. Best for copying the transcript into a word processor, notes app, or AI prompt. No formatting, just the words.\n- PDF — Formatted document with the video title, thumbnail, and timestamps. Best for sharing with colleagues or archiving.\n- SRT — SubRip Subtitle file. Best for video editors who want to burn captions into a video or upload subtitles to YouTube/Vimeo.',
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
        body: 'Pro is designed for content creators and students. It includes:\n- 10 transcripts per month\n- TXT and PDF export\n- Folder organisation\n- Unlimited transcript retention\n- Share links\n- URL screenshots',
      },
      {
        heading: 'Understand the Studio plan',
        body: 'Studio is for power users and small teams. It includes:\n- 300 transcripts per month\n- TXT, PDF, and SRT export\n- Folder organisation and sharing\n- Notes on transcripts\n- Share links with all expiry options including Never\n- Priority processing queue',
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
    category: 'getting-started',
    role: 'user',
    videoId: null,
    readTime: 3,
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
        body: 'An override only affects the specific user or organisation you selected. It does not change the tier default for anyone else. For example, you can give a single Creator-tier user access to SRT exports without upgrading their account. Overrides are recorded in the audit log.',
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
    steps: [
      {
        heading: 'Nginx containers',
        body: 'Container name: yt-nginx\nPort: 80 (HTTP), 443 (HTTPS)\nRole: Reverse proxy and load balancer. Receives all external traffic and forwards it to app containers. Reads the upstream config dynamically so it can add or remove app containers without restarting.',
      },
      {
        heading: 'App containers',
        body: 'Container names: yt-app-1, yt-app-2, … (autoscaled)\nPort: 3000 (internal only, not exposed externally)\nRole: Runs the Next.js application. Each instance is identical and stateless. Nginx routes traffic across all healthy app containers. The autoscaler can spin up additional instances (yt-app-3, etc.) when load is high.',
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
        body: 'All containers are attached to a shared Docker bridge network named yt-network. Containers communicate with each other by container name (e.g. the app connects to Redis using the hostname redis-master:6379). No container ports are exposed to the internet except Nginx ports 80 and 443. This network isolation is a core security boundary.',
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
    steps: [
      {
        heading: 'The upstream block',
        body: 'In the Nginx config, an upstream block defines the pool of app containers that can receive traffic. Each container\'s internal address (e.g. yt-app-1:3000, yt-app-2:3000) is listed as a server directive. Nginx automatically adds or removes servers from this list when the autoscaler updates the config and sends a SIGHUP reload signal.',
      },
      {
        heading: 'Round-robin load balancing',
        body: 'By default, Nginx distributes incoming requests across app containers in round-robin order: request 1 goes to yt-app-1, request 2 to yt-app-2, request 3 back to yt-app-1, and so on. Because the app containers are stateless, any container can handle any request without needing to share session data.',
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
    steps: [
      {
        heading: 'Scenario 1: An app container fails',
        body: 'Impact: None for users (assuming at least one other healthy app container is running).\nWhat happens: Nginx detects the failed health check within seconds and stops routing to the failed container. Traffic is redistributed to the remaining containers. The autoscaler notices a container is down and may spin up a replacement if total capacity is below threshold.\nUser experience: No error. Some in-flight requests may need to be retried by the browser, which Nginx handles transparently.',
      },
      {
        heading: 'Scenario 2: All app containers fail simultaneously',
        body: 'Impact: The site is down. Users see a 502 Bad Gateway or 503 Service Unavailable error from Nginx.\nWhat happens: Nginx has no healthy upstreams and returns an error. The autoscaler should detect this and restart containers. Docker\'s restart policy (restart: always) will also attempt to restart crashed containers automatically.\nRecovery: Usually within 30–60 seconds as containers restart and pass health checks.',
      },
      {
        heading: 'Scenario 3: The Nginx container fails',
        body: 'Impact: The site is completely unreachable from the internet — all traffic enters via Nginx.\nWhat happens: Docker\'s restart policy kicks in immediately and attempts to restart the container. Because Nginx is a single point of entry, this is the highest-impact failure.\nRecovery: Usually within 10–20 seconds. For higher availability, consider running two Nginx instances behind a hardware or cloud load balancer (e.g. AWS ALB or Cloudflare).',
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
    steps: [
      {
        heading: 'What a rolling deployment is',
        body: 'A rolling deployment replaces containers one at a time rather than all at once. At any point during the deployment, some containers are running the old version and some are running the new version. Because the app is stateless and both versions can serve requests simultaneously, users experience no downtime.',
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
]
