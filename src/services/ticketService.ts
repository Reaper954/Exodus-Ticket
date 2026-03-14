import {
  ChannelType,
  Client,
  Colors,
  EmbedBuilder,
  PermissionFlagsBits,
  TextChannel
} from 'discord.js';
import { AppDataSource } from '../data-source';
import { Ticket } from '../entities/Ticket';
import { TicketPanel } from '../entities/TicketPanel';
import { TicketType } from '../entities/TicketType';
import { buildClosedTicketComponents, buildClosedTicketEmbed, buildOpenTicketComponents, buildOpenTicketEmbed, buildPanelMessage, slugify } from '../utils/discord';
import { buildTranscriptAttachment } from './transcriptService';

export class TicketService {
  private ticketRepo = AppDataSource.getRepository(Ticket);
  private panelRepo = AppDataSource.getRepository(TicketPanel);
  private typeRepo = AppDataSource.getRepository(TicketType);

  async deployPanel(client: Client, panelId: number) {
    const panel = await this.panelRepo.findOne({ where: { id: panelId }, relations: ['types'] });
    if (!panel) throw new Error('Panel not found.');
    if (!panel.panelChannelId) throw new Error('Panel channel is not set.');
    const channel = await client.channels.fetch(panel.panelChannelId);
    if (!channel || !channel.isTextBased()) throw new Error('Panel channel could not be found.');
    const message = await (channel as TextChannel).send(buildPanelMessage(panel, panel.types as TicketType[]) as any);
    panel.panelMessageId = message.id;
    panel.isDraft = false;
    await this.panelRepo.save(panel);
    return message;
  }

