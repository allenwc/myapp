import { getSupabaseClient } from '@/services/supabase/client';
import type { FamilyMember, Track } from './types';

export type LocationsMap = Record<string, [number, number]>;

export const fetchFamilyMembers = async (): Promise<FamilyMember[]> => {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase client not configured');

  const { data, error } = await supabase
    .from('tb_family_members')
    .select(
      'id,name,color,emoji,residence_city,birth_date,death_date,sort,is_active',
    )
    .eq('is_active', true)
    .order('sort', { ascending: true });

  if (error) throw error;
  if (!data) return [];

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    color: row.color,
    emoji: row.emoji,
    residenceCity: (row as any).residence_city ?? undefined,
    birthDate: (row as any).birth_date ?? undefined,
    deathDate: (row as any).death_date ?? undefined,
    sort: row.sort,
    isActive: row.is_active,
  }));
};

export const fetchAllFamilyMembers = async (): Promise<FamilyMember[]> => {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase client not configured');

  const { data, error } = await supabase
    .from('tb_family_members')
    .select(
      'id,name,color,emoji,residence_city,birth_date,death_date,sort,is_active',
    )
    .order('sort', { ascending: true });

  if (error) throw error;
  if (!data) return [];

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    color: row.color,
    emoji: row.emoji,
    residenceCity: (row as any).residence_city ?? undefined,
    birthDate: (row as any).birth_date ?? undefined,
    deathDate: (row as any).death_date ?? undefined,
    sort: row.sort,
    isActive: row.is_active,
  }));
};

export const createFamilyMember = async (
  member: Omit<FamilyMember, 'id'>,
): Promise<FamilyMember> => {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase client not configured');

  const { data, error } = await supabase
    .from('tb_family_members')
    .insert({
      name: member.name,
      color: member.color,
      emoji: member.emoji,
      residence_city: member.residenceCity || null,
      birth_date: member.birthDate || null,
      death_date: member.deathDate || null,
      sort: member.sort,
      is_active: member.isActive,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    color: data.color,
    emoji: data.emoji,
    residenceCity: data.residence_city ?? undefined,
    birthDate: data.birth_date ?? undefined,
    deathDate: data.death_date ?? undefined,
    sort: data.sort,
    isActive: data.is_active,
  };
};

export const updateFamilyMember = async (
  member: FamilyMember,
): Promise<FamilyMember> => {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase client not configured');

  const { data, error } = await supabase
    .from('tb_family_members')
    .update({
      name: member.name,
      color: member.color,
      emoji: member.emoji,
      residence_city: member.residenceCity || null,
      birth_date: member.birthDate || null,
      death_date: member.deathDate || null,
      sort: member.sort,
      is_active: member.isActive,
      updated_at: new Date().toISOString(),
    })
    .eq('id', member.id)
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    color: data.color,
    emoji: data.emoji,
    residenceCity: data.residence_city ?? undefined,
    birthDate: data.birth_date ?? undefined,
    deathDate: data.death_date ?? undefined,
    sort: data.sort,
    isActive: data.is_active,
  };
};

export const deleteFamilyMember = async (id: string): Promise<void> => {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase client not configured');

  const { error } = await supabase
    .from('tb_family_members')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const fetchFamilyTracks = async (): Promise<Track[]> => {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase client not configured');

  const { data, error } = await supabase
    .from('tb_family_tracks')
    .select(
      'id,member_id,from_city,to_city,start_date,end_date,reason,member:member_id(name)',
    )
    .order('start_date', { ascending: true });

  if (error) throw error;
  if (!data) return [];

  return data
    .map((row) => {
      const memberName = (row as any).member?.name as string | undefined;
      if (!memberName) return null;

      return {
        id: row.id,
        memberId: (row as any).member_id,
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

export const createTrack = async (
  track: Omit<Track, 'id' | 'person'>,
): Promise<Track> => {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase client not configured');

  const { data, error } = await supabase
    .from('tb_family_tracks')
    .insert({
      member_id: track.memberId,
      from_city: track.from,
      to_city: track.to,
      start_date: track.startDate,
      end_date: track.endDate,
      reason: track.reason || null,
    })
    .select('*, member:member_id(name)')
    .single();

  if (error) throw error;

  return {
    id: data.id,
    memberId: data.member_id,
    person: (data as any).member?.name || 'Unknown',
    from: data.from_city,
    to: data.to_city,
    startDate: data.start_date,
    endDate: data.end_date,
    reason: data.reason || '',
  };
};

export const updateTrack = async (track: Track): Promise<Track> => {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase client not configured');

  const { data, error } = await supabase
    .from('tb_family_tracks')
    .update({
      member_id: track.memberId,
      from_city: track.from,
      to_city: track.to,
      start_date: track.startDate,
      end_date: track.endDate,
      reason: track.reason || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', track.id)
    .select('*, member:member_id(name)')
    .single();

  if (error) throw error;

  return {
    id: data.id,
    memberId: data.member_id,
    person: (data as any).member?.name || 'Unknown',
    from: data.from_city,
    to: data.to_city,
    startDate: data.start_date,
    endDate: data.end_date,
    reason: data.reason || '',
  };
};

export const deleteTrack = async (id: string): Promise<void> => {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase client not configured');

  const { error } = await supabase
    .from('tb_family_tracks')
    .delete()
    .eq('id', id);

  if (error) throw error;
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
