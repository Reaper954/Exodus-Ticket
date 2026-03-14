import type { APIModalInteractionResponseCallbackData } from 'discord-api-types/v10';
import {
  ButtonBuilder,
  ButtonInteraction,
  ChannelSelectMenuInteraction,
  Client,
  ModalBuilder,
  ModalSubmitInteraction,
  RoleSelectMenuInteraction,
  StringSelectMenuInteraction,
  ActionRowBuilder,
  TextInputBuilder,
  ButtonStyle,
} from 'discord.js';
import { panelService } from '../services/panelService';
import { setSelectedType, getSelectedType } from '../services/setupState';
import {
  renderChannelsView,
  renderFieldView,
  renderSetupRoot,
  renderTypeConfigView,
  buildBasicsModal,
  buildAddTypeModal,
  buildAddFieldModal,
} from './setupView';
import { SETUP_CUSTOM_IDS, TICKET_CUSTOM_IDS } from '../utils/types';
import { ticketService } from '../services/ticketService';
import { AppDataSource } from '../data-source';
import { TicketType } from '../entities/TicketType';
import { styleFromFieldStyle } from '../utils/discord';

function toModalData(modal: ModalBuilder): APIModalInteractionResponseCallbackData {
  return modal.toJSON() as APIModalInteractionResponseCallbackData;
}

export async function handleButtonInteraction(client: Client, interaction: ButtonInteraction) {
  const { customId } = interaction;

  if (customId === SETUP_CUSTOM_IDS.basics) {
    await interaction.showModal(toModalData(buildBasicsModal()));
    return;
  }

  if (customId === SETUP_CUSTOM_IDS.channels) {
    await renderChannelsView(interaction);
    return;
  }

  if (customId === SETUP_CUSTOM_IDS.addType) {
    await interaction.showModal(toModalData(buildAddTypeModal()));
    return;
  }

  if (customId === SETUP_CUSTOM_IDS.typeConfig) {
    await renderTypeConfigView(interaction);
    return;
  }

  if (customId === SETUP_CUSTOM_IDS.formFields) {
    await renderFieldView(interaction);
    return;
  }

  if (customId === SETUP_CUSTOM_IDS.addField) {
    await interaction.showModal(toModalData(buildAddFieldModal()));
    return;
  }

  if (customId === SETUP_CUSTOM_IDS.backRoot) {
    await renderSetupRoot(interaction);
    return;
  }

  if (customId === SETUP_CUSTOM_IDS.backTypeConfig) {
    await renderTypeConfigView(interaction);
    return;
  }

  if (customId === SETUP_CUSTOM_IDS.deploy) {
    const panel = await panelService.deployPanel(interaction.guildId!);
    const message = await ticketService.deployPanel(client, panel.id);
    await interaction.reply({
      content: `Panel deployed in <#${panel.panelChannelId}>. Message ID: ${message.id}`,
      ephemeral: true,
    } as any);
    return;
  }

  if (customId === TICKET_CUSTOM_IDS.claim) {
    await ticketService.setClaim(interaction.channelId, interaction.user.id);
    await interaction.reply({
      content: `Claimed by <@${interaction.user.id}>.`,
      ephemeral: true,
    } as any);
    return;
  }

  if (customId === TICKET_CUSTOM_IDS.unclaim) {
    await ticketService.setClaim(interaction.channelId, null);
    await interaction.reply({
      content: 'Ticket unclaimed.',
      ephemeral: true,
    } as any);
    return;
  }

  if (customId === TICKET_CUSTOM_IDS.close) {
    await ticketService.closeTicket(client, interaction.channelId, interaction.user.id);
    await interaction.reply({
      content: 'Ticket closed.',
      ephemeral: true,
    } as any);
    return;
  }

  if (customId === TICKET_CUSTOM_IDS.reopen) {
    await ticketService.reopenTicket(client, interaction.channelId);
    await interaction.reply({
      content: 'Ticket reopened.',
      ephemeral: true,
    } as any);
    return;
  }

  if (customId === TICKET_CUSTOM_IDS.transcript) {
    const attachment = await ticketService.generateTranscriptAndLog(client, interaction.channelId);
    await interaction.reply({
      content: 'Transcript generated.',
      files: [attachment],
      ephemeral: true,
    } as any);
    return;
  }

  if (customId === TICKET_CUSTOM_IDS.delete) {
    const confirmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(TICKET_CUSTOM_IDS.confirmDelete)
        .setLabel('Confirm Delete')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(TICKET_CUSTOM_IDS.cancelDelete)
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({
      content: 'Delete this ticket? This will generate a transcript and remove the channel.',
      components: [confirmRow],
      ephemeral: true,
    } as any);
    return;
  }

  if (customId === TICKET_CUSTOM_IDS.confirmDelete) {
    await interaction.update({
      content: 'Deleting ticket...',
      components: [],
    } as any);
    await ticketService.deleteTicket(client, interaction.channelId);
    return;
  }

  if (customId === TICKET_CUSTOM_IDS.cancelDelete) {
    await interaction.update({
      content: 'Delete cancelled.',
      components: [],
    } as any);
    return;
  }
}

