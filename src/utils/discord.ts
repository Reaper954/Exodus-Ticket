import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
  Colors,
  EmbedBuilder,
  RoleSelectMenuBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextInputStyle
} from 'discord.js';
import { TicketPanel } from '../entities/TicketPanel';
import { TicketType } from '../entities/TicketType';
import { TicketFormField } from '../entities/TicketFormField';
import { SETUP_CUSTOM_IDS, TICKET_CUSTOM_IDS } from './types';

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 90);
}

export function summarizeFields(fields: TicketFormField[]): string {
  if (!fields.length) return 'No form fields yet.';
  return fields
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((field, index) => `${index + 1}. ${field.label} · ${field.style} · ${field.required ? 'required' : 'optional'}`)
    .join('\n');
}

export function buildSetupEmbed(panel: TicketPanel, types: TicketType[], selectedType?: TicketType | null): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(Colors.Blurple)
    .setTitle(`Setup Wizard · ${panel.name}`)
    .setDescription('Use the controls below to configure your ticket panel before deploying it.')
    .addFields(
      { name: 'Panel Title', value: panel.panelTitle || 'Not set', inline: false },
      { name: 'Panel Description', value: panel.panelDescription || 'Not set', inline: false },
      { name: 'Ticket Name Format', value: `\`${panel.namingFormat}\``, inline: false },
      { name: 'Panel Channel', value: panel.panelChannelId ? `<#${panel.panelChannelId}>` : 'Not set', inline: true },
      { name: 'Log Channel', value: panel.logChannelId ? `<#${panel.logChannelId}>` : 'Not set', inline: true },
      { name: 'Default Closed Category', value: panel.defaultClosedCategoryId ? `<#${panel.defaultClosedCategoryId}>` : 'Not set', inline: true },
      { name: 'Claiming', value: panel.claimEnabled ? 'Enabled (not required to close)' : 'Disabled', inline: true },
      { name: 'Ticket Types', value: types.length ? types.map((type) => `• ${type.name}`).join('\n') : 'No ticket types yet.', inline: true },
      {
        name: 'Selected Type',
        value: selectedType
          ? [`Name: ${selectedType.name}`, `Open Category: ${selectedType.openCategoryId ? `<#${selectedType.openCategoryId}>` : 'Not set'}`, `Closed Category: ${selectedType.closedCategoryId ? `<#${selectedType.closedCategoryId}>` : 'Use panel default'}`, `Support Roles: ${selectedType.supportRoleIds?.length ? selectedType.supportRoleIds.map((id) => `<@&${id}>`).join(', ') : 'Not set'}`].join('\n')
          : 'No type selected.',
        inline: false
      }
    )
    .setFooter({ text: 'You can deploy after at least one ticket type is configured.' });
}

export function buildRootComponents(types: TicketType[], selectedTypeId?: string) {
  const rows: any[] = [];
  rows.push(
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(SETUP_CUSTOM_IDS.basics).setLabel('Panel Basics').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(SETUP_CUSTOM_IDS.channels).setLabel('Panel Channels').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(SETUP_CUSTOM_IDS.types).setLabel('Ticket Types').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(SETUP_CUSTOM_IDS.deploy).setLabel('Deploy Panel').setStyle(ButtonStyle.Success)
    )
  );

  if (types.length) {
    rows.push(
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(SETUP_CUSTOM_IDS.typeSelect)
          .setPlaceholder('Select a ticket type to configure')
          .addOptions(
            types.map((type) =>
              new StringSelectMenuOptionBuilder()
                .setLabel(type.name.slice(0, 100))
                .setDescription((type.description || 'No description').slice(0, 100))
                .setValue(String(type.id))
                .setDefault(selectedTypeId === String(type.id))
            )
          )
      )
    );
  }

  rows.push(
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(SETUP_CUSTOM_IDS.addType).setLabel('Add Ticket Type').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(SETUP_CUSTOM_IDS.typeConfig).setLabel('Configure Selected Type').setStyle(ButtonStyle.Secondary).setDisabled(!types.length)
    )
  );

  return rows;
}

export function buildChannelsComponents() {
  return [
    new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId(SETUP_CUSTOM_IDS.selectPanelChannel)
        .setPlaceholder('Choose the channel where the panel will be deployed')
        .addChannelTypes(ChannelType.GuildText)
        .setMinValues(1)
        .setMaxValues(1)
    ),
    new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId(SETUP_CUSTOM_IDS.selectLogChannel)
        .setPlaceholder('Choose the log channel for transcripts')
        .addChannelTypes(ChannelType.GuildText)
        .setMinValues(1)
        .setMaxValues(1)
    ),
    new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId(SETUP_CUSTOM_IDS.selectClosedCategory)
        .setPlaceholder('Choose a default closed ticket category (optional)')
        .addChannelTypes(ChannelType.GuildCategory)
        .setMinValues(0)
        .setMaxValues(1)
    ),
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(SETUP_CUSTOM_IDS.backRoot).setLabel('Back').setStyle(ButtonStyle.Secondary)
    )
  ];
}

