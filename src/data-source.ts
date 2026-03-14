import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { getEnv } from './utils/env';
import { TicketPanel } from './entities/TicketPanel';
import { TicketType } from './entities/TicketType';
import { TicketFormField } from './entities/TicketFormField';
import { Ticket } from './entities/Ticket';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: getEnv('MYSQL_DB_HOST'),
  port: Number(getEnv('MYSQL_DB_PORT')),
  username: getEnv('MYSQL_DB_USERNAME'),
  password: getEnv('MYSQL_DB_PASSWORD'),
  database: getEnv('MYSQL_DB_DATABASE'),
  synchronize: true,
  logging: false,
  entities: [TicketPanel, TicketType, TicketFormField, Ticket],
  migrations: [],
  subscribers: []
});
