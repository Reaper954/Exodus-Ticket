import { ButtonInteraction, ChatInputCommandInteraction, Colors, EmbedBuilder, ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle, StringSelectMenuInteraction, RoleSelectMenuInteraction, ChannelSelectMenuInteraction } from 'discord.js';
import { panelService } from '../services/panelService';
import { getSelectedType, setSelectedType } from '../services/setupState';
import { buildChannelsComponents, buildFieldComponents, buildRootComponents, buildSetupEmbed, buildTypeConfigComponents, summarizeFields } from '../utils/discord';
import { SETUP_CUSTOM_IDS } from '../utils/types';

export async function renderSetupRoot(interaction: ChatInputCommandInteraction | ButtonInteraction | StringSelectMenuInteraction | RoleSelectMenuInteraction | ChannelSelectMenuInteraction) {
  const guildId = interaction.guildId!;
  const panel = await panelService.getDraftWithRelations(guildId);
  const selectedId = getSelectedType(guildId);
  const selected = selectedId ? panel.types.find((type) => type.id === selectedId) ?? null : panel.types[0] ?? null;
  if (selected) setSelectedType(guildId, selected.id);

  const payload = {
    embeds: [buildSetupEmbed(panel, panel.types, selected)],
    components: buildRootComponents(panel.types, selected ? String(selected.id) : undefined) as any,
    ephemeral: true
  };

  if (interaction.isRepliable()) {
    if (interaction.replied || interaction.deferred) {
      return interaction.editReply(payload as any);
    }
    return interaction.reply(payload as any);
  }
}

export async function renderChannelsView(interaction: ButtonInteraction | ChannelSelectMenuInteraction) {
  const panel = await panelService.getDraftWithRelations(interaction.guildId!);
  const embed = new EmbedBuilder()
    .setColor(Colors.Blurple)
    .setTitle('Panel Channels')
    .setDescription('Choose the channel to deploy your panel, the log channel for transcripts, and an optional default closed category.')
    .addFields(
      { name: 'Panel Channel', value: panel.panelChannelId ? `<#${panel.panelChannelId}>` : 'Not set', inline: true },
      { name: 'Log Channel', value: panel.logChannelId ? `<#${panel.logChannelId}>` : 'Not set', inline: true },
      { name: 'Default Closed Category', value: panel.defaultClosedCategoryId ? `<#${panel.defaultClosedCategoryId}>` : 'Not set', inline: true }
    );

  return interaction.update({ embeds: [embed], components: buildChannelsComponents() as any } as any);
}

export async function renderTypeConfigView(interaction: ButtonInteraction | StringSelectMenuInteraction | RoleSelectMenuInteraction | ChannelSelectMenuInteraction) {
  const panel = await panelService.getDraftWithRelations(interaction.guildId!);
  const selectedId = getSelectedType(interaction.guildId!);
  const selected = selectedId ? panel.types.find((type) => type.id === selectedId) : null;

  if (!selected) {
    return interaction.reply({ content: 'Select a ticket type first.', ephemeral: true } as any);
  }

  const embed = new EmbedBuilder()
    .setColor(Colors.Blurple)
    .setTitle(`Configure Ticket Type · ${selected.name}`)
    .setDescription('Choose support roles, open/closed categories, and manage form fields.')
    .addFields(
      { name: 'Description', value: selected.description || 'No description', inline: false },
      { name: 'Open Category', value: selected.openCategoryId ? `<#${selected.openCategoryId}>` : 'Not set', inline: true },
      { name: 'Closed Category', value: selected.closedCategoryId ? `<#${selected.closedCategoryId}>` : 'Use panel default / stay in place', inline: true },
      { name: 'Support Roles', value: selected.supportRoleIds?.length ? selected.supportRoleIds.map((id) => `<@&${id}>`).join(', ') : 'None set', inline: false },
      { name: 'Form Fields', value: summarizeFields(selected.fields || []), inline: false }
    );

  return interaction.update({ embeds: [embed], components: buildTypeConfigComponents() as any } as any);
}

export async function renderFieldView(interaction: ButtonInteraction | StringSelectMenuInteraction) {
  const panel = await panelService.getDraftWithRelations(interaction.guildId!);
  const selectedId = getSelectedType(interaction.guildId!);
  const selected = selectedId ? panel.types.find((type) => type.id === selectedId) : null;
  if (!selected) {
    return interaction.reply({ content: 'Select a ticket type first.', ephemeral: true } as any);
  }
  const embed = new EmbedBuilder()
    .setColor(Colors.Blurple)
    .setTitle(`Form Fields · ${selected.name}`)
    .setDescription('Add or remove fields for the ticket creation modal.')
    .addFields({ name: 'Current Fields', value: summarizeFields(selected.fields || []), inline: false });

  return interaction.update({ embeds: [embed], components: buildFieldComponents(selected.fields || []) as any } as any);
}

export function buildBasicsModal() {
  return new ModalBuilder()
    .setCustomId(SETUP_CUSTOM_IDS.basics)
    .setTitle('Panel Basics')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder().setCustomId('name').setLabel('Panel Name').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(100)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder().setCustomId('title').setLabel('Panel Title').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(150)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder().setCustomId('description').setLabel('Panel Description').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(1000)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder().setCustomId('namingFormat').setLabel('Ticket Naming Format').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('{type}-{counter}-{username}').setMaxLength(150)
      )
    );
}

export function buildAddTypeModal() {
  return new ModalBuilder()
    .setCustomId(SETUP_CUSTOM_IDS.addType)
    .setTitle('Add Ticket Type')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder().setCustomId('typeName').setLabel('Ticket Type Name').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(100)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder().setCustomId('typeDescription').setLabel('Description').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(200)
      )
    );
}

export function buildAddFieldModal() {
  return new ModalBuilder()
    .setCustomId(SETUP_CUSTOM_IDS.addField)
    .setTitle('Add Form Field')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder().setCustomId('label').setLabel('Field Label').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(100)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder().setCustomId('placeholder').setLabel('Placeholder').setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(100)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder().setCustomId('style').setLabel('Style: short or paragraph').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('short').setMaxLength(20)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder().setCustomId('required').setLabel('Required? yes or no').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('yes').setMaxLength(10)
      )
    );
}
