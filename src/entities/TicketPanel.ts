import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { TicketType } from './TicketType';

@Entity({ name: 'ticket_panels' })
export class TicketPanel {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 32 })
  guildId!: string;

  @Column({ type: 'varchar', length: 100, default: 'Main Ticket Panel' })
  name!: string;

  @Column({ type: 'varchar', length: 150, default: 'Open a Ticket' })
  panelTitle!: string;

  @Column({ type: 'varchar', length: 1000, default: 'Need help? Choose a ticket type below to open a ticket.' })
  panelDescription!: string;

  @Column({ type: 'varchar', length: 150, default: '{type}-{counter}-{username}' })
  namingFormat!: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  panelChannelId!: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  panelMessageId!: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  logChannelId!: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  defaultClosedCategoryId!: string | null;

  @Column({ type: 'tinyint', width: 1, default: () => '1' })
  claimEnabled!: boolean;

  @Column({ type: 'tinyint', width: 1, default: () => '0' })
  requireClaimBeforeClose!: boolean;

  @Column({ type: 'tinyint', width: 1, default: () => '1' })
  isDraft!: boolean;

  @OneToMany(() => TicketType, (type) => type.panel, { cascade: true })
  types!: TicketType[];
}