export async function handleSelectMenuInteraction(
  interaction: StringSelectMenuInteraction | RoleSelectMenuInteraction | ChannelSelectMenuInteraction
) {
  const { customId } = interaction;

  if (customId === SETUP_CUSTOM_IDS.typeSelect && interaction.isStringSelectMenu()) {
    setSelectedType(interaction.guildId!, Number(interaction.values[0]));
    await renderSetupRoot(interaction);
    return;
  }

  if (customId === SETUP_CUSTOM_IDS.removeField && interaction.isStringSelectMenu()) {
    await panelService.removeField(Number(interaction.values[0]));
    await renderFieldView(interaction);
    return;
  }

  if (customId === SETUP_CUSTOM_IDS.selectPanelChannel && interaction.isChannelSelectMenu()) {
    await panelService.updatePanelBasics(interaction.guildId!, {
      panelChannelId: interaction.values[0] || null,
    });
    await renderChannelsView(interaction);
    return;
  }

  if (customId === SETUP_CUSTOM_IDS.selectLogChannel && interaction.isChannelSelectMenu()) {
    await panelService.updatePanelBasics(interaction.guildId!, {
      logChannelId: interaction.values[0] || null,
    });
    await renderChannelsView(interaction);
    return;
  }

  if (customId === SETUP_CUSTOM_IDS.selectClosedCategory && interaction.isChannelSelectMenu()) {
    await panelService.updatePanelBasics(interaction.guildId!, {
      defaultClosedCategoryId: interaction.values[0] || null,
    });
    await renderChannelsView(interaction);
    return;
  }

  const selectedTypeId = getSelectedType(interaction.guildId!);
  if (!selectedTypeId) {
    await interaction.reply({
      content: 'Select a ticket type first.',
      ephemeral: true,
    } as any);
    return;
  }

  if (customId === SETUP_CUSTOM_IDS.selectTypeRoles && interaction.isRoleSelectMenu()) {
    await panelService.updateTicketType(selectedTypeId, {
      supportRoleIds: interaction.values,
    });
    await renderTypeConfigView(interaction);
    return;
  }

  if (customId === SETUP_CUSTOM_IDS.selectTypeOpenCategory && interaction.isChannelSelectMenu()) {
    await panelService.updateTicketType(selectedTypeId, {
      openCategoryId: interaction.values[0] || null,
    });
    await renderTypeConfigView(interaction);
    return;
  }

  if (customId === SETUP_CUSTOM_IDS.selectTypeClosedCategory && interaction.isChannelSelectMenu()) {
    await panelService.updateTicketType(selectedTypeId, {
      closedCategoryId: interaction.values[0] || null,
    });
    await renderTypeConfigView(interaction);
    return;
  }

  if (customId === TICKET_CUSTOM_IDS.panelTypeSelect && interaction.isStringSelectMenu()) {
    const typeId = Number(interaction.values[0]);
    const typeRepo = AppDataSource.getRepository(TicketType);
    const type = await typeRepo.findOne({
      where: { id: typeId },
      relations: ['fields'],
    });

    if (!type) {
      await interaction.reply({
        content: 'Ticket type not found.',
        ephemeral: true,
      } as any);
      return;
    }

    const modal = new ModalBuilder()
      .setCustomId(`${TICKET_CUSTOM_IDS.panelTypeSelect}:${type.id}`)
      .setTitle(`Open ${type.name}`);

    const fields = (type.fields || [])
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .slice(0, 5);

    if (!fields.length) {
      fields.push({
        id: 0,
        label: 'Reason',
        placeholder: 'How can we help?',
        required: true,
        style: 'paragraph',
        sortOrder: 0,
      } as any);
    }

    modal.addComponents(
      ...fields.map((field) =>
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId(`field_${field.id}`)
            .setLabel(field.label)
            .setRequired(field.required)
            .setStyle(styleFromFieldStyle(field.style))
            .setPlaceholder(field.placeholder || '')
            .setMaxLength(field.style === 'paragraph' ? 1000 : 200)
        )
      )
    );

    await interaction.showModal(toModalData(modal));
    return;
  }
}

