import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

const { Given, When, Then } = createBdd();

const API_BASE = 'http://localhost:5000/api';

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

Given('I navigate to {string}', async ({ page }, path) => {
  await page.goto(path);
});

When('I enter email {string} and password {string}', async ({ page }, email, password) => {
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
});

When('I click the register button', async ({ page }) => {
  // Set up mock for registration and profile load
  await page.route(`${API_BASE}/auth/register`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: {
          accessToken: 'fake-access-token',
          refreshToken: 'fake-refresh-token',
          user: mockFreeUser,
        },
      }),
    });
  });

  await page.route(`${API_BASE}/profile/me`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: mockFreeUser,
      }),
    });
  });

  // Mock initial discovery list to prevent error when landing on discovery page
  await page.route(`${API_BASE}/discovery/users*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: mockDiscoveryUsers,
        pagination: { total: mockDiscoveryUsers.length, page: 1, limit: 10, pages: 1 }
      }),
    });
  });

  // Mock notifications endpoint to prevent 401 redirects
  await page.route(`${API_BASE}/notifications*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: [],
      }),
    });
  });

  await page.click('button[type="submit"]');
});

Then('I should see the discovery page header', async ({ page }) => {
  // Wait for redirect to discovery page and verify header is present
  await expect(page).toHaveURL(/\/discovery/);
  // Wait for the main discovery page content
  const header = page.locator('h1');
  await expect(header).toContainText(/Discover/i);
});

Given('I am logged in as a premium user', async ({ page }) => {
  // Mock localStorage for authenticated session, including user object to satisfy PrivateRoute auth checks
  await page.addInitScript((userData) => {
    window.localStorage.setItem('accessToken', 'fake-gold-token');
    window.localStorage.setItem('refreshToken', 'fake-refresh-token');
    window.localStorage.setItem('user', JSON.stringify(userData));
  }, mockPremiumUser);

  // Mock /api/profile/me to return a gold user
  await page.route(`${API_BASE}/profile/me`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: mockPremiumUser,
      }),
    });
  });

  // Mock initial discovery list
  await page.route(`${API_BASE}/discovery/users*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: mockDiscoveryUsers,
        pagination: { total: mockDiscoveryUsers.length, page: 1, limit: 10, pages: 1 }
      }),
    });
  });

  // Mock notifications endpoint to prevent 401 redirects
  await page.route(`${API_BASE}/notifications*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: [],
      }),
    });
  });
});

When('I filter by gender {string}', async ({ page }, gender) => {
  // Select option in the native select dropdown we added
  await page.selectOption('select', gender);
});

Then('I should only see profiles with gender {string}', async ({ page }, gender) => {
  if (gender === 'Female') {
    await expect(page.locator('text=Sarah')).toBeVisible();
    await expect(page.locator('text=John')).not.toBeVisible();
  } else if (gender === 'Male') {
    await expect(page.locator('text=John')).toBeVisible();
    await expect(page.locator('text=Sarah')).not.toBeVisible();
  }
});

Given('I am logged in as a free user', async ({ page }) => {
  // Mock localStorage for authenticated session, including user object to satisfy PrivateRoute auth checks
  await page.addInitScript((userData) => {
    window.localStorage.setItem('accessToken', 'fake-free-token');
    window.localStorage.setItem('refreshToken', 'fake-refresh-token');
    window.localStorage.setItem('user', JSON.stringify(userData));
  }, mockFreeUser);

  // Mock /api/profile/me to return a free user
  await page.route(`${API_BASE}/profile/me`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: mockFreeUser,
      }),
    });
  });

  // Mock subscription to show free tier
  await page.route(`${API_BASE}/stats/subscription`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: null,
      }),
    });
  });

  // Mock notifications endpoint to prevent 401 redirects
  await page.route(`${API_BASE}/notifications*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: [],
      }),
    });
  });
});

When('I enter M-Pesa phone number {string}', async ({ page }, phone) => {
  // Click the 'Upgrade Now' button first to open payment modal
  const upgradeBtn = page.locator('button:has-text("Upgrade Now")').first();
  await upgradeBtn.click();

  // Click the M-PESA payment method
  const mpesaMethodBtn = page.locator('button:has-text("M-PESA")');
  await mpesaMethodBtn.click();

  // Enter phone number
  await page.fill('input[placeholder="e.g. 0712345678"]', phone);
});

When('I click the pay button', async ({ page }) => {
  // Mock pay STK push endpoint
  await page.route(`${API_BASE}/payments/pay/mpesa`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        message: 'STK Push sent successfully',
      }),
    });
  });

  // Mock subsequent subscription requests to simulate active premium after successful payment
  await page.route(`${API_BASE}/stats/subscription`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: {
          id: 100,
          userId: 1,
          status: 'active',
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        },
      }),
    });
  });

  // Click Dispatch Prompt
  await page.click('button:has-text("Dispatch Prompt")');
});

Then('I should see a message that the STK push was sent', async ({ page }) => {
  // Verify modal is closed or subscription upgrade is updated
  // When upgrade succeeds, the modal closes and isPremium is true, button changes to "Elite Active"
  const activeBtn = page.locator('button:has-text("Elite Active")');
  await expect(activeBtn).toBeVisible({ timeout: 10000 });
});

Given('I have received notifications', async ({ page }) => {
  // Mock premium user profile
  await page.addInitScript((userData) => {
    window.localStorage.setItem('accessToken', 'fake-gold-token');
    window.localStorage.setItem('refreshToken', 'fake-refresh-token');
    window.localStorage.setItem('user', JSON.stringify(userData));
  }, mockPremiumUser);

  // Mock /api/profile/me to return a gold user
  await page.route(`${API_BASE}/profile/me`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: mockPremiumUser,
      }),
    });
  });

  // Mock discovery users list
  await page.route(`${API_BASE}/discovery/users*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: mockDiscoveryUsers,
        pagination: { total: mockDiscoveryUsers.length, page: 1, limit: 10, pages: 1 }
      }),
    });
  });

  // Mock notifications endpoint
  await page.route(`${API_BASE}/notifications`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: [
          { id: 1, userId: 2, type: 'like', content: 'Jane liked your profile!', isRead: false, createdAt: new Date().toISOString() },
        ],
      }),
    });
  });
});

When('I click the notifications bell', async ({ page }) => {
  const bellBtn = page.locator('#notifications-bell, button[aria-label="Notifications"], button:has-text("Notifications")').first();
  await bellBtn.click();
});

Then('I should see a notification {string}', async ({ page }, content) => {
  const notifItem = page.locator(`text=${content}`);
  await expect(notifItem).toBeVisible();
});

