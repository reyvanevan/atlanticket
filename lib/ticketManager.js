const { loadJSON, saveJSON, STORAGE_PATH } = require('./storage');

/**
 * Ticket Manager - Handle semua operasi tiket
 */

const loadTickets = () => loadJSON(STORAGE_PATH.TICKETS, { tickets: [] }).tickets;

const saveTickets = (tickets) => {
  return saveJSON(STORAGE_PATH.TICKETS, { tickets }, 'Tickets');
};

const ticketManager = {
  /**
   * Create new ticket
   */
  create: (ticketData) => {
    try {
      const tickets = loadTickets();
      const newTicket = {
        ticketID: ticketData.ticketID,
        refID: ticketData.refID,
        buyerJid: ticketData.buyerJid,
        buyerName: ticketData.buyerName,
        buyerPhone: ticketData.buyerPhone,
        konser: ticketData.konser,
        harga: ticketData.harga,
        status: 'aktif', // aktif | used | invalid
        securityCode: ticketData.securityCode,
        createdAt: new Date().toISOString(),
        approvedAt: new Date().toISOString(),
        approvedBy: ticketData.approvedBy,
        catatan: ticketData.catatan || '',
        scannedAt: null,
        scannedBy: null
      };
      
      tickets.push(newTicket);
      saveTickets(tickets);
      console.log(`✅ Ticket created: ${ticketData.ticketID}`);
      return newTicket;
    } catch (err) {
      console.error('❌ Error creating ticket:', err.message);
      return null;
    }
  },

  /**
   * Get ticket by ID
   */
  findById: (ticketID) => {
    try {
      const tickets = loadTickets();
      return tickets.find(t => t.ticketID === ticketID) || null;
    } catch (err) {
      console.error('❌ Error finding ticket:', err.message);
      return null;
    }
  },

  /**
   * Get ticket by refID
   */
  findByRefId: (refID) => {
    try {
      const tickets = loadTickets();
      return tickets.find(t => t.refID === refID) || null;
    } catch (err) {
      console.error('❌ Error finding ticket by refID:', err.message);
      return null;
    }
  },

  /**
   * Update ticket status
   */
  updateStatus: (ticketID, status, scannerPhone = null) => {
    try {
      const tickets = loadTickets();
      const ticket = tickets.find(t => t.ticketID === ticketID);
      if (!ticket) return false;

      ticket.status = status;
      if (status === 'used') {
        ticket.scannedAt = new Date().toISOString();
        ticket.scannedBy = scannerPhone;
      }
      saveTickets(tickets);
      console.log(`✅ Ticket ${ticketID} status updated to ${status}`);
      return true;
    } catch (err) {
      console.error('❌ Error updating ticket status:', err.message);
      return false;
    }
  },

  /**
   * Get all tickets
   */
  getAll: () => {
    try {
      return loadTickets();
    } catch (err) {
      console.error('❌ Error getting all tickets:', err.message);
      return [];
    }
  },

  /**
   * Get tickets by status
   */
  getByStatus: (status) => {
    try {
      const tickets = loadTickets();
      return tickets.filter(t => t.status === status);
    } catch (err) {
      console.error('❌ Error getting tickets by status:', err.message);
      return [];
    }
  },

  /**
   * Get tickets by concert
   */
  getByKonser: (konser) => {
    try {
      const tickets = loadTickets();
      return tickets.filter(t => t.konser === konser);
    } catch (err) {
      console.error('❌ Error getting tickets by konser:', err.message);
      return [];
    }
  },

  /**
   * Count tickets by various criteria
   */
  getStats: () => {
    try {
      const tickets = loadTickets();
      return {
        total: tickets.length,
        aktif: tickets.filter(t => t.status === 'aktif').length,
        used: tickets.filter(t => t.status === 'used').length,
        invalid: tickets.filter(t => t.status === 'invalid').length
      };
    } catch (err) {
      console.error('❌ Error getting ticket stats:', err.message);
      return { total: 0, aktif: 0, used: 0, invalid: 0 };
    }
  }
};

module.exports = ticketManager;
