import { setupMatchingEngines } from './src/db/engines.js';

const runSetup = async () => {
  console.log('Running SQL Engine setup...');
  try {
    await setupMatchingEngines();
    console.log('SQL Engines setup complete.');
  } catch (error) {
    console.error('Setup failed:', error);
  } finally {
    process.exit();
  }
};

runSetup();
