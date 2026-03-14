import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { TicketPanel } from '../entities/TicketPanel';
import { TicketType } from '../entities/TicketType';
import { TicketFormField } from '../entities/TicketFormField';

export class PanelService {
  private panelRepo: Repository<TicketPanel> = AppDataSource.getRepository(TicketPanel);
  private typeRepo: Repository<TicketType> = AppDataSource.getRepository(TicketType);
  private fieldRepo: Repository<TicketFormField> = AppDataSource.getRepository(TicketFormField);

  async getOrCreateDraft(guildId: string): Promise<TicketPanel> {
    let panel = await this.panelRepo.findOne({ where: { guildId, isDraft: true }, relations: ['types', 'types.fields'] });
    if (!panel) {
      panel = this.panelRepo.create({ guildId, isDraft: true, name: 'Main Ticket Panel' });
      panel = await this.panelRepo.save(panel);
    }
    return this.getDraftWithRelations(guildId);
  }

  async getDraftWithRelations(guildId: string): Promise<TicketPanel> {
    const panel = await this.panelRepo.findOne({ where: { guildId, isDraft: true }, relations: ['types', 'types.fields'] });
    if (!panel) {
      throw new Error('No draft panel found. Run /setup to create one.');
    }
    panel.types = (panel.types || []).sort((a, b) => a.id - b.id);
    for (const type of panel.types) {
      type.fields = (type.fields || []).sort((a, b) => a.sortOrder - b.sortOrder);
    }
    return panel;
  }

  async updatePanelBasics(guildId: string, values: Partial<TicketPanel>) {
    const panel = await this.getOrCreateDraft(guildId);
    Object.assign(panel, values);
    await this.panelRepo.save(panel);
    return this.getDraftWithRelations(guildId);
  }

  async addTicketType(guildId: string, name: string, description: string) {
    const panel = await this.getOrCreateDraft(guildId);
    const type = this.typeRepo.create({ guildId, name, description, panel, supportRoleIds: [] });
    await this.typeRepo.save(type);
    return this.getDraftWithRelations(guildId);
  }

  async getTypeById(id: number) {
    return this.typeRepo.findOne({ where: { id }, relations: ['panel', 'fields'] });
  }

  async updateTicketType(id: number, values: Partial<TicketType>) {
    const type = await this.getTypeById(id);
    if (!type) throw new Error('Ticket type not found.');
    Object.assign(type, values);
    await this.typeRepo.save(type);
    return this.getDraftWithRelations(type.guildId);
  }

  async addField(ticketTypeId: number, label: string, placeholder: string | null, required: boolean, style: 'short' | 'paragraph') {
    const type = await this.getTypeById(ticketTypeId);
    if (!type) throw new Error('Ticket type not found.');
    const count = await this.fieldRepo.count({ where: { ticketType: { id: ticketTypeId } } as any });
    const field = this.fieldRepo.create({ label, placeholder, required, style, sortOrder: count, ticketType: type });
    await this.fieldRepo.save(field);
    return this.getDraftWithRelations(type.guildId);
  }

  async removeField(fieldId: number) {
    const field = await this.fieldRepo.findOne({ where: { id: fieldId }, relations: ['ticketType', 'ticketType.panel'] });
    if (!field) throw new Error('Field not found.');
    const guildId = field.ticketType.guildId;
    await this.fieldRepo.remove(field);
    return this.getDraftWithRelations(guildId);
  }

  async deployPanel(guildId: string) {
    const panel = await this.getDraftWithRelations(guildId);
    if (!panel.panelChannelId) throw new Error('Set a panel channel first.');
    if (!panel.types.length) throw new Error('Add at least one ticket type first.');
    return panel;
  }
}

export const panelService = new PanelService();
