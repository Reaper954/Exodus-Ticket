export type TicketStatus = 'open' | 'closed' | 'deleted';
export type FieldStyle = 'short' | 'paragraph';

export const SETUP_CUSTOM_IDS = {
  root: 'setup:root',
  basics: 'setup:basics',
  channels: 'setup:channels',
  types: 'setup:types',
  addType: 'setup:addType',
  typeSelect: 'setup:typeSelect',
  typeConfig: 'setup:typeConfig',
  formFields: 'setup:formFields',
  addField: 'setup:addField',
  removeField: 'setup:removeField',
  deploy: 'setup:deploy',
  backRoot: 'setup:backRoot',
  backTypes: 'setup:backTypes',
  backTypeConfig: 'setup:backTypeConfig',
  selectPanelChannel: 'setup:panelChannel',
  selectLogChannel: 'setup:logChannel',
  selectClosedCategory: 'setup:panelClosedCategory',
  selectTypeOpenCategory: 'setup:typeOpenCategory',
  selectTypeClosedCategory: 'setup:typeClosedCategory',
  selectTypeRoles: 'setup:typeRoles'
} as const;

export const TICKET_CUSTOM_IDS = {
  panelTypeSelect: 'panel:typeSelect',
  claim: 'ticket:claim',
  unclaim: 'ticket:unclaim',
  close: 'ticket:close',
  reopen: 'ticket:reopen',
  transcript: 'ticket:transcript',
  delete: 'ticket:delete',
  confirmDelete: 'ticket:confirmDelete',
  cancelDelete: 'ticket:cancelDelete'
} as const;
