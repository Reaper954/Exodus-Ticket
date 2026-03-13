import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
  Colors,
  EmbedBuilder,
  RoleSelectMenuBuilder,
} from 'discord.js';
import { TicketConfig } from '../typeorm/entities/TicketConfig';
import { CUSTOM_IDS } from '../utils/types';

function mentionOrUnset(id: string | null, type: 'channel' | 'role' = 'channel') {
  if (!id) return '`Not set`';
  return type === 'role' ? `<@&${id}>` : `<#${id}>`;
}

export function buildSetupEmbed(config: TicketConfig) {
  return new EmbedBuilder()
    .setColor(Colors.Blurple)
    .setTitle('🎟 Exodus Tickets - Setup Menu')
    .setDescription('Use the controls below to configure your ticket system, then deploy the panel.')
    .addFields(
      { name: 'Panel Channel', value: mentionOrUnset(config.panelChannelId), inline: true },
      { name: 'Ticket Category', value: mentionOrUnset(config.ticketCategoryId), inline: true },
      { name: 'Logs Channel', value: mentionOrUnset(config.logsChannelId), inline: true },
      { name: 'Support Role', value: mentionOrUnset(config.supportRoleId, 'role'), inline: true },
      { name: 'Panel Title', value: `\`${config.panelTitle}\``, inline: false },
      { name: 'Button Label', value: `\`${config.buttonLabel}\``, inline: true },
      { name: 'Panel Description', value: config.panelDescription.slice(0, 1024), inline: false }
    );
}

export function buildSetupComponents() {
  const topRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(CUSTOM_IDS.setupEditPanel)
      .setLabel('Edit Panel')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(CUSTOM_IDS.setupDeployPanel)
      .setLabel('Deploy Panel')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(CUSTOM_IDS.setupRefresh)
      .setLabel('Refresh')
      .setStyle(ButtonStyle.Secondary)
  );

  const channelRow = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
    new ChannelSelectMenuBuilder()
      .setCustomId(CUSTOM_IDS.setupSelectPanelChannel)
      .setPlaceholder('Choose the panel channel')
      .setChannelTypes(ChannelType.GuildText)
      .setMinValues(1)
      .setMaxValues(1),
  );

  const categoryRow = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
    new ChannelSelectMenuBuilder()
      .setCustomId(CUSTOM_IDS.setupSelectTicketCategory)
      .setPlaceholder('Choose the ticket category')
      .setChannelTypes(ChannelType.GuildCategory)
      .setMinValues(1)
      .setMaxValues(1),
  );

  const logsRow = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
    new ChannelSelectMenuBuilder()
      .setCustomId(CUSTOM_IDS.setupSelectLogsChannel)
      .setPlaceholder('Choose the logs channel')
      .setChannelTypes(ChannelType.GuildText)
      .setMinValues(1)
      .setMaxValues(1),
  );

  const roleRow = new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
    new RoleSelectMenuBuilder()
      .setCustomId(CUSTOM_IDS.setupSelectSupportRole)
      .setPlaceholder('Choose the support role')
      .setMinValues(1)
      .setMaxValues(1)
  );

  return [topRow, channelRow, categoryRow, logsRow, roleRow];
}
