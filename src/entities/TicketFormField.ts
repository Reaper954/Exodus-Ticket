import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TicketType } from './TicketType';
import { FieldStyle } from '../utils/types';

@Entity({ name: 'ticket_form_fields' })
export class TicketFormField {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100 })
  label!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  placeholder!: string | null;

  @Column({ type: 'varchar', length: 20, default: 'short' })
  style!: FieldStyle;

  @Column({ type: 'tinyint', width: 1, default: () => '1' })
  required!: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder!: number;

  @ManyToOne(() => TicketType, (ticketType) => ticketType.fields, { onDelete: 'CASCADE' })
  ticketType!: TicketType;
}
