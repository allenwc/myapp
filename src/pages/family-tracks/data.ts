import type { FamilyMember, Track } from './types';

export const FAMILY_MEMBERS: FamilyMember[] = [
  { name: 'yeye', color: '#1890ff', emoji: '👴' },
  { name: 'nainai', color: '#f5222d', emoji: '👵' },
  { name: 'Father', color: '#1890ff', emoji: '👨' },
  { name: 'laoye', color: '#faad14', emoji: '👴🏻' },
  { name: 'laolao', color: '#52c41a', emoji: '👵🏻' },
  { name: 'Mother', color: '#f5222d', emoji: '👩🏻' },
  { name: 'Child', color: '#52c41a', emoji: '👶' },
];

export const LOCATIONS: Record<string, [number, number]> = {
  Beijing: [116.46253300000001, 40.250521000000006],
  Shanghai: [121.4825945, 31.2821245],
  Shenzhen: [114.1869645, 22.650877],
  Hangzhou: [119.526923, 29.8768465],
  Chengdu: [103.94294249999999, 30.764372],
  Wuhan: [114.3868375, 30.667366],
  XiAn: [108.740047, 34.219958],
  Guangzhou: [113.50385349999999, 23.249384499999998],
  Nanjing: [118.79540750000001, 31.9213915],
  Chongqing: [107.742733, 30.1846885],
  Harbin: [127.956601, 45.366278],
  Urumqi: [87.88448149999999, 43.9614355],
  Lhasa: [91.18392800000001, 30.14945],
  Kunming: [102.91880549999999, 25.467060500000002],
  Zhangjiakou: [115.13884250000001, 40.851199],
  Fuzhou: [119.44364250000001, 25.965812999999997],
};

export const TRACKS: Track[] = [
  {
    person: 'yeye',
    from: 'Fuzhou',
    to: 'Hangzhou',
    startDate: '2014-02-15',
    endDate: '2014-02-16',
    reason: 'Business Trip',
  },
  {
    person: 'nainai',
    from: 'Fuzhou',
    to: 'Hangzhou',
    startDate: '2014-01-01',
    endDate: '2014-01-02',
    reason: 'Business Trip',
  },
  {
    person: 'laoye',
    from: 'Zhangjiakou',
    to: 'Hangzhou',
    startDate: '2014-02-15',
    endDate: '2014-02-16',
    reason: 'Business Trip',
  },
  {
    person: 'laolao',
    from: 'Zhangjiakou',
    to: 'Hangzhou',
    startDate: '2014-01-01',
    endDate: '2014-01-02',
    reason: 'Business Trip',
  },
  {
    person: 'Father',
    from: 'Fuzhou',
    to: 'Hangzhou',
    startDate: '2008-02-14',
    endDate: '2008-02-15',
    reason: 'Friends Visit',
  },
  {
    person: 'Mother',
    from: 'Zhangjiakou',
    to: 'Hangzhou',
    startDate: '2008-05-01',
    endDate: '2008-05-05',
    reason: 'Friends Visit',
  },
];

export const Z_OFFSET = 0; // Elevation in meters, flat map

export const PLAYBACK_SPEED = {
  FAST: 30, // Days per tick (50ms)
  SLOW: 0.1, // Days per tick (when activity detected)
};
