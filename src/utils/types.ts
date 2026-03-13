export type TicketStatus = 'open' | 'closed';

export type ConfigStep =
  | 'panel_channel'
  | 'ticket_category'
  | 'logs_channel'
  | 'support_role';

export const CUSTOM_IDS = {
  createTicket: 'ticket:create',
  ticketClaim: 'ticket:claim',
  ticketClose: 'ticket:close',
  ticketReopen: 'ticket:reopen',
  setupRefresh: 'setup:refresh',
  setupEditPanel: 'setup:edit-panel',
  setupDeployPanel: 'setup:deploy-panel',
  setupSelectPanelChannel: 'setup:select:panel_channel',
  setupSelectTicketCategory: 'setup:select:ticket_category',
  setupSelectLogsChannel: 'setup:select:logs_channel',
  setupSelectSupportRole: 'setup:select:support_role',
  ticketCreateModal: 'ticket:create-modal',
  setupPanelModal: 'setup:panel-modal',
} as const;
