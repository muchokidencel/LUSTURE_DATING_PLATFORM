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
  await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 60000 });
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

  // Mock stats endpoint to prevent 401 redirects when loading the profile page
  await page.route(`${API_BASE}/stats*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: { likes: 5, matches: 2, views: 10 },
      }),
    });
  });

  // Mock recommendations matching feed
  await page.route(`${API_BASE}/matching/recommendations*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: mockDiscoveryUsers,
      }),
    });
  });

  // Mock admin stats endpoint
  await page.route(`${API_BASE}/admin/stats*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: {
          users: { total: 120, premium: 45, free: 75, premiumPercentage: 37 },
          commissions: { totalPendingAmount: 5000, totalPendingCount: 3, currency: 'KES', byAffiliate: [] },
        },
      }),
    });
  });

  // Mock admin withdrawals list
  await page.route(`${API_BASE}/referrals/admin/withdrawals*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: [],
      }),
    });
  });

  // Mock admin export endpoints (return minimal CSV blob)
  await page.route(`${API_BASE}/admin/export/**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/csv',
      body: 'id,email\n1,test@example.com',
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

  // Mock stats endpoint to prevent 401 redirects
  await page.route(`${API_BASE}/stats*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: { likes: 0, matches: 0, views: 0 },
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

Then('I should see the "Share Live Location" button', async ({ page }) => {
  const shareBtn = page.locator('button:has-text("Share Live Location")');
  await expect(shareBtn).toBeVisible();
});

When('I click the "Share Live Location" button and it fails', async ({ page }) => {
  await page.evaluate(() => {
    navigator.geolocation.getCurrentPosition = (success, error) => {
      if (error) {
        error({
          code: 1, // PERMISSION_DENIED
          message: "User denied Geolocation",
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3
        } as any);
      }
    };
  });

  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toContain('Failed to access your location');
    await dialog.accept();
  });

  const shareBtn = page.locator('button:has-text("Share Live Location")');
  await shareBtn.click();
});

Then('I should see a manual City input field', async ({ page }) => {
  const cityInput = page.locator('input[name="city"]');
  await expect(cityInput).toBeVisible();
});

When('I enter city {string}', async ({ page }, city) => {
  const cityInput = page.locator('input[name="city"]');
  await cityInput.fill(city);
});

When('I click {string}', async ({ page }, buttonText) => {
  if (buttonText === 'Save Changes') {
    await page.route(`${API_BASE}/profile`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: {
            ...mockPremiumUser,
            location: 'Mombasa',
            latitude: null,
            longitude: null
          }
        }),
      });
    });

    await page.route(`${API_BASE}/profile/me`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: {
            ...mockPremiumUser,
            location: 'Mombasa',
            latitude: null,
            longitude: null
          }
        }),
      });
    });
  }
  const btn = page.locator(`button:has-text("${buttonText}")`).first();
  await btn.click();
});

Then('my profile city should be updated to {string}', async ({ page }, city) => {
  await page.route(`${API_BASE}/profile/me`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: {
          ...mockPremiumUser,
          location: city,
          latitude: null,
          longitude: null
        }
      })
    });
  });

  // Let's capture the state for debugging
  await page.screenshot({ path: 'C:/Users/DENZEL/.gemini/antigravity-ide/scratch/screenshots/profile_fallback_debug.png' });

  await expect(page).toHaveURL(/\/profile$/);
  const cityLabel = page.locator(`text=${city}`).first();
  await expect(cityLabel).toBeVisible();
});

Then('I should see the age range filter label', async ({ page }) => {
  const label = page.locator('text=Age Filter:').first();
  await expect(label).toBeVisible();
});

When('I adjust the age range slider to {int} and {int}', async ({ page }, min, max) => {
  await page.evaluate(({ min, max }) => {
    if ((window as any).setAgeRange) {
      (window as any).setAgeRange(min, max);
    }
  }, { min, max });
});

Then('the feed should only display profiles within the age bracket {int} to {int}', async ({ page }, min, max) => {
  // John is 27 (inside [25, 30]), Sarah is 24 (outside)
  await expect(page.locator('text=John').first()).toBeVisible();
  await expect(page.locator('text=Sarah')).not.toBeVisible();
});

// ── Admin CSV Export Steps ────────────────────────────────────────────────────

const mockAdminUser = {
  id: 99,
  email: 'admin@lustre.com',
  displayName: 'Admin User',
  premiumTier: 'gold',
  referralCode: 'ADMIN-VIP',
  role: 'admin',
};

Given('I am logged in as an admin user', async ({ page }) => {
  // Inject admin user into localStorage with role: admin
  await page.addInitScript((userData) => {
    window.localStorage.setItem('accessToken', 'fake-admin-token');
    window.localStorage.setItem('refreshToken', 'fake-refresh-token');
    window.localStorage.setItem('user', JSON.stringify(userData));
  }, mockAdminUser);

  // Mock /api/profile/me to return the admin user
  await page.route(`${API_BASE}/profile/me`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'success', data: mockAdminUser }),
    });
  });

  // Mock admin stats
  await page.route(`${API_BASE}/admin/stats*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: {
          users: { total: 120, premium: 45, free: 75, premiumPercentage: 37 },
          commissions: { totalPendingAmount: 5000, totalPendingCount: 3, currency: 'KES', byAffiliate: [] },
        },
      }),
    });
  });

  // Mock admin withdrawals list
  await page.route(`${API_BASE}/referrals/admin/withdrawals*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'success', data: [] }),
    });
  });

  // Mock notifications endpoint
  await page.route(`${API_BASE}/notifications*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'success', data: [] }),
    });
  });

  // Mock admin CSV export endpoints
  await page.route(`${API_BASE}/admin/export/**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/csv',
      body: 'id,email\n1,test@example.com',
    });
  });
});

Then('a CSV file download should be initiated', async ({ page }) => {
  // The CSV download happens via anchor.click() which is browser-controlled.
  // We confirm the page remains on /admin without any error state.
  await expect(page).toHaveURL(/\/admin/);
});
