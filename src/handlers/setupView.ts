import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
  EmbedBuilder,
  ModalBuilder,
  RoleSelectMenuBuilder,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';

type MaybeType = {
  name?: string;
  label?: string;
  customId?: string;
  fields?: Array<{ label?: string; required?: boolean }>;
};

function normalizeType(type?: MaybeType) {
  return {
    name: type?.name ?? type?.label ?? 'Untitled Type',
    customId: type?.customId ?? 'type',
    fields: type?.fields ?? [],
  };
}

export function renderSetupRoot(config?: any) {
  const typeCount = Array.isArray(config?.ticketTypes) ? config.ticketTypes.length : 0;

  const embed = new EmbedBuilder()
    .setTitle('Ticket Setup Wizard')
    .setDescription(
      [
        'Use the controls below to configure your ticket system.',
        '',
        `**Panel Title:** ${config?.panelTitle ?? 'Not set'}`,
        `**Panel Description:** ${config?.panelDescription ?? 'Not set'}`,
        `**Ticket Types:** ${typeCount}`,
        `**Panel Channel:** ${config?.panelChannelId ? `<#${config.panelChannelId}>` : 'Not set'}`,
        `**Open Category:** ${config?.openCategoryId ? `<#${config.openCategoryId}>` : 'Not set'}`,
        `**Closed Category:** ${config?.closedCategoryId ? `<#${config.closedCategoryId}>` : 'Not set'}`,
        `**Log Channel:** ${config?.logChannelId ? `<#${config.logChannelId}>` : 'Not set'}`,
      ].join('\n')
    );

  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('setup_basics')
      .setLabel('Panel Basics')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('setup_channels')
      .setLabel('Channels')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('setup_add_type')
      .setLabel('Add Ticket Type')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('setup_deploy')
      .setLabel('Deploy Panel')
      .setStyle(ButtonStyle.Success)
      .setDisabled(typeCount === 0 || !config?.panelChannelId)
  );

  const typeOptions =
    typeCount > 0
      ? config.ticketTypes.slice(0, 25).map((t: any, i: number) => {
          const nt = normalizeType(t);
          return {
            label: nt.name.slice(0, 100),
            value: `type_${i}`,
            description: `Edit ${nt.name}`.slice(0, 100),
          };
        })
      : [
          {
            label: 'No ticket types yet',
            value: 'type_none',
            description: 'Add a ticket type first',
          },
        ];

  const row2 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('setup_type_select')
      .setPlaceholder(typeCount > 0 ? 'Select a ticket type to edit' : 'No ticket types yet')
      .addOptions(typeOptions)
      .setDisabled(typeCount === 0)
  );

  return {
    embeds: [embed],
    components: [row1, row2],
  };
}

export function renderChannelsView(config?: any) {
  const embed = new EmbedBuilder()
    .setTitle('Channel Configuration')
    .setDescription(
      [
        'Select the channels and categories used by this ticket panel.',
        '',
        `**Panel Channel:** ${config?.panelChannelId ? `<#${config.panelChannelId}>` : 'Not set'}`,
        `**Open Category:** ${config?.openCategoryId ? `<#${config.openCategoryId}>` : 'Not set'}`,
        `**Closed Category:** ${config?.closedCategoryId ? `<#${config.closedCategoryId}>` : 'Not set'}`,
        `**Log Channel:** ${config?.logChannelId ? `<#${config.logChannelId}>` : 'Not set'}`,
      ].join('\n')
    );

  const panelChannelRow = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
    new ChannelSelectMenuBuilder()
      .setCustomId('setup_panel_channel')
      .setPlaceholder('Select panel channel')
      .setChannelTypes(ChannelType.GuildText)
      .setMinValues(1)
      .setMaxValues(1)
  );

  const openCategoryRow = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
    new ChannelSelectMenuBuilder()
      .setCustomId('setup_open_category')
      .setPlaceholder('Select open ticket category')
      .setChannelTypes(ChannelType.GuildCategory)
      .setMinValues(1)
      .setMaxValues(1)
  );

  const closedCategoryRow = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
    new ChannelSelectMenuBuilder()
      .setCustomId('setup_closed_category')
      .setPlaceholder('Select closed ticket category (optional)')
      .setChannelTypes(ChannelType.GuildCategory)
      .setMinValues(0)
      .setMaxValues(1)
  );

  const logChannelRow = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
    new ChannelSelectMenuBuilder()
      .setCustomId('setup_log_channel')
      .setPlaceholder('Select transcript / log channel')
      .setChannelTypes(ChannelType.GuildText)
      .setMinValues(1)
      .setMaxValues(1)
  );

  const backRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('setup_back_root')
      .setLabel('Back')
      .setStyle(ButtonStyle.Secondary)
  );

  return {
    embeds: [embed],
    components: [panelChannelRow, openCategoryRow, closedCategoryRow, logChannelRow, backRow],
  };
}

