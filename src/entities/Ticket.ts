import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { TicketStatus } from '../utils/types';

@Entity({ name: 'tickets' })
export class Ticket {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 32 })
  guildId!: string;

  @Column({ type: 'int' })
  panelId!: number;

  @Column({ type: 'int' })
  ticketTypeId!: number;

  @Column({ type: 'varchar', length: 32 })
  channelId!: string;

  @Column({ type: 'varchar', length: 32 })
  creatorId!: string;

  @Column({ type: 'varchar', length: 150 })
  displayName!: string;

  @Column({ type: 'varchar', length: 20, default: 'open' })
  status!: TicketStatus;

  @Column({ type: 'varchar', length: 32, nullable: true })
  claimedById!: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  closedById!: string | null;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  formJson!: string | null;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({ type: 'datetime', nullable: true })
  closedAt!: Date | null;
}
