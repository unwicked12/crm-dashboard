import { seedKnowledgeBase } from '../src/utils/seedKnowledgeBase';
import dotenv from 'dotenv';
import connectDB from '../src/utils/db';

dotenv.config();

const seed = async () => {
  try {
    await connectDB();
    await seedKnowledgeBase();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seed();

export {};
