
import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";

export function buildBasicsModal(): ModalBuilder {
  const panelName = new TextInputBuilder()
    .setCustomId("panelName")
    .setLabel("Panel Name")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const panelDescription = new TextInputBuilder()
    .setCustomId("panelDescription")
    .setLabel("Panel Description")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);

  return new ModalBuilder()
    .setCustomId("setup_basics_modal")
    .setTitle("Panel Basics")
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(panelName),
      new ActionRowBuilder<TextInputBuilder>().addComponents(panelDescription)
    );
}

export function buildAddTypeModal(): ModalBuilder {
  const typeName = new TextInputBuilder()
    .setCustomId("typeName")
    .setLabel("Ticket Type Name")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const namingFormat = new TextInputBuilder()
    .setCustomId("namingFormat")
    .setLabel("Ticket Naming Format")
    .setPlaceholder("{type}-{username}")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  return new ModalBuilder()
    .setCustomId("setup_add_type_modal")
    .setTitle("Add Ticket Type")
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(typeName),
      new ActionRowBuilder<TextInputBuilder>().addComponents(namingFormat)
    );
}

export function buildAddFieldModal(): ModalBuilder {
  const fieldLabel = new TextInputBuilder()
    .setCustomId("fieldLabel")
    .setLabel("Field Label")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const fieldPlaceholder = new TextInputBuilder()
    .setCustomId("fieldPlaceholder")
    .setLabel("Field Placeholder")
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  const fieldRequired = new TextInputBuilder()
    .setCustomId("fieldRequired")
    .setLabel("Required? (yes/no)")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  return new ModalBuilder()
    .setCustomId("setup_add_field_modal")
    .setTitle("Add Form Field")
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(fieldLabel),
      new ActionRowBuilder<TextInputBuilder>().addComponents(fieldPlaceholder),
      new ActionRowBuilder<TextInputBuilder>().addComponents(fieldRequired)
    );
}
