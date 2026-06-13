-- Create knowledge base articles table
CREATE TABLE IF NOT EXISTS knowledge_base_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  content text NOT NULL,
  category text NOT NULL, -- 'setup', 'user-management', 'api', 'organizations', 'system'
  is_public boolean DEFAULT true,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS for knowledge base articles
ALTER TABLE knowledge_base_articles ENABLE ROW LEVEL SECURITY;

-- Insert seed articles
INSERT INTO knowledge_base_articles (slug, title, description, content, category, is_public, order_index) VALUES
  (
    'setup-account',
    'How to Set Up Your YT Transcriber Account',
    'Get started with YT Transcriber in minutes. Learn the basics of account setup and your first transcription.',
    '# How to Set Up Your YT Transcriber Account

## Getting Started

Welcome to YT Transcriber! This guide walks you through setting up your account and getting your first transcription.

### Step 1: Sign Up

1. Visit YouTube Transcriber and click "Sign Up"
2. Enter your email address and create a secure password
3. Verify your email by clicking the link we send you
4. You''re all set! Your account is now active with 3 free transcriptions

### Step 2: First Transcription

1. From your dashboard, click "New Transcription"
2. Paste a YouTube video URL
3. The transcription will start automatically
4. Once complete, you can view, download, or share it

### Step 3: Explore Features

- **Notes**: Add notes to specific parts of your transcription
- **Export**: Download transcripts as TXT, PDF, or SRT
- **Share**: Create shareable links for your videos

### Credits

Your account starts with 3 free transcriptions. After that, you can upgrade to a paid plan or purchase additional credits.

For help, visit our Knowledge Base or contact support.',
    'setup',
    true,
    1
  ),
  (
    'understand-tiers-and-credits',
    'Understanding Tiers and Credits',
    'Learn about our different subscription tiers and how credits work in YT Transcriber.',
    '# Understanding Tiers and Credits

## Subscription Tiers

We offer four tier levels designed for different use cases:

### Explorer (Free)
- **Cost**: Free
- **Transcriptions per month**: 3 (lifetime total)
- **Features**: Basic transcription, notes, TXT export
- **Best for**: Personal use and testing

### Creator (£7/month)
- **Cost**: £7 per month
- **Transcriptions per month**: 10
- **Features**: All Explorer features + PDF export, folders, credit top-ups
- **Best for**: Content creators and regular users

### Studio (£19/month)
- **Cost**: £19 per month
- **Transcriptions per month**: 40
- **Features**: All Creator features + share links, screenshots, AI chapters
- **Best for**: Production teams and agencies

### Enterprise (£45/month)
- **Cost**: £45 per month
- **Transcriptions per month**: Unlimited
- **Features**: All features + API access, team seats
- **Best for**: Large organizations and integrations

## How Credits Work

- **Subscription Credits**: Refreshed monthly based on your tier
- **Purchased Credits**: One-time purchases that don''t expire until used
- **Credit Usage**: Each transcription costs 1 credit
- **Overflow**: If you have purchased credits, they are used before subscription credits

## Upgrading Your Account

1. Click on your profile in the top right
2. Select "Billing" or "Upgrade"
3. Choose your new tier
4. Your new features become available immediately
5. Your subscription renews on the same day each month

## Questions?

Contact our support team at support@example.com for help choosing the right tier for your needs.',
    'user-management',
    true,
    2
  ),
  (
    'api-authentication-and-endpoints',
    'API Authentication and Endpoints',
    'Complete API documentation for developers. Learn authentication, endpoints, and rate limits.',
    '# API Authentication and Endpoints

## Important: Admin Only

This documentation is for Enterprise users and administrators. If you don''t have API access, please upgrade your tier.

## Authentication

All API requests require Bearer token authentication using your API key.

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" https://api.example.com/v1/transcriptions
```

## Getting Your API Key

1. Go to your dashboard
2. Navigate to Settings > API Keys
3. Click "Generate New Key"
4. Copy and store securely (shown only once!)
5. Use it with all API requests

## API Endpoints

### List Transcriptions
```
GET /api/v1/transcriptions
```

### Create Transcription
```
POST /api/v1/transcriptions
Content-Type: application/json

{
  "url": "https://www.youtube.com/watch?v=...",
  "notify_url": "https://your-domain.com/webhook"
}
```

### Get Transcription Details
```
GET /api/v1/transcriptions/:id
```

### Download Transcript
```
GET /api/v1/transcriptions/:id/transcript?format=txt|pdf|srt
```

## Rate Limits

- **Standard**: 100 requests per minute
- **Enterprise**: 1000 requests per minute
- **Burst**: Up to 10 requests per second

Rate limit info is included in response headers:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

## Error Codes

- `400`: Bad request (invalid parameters)
- `401`: Unauthorized (invalid API key)
- `403`: Forbidden (insufficient permissions)
- `404`: Not found
- `429`: Rate limit exceeded
- `500`: Server error

## Webhooks

Get real-time updates when transcriptions complete. Set `notify_url` when creating a transcription.',
    'api',
    false,
    1
  ),
  (
    'managing-organizations',
    'Creating and Managing Organizations',
    'Set up organizations, manage team members, and control access for your team.',
    '# Creating and Managing Organizations

## What is an Organization?

An organization lets you:
- Create team accounts
- Share transcriptions with team members
- Control access permissions
- Track usage across the organization
- Manage billing for the whole team

## Creating an Organization

1. Log in to your account
2. Click your profile and select "Organizations"
3. Click "Create New Organization"
4. Enter your organization name
5. Choose your subscription tier
6. Complete billing setup

## Adding Team Members

### Invite by Email

1. Go to Organization Settings > Members
2. Click "Invite Member"
3. Enter their email address
4. Select their role:
   - **Admin**: Full access to organization settings
   - **Editor**: Can create and manage transcriptions
   - **Viewer**: Read-only access to transcriptions
5. They''ll receive an invitation email

### Manage Existing Members

1. Go to Members section
2. Click on any member to:
   - Change their role
   - Remove them from the organization
   - Reset their access

## Organization Roles

### Admin
- Manage members and invitations
- Change organization settings
- View billing and usage
- Delete the organization

### Editor
- Create new transcriptions
- Manage their own transcriptions
- View shared transcriptions

### Viewer
- View transcriptions shared with them
- Download transcripts
- Cannot create or edit

## Billing

Organization subscriptions are billed to the organization owner. All transcriptions count toward the organization''s monthly limit regardless of which member created them.',
    'organizations',
    true,
    1
  ),
  (
    'container-health-monitoring',
    'Container Health Monitoring and Maintenance',
    'Monitor Docker container health, manage system resources, and troubleshoot issues.',
    '# Container Health Monitoring and Maintenance

## Restricted Access

This article is for system administrators only. Unauthorized access is prohibited.

## Overview

The YouTube Transcriber system runs on Docker containers. This guide covers monitoring, health checks, and maintenance procedures.

## Monitoring Container Health

### Check Container Status

```bash
docker ps -a
docker logs [container_id] --tail 100
docker stats [container_id]
```

### Health Check Endpoints

Each service exposes a health endpoint:
- `GET /health` - Basic health check
- `GET /health/db` - Database connectivity
- `GET /health/queue` - Job queue status

### Memory and CPU Limits

Review current limits:
```bash
docker inspect [container_id] | grep -E "Memory|CpuShares"
```

## Common Issues and Solutions

### Container Crashes

1. Check logs: `docker logs [container_id]`
2. Verify environment variables are set
3. Check disk space and memory availability
4. Restart: `docker restart [container_id]`

### Database Connectivity Issues

1. Check database container is running
2. Verify connection string in environment variables
3. Test with: `psql -h [host] -U [user] -d [db]`

### High Memory Usage

1. Check for memory leaks: `docker stats`
2. Identify problematic processes
3. Consider scaling resources or optimizing code
4. Restart container as temporary fix

## Maintenance Tasks

### Regular Checks (Daily)
- Monitor error logs
- Check disk usage
- Verify backup jobs

### Weekly Maintenance
- Review performance metrics
- Check for security updates
- Clean up old logs

### Monthly Review
- Analyze usage patterns
- Review resource allocation
- Plan capacity updates

## Backup Procedures

```bash
# Backup database
docker exec [db_container] pg_dump -U user dbname > backup.sql

# Backup application data
docker cp [container]:/app/data ./backup/
```

## Support and Escalation

For critical issues:
1. Document the issue with timestamps
2. Collect relevant logs
3. Contact the technical team
4. Provide reproduction steps',
    'system',
    false,
    1
  )
ON CONFLICT (slug) DO NOTHING;
