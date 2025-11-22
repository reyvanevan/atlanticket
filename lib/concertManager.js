const { loadJSON, saveJSON, STORAGE_PATH } = require('./storage');

/**
 * Concert Manager - Handle semua operasi konser
 */

const loadConcerts = () => loadJSON(STORAGE_PATH.CONCERTS, { concerts: [] }).concerts;

const saveConcerts = (concerts) => {
  return saveJSON(STORAGE_PATH.CONCERTS, { concerts }, 'Concerts');
};

const concertManager = {
  /**
   * Create new concert
   */
  create: (concertData) => {
    try {
      const concerts = loadConcerts();
      const newConcert = {
        konserID: concertData.konserID || `konser_${Date.now()}`,
        nama: concertData.nama,
        tanggal: concertData.tanggal,
        jam: concertData.jam,
        lokasi: concertData.lokasi,
        harga: concertData.harga,
        stokAwal: concertData.stokAwal,
        stok: concertData.stokAwal, // Start with full stock
        deskripsi: concertData.deskripsi,
        status: 'aktif', // aktif | inactive
        dibuat: new Date().toISOString(),
        dibuatOleh: concertData.dibuatOleh,
        diupdate: new Date().toISOString()
      };
      
      concerts.push(newConcert);
      saveConcerts(concerts);
      console.log(`✅ Concert created: ${newConcert.nama}`);
      return newConcert;
    } catch (err) {
      console.error('❌ Error creating concert:', err.message);
      return null;
    }
  },

  /**
   * Get active concert
   */
  getActive: () => {
    try {
      const concerts = loadConcerts();
      return concerts.find(c => c.status === 'aktif') || null;
    } catch (err) {
      console.error('❌ Error getting active concert:', err.message);
      return null;
    }
  },

  /**
   * Get by konserID
   */
  findById: (konserID) => {
    try {
      const concerts = loadConcerts();
      return concerts.find(c => c.konserID === konserID) || null;
    } catch (err) {
      console.error('❌ Error finding concert:', err.message);
      return null;
    }
  },

  /**
   * Decrease stock
   */
  decreaseStock: (konserID, amount = 1) => {
    try {
      const concerts = loadConcerts();
      const concert = concerts.find(c => c.konserID === konserID);
      if (!concert) return false;

      if (concert.stok >= amount) {
        concert.stok -= amount;
        concert.diupdate = new Date().toISOString();
        saveConcerts(concerts);
        console.log(`📉 Stok berkurang: ${concert.stok + amount} → ${concert.stok}`);
        return true;
      } else {
        console.warn('⚠️ Stok tidak cukup!');
        return false;
      }
    } catch (err) {
      console.error('❌ Error decreasing stock:', err.message);
      return false;
    }
  },

  /**
   * Update concert status
   */
  updateStatus: (konserID, status) => {
    try {
      const concerts = loadConcerts();
      const concert = concerts.find(c => c.konserID === konserID);
      if (!concert) return false;

      concert.status = status;
      concert.diupdate = new Date().toISOString();
      saveConcerts(concerts);
      console.log(`✅ Concert ${konserID} status updated to ${status}`);
      return true;
    } catch (err) {
      console.error('❌ Error updating concert status:', err.message);
      return false;
    }
  },

  /**
   * Get all concerts
   */
  getAll: () => {
    try {
      return loadConcerts();
    } catch (err) {
      console.error('❌ Error getting all concerts:', err.message);
      return [];
    }
  },

  /**
   * Get concert stats
   */
  getStats: (konserID) => {
    try {
      const concert = concertManager.findById(konserID);
      if (!concert) return null;

      return {
        konserID: concert.konserID,
        nama: concert.nama,
        stokAwal: concert.stokAwal,
        stokTerjual: concert.stokAwal - concert.stok,
        sisaStok: concert.stok,
        persentaseTerjual: ((concert.stokAwal - concert.stok) / concert.stokAwal * 100).toFixed(1)
      };
    } catch (err) {
      console.error('❌ Error getting concert stats:', err.message);
      return null;
    }
  },

  /**
   * Reset stok ke stokAwal (developer mode)
   */
  resetStock: (konserID) => {
    try {
      const concerts = loadConcerts();
      const concert = concerts.find(c => c.konserID === konserID);
      if (!concert) return false;

      concert.stok = concert.stokAwal;
      concert.diupdate = new Date().toISOString();
      saveConcerts(concerts);
      console.log(`🔄 Stok di-reset: ${concert.stok} (kembali ke stokAwal)`);
      return true;
    } catch (err) {
      console.error('❌ Error resetting stock:', err.message);
      return false;
    }
  }
};

module.exports = concertManager;
