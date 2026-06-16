const { chromium, devices } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

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

async function setupMocks(page) {
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log(`[BROWSER-ERROR] ${msg.text()}`);
    }
  });

  await page.route(`${API_BASE}/profile/me`, async (route) => {
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

  await page.route(`${API_BASE}/discovery/users*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: {
          users: mockDiscoveryUsers,
          pagination: { total: mockDiscoveryUsers.length, page: 1, limit: 10, pages: 1 }
        },
      }),
    });
  });

  await page.route(`${API_BASE}/matching/recommendations`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: mockDiscoveryUsers,
      }),
    });
  });

  await page.route(`${API_BASE}/stats/subscription`, async (route) => {
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

  await page.route(`${API_BASE}/referrals/stats`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: { totalReferrals: 10, totalEarnings: 150, withdrawnEarnings: 50, availableEarnings: 100 },
      }),
    });
  });

  await page.route(`${API_BASE}/referrals/activity`, async (route) => {
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

async function testViewport(isMobile) {
  const mode = isMobile ? 'mobile' : 'desktop';
  console.log(`Starting UI tests for ${mode}...`);
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext(
    isMobile ? devices['iPhone 12'] : { viewport: { width: 1280, height: 800 } }
  );
  
  const page = await context.newPage();
  await setupMocks(page);

  const mockUser = isMobile ? mockFreeUser : mockPremiumUser;
  await page.addInitScript((userData) => {
    window.localStorage.setItem('accessToken', 'fake-token');
    window.localStorage.setItem('refreshToken', 'fake-refresh-token');
    window.localStorage.setItem('user', JSON.stringify(userData));
  }, mockUser);

  // 1. Landing Page
  await page.goto(CLIENT_BASE);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/${mode}_1_landing.png` });

  // 2. Register Page
  await page.goto(`${CLIENT_BASE}/register`);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/${mode}_2_register.png` });

  // 3. Login Page
  await page.goto(`${CLIENT_BASE}/login`);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/${mode}_3_login.png` });

  // 4. Discovery Page
  await page.goto(`${CLIENT_BASE}/discovery`);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/${mode}_4_discovery.png` });

  // 5. Recommendations Page
  await page.goto(`${CLIENT_BASE}/matching`);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/${mode}_5_matching.png` });

  // 6. Premium Page
  await page.goto(`${CLIENT_BASE}/premium`);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/${mode}_6_premium.png` });

  // 6b. Premium modal
  if (!isMobile) {
    const upgradeBtn = page.locator('button:has-text("Upgrade Now")').first();
    if (await upgradeBtn.count() > 0) {
      await upgradeBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/${mode}_6_premium_modal.png` });
      const mpesaBtn = page.locator('button:has-text("M-PESA")').first();
      if (await mpesaBtn.count() > 0) {
        await mpesaBtn.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: `${SCREENSHOT_DIR}/${mode}_6_premium_modal_mpesa.png` });
      }
    }
  }

  // 7. Referral Dashboard
  await page.goto(`${CLIENT_BASE}/referrals`);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/${mode}_7_referrals.png` });

  // 8. Edit Profile
  await page.goto(`${CLIENT_BASE}/profile/edit`);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/${mode}_8_edit_profile.png` });

  await browser.close();
  console.log(`UI tests for ${mode} completed successfully.`);
}

async function run() {
  try {
    await testViewport(false); // Desktop
    await testViewport(true);  // Mobile
  } catch (error) {
    console.error('UI Test Execution failed:', error);
  }
}

run();
