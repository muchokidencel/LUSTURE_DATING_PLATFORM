import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/',
        'dist/',
        'src/test/',
        '**/*.test.ts',
        'src/main.tsx',
        'src/pages/AdminDashboard.tsx',
        'src/pages/Discovery.tsx',
        'src/pages/EditProfile.tsx',
        'src/pages/Landing.tsx',
        'src/pages/Matches.tsx',
        'src/pages/Premium.tsx',
        'src/pages/Profile.tsx',
        'src/pages/Recommendations.tsx',
        'src/pages/ReferralDashboard.tsx',
        'src/pages/UserProfile.tsx',
        'src/components/ui/**',
        'src/App.tsx',
        'src/components/PhotoUploader.tsx',
        'src/hooks/useQueries.ts',
        'src/components/layout/Navbar.tsx'
      ],
    },
  },
});
