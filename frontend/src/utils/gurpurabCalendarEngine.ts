/**
 * Gurpurab Calendar Engine
 * Uses self-contained Nanakshahi calculations
 */

import { COMPLETE_GURUPURAB_DATABASE, getGurupurabsForYear, nanakshahiToGregorian } from './nanakshahiCalendar';

export interface GurpurabEvent {
  id: string;
  name_pa: string;
  name_en: string;
  nanakshahi_date: string;
  gregorian_date: string;
  type: string;
  color: string;
  importance: string;
  guru_number?: number;
  description_en?: string;
  description_pa?: string;
  related_shabads?: string[];
  celebrations?: string[];
  historicalYear?: number;
}

export class GurpurabCalendarEngine {
  private static instance: GurpurabCalendarEngine;
  
  static getInstance(): GurpurabCalendarEngine {
    if (!GurpurabCalendarEngine.instance) {
      GurpurabCalendarEngine.instance = new GurpurabCalendarEngine();
    }
    return GurpurabCalendarEngine.instance;
  }

  async getEventsForYear(gregorianYear: number): Promise<GurpurabEvent[]> {
    const events = getGurupurabsForYear(gregorianYear);
    
    return events.map(event => ({
      id: event.id,
      name_pa: event.namePunjabi,
      name_en: event.nameEnglish,
      nanakshahi_date: `${event.nanakshahiDay} ${this.getNanakshahiMonthName(event.nanakshahiMonth)}`,
      gregorian_date: this.formatDate(event.gregorianDate),
      type: event.type,
      color: event.color,
      importance: event.importance,
      guru_number: this.getGuruNumber(event.relatedGuru),
      description_en: event.description,
      description_pa: event.descriptionPunjabi,
      related_shabads: [],
      celebrations: [],
      historicalYear: event.historicalYear
    }));
  }

  async getEventsForMonth(gregorianYear: number, month: number): Promise<GurpurabEvent[]> {
    const yearEvents = await this.getEventsForYear(gregorianYear);
    return yearEvents.filter(event => {
      const eventDate = new Date(event.gregorian_date);
      return eventDate.getMonth() === month;
    });
  }

  async getUpcomingEvents(daysAhead: number = 30): Promise<GurpurabEvent[]> {
    const today = new Date();
    const currentYear = today.getFullYear();
    const allEvents = [
      ...(await this.getEventsForYear(currentYear)),
      ...(await this.getEventsForYear(currentYear + 1))
    ];
    
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + daysAhead);
    
    return allEvents
      .filter(event => {
        const eventDate = new Date(event.gregorian_date);
        return eventDate >= today && eventDate <= endDate;
      })
      .sort((a, b) => new Date(a.gregorian_date).getTime() - new Date(b.gregorian_date).getTime());
  }

  async getTodayEvents(): Promise<GurpurabEvent[]> {
    const today = new Date();
    const todayStr = this.formatDate(today);
    const yearEvents = await this.getEventsForYear(today.getFullYear());
    
    return yearEvents.filter(event => event.gregorian_date === todayStr);
  }

  private getNanakshahiMonthName(month: number): string {
    const months = ['Chet', 'Vaisakh', 'Jeth', 'Harh', 'Sawan', 'Bhadon', 'Assu', 'Katak', 'Maghar', 'Poh', 'Magh', 'Phagan'];
    return months[month - 1] || '';
  }

  private getGuruNumber(guruName?: string): number | undefined {
    const guruMap: { [key: string]: number } = {
      'Guru Nanak Dev Ji': 1,
      'Guru Angad Dev Ji': 2,
      'Guru Amar Das Ji': 3,
      'Guru Ram Das Ji': 4,
      'Guru Arjan Dev Ji': 5,
      'Guru Hargobind Sahib Ji': 6,
      'Guru Har Rai Ji': 7,
      'Guru Har Krishan Ji': 8,
      'Guru Tegh Bahadur Ji': 9,
      'Guru Gobind Singh Ji': 10
    };
    return guruName ? guruMap[guruName] : undefined;
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async searchEvents(query: string): Promise<GurpurabEvent[]> {
    const currentYear = new Date().getFullYear();
    const allEvents = await this.getEventsForYear(currentYear);
    const lowerQuery = query.toLowerCase();
    
    return allEvents.filter(event =>
      event.name_en.toLowerCase().includes(lowerQuery) ||
      event.name_pa.includes(query) ||
      event.description_en?.toLowerCase().includes(lowerQuery) ||
      event.description_pa?.includes(query)
    );
  }
}
