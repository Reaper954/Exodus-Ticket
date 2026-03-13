import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  Client,
  Colors,
  EmbedBuilder,
  Guild,
  PermissionFlagsBits,
  PermissionsBitField,
  TextChannel,
} from 'discord.js';
import { AppDataSource } from '../typeorm';
import { Ticket } from '../typeorm/entities/Ticket';
import { TicketConfig } from '../typeorm/entities/TicketConfig';
import { CUSTOM_IDS } from '../utils/types';

const ticketRepo = AppDataSource.getRepository(Ticket);

export function buildPanelEmbed(config: TicketConfig): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(Colors.Blurple)
    .setTitle(`🎟 ${config.panelTitle}`)
    .setDescription(config.panelDescription)
    .addFields(
      {
        name: 'Quick Start',
        value:
          'Press the button below, fill out the form, and a private ticket channel will be created for you.',
      },
      {
        name: 'Staff Commands',
        value:
          '`/claim` · `/close` · `/reopen` · `/rename` · `/add` · `/remove` · `/close-request`',
      }
    );
}

export function buildPanelComponents(config: TicketConfig) {
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(CUSTOM_IDS.createTicket)
        .setLabel(config.buttonLabel)
        .setStyle(ButtonStyle.Primary)
    ),
  ];
}

export function buildTicketControls(ticket: Ticket, claimedByText?: string) {
  const summary = new EmbedBuilder()
    .setColor(ticket.status === 'open' ? Colors.Green : Colors.Red)
    .setTitle(`Ticket #${ticket.id.toString().padStart(4, '0')}`)
    .setDescription(ticket.details || 'No extra details provided.')
    .addFields(
      { name: 'Opened By', value: ticket.openerId ? `<@${ticket.openerId}>` : 'Unknown', inline: true },
      { name: 'Reason', value: ticket.reason || 'No reason provided', inline: true },
      { name: 'Claimed By', value: claimedByText || 'Nobody yet', inline: true }
    );

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(CUSTOM_IDS.ticketClaim)
      .setLabel('Claim')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(ticket.status !== 'open'),
    new ButtonBuilder()
      .setCustomId(CUSTOM_IDS.ticketClose)
      .setLabel('Close')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(ticket.status !== 'open'),
    new ButtonBuilder()
      .setCustomId(CUSTOM_IDS.ticketReopen)
      .setLabel('Reopen')
      .setStyle(ButtonStyle.Success)
      .setDisabled(ticket.status !== 'closed')
  );

  return { embeds: [summary], components: [row] };
}

export async function createTicketChannel(options: {
  client: Client;
  guild: Guild;
  config: TicketConfig;
  openerId: string;
  reason: string;
  details: string;
}) {
  const { client, guild, config, openerId, reason, details } = options;

  if (!config.ticketCategoryId) {
    throw new Error('Ticket category is not configured.');
  }

  const existing = await ticketRepo.findOneBy({
    guildId: guild.id,
    openerId,
    status: 'open',
  });

  if (existing?.channelId) {
    const existingChannel = guild.channels.cache.get(existing.channelId);
    if (existingChannel) {
      return { existingChannel, ticket: existing, created: false as const };
    }
  }

  const ticket = await ticketRepo.save(
    ticketRepo.create({
      guildId: guild.id,
      openerId,
      reason,
      details,
      status: 'open',
    })
  );

  const overwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel],
    },
    {
      id: openerId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
      ],
    },
    {
      id: client.user!.id,
      allow: [PermissionsBitField.Flags.Administrator],
    },
  ];

  if (config.supportRoleId) {
    overwrites.push({
      id: config.supportRoleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageChannels,
      ],
    });
  }

  const channel = await guild.channels.create({
    name: `ticket-${ticket.id.toString().padStart(4, '0')}`,
    type: ChannelType.GuildText,
    parent: config.ticketCategoryId,
    permissionOverwrites: overwrites,
    topic: `Ticket ${ticket.id} | opener ${openerId}`,
  });

  const firstMessage = await (channel as TextChannel).send({
    content: `${config.supportRoleId ? `<@&${config.supportRoleId}> ` : ''}<@${openerId}>`,
    ...buildTicketControls(ticket),
  });

  ticket.channelId = channel.id;
  ticket.messageId = firstMessage.id;
  await ticketRepo.save(ticket);

  await sendLog(config, guild, '🎫 Ticket Created', [
    `Ticket: ${channel}`,
    `User: <@${openerId}>`,
    `Reason: ${reason}`,
  ]);

  return { channel, ticket, created: true as const };
}

export async function sendLog(
  config: TicketConfig,
  guild: Guild,
  title: string,
  lines: string[]
) {
  if (!config.logsChannelId) return;
  const logsChannel = guild.channels.cache.get(config.logsChannelId);
  if (!logsChannel || logsChannel.type !== ChannelType.GuildText) return;

  await (logsChannel as TextChannel).send({
    embeds: [
      new EmbedBuilder()
        .setColor(Colors.Gold)
        .setTitle(title)
        .setDescription(lines.join('\n')),
    ],
  }).catch(() => null);
}

export async function syncTicketMessage(guild: Guild, ticket: Ticket) {
  if (!ticket.channelId || !ticket.messageId) return;
  const channel = guild.channels.cache.get(ticket.channelId);
  if (!channel || channel.type !== ChannelType.GuildText) return;

  const message = await (channel as TextChannel).messages.fetch(ticket.messageId).catch(() => null);
  if (!message) return;

  const claimedByText = ticket.claimedById ? `<@${ticket.claimedById}>` : 'Nobody yet';
  await message.edit(buildTicketControls(ticket, claimedByText)).catch(() => null);
}

export function isStaffMember(memberRoleIds: string[], config: TicketConfig): boolean {
  return Boolean(config.supportRoleId && memberRoleIds.includes(config.supportRoleId));
}
