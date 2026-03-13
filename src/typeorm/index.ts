import { DataSource } from 'typeorm';
import { Ticket } from './entities/Ticket';
import { TicketConfig } from './entities/TicketConfig';

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: getEnv('MYSQL_DB_HOST'),
  port: Number(getEnv('MYSQL_DB_PORT')),
  username: getEnv('MYSQL_DB_USERNAME'),
  password: getEnv('MYSQL_DB_PASSWORD'),
  database: getEnv('MYSQL_DB_DATABASE'),
  synchronize: true,
  logging: false,
  entities: [Ticket, TicketConfig],
  migrations: [],
  subscribers: [],
});
