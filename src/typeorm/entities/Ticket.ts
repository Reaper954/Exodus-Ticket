import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { TicketStatus } from '../../utils/types';

@Entity({ name: 'tickets' })
export class Ticket {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 32 })
  guildId!: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  channelId!: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  openerId!: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  claimedById!: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  messageId!: string | null;

  @Column({ type: 'varchar', length: 16, default: 'open' })
  status!: TicketStatus;

  @Column({ type: 'varchar', length: 100, nullable: true })
  reason!: string | null;

  @Column({ type: 'text', nullable: true })
  details!: string | null;
}