export function buildTypeConfigComponents() {
  return [
    new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
      new RoleSelectMenuBuilder()
        .setCustomId(SETUP_CUSTOM_IDS.selectTypeRoles)
        .setPlaceholder('Choose the support role(s) for this ticket type')
        .setMinValues(0)
        .setMaxValues(10)
    ),
    new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId(SETUP_CUSTOM_IDS.selectTypeOpenCategory)
        .setPlaceholder('Choose the open ticket category for this type')
        .addChannelTypes(ChannelType.GuildCategory)
        .setMinValues(1)
        .setMaxValues(1)
    ),
    new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId(SETUP_CUSTOM_IDS.selectTypeClosedCategory)
        .setPlaceholder('Choose a closed ticket category for this type (optional)')
        .addChannelTypes(ChannelType.GuildCategory)
        .setMinValues(0)
        .setMaxValues(1)
    ),
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(SETUP_CUSTOM_IDS.formFields).setLabel('Manage Form Fields').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(SETUP_CUSTOM_IDS.backRoot).setLabel('Back').setStyle(ButtonStyle.Secondary)
    )
  ];
}

export function buildFieldComponents(fields: TicketFormField[]) {
  const rows: any[] = [];
  if (fields.length) {
    rows.push(
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(SETUP_CUSTOM_IDS.removeField)
          .setPlaceholder('Remove a field')
          .addOptions(
            fields
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((field) =>
                new StringSelectMenuOptionBuilder()
                  .setLabel(field.label.slice(0, 100))
                  .setDescription(`${field.style} · ${field.required ? 'required' : 'optional'}`.slice(0, 100))
                  .setValue(String(field.id))
              )
          )
      )
    );
  }

  rows.push(
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(SETUP_CUSTOM_IDS.addField).setLabel('Add Field').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(SETUP_CUSTOM_IDS.backTypeConfig).setLabel('Back').setStyle(ButtonStyle.Secondary)
    )
  );

  return rows;
}

export function buildPanelMessage(panel: TicketPanel, types: TicketType[]) {
  const embed = new EmbedBuilder()
    .setColor(Colors.Blurple)
    .setTitle(panel.panelTitle)
    .setDescription(panel.panelDescription);

  const select = new StringSelectMenuBuilder()
    .setCustomId(TICKET_CUSTOM_IDS.panelTypeSelect)
    .setPlaceholder('Choose a ticket type')
    .addOptions(
      types.map((type) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(type.name.slice(0, 100))
          .setDescription((type.description || 'Open this ticket type.').slice(0, 100))
          .setValue(String(type.id))
      )
    );

  return {
    embeds: [embed],
    components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select)]
  };
}

export function buildOpenTicketEmbed(name: string, typeName: string, creatorId: string, claimedById?: string | null) {
  const embed = new EmbedBuilder()
    .setColor(Colors.Green)
    .setTitle(name)
    .setDescription(`Ticket Type: **${typeName}**\nCreated by: <@${creatorId}>`)
    .addFields({ name: 'Claimed By', value: claimedById ? `<@${claimedById}>` : 'Nobody yet', inline: true });
  return embed;
}

export function buildOpenTicketComponents(claimEnabled: boolean) {
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(TICKET_CUSTOM_IDS.close).setLabel('Close').setStyle(ButtonStyle.Danger)
  );
  if (claimEnabled) {
    row.addComponents(
      new ButtonBuilder().setCustomId(TICKET_CUSTOM_IDS.claim).setLabel('Claim').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(TICKET_CUSTOM_IDS.unclaim).setLabel('Unclaim').setStyle(ButtonStyle.Secondary)
    );
  }
  return [row];
}

export function buildClosedTicketEmbed(name: string, claimedById?: string | null, closedById?: string | null) {
  return new EmbedBuilder()
    .setColor(Colors.Orange)
    .setTitle(`${name} · Closed`)
    .setDescription('This ticket is closed. You can reopen it, generate a transcript, or delete it.')
    .addFields(
      { name: 'Claimed By', value: claimedById ? `<@${claimedById}>` : 'Nobody', inline: true },
      { name: 'Closed By', value: closedById ? `<@${closedById}>` : 'Unknown', inline: true }
    );
}

export function buildClosedTicketComponents() {
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(TICKET_CUSTOM_IDS.reopen).setLabel('Reopen').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(TICKET_CUSTOM_IDS.transcript).setLabel('Transcript').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(TICKET_CUSTOM_IDS.delete).setLabel('Delete').setStyle(ButtonStyle.Danger)
    )
  ];
}

export function styleFromFieldStyle(style: 'short' | 'paragraph') {
  return style === 'paragraph' ? TextInputStyle.Paragraph : TextInputStyle.Short;
}