export async function handleModalSubmit(client: Client, interaction: ModalSubmitInteraction) {
  if (interaction.customId === SETUP_CUSTOM_IDS.basics) {
    await panelService.updatePanelBasics(interaction.guildId!, {
      name: interaction.fields.getTextInputValue('panelTitle'),
      panelTitle: interaction.fields.getTextInputValue('panelTitle'),
      panelDescription: interaction.fields.getTextInputValue('panelDescription'),
    });

    await interaction.reply({
      content: 'Panel basics updated.',
      ephemeral: true,
    } as any);
    return;
  }

  if (interaction.customId === SETUP_CUSTOM_IDS.addType) {
    const typeName = interaction.fields.getTextInputValue('typeName');
    const namingFormat = interaction.fields.getTextInputValue('namingFormat');

    const panel = await panelService.addTicketType(
      interaction.guildId!,
      typeName,
      namingFormat
    );

    const newType = panel.types[panel.types.length - 1];
    if (newType) setSelectedType(interaction.guildId!, newType.id);

    await interaction.reply({
      content: `Added ticket type **${typeName}**.`,
      ephemeral: true,
    } as any);
    return;
  }

  if (interaction.customId === SETUP_CUSTOM_IDS.addField) {
    const selectedTypeId = getSelectedType(interaction.guildId!);

    if (!selectedTypeId) {
      await interaction.reply({
        content: 'Select a ticket type first.',
        ephemeral: true,
      } as any);
      return;
    }

    const requiredValue = ['yes', 'true', 'required', 'y', '1'].includes(
      interaction.fields.getTextInputValue('fieldRequired').trim().toLowerCase()
    );

    await panelService.addField(
      selectedTypeId,
      interaction.fields.getTextInputValue('fieldLabel'),
      interaction.fields.getTextInputValue('fieldPlaceholder') || null,
      requiredValue,
      'short'
    );

    await interaction.reply({
      content: 'Field added.',
      ephemeral: true,
    } as any);
    return;
  }

  if (interaction.customId.startsWith(`${TICKET_CUSTOM_IDS.panelTypeSelect}:`)) {
    const typeId = Number(interaction.customId.split(':')[1]);
    const type = await AppDataSource.getRepository(TicketType).findOne({
      where: { id: typeId },
      relations: ['fields'],
    });

    if (!type) {
      await interaction.reply({
        content: 'Ticket type not found.',
        ephemeral: true,
      } as any);
      return;
    }

    const answers: Record<string, string> = {};
    const fields = (type.fields || []).sort((a, b) => a.sortOrder - b.sortOrder);

    if (!fields.length) {
      answers['Reason'] = interaction.fields.getTextInputValue('field_0');
    } else {
      for (const field of fields.slice(0, 5)) {
        answers[field.label] = interaction.fields.getTextInputValue(`field_${field.id}`);
      }
    }

    try {
      const { channel } = await ticketService.createTicket(
        client,
        typeId,
        interaction.user.id,
        interaction.user.username,
        answers
      );

      await interaction.reply({
        content: `Your ticket has been created: <#${channel.id}>`,
        ephemeral: true,
      } as any);
    } catch (error) {
      await interaction.reply({
        content: error instanceof Error ? error.message : 'Could not create ticket.',
        ephemeral: true,
      } as any);
    }
  }
}