import { migrateUsers } from './migrateUsers.js';

const runMigration = async () => {
  try {
    console.log('Starting user migration process...');
    const result = await migrateUsers();
    
    console.log('\nMigration completed successfully!');
    console.log('----------------------------------------');
    console.log('Summary:');
    console.log(`Total users: ${result.total}`);
    console.log(`Successfully migrated: ${result.migrated}`);
    console.log(`Errors: ${result.errors}`);
    
    if (result.errorDetails.length > 0) {
      console.log('\nError Details:');
      result.errorDetails.forEach(({ id, error }) => {
        console.log(`- User ${id}: ${error}`);
      });
    }
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

// Run the migration
runMigration(); 