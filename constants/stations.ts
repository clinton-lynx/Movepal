import { Station, StationStatus } from '@/types/station';

export const LAGOS_STATIONS: Station[] = [
  {
    id: '1',
    name: 'Oshodi Terminal',
    lat: 6.557,
    lng: 3.35,
    status: 'heavy',
    reportCount: 14,
    lastUpdated: '2 mins ago',
  },
  {
    id: '2',
    name: 'Mile 2',
    lat: 6.4698,
    lng: 3.3023,
    status: 'moderate',
    reportCount: 7,
    lastUpdated: '5 mins ago',
  },
  {
    id: '3',
    name: 'Ikeja Under Bridge',
    lat: 6.5958,
    lng: 3.3403,
    status: 'flowing',
    reportCount: 3,
    lastUpdated: '1 min ago',
  },
  {
    id: '4',
    name: 'Ojota',
    lat: 6.5952,
    lng: 3.3831,
    status: 'heavy',
    reportCount: 11,
    lastUpdated: '3 mins ago',
  },
  {
    id: '5',
    name: 'Berger',
    lat: 6.6349,
    lng: 3.3782,
    status: 'moderate',
    reportCount: 5,
    lastUpdated: '8 mins ago',
  },
  {
    id: '6',
    name: 'CMS Marina',
    lat: 6.4505,
    lng: 3.3958,
    status: 'flowing',
    reportCount: 2,
    lastUpdated: '4 mins ago',
  },
];

export const STATUS_COLOR: Record<StationStatus, string> = {
  heavy: '#EF4444',
  moderate: '#F97316',
  flowing: '#22C55E',
};

export const STATUS_LABEL: Record<StationStatus, string> = {
  heavy: 'Heavy',
  moderate: 'Moderate',
  flowing: 'Flowing',
};
