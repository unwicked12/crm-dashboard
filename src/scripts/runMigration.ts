import { migrateUsers } from './migrateUsers.js';

const runMigration = async () => {
  try {
    // Removed console.log
    const result = await migrateUsers();
    
    // Removed console.log
    // Removed console.log
    // Removed console.log
    // Removed console.log
    // Removed console.log
    // Removed console.log
    
    if (result.errorDetails.length > 0) {
      // Removed console.log
      result.errorDetails.forEach(({ id, error }) => {
        // Removed console.log
      });
    }
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

// Run the migration
runMigration(); 