import { getSupabaseClient } from '@/services/supabase/client';
import type { FamilyMember, Track } from './types';

export type LocationsMap = Record<string, [number, number]>;

export const fetchFamilyMembers = async (): Promise<FamilyMember[]> => {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase client not configured');

  const { data, error } = await supabase
    .from('tb_family_members')
    .select(
      'name,color,emoji,residence_city,birth_date,death_date,sort,is_active',
    )
    .eq('is_active', true)
    .order('sort', { ascending: true });

  if (error) throw error;
  if (!data) return [];

  return data.map((row) => ({
    name: row.name,
    color: row.color,
    emoji: row.emoji,
    residenceCity: (row as any).residence_city ?? undefined,
    birthDate: (row as any).birth_date ?? undefined,
    deathDate: (row as any).death_date ?? undefined,
  }));
};

export const fetchFamilyTracks = async (): Promise<Track[]> => {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase client not configured');

  const { data, error } = await supabase
    .from('tb_family_tracks')
    .select(
      'from_city,to_city,start_date,end_date,reason,member:member_id(name)',
    );

  if (error) throw error;
  if (!data) return [];

  return data
    .map((row) => {
      const memberName = (row as any).member?.name as string | undefined;
      if (!memberName) return null;

      return {
        person: memberName,
        from: (row as any).from_city as string,
        to: (row as any).to_city as string,
        startDate: (row as any).start_date as string,
        endDate: (row as any).end_date as string,
        reason: ((row as any).reason as string | null) || '',
      } satisfies Track;
    })
    .filter((t): t is Track => Boolean(t));
};

export const fetchLocationsFromStorage = async (
  bucketId = 'family-tracks',
  objectKey = 'locations.json',
): Promise<LocationsMap> => {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase client not configured');

  const { data, error } = await supabase.storage
    .from(bucketId)
    .download(objectKey);
  if (error) throw error;
  if (!data) throw new Error('locations.json not found');

  const text = await data.text();
  const parsed = JSON.parse(text) as LocationsMap;

  return parsed;
};
