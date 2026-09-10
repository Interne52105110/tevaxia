import { describe, expect, it } from 'vitest';
import { parsePmsImport } from '../pms/webhook-input';
const hotel_id = '11111111-1111-1111-1111-111111111111';
const metric = { date: '2026-09-01', occupancy: 0.8, adr: 125 };
const parse = (m: unknown[], extra = {}) => parsePmsImport({ hotel_id, metrics: m, ...extra }, new Date('2026-09-10T12:00:00Z'));
describe('normalized PMS observations', () => {
  it('computes RevPAR without guessing the occupancy unit', () => {
    expect(parse([metric]).rows[0].revpar).toBe(100);
    expect(parse([{ ...metric, occupancy: 1 }]).rows[0].occupancy).toBe(1);
    expect(parse([{ ...metric, occupancy: 1 }], { occupancy_unit: 'percent' }).rows[0].occupancy).toBe(.01);
    expect(parse([{ ...metric, occupancy: 82 }], { occupancy_unit: 'percent' }).rows[0].occupancy).toBe(.82);
    expect(() => parse([{ ...metric, occupancy: 82 }])).toThrow();
  });
  it('derives occupancy from consistent room counts', () => {
    expect(parse([{ date: metric.date, rooms_sold: 8, rooms_available: 10, adr: 125 }]).rows[0].revpar).toBe(100);
    expect(() => parse([{ ...metric, rooms_sold: 9, rooms_available: 10 }])).toThrow();
    expect(() => parse([{ ...metric, rooms_sold: 8 }])).toThrow();
    expect(() => parse([{ ...metric, rooms_sold: 11, rooms_available: 10 }])).toThrow();
  });
  it.each([null, '2026-02-30', '2026-09-11', '1999-12-31', 'invalid'])('rejects invalid observation date %s', date => {
    expect(() => parse([{ ...metric, date }])).toThrow();
  });
  it('rejects empty, oversized, duplicate and partially invalid batches', () => {
    for (const rows of [[], Array(367).fill(metric), [metric, metric], [metric, null]]) expect(() => parse(rows)).toThrow();
  });
  it('requires a complete ADR and consistent RevPAR', () => {
    expect(() => parse([{ ...metric, adr: undefined }])).toThrow();
    expect(() => parse([{ ...metric, adr: null }])).toThrow();
    expect(() => parse([{ ...metric, revpar: 99 }])).toThrow();
    expect(parse([{ ...metric, occupancy: 0, adr: null }]).rows[0].revpar).toBe(0);
    expect(() => parse([{ ...metric, occupancy: 0 }])).toThrow();
    expect(parse([{ ...metric, adr: 0 }]).rows[0].revpar).toBe(0);
  });
  it.each([{ currency: 'USD' }, { source: 'unknown' }, { occupancy_unit: null }, { hotel_id: 'bad' }])('rejects unsupported metadata %j', extra => {
    expect(() => parse([metric], extra)).toThrow();
  });
  it('uses the Luxembourg civil day around midnight', () => {
    expect(parsePmsImport({ hotel_id, metrics: [{ ...metric, date: '2026-09-11' }] }, new Date('2026-09-10T22:30:00Z')).rows).toHaveLength(1);
  });
});
