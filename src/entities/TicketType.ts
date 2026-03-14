import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { TicketPanel } from './TicketPanel';
import { TicketFormField } from './TicketFormField';

@Entity({ name: 'ticket_types' })
export class TicketType {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 32 })
  guildId!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 200, default: 'Open this ticket type.' })
  description!: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  openCategoryId!: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  closedCategoryId!: string | null;

  @Column({ type: 'simple-array', nullable: true })
  supportRoleIds!: string[] | null;

  @Column({ type: 'int', default: 0 })
  counter!: number;

  @Column({ type: 'int', default: 2 })
  maxOpenPerUser!: number;

  @ManyToOne(() => TicketPanel, (panel) => panel.types, { onDelete: 'CASCADE' })
  panel!: TicketPanel;

  @OneToMany(() => TicketFormField, (field) => field.ticketType, { cascade: true })
  fields!: TicketFormField[];
}
