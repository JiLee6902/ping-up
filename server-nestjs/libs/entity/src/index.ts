// Configure pg types FIRST before any TypeORM initialization
import { types } from 'pg';

// Configure pg to return timestamps as strings to avoid timezone issues
// 1184 = TIMESTAMPTZ, 1114 = TIMESTAMP
types.setTypeParser(1184, (val: string) => val);
types.setTypeParser(1114, (val: string) => val);

export * from './entities';
export * from './data-source';
