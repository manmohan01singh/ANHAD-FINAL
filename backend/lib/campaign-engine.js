/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ANHAD REUSABLE SPIRITUAL CAMPAIGN ENGINE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Admin-controlled, non-hardcoded spiritual campaign manager supporting dynamic
 * day calculation, daily Amrit Vela messages, artwork swapping, and deep linking.
 */

class CampaignEngine {
  constructor() {
    this.campaigns = new Map();
    this.initDefaultCampaign();
  }

  initDefaultCampaign() {
    // 40-Day Chaliya 2026 Default Campaign
    const chaliya = {
      id: 'chaliya-2026',
      title: 'Annual 40-Day Chaliya 2026',
      subtitle: 'Divine Amritvela Simran & Nitnem Practice',
      startDate: new Date(Date.now() - 11 * 86400000).toISOString(), // Simulated starting 11 days ago
      endDate: new Date(Date.now() + 29 * 86400000).toISOString(),
      totalDays: 40,
      isActive: true,
      artworkUrl: 'assets/companion/chaliya-2026.webp',
      deepLink: 'anhad://companion?campaign=chaliya-2026',
      webDestination: '/Companion/companion.html',
      dailyMessages: this.generateDailyMessages(40)
    };
    this.campaigns.set(chaliya.id, chaliya);
  }

  generateDailyMessages(count = 40) {
    const messages = [];
    const spiritualThemes = [
      { quote: 'ਅੰਮ੍ਰਿਤ ਵੇਲਾ ਸਚੁ ਨਾਉ ਵਡਿਆਈ ਵੀਚਾਰੁ ॥', en: 'In the ambrosial hours before dawn, chant the True Name and contemplate His greatness.' },
      { quote: 'ਝਾਲਾਘੇ ਉਠਿ ਨਾਮੁ ਜਪਿ ਨਿਸਿ ਬਾਸੁਰ ਆਰਾਧਿ ॥', en: 'Rise early in the dawn, chant the Naam, and worship Him night and day.' },
      { quote: 'ਹਰਿ ਕਾ ਨਾਮੁ ਧਿਆਇ ਸੁਣਿ ਸਭਨਾ ਨੋ ਕਰਿ ਦਾਨੁ ॥', en: 'Meditate on the Lord\'s Name, listen to it, and share it with everyone.' },
      { quote: 'ਗੁਰ ਸਤਿਗੁਰ ਕਾ ਜੋ ਸਿਖੁ ਅਖਾਏ ਸੁ ਭਲਕੇ ਉਠਿ ਹਰਿ ਨਾਮੁ ਧਿਆਵੈ ॥', en: 'One who calls oneself a Sikh of the Guru shall rise in the early morning and contemplate the Name.' },
      { quote: 'ਸਿਮਰਉ ਸਿਮਰਿ ਸਿਮਰਿ ਸੁਖੁ ਪਾਵਉ ॥ ਕਲਿ ਕਲੇਸ ਤਨ ਮਾਹਿ ਮਿਟਾਵਉ ॥', en: 'Meditate, meditate, meditate in remembrance of Him, and find eternal peace.' }
    ];

    for (let day = 1; day <= count; day++) {
      const theme = spiritualThemes[(day - 1) % spiritualThemes.length];
      messages.push({
        day,
        title: `Chaliya — Day ${day} of ${count}`,
        quoteGurmukhi: theme.quote,
        quoteEnglish: theme.en,
        practiceTip: `Awaken at Amritvela (3:00 AM – 6:00 AM) and recite your morning Nitnem with focused attention.`,
        actionLabel: 'Start Amrit Vela Practice',
        deepLink: '/nitnem/indexbani.html?source=chaliya_day_' + day
      });
    }
    return messages;
  }

  calculateDayNumber(campaign) {
    if (!campaign || !campaign.startDate) return 1;
    const start = new Date(campaign.startDate).getTime();
    const now = Date.now();
    if (now < start) return 0; // Not yet started

    const diffDays = Math.floor((now - start) / (24 * 60 * 60 * 1000)) + 1;
    return Math.max(1, Math.min(campaign.totalDays || 40, diffDays));
  }

  getActiveCampaign() {
    for (const c of this.campaigns.values()) {
      if (c.isActive) {
        const currentDay = this.calculateDayNumber(c);
        const dayMsg = (c.dailyMessages && c.dailyMessages[currentDay - 1]) || (c.dailyMessages && c.dailyMessages[0]);
        return {
          ...c,
          currentDay,
          todayMessage: dayMsg
        };
      }
    }
    return null;
  }

  getCampaignById(id) {
    const c = this.campaigns.get(id);
    if (!c) return null;
    const currentDay = this.calculateDayNumber(c);
    return {
      ...c,
      currentDay,
      todayMessage: (c.dailyMessages && c.dailyMessages[currentDay - 1]) || null
    };
  }

  getAllCampaigns() {
    return Array.from(this.campaigns.values()).map(c => ({
      ...c,
      currentDay: this.calculateDayNumber(c)
    }));
  }

  saveCampaign(campaignData) {
    if (!campaignData || !campaignData.id) {
      throw { status: 400, message: 'Campaign ID is required' };
    }
    const existing = this.campaigns.get(campaignData.id) || {};
    const updated = {
      ...existing,
      ...campaignData,
      totalDays: parseInt(campaignData.totalDays || existing.totalDays || 40, 10),
      isActive: campaignData.isActive !== undefined ? Boolean(campaignData.isActive) : (existing.isActive !== undefined ? existing.isActive : false),
      updatedAt: new Date().toISOString()
    };
    this.campaigns.set(updated.id, updated);
    return updated;
  }

  toggleCampaignStatus(id, isActive) {
    const campaign = this.campaigns.get(id);
    if (!campaign) throw { status: 404, message: 'Campaign not found' };
    campaign.isActive = Boolean(isActive);
    campaign.updatedAt = new Date().toISOString();
    this.campaigns.set(id, campaign);
    return campaign;
  }

  generateShareableUrl(campaignId, hostUrl = 'https://anhad.app') {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) throw { status: 404, message: 'Campaign not found' };
    const currentDay = this.calculateDayNumber(campaign);

    const shareUrl = `${hostUrl}/share/campaign?id=${encodeURIComponent(campaignId)}`;
    const whatsappMessage = encodeURIComponent(
      `ੴ Join me in the ${campaign.title} on ANHAD (Day ${currentDay} of ${campaign.totalDays})!\n\nAwaken during sacred Amritvela for collective Simran & Nitnem.\n\nOpen journey: ${shareUrl}`
    );

    return {
      shareUrl,
      whatsappUrl: `https://api.whatsapp.com/send?text=${whatsappMessage}`,
      deepLink: campaign.deepLink,
      title: campaign.title,
      currentDay,
      totalDays: campaign.totalDays
    };
  }
}

const campaignSingleton = new CampaignEngine();
campaignSingleton.CampaignEngine = CampaignEngine;
module.exports = campaignSingleton;
