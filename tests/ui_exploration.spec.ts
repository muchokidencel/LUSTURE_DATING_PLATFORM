import { test, expect, devices } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const API_BASE = 'http://localhost:5000/api';
const CLIENT_BASE = 'http://localhost:5173';
const SCREENSHOT_DIR = 'C:/Users/DENZEL/.gemini/antigravity-ide/scratch/screenshots';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Reusable mock data
const mockFreeUser = {
  id: 1,
  email: 'freeuser@example.com',
  displayName: 'Free User',
  premiumTier: 'free',
  referralCode: 'FREE-VIP',
};

const mockPremiumUser = {
  id: 2,
  email: 'golduser@example.com',
  displayName: 'Gold User',
  premiumTier: 'gold',
  referralCode: 'GOLD-VIP',
};

const mockDiscoveryUsers = [
  {
    id: 10,
    displayName: 'Sarah',
    gender: 'Female',
    age: 24,
    bio: 'Looking for a real connection.',
    photos: [{ url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330' }],
    location: 'Nairobi',
  },
  {
    id: 11,
    displayName: 'John',
    gender: 'Male',
    age: 27,
    bio: 'Adventure seeker.',
    photos: [{ url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e' }],
    location: 'Nairobi',
  },
];

async function setupMocks(page: any) {
  // Capture browser errors
  page.on('console', (msg: any) => {
    if (msg.type() === 'error') {
      console.log(`[BROWSER-ERROR] ${msg.text()}`);
    }
  });

  // Mock API endpoints
  await page.route(`${API_BASE}/profile/me`, async (route: any) => {
    const isPremium = page.viewportSize().width > 500;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: isPremium ? mockPremiumUser : mockFreeUser,
      }),
    });
  });

  await page.route(`${API_BASE}/discovery/users*`, async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: mockDiscoveryUsers,
        pagination: { total: mockDiscoveryUsers.length, page: 1, pageSize: 12, totalPages: 1 }
      }),
    });
  });


  await page.route(`${API_BASE}/matching/recommendations`, async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: mockDiscoveryUsers,
      }),
    });
  });

  await page.route(`${API_BASE}/stats/subscription`, async (route: any) => {
    const isPremium = page.viewportSize().width > 500;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: isPremium ? {
          id: 100,
          userId: 2,
          status: 'active',
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        } : null,
      }),
    });
  });

  await page.route(`${API_BASE}/referrals/stats`, async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: { totalReferrals: 10, totalEarnings: 150, withdrawnEarnings: 50, availableEarnings: 100 },
      }),
    });
  });

  await page.route(`${API_BASE}/referrals/activity`, async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: [],
      }),
    });
  });
}

test.describe('UI Exploration Desktop', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('Capture Desktop screenshots', async ({ page }) => {
    await setupMocks(page);

    // Init storage state
    await page.addInitScript((userData) => {
      window.localStorage.setItem('accessToken', 'fake-token');
      window.localStorage.setItem('refreshToken', 'fake-refresh-token');
      window.localStorage.setItem('user', JSON.stringify(userData));
    }, mockPremiumUser);

    // 1. Landing Page
    await page.goto('/');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/desktop_1_landing.png` });

    // 2. Register Page
    await page.goto('/register');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/desktop_2_register.png` });

    // 3. Login Page
    await page.goto('/login');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/desktop_3_login.png` });

    // 4. Discovery Page
    await page.goto('/discovery');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/desktop_4_discovery.png` });

    // 5. Recommendations Page
    await page.goto('/matching');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/desktop_5_matching.png` });

    // 6. Premium Page
    await page.goto('/premium');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/desktop_6_premium.png` });

    // Open Mpesa Modal
    const upgradeBtn = page.locator('button:has-text("Upgrade Now")').first();
    if (await upgradeBtn.count() > 0) {
      await upgradeBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/desktop_6_premium_modal.png` });
      const mpesaBtn = page.locator('button:has-text("M-PESA")').first();
      if (await mpesaBtn.count() > 0) {
        await mpesaBtn.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: `${SCREENSHOT_DIR}/desktop_6_premium_modal_mpesa.png` });
      }
    }

    // 7. Referral Dashboard
    await page.goto('/referrals');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/desktop_7_referrals.png` });

    // 8. Edit Profile
    await page.goto('/profile/edit');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/desktop_8_edit_profile.png` });
  });
});

test.describe('UI Exploration Mobile', () => {
  test.use({ 
    viewport: { width: 375, height: 667 },
    isMobile: true,
    hasTouch: true
  });


  test('Capture Mobile screenshots', async ({ page }) => {
    await setupMocks(page);

    // Init storage state
    await page.addInitScript((userData) => {
      window.localStorage.setItem('accessToken', 'fake-token');
      window.localStorage.setItem('refreshToken', 'fake-refresh-token');
      window.localStorage.setItem('user', JSON.stringify(userData));
    }, mockFreeUser);

    // 1. Landing Page
    await page.goto('/');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/mobile_1_landing.png` });

    // 2. Register Page
    await page.goto('/register');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/mobile_2_register.png` });

    // 3. Login Page
    await page.goto('/login');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/mobile_3_login.png` });

    // 4. Discovery Page
    await page.goto('/discovery');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/mobile_4_discovery.png` });

    // 5. Recommendations Page
    await page.goto('/matching');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/mobile_5_matching.png` });

    // 6. Premium Page
    await page.goto('/premium');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/mobile_6_premium.png` });

    // 7. Referral Dashboard
    await page.goto('/referrals');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/mobile_7_referrals.png` });

    // 8. Edit Profile
    await page.goto('/profile/edit');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/mobile_8_edit_profile.png` });
  });
});
