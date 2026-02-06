export interface FamilyMember {
  name: string;
  color: string;
  emoji: string;
  residenceCity?: string;
  birthDate?: string;
  deathDate?: string;
}

export interface Track {
  person: string;
  from: string;
  to: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reason: string;
}

export interface Point {
  person: string;
  city: string;
  coordinates: [number, number, number];
  date: string;
  type: string;
  emoji: string;
}

export interface VisibleTrack extends Track {
  coords: [[number, number, number], [number, number, number]];
}
