import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

// In-memory flag for graceful shutdown
let isShuttingDown = false;

// Listen for SIGTERM signal
if (typeof process !== 'undefined') {
  process.on('SIGTERM', () => {
    console.log('[HEALTH] Received SIGTERM, initiating graceful shutdown');
    isShuttingDown = true;

    // Track reboot count
    trackReboot();
  });
}

/**
 * Track reboot count in /tmp/reboot-count.json
 * If >5 reboots in 1 hour, log a warning
 */
function trackReboot() {
  const rebootFile = '/tmp/reboot-count.json';
  const now = Date.now();
  const oneHourAgo = now - 3600000; // 1 hour in milliseconds

  try {
    let rebootData: { reboots: number[] } = { reboots: [] };

    // Read existing reboot data if it exists
    if (fs.existsSync(rebootFile)) {
      const content = fs.readFileSync(rebootFile, 'utf-8');
      rebootData = JSON.parse(content) as { reboots: number[] };
    }

    // Add current reboot timestamp
    (rebootData.reboots as number[]).push(now);

    // Remove reboots older than 1 hour
    rebootData.reboots = rebootData.reboots.filter(ts => ts > oneHourAgo);

    // Save updated data
    fs.writeFileSync(rebootFile, JSON.stringify(rebootData, null, 2));

    // Check if we've exceeded 5 reboots in 1 hour
    if (rebootData.reboots.length > 5) {
      console.warn(
        `[HEALTH] WARNING: Container has rebooted ${rebootData.reboots.length} times in the last hour. ` +
        `Manual intervention may be required.`
      );
    }
  } catch (error) {
    console.error('[HEALTH] Error tracking reboot count:', error);
  }
}

/**
 * GET /api/health
 *
 * Returns health status of the application.
 * - 200: App is healthy and ready to serve requests
 * - 503: App is shutting down (SIGTERM received)
 */
export async function GET(request: NextRequest) {
  // If we're in graceful shutdown mode, return 503
  if (isShuttingDown) {
    return NextResponse.json(
      {
        status: 'shutting_down',
        message: 'Container is shutting down, no new requests accepted',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }

  // Return healthy status
  return NextResponse.json(
    {
      status: 'healthy',
      message: 'Application is running and ready to serve requests',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
    { status: 200 }
  );
}
