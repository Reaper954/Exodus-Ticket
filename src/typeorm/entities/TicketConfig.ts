import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'ticket_configs' })
export class TicketConfig {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 32, unique: true })
  guildId!: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  panelChannelId!: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  panelMessageId!: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  ticketCategoryId!: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  logsChannelId!: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  supportRoleId!: string | null;

  @Column({ type: 'varchar', length: 100, default: 'Create a Ticket' })
  panelTitle!: string;

  @Column({
    type: 'varchar',
    default:
      'Need help? Press the button below and fill out the form to open a support ticket.',
  })
  panelDescription!: string;

  @Column({ type: 'varchar', length: 80, default: 'Open Ticket' })
  buttonLabel!: string;
}