export function renderTypeConfigView(type?: any) {
  const currentType = normalizeType(type);

  const embed = new EmbedBuilder()
    .setTitle(`Ticket Type: ${currentType.name}`)
    .setDescription(
      [
        `**Name:** ${currentType.name}`,
        `**Custom ID:** ${currentType.customId}`,
        `**Fields:** ${currentType.fields.length}`,
        '',
        'Configure support roles and form fields for this ticket type.',
      ].join('\n')
    );

  const roleRow = new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
    new RoleSelectMenuBuilder()
      .setCustomId('setup_type_roles')
      .setPlaceholder('Select support role(s) for this type')
      .setMinValues(1)
      .setMaxValues(10)
  );

  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('setup_add_field')
      .setLabel('Add Form Field')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('setup_view_fields')
      .setLabel('View Fields')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('setup_back_root')
      .setLabel('Back')
      .setStyle(ButtonStyle.Secondary)
  );

  return {
    embeds: [embed],
    components: [roleRow, actionRow],
  };
}

export function renderFieldView(type?: any) {
  const currentType = normalizeType(type);

  const fieldLines =
    currentType.fields.length > 0
      ? currentType.fields.map((field, index) => {
          const label = field?.label ?? `Field ${index + 1}`;
          const required = field?.required ? 'Required' : 'Optional';
          return `${index + 1}. ${label} — ${required}`;
        })
      : ['No form fields added yet.'];

  const embed = new EmbedBuilder()
    .setTitle(`Fields: ${currentType.name}`)
    .setDescription(fieldLines.join('\n'));

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('setup_add_field')
      .setLabel('Add Field')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('setup_back_type')
      .setLabel('Back')
      .setStyle(ButtonStyle.Secondary)
  );

  return {
    embeds: [embed],
    components: [row],
  };
}

export function buildBasicsModal(): ModalBuilder {
  const panelTitle = new TextInputBuilder()
    .setCustomId('panelTitle')
    .setLabel('Panel Title')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const panelDescription = new TextInputBuilder()
    .setCustomId('panelDescription')
    .setLabel('Panel Description')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);

  return new ModalBuilder()
    .setCustomId('setup_basics_modal')
    .setTitle('Panel Basics')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(panelTitle),
      new ActionRowBuilder<TextInputBuilder>().addComponents(panelDescription)
    );
}

export function buildAddTypeModal(): ModalBuilder {
  const typeName = new TextInputBuilder()
    .setCustomId('typeName')
    .setLabel('Ticket Type Name')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const namingFormat = new TextInputBuilder()
    .setCustomId('namingFormat')
    .setLabel('Ticket Naming Format')
    .setPlaceholder('{type}-{username}')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  return new ModalBuilder()
    .setCustomId('setup_add_type_modal')
    .setTitle('Add Ticket Type')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(typeName),
      new ActionRowBuilder<TextInputBuilder>().addComponents(namingFormat)
    );
}

export function buildAddFieldModal(): ModalBuilder {
  const fieldLabel = new TextInputBuilder()
    .setCustomId('fieldLabel')
    .setLabel('Field Label')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const fieldPlaceholder = new TextInputBuilder()
    .setCustomId('fieldPlaceholder')
    .setLabel('Field Placeholder')
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  const fieldRequired = new TextInputBuilder()
    .setCustomId('fieldRequired')
    .setLabel('Required? (yes/no)')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  return new ModalBuilder()
    .setCustomId('setup_add_field_modal')
    .setTitle('Add Form Field')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(fieldLabel),
      new ActionRowBuilder<TextInputBuilder>().addComponents(fieldPlaceholder),
      new ActionRowBuilder<TextInputBuilder>().addComponents(fieldRequired)
    );
}