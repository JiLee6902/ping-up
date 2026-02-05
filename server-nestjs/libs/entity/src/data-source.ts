import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

// Import all entities explicitly for Docker/bundled environments
import {
  User,
  Post,
  Story,
  Message,
  Connection,
  UserRefreshToken,
  ChatSettings,
  ChatEvent,
  Comment,
  Notification,
  Bookmark,
  BlockedUser,
  Report,
  GroupChat,
  GroupMember,
  GroupMessage,
  MutedUser,
  Reaction,
  Poll,
  PollVote,
  UserWallet,
  CoinTransaction,
  PaymentOrder,
  Subscription,
  ProfileView,
  ScheduledPost,
  UserKeyBundle,
  MessageDeletion,
  GroupMessageDeletion,
} from './entities';

// Load env file based on NODE_ENV
const envFile = `.env.${process.env.NODE_ENV || 'local'}`;
config({ path: envFile });
// Fallback to .env.local
config({ path: '.env.local' });

// NOTE: pg types configuration is in index.ts to ensure it runs before any DB connection

// All entities array for TypeORM
const entities = [
  User,
  Post,
  Story,
  Message,
  Connection,
  UserRefreshToken,
  ChatSettings,
  ChatEvent,
  Comment,
  Notification,
  Bookmark,
  BlockedUser,
  Report,
  GroupChat,
  GroupMember,
  GroupMessage,
  MutedUser,
  Reaction,
  Poll,
  PollVote,
  UserWallet,
  CoinTransaction,
  PaymentOrder,
  Subscription,
  ProfileView,
  ScheduledPost,
  UserKeyBundle,
  MessageDeletion,
  GroupMessageDeletion,
];

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'pingup',
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities,
  migrations: [join(__dirname, '/migrations/*.{ts,js}')],
  ssl:
    process.env.DB_SSL === 'true'
      ? { rejectUnauthorized: false }
      : false,
  extra: {
    options: '-c timezone=UTC',
  },
};

export const AppDataSource = new DataSource(dataSourceOptions);