  async createTicket(client: Client, ticketTypeId: number, creatorId: string, username: string, answers: Record<string, string>) {
    const type = await this.typeRepo.findOne({ where: { id: ticketTypeId }, relations: ['panel', 'fields'] });
    if (!type) throw new Error('Ticket type not found.');
    if (!type.openCategoryId) throw new Error('This ticket type has no open category configured yet.');

    const openCount = await this.ticketRepo.count({ where: { ticketTypeId: type.id, creatorId, status: 'open' } });
    if (openCount >= type.maxOpenPerUser) {
      throw new Error(`You already have ${type.maxOpenPerUser} open ticket(s) for ${type.name}. Please close one before opening another.`);
    }

    type.counter += 1;
    await this.typeRepo.save(type);

    const rawName = type.panel.namingFormat
      .replaceAll('{counter}', String(type.counter))
      .replaceAll('{username}', username)
      .replaceAll('{userid}', creatorId)
      .replaceAll('{type}', type.name);

    const channelName = slugify(rawName) || `ticket-${type.counter}`;
    const guild = await client.guilds.fetch(type.guildId);
    const channel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: type.openCategoryId,
      permissionOverwrites: [
        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: creatorId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
        { id: client.user!.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels] },
        ...((type.supportRoleIds || []).map((roleId) => ({ id: roleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] })))
      ],
      topic: `Ticket for ${creatorId} | Type ${type.id}`
    });

    const ticket = this.ticketRepo.create({
      guildId: type.guildId,
      panelId: type.panel.id,
      ticketTypeId: type.id,
      channelId: channel.id,
      creatorId,
      displayName: channelName,
      status: 'open',
      formJson: JSON.stringify(answers)
    });
    const saved = await this.ticketRepo.save(ticket);

    const answerText = Object.entries(answers).length
      ? Object.entries(answers).map(([key, value]) => `**${key}**\n${value}`).join('\n\n')
      : 'No form answers provided.';

    const ticketEmbed = buildOpenTicketEmbed(channelName, type.name, creatorId, null)
      .setColor(Colors.Green)
      .addFields({ name: 'Form Answers', value: answerText.slice(0, 1024) || 'No answers.', inline: false });

    await (channel as TextChannel).send({
      content: `<@${creatorId}> ${(type.supportRoleIds || []).map((id) => `<@&${id}>`).join(' ')}`.trim(),
      embeds: [ticketEmbed],
      components: buildOpenTicketComponents(type.panel.claimEnabled) as any
    } as any);

    return { ticket: saved, channel };
  }

  async getTicketByChannel(channelId: string) {
    return this.ticketRepo.findOne({ where: { channelId } });
  }

  async closeTicket(client: Client, channelId: string, closedById: string) {
    const ticket = await this.getTicketByChannel(channelId);
    if (!ticket) throw new Error('Ticket record not found.');
    if (ticket.status === 'closed') return ticket;

    const type = await this.typeRepo.findOne({ where: { id: ticket.ticketTypeId }, relations: ['panel'] });
    if (!type) throw new Error('Ticket type not found.');
    const channel = await client.channels.fetch(channelId);
    if (!channel || !channel.isTextBased()) throw new Error('Ticket channel not found.');

    ticket.status = 'closed';
    ticket.closedById = closedById;
    ticket.closedAt = new Date();
    await this.ticketRepo.save(ticket);

    const targetCategoryId = type.closedCategoryId || type.panel.defaultClosedCategoryId;
    if (targetCategoryId && 'setParent' in channel) {
      await (channel as TextChannel).setParent(targetCategoryId).catch(() => null);
    }

    await (channel as TextChannel).send({
      embeds: [buildClosedTicketEmbed(ticket.displayName, ticket.claimedById, ticket.closedById)],
      components: buildClosedTicketComponents() as any
    } as any);

    return ticket;
  }

  async reopenTicket(client: Client, channelId: string) {
    const ticket = await this.getTicketByChannel(channelId);
    if (!ticket) throw new Error('Ticket record not found.');
    const type = await this.typeRepo.findOne({ where: { id: ticket.ticketTypeId }, relations: ['panel'] });
    if (!type) throw new Error('Ticket type not found.');
    const channel = await client.channels.fetch(channelId);
    if (!channel || !channel.isTextBased()) throw new Error('Ticket channel not found.');

    ticket.status = 'open';
    ticket.closedById = null;
    ticket.closedAt = null;
    await this.ticketRepo.save(ticket);

    if (type.openCategoryId && 'setParent' in channel) {
      await (channel as TextChannel).setParent(type.openCategoryId).catch(() => null);
    }

    await (channel as TextChannel).send({
      embeds: [buildOpenTicketEmbed(ticket.displayName, type.name, ticket.creatorId, ticket.claimedById)],
      components: buildOpenTicketComponents(type.panel.claimEnabled) as any
    } as any);

    return ticket;
  }

  async setClaim(channelId: string, staffId: string | null) {
    const ticket = await this.getTicketByChannel(channelId);
    if (!ticket) throw new Error('Ticket record not found.');
    ticket.claimedById = staffId;
    return this.ticketRepo.save(ticket);
  }

  async generateTranscriptAndLog(client: Client, channelId: string) {
    const ticket = await this.getTicketByChannel(channelId);
    if (!ticket) throw new Error('Ticket record not found.');
    const type = await this.typeRepo.findOne({ where: { id: ticket.ticketTypeId }, relations: ['panel'] });
    if (!type) throw new Error('Ticket type not found.');
    const channel = await client.channels.fetch(channelId);
    if (!channel || channel.type !== ChannelType.GuildText) throw new Error('Ticket channel not found.');

    const attachment = await buildTranscriptAttachment(channel as TextChannel, ticket.displayName);

    if (type.panel.logChannelId) {
      const logChannel = await client.channels.fetch(type.panel.logChannelId);
      if (logChannel && logChannel.isTextBased()) {
        await (logChannel as TextChannel).send({
          content: `Closed Ticket: **${ticket.displayName}**\nCreator: <@${ticket.creatorId}>\nClaimed By: ${ticket.claimedById ? `<@${ticket.claimedById}>` : 'Nobody'}\nClosed By: ${ticket.closedById ? `<@${ticket.closedById}>` : 'Unknown'}`,
          files: [attachment]
        } as any);
      }
    }

    return attachment;
  }

  async deleteTicket(client: Client, channelId: string) {
    const ticket = await this.getTicketByChannel(channelId);
    if (!ticket) throw new Error('Ticket record not found.');
    const channel = await client.channels.fetch(channelId);
    if (channel && channel.isTextBased()) {
      await this.generateTranscriptAndLog(client, channelId);
      await channel.delete('Ticket deleted');
    }
    ticket.status = 'deleted';
    await this.ticketRepo.save(ticket);
  }
}

export const ticketService = new TicketService();
