const { loadJSON, saveJSON, STORAGE_PATH } = require('./storage');

/**
 * Bukti Transfer Manager - Handle semua operasi bukti transfer/pembayaran
 */

const loadBukti = () => loadJSON(STORAGE_PATH.BUKTI, { bukti_transfer: [] }).bukti_transfer;

const saveBukti = (bukti) => {
  return saveJSON(STORAGE_PATH.BUKTI, { bukti_transfer: bukti }, 'Bukti Transfer');
};

const buktiTransferManager = {
  /**
   * Create new bukti transfer record
   */
  create: (buktiData) => {
    try {
      const buktiList = loadBukti();
      const newBukti = {
        refID: buktiData.refID,
        userJid: buktiData.userJid,
        userName: buktiData.userName,
        userPhone: buktiData.userPhone,
        jumlah: buktiData.jumlah,
        catatan: buktiData.catatan || '',
        mediaPath: buktiData.mediaPath || null,
        status: 'pending', // pending | approved | rejected
        createdAt: new Date().toISOString(),
        approvedAt: null,
        approvedBy: null,
        rejectedAt: null,
        rejectedBy: null,
        alasan: null,
        ticketID: null
      };
      
      buktiList.push(newBukti);
      saveBukti(buktiList);
      console.log(`✅ Bukti transfer created: ${buktiData.refID}`);
      return newBukti;
    } catch (err) {
      console.error('❌ Error creating bukti transfer:', err.message);
      return null;
    }
  },

  /**
   * Get by refID
   */
  findById: (refID) => {
    try {
      const buktiList = loadBukti();
      return buktiList.find(b => b.refID === refID) || null;
    } catch (err) {
      console.error('❌ Error finding bukti:', err.message);
      return null;
    }
  },

  /**
   * Update bukti status (approve/reject)
   */
  updateStatus: (refID, status, adminPhone, ticketID = null, alasan = null) => {
    try {
      const buktiList = loadBukti();
      const bukti = buktiList.find(b => b.refID === refID);
      if (!bukti) return false;

      bukti.status = status;
      if (status === 'approved') {
        bukti.approvedAt = new Date().toISOString();
        bukti.approvedBy = adminPhone;
        bukti.ticketID = ticketID;
      } else if (status === 'rejected') {
        bukti.rejectedAt = new Date().toISOString();
        bukti.rejectedBy = adminPhone;
        bukti.alasan = alasan;
      }
      saveBukti(buktiList);
      console.log(`✅ Bukti ${refID} status updated to ${status}`);
      return true;
    } catch (err) {
      console.error('❌ Error updating bukti status:', err.message);
      return false;
    }
  },

  /**
   * Get all bukti
   */
  getAll: () => {
    try {
      return loadBukti();
    } catch (err) {
      console.error('❌ Error getting all bukti:', err.message);
      return [];
    }
  },

  /**
   * Get by status
   */
  getByStatus: (status) => {
    try {
      const buktiList = loadBukti();
      return buktiList.filter(b => b.status === status);
    } catch (err) {
      console.error('❌ Error getting bukti by status:', err.message);
      return [];
    }
  },

  /**
   * Get by user phone
   */
  getByUserPhone: (userPhone) => {
    try {
      const buktiList = loadBukti();
      return buktiList.filter(b => b.userPhone === userPhone);
    } catch (err) {
      console.error('❌ Error getting bukti by user phone:', err.message);
      return [];
    }
  },

  /**
   * Get stats
   */
  getStats: () => {
    try {
      const buktiList = loadBukti();
      return {
        total: buktiList.length,
        pending: buktiList.filter(b => b.status === 'pending').length,
        approved: buktiList.filter(b => b.status === 'approved').length,
        rejected: buktiList.filter(b => b.status === 'rejected').length
      };
    } catch (err) {
      console.error('❌ Error getting bukti stats:', err.message);
      return { total: 0, pending: 0, approved: 0, rejected: 0 };
    }
  }
};

module.exports = buktiTransferManager;
