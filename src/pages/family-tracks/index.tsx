import { PageContainer, ProCard } from '@ant-design/pro-components';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useState } from 'react';
import BaseMap from './components/BaseMap';
import LocationMarkers from './components/LocationMarkers';
import PlaybackControl from './components/PlaybackControl';
import TrajectoryLayer from './components/TrajectoryLayer';
import { PLAYBACK_SPEED, Z_OFFSET } from './data';
import {
  fetchFamilyMembers,
  fetchFamilyTracks,
  fetchLocationsFromStorage,
  type LocationsMap,
} from './service';
import type { FamilyMember, Point, Track, VisibleTrack } from './types';

const FamilyTracks: React.FC = () => {
  const [currentDayOffset, setCurrentDayOffset] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [locations, setLocations] = useState<LocationsMap>({});
  const [loadError, setLoadError] = useState<string>('');

  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [scene, setScene] = useState<any>(null);

  // Calculate time range based on tracks data
  const { startDate, totalDays } = useMemo(() => {
    if (tracks.length === 0) {
      // Default fallback if no tracks
      const start = dayjs('2008-01-01');
      const end = dayjs('2008-12-16');
      return { startDate: start, totalDays: end.diff(start, 'day') };
    }

    let minDate = dayjs(tracks[0].startDate);
    let maxDate = dayjs(tracks[0].endDate);

    tracks.forEach((t) => {
      const s = dayjs(t.startDate);
      const e = dayjs(t.endDate);
      if (s.isBefore(minDate)) minDate = s;
      if (e.isAfter(maxDate)) maxDate = e;
    });

    // Add 1 week buffer
    const start = minDate.subtract(1, 'week');
    const end = maxDate.add(1, 'week');

    return {
      startDate: start,
      totalDays: end.diff(start, 'day'),
    };
  }, [tracks]);

  const memberByName = useMemo(() => {
    return new Map(familyMembers.map((m) => [m.name, m]));
  }, [familyMembers]);

  // Pre-calculate all key dates for selected members to optimize playback
  const keyDates = useMemo(() => {
    const dates: dayjs.Dayjs[] = [];
    tracks.forEach((t) => {
      if (!selectedMembers.includes(t.person)) return;
      dates.push(dayjs(t.startDate));
      dates.push(dayjs(t.endDate));
    });

    selectedMembers.forEach((person) => {
      const birthDate = memberByName.get(person)?.birthDate;
      if (birthDate) dates.push(dayjs(birthDate));
    });

    return dates.sort((a, b) => a.valueOf() - b.valueOf());
  }, [tracks, selectedMembers, memberByName]);

  const isMemberVisibleOnDate = useMemo(() => {
    return (name: string, date: dayjs.Dayjs) => {
      const member = memberByName.get(name);
      if (!member) return false;

      if (member.birthDate && date.isBefore(dayjs(member.birthDate), 'day'))
        return false;
      if (member.deathDate && date.isAfter(dayjs(member.deathDate), 'day'))
        return false;

      return true;
    };
  }, [memberByName]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [members, dbTracks, locs] = await Promise.all([
          fetchFamilyMembers(),
          fetchFamilyTracks(),
          fetchLocationsFromStorage(),
        ]);

        if (cancelled) return;
        setFamilyMembers(members);
        setTracks(dbTracks);
        setLocations(locs);
        setLoadError('');

        // No need to calculate date range here as it's handled by useMemo

        setSelectedMembers((prev) => {
          if (prev.length > 0) return prev;
          // Determine visible members based on the calculated range
          // Note: Since startDate/totalDays are computed from tracks, they will update after setTracks
          // But here inside load(), we don't have access to the new startDate/endDate yet if we rely on the memo.
          // However, for initial selection, we can just select everyone or use a simpler logic.
          // The original logic used fixed START_DATE/END_DATE constants.
          // Let's keep it simple and select everyone who is alive within the data range.

          // Re-calculate range locally for this initial selection logic
          let minD = dayjs('2099-12-31');
          let maxD = dayjs('1900-01-01');

          if (dbTracks.length > 0) {
            dbTracks.forEach((t: Track) => {
              const s = dayjs(t.startDate);
              const e = dayjs(t.endDate);
              if (s.isBefore(minD)) minD = s;
              if (e.isAfter(maxD)) maxD = e;
            });
          } else {
            minD = dayjs('2008-01-01');
            maxD = dayjs('2008-12-16');
          }
          const start = minD.subtract(1, 'week');
          const end = maxD.add(1, 'week');

          return members
            .filter((m) => {
              const birthOk =
                !m.birthDate || !end.isBefore(dayjs(m.birthDate), 'day');
              const deathOk =
                !m.deathDate || !start.isAfter(dayjs(m.deathDate), 'day');
              return birthOk && deathOk;
            })
            .map((m) => m.name);
        });
      } catch (e: any) {
        if (cancelled) return;
        setLoadError(e?.message || 'Failed to load data');
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const currentDate = useMemo(() => {
    return startDate.add(currentDayOffset, 'day');
  }, [currentDayOffset, startDate]);

  // Filtered Data based on Current Date
  const currentPositions = useMemo(() => {
    const positions: Point[] = [];

    selectedMembers.forEach((person) => {
      if (!isMemberVisibleOnDate(person, currentDate)) return;

      const member = memberByName.get(person);
      const residenceCity = member?.residenceCity;
      const residenceCoords = residenceCity
        ? locations[residenceCity]
        : undefined;
      const birthDate = member?.birthDate ? dayjs(member.birthDate) : null;

      const personTracks = tracks.filter((t) => t.person === person);

      if (personTracks.length === 0) {
        if (residenceCity && residenceCoords) {
          positions.push({
            person,
            city: residenceCity,
            coordinates: [...residenceCoords, Z_OFFSET],
            date: currentDate.format('YYYY-MM-DD'),
            type: 'residence',
            emoji: member?.emoji || '',
          });
        }
        return;
      }

      if (
        birthDate?.isSame(currentDate, 'day') &&
        residenceCity &&
        residenceCoords
      ) {
        const hasTripToday = personTracks.some((t) => {
          const start = dayjs(t.startDate);
          const end = dayjs(t.endDate);
          const startOk =
            start.isSame(currentDate, 'day') ||
            start.isBefore(currentDate, 'day');
          const endOk =
            end.isSame(currentDate, 'day') || end.isAfter(currentDate, 'day');
          return startOk && endOk;
        });

        if (!hasTripToday) {
          positions.push({
            person,
            city: residenceCity,
            coordinates: [...residenceCoords, Z_OFFSET],
            date: currentDate.format('YYYY-MM-DD'),
            type: 'residence',
            emoji: member?.emoji || '',
          });
          return;
        }
      }

      // Find where the person is at currentDate
      // 1. Check if they are travelling
      const activeTrip = tracks.find(
        (t) =>
          t.person === person &&
          (dayjs(t.startDate).isSame(currentDate, 'day') ||
            dayjs(t.endDate).isSame(currentDate, 'day') ||
            (dayjs(t.startDate).isBefore(currentDate) &&
              dayjs(t.endDate).isAfter(currentDate))),
      );

      if (activeTrip) {
        // In transit (or at destination if start=end)
        // If start=end, they are at destination
        // Also if today is the endDate, they have arrived (show as stationary)
        const isEndDate = dayjs(activeTrip.endDate).isSame(currentDate, 'day');

        if (
          activeTrip.startDate === activeTrip.endDate ||
          (isEndDate && !dayjs(activeTrip.startDate).isSame(currentDate, 'day'))
        ) {
          const member = memberByName.get(person);
          const toCoords = locations[activeTrip.to];
          if (!toCoords) return;

          positions.push({
            person,
            city: activeTrip.to,
            coordinates: [...toCoords, Z_OFFSET],
            date: activeTrip.endDate,
            type: 'destination',
            emoji: member?.emoji || '',
          });
        } else {
          // Interpolate
          const member = memberByName.get(person);
          // Calculate progress
          const start = dayjs(activeTrip.startDate);
          const end = dayjs(activeTrip.endDate);
          const total = end.diff(start, 'day', true) || 1;
          const current = currentDate.diff(start, 'day', true);
          const progress = Math.min(Math.max(current / total, 0), 1);

          const fromCoords = locations[activeTrip.from];
          const toCoords = locations[activeTrip.to];
          if (!fromCoords || !toCoords) return;

          const curLng =
            fromCoords[0] + (toCoords[0] - fromCoords[0]) * progress;
          const curLat =
            fromCoords[1] + (toCoords[1] - fromCoords[1]) * progress;

          positions.push({
            person,
            city: 'En route',
            coordinates: [curLng, curLat, Z_OFFSET],
            date: currentDate.format('YYYY-MM-DD'),
            type: 'transit',
            emoji: member?.emoji || '✈️',
          });
        }
      } else {
        // Not travelling, find last known location
        // Find the last trip that ended before currentDate
        const pastTrips = tracks
          .filter(
            (t) =>
              t.person === person && dayjs(t.endDate).isBefore(currentDate),
          )
          .sort((a, b) => dayjs(b.endDate).diff(dayjs(a.endDate)));

        const lastTrip = pastTrips[0];
        const member = memberByName.get(person);

        if (lastTrip) {
          const toCoords = locations[lastTrip.to];
          if (!toCoords) return;

          positions.push({
            person,
            city: lastTrip.to,
            coordinates: [...toCoords, Z_OFFSET],
            date: currentDate.format('YYYY-MM-DD'),
            type: 'residence',
            emoji: member?.emoji || '',
          });
        } else {
          // If no past trip, it means they are at their starting location of their very first trip (Initial Position)
          const firstTrip = personTracks.sort((a, b) =>
            dayjs(a.startDate).diff(dayjs(b.startDate)),
          )[0];
          const fromCoords = locations[firstTrip.from];
          if (!fromCoords) return;

          positions.push({
            person,
            city: firstTrip.from,
            coordinates: [...fromCoords, Z_OFFSET],
            date: currentDate.format('YYYY-MM-DD'),
            type: 'residence',
            emoji: member?.emoji || '',
          });
        }
      }
    });

    const groups = new Map<
      string,
      { lng: number; lat: number; alt: number; members: Point[]; type: string }
    >();

    positions.forEach((p) => {
      const groupType = p.type === 'transit' ? 'moving' : 'stationary';
      const key = `${p.coordinates[0]},${p.coordinates[1]},${groupType}`;

      if (!groups.has(key)) {
        groups.set(key, {
          lng: p.coordinates[0],
          lat: p.coordinates[1],
          alt: p.coordinates[2] || 0,
          members: [],
          type: groupType,
        });
      }

      groups.get(key)?.members.push(p);
    });

    selectedMembers.forEach((person) => {
      const residenceCity = memberByName.get(person)?.residenceCity;
      if (!residenceCity) return;

      const residenceCoords = locations[residenceCity];
      if (!residenceCoords) return;

      const key = `${residenceCoords[0]},${residenceCoords[1]},stationary`;
      if (groups.has(key)) return;

      groups.set(key, {
        lng: residenceCoords[0],
        lat: residenceCoords[1],
        alt: Z_OFFSET,
        members: [],
        type: 'stationary',
      });
    });

    return Array.from(groups.values());
  }, [
    currentDate,
    selectedMembers,
    tracks,
    memberByName,
    locations,
    isMemberVisibleOnDate,
  ]);

  // Split positions into stationary (PointLayer + Popup) and moving (Marker)
  const stationaryPositions = useMemo(
    () => currentPositions.filter((g) => g.type === 'stationary'),
    [currentPositions],
  );
  const movingPositions = useMemo(
    () => currentPositions.filter((g) => g.type === 'moving'),
    [currentPositions],
  );

  // Playback timer with variable speed
  useEffect(() => {
    let timerId: NodeJS.Timeout;

    if (isPlaying) {
      // Determine speed based on current activity
      let step = PLAYBACK_SPEED.FAST;

      const hasActivity = selectedMembers.some((person) => {
        if (!isMemberVisibleOnDate(person, currentDate)) return false;

        return tracks.some((t) => {
          if (t.person !== person) return false;

          const start = dayjs(t.startDate);
          const end = dayjs(t.endDate);

          // Check if today is a key date or within travel range
          const isKeyDate =
            start.isSame(currentDate, 'day') || end.isSame(currentDate, 'day');
          const isTraveling =
            currentDate.isAfter(start) && currentDate.isBefore(end);

          return isKeyDate || isTraveling;
        });
      });

      if (hasActivity) {
        step = PLAYBACK_SPEED.SLOW;
      } else {
        // Look ahead for upcoming events to prevent skipping
        // Find the earliest event in the upcoming window (currentDate, currentDate + step]
        const nextDateLimit = currentDate.add(step, 'day');

        const upcomingEvent = keyDates.find(
          (d) =>
            (d.isAfter(currentDate) && d.isBefore(nextDateLimit)) ||
            d.isSame(nextDateLimit, 'day'),
        );

        if (upcomingEvent) {
          // Jump exactly to the event date so next tick catches the activity
          const daysToEvent = upcomingEvent.diff(currentDate, 'day', true);
          // Ensure we move forward at least a small amount to avoid getting stuck if diff is tiny
          step = Math.max(daysToEvent, PLAYBACK_SPEED.SLOW);
        }
      }

      timerId = setTimeout(() => {
        setCurrentDayOffset((prev) => {
          if (prev >= totalDays) {
            setIsPlaying(false);
            return prev;
          }
          return prev + step;
        });
      }, 50); // Constant high frame rate
    }

    return () => clearTimeout(timerId);
  }, [
    isPlaying,
    currentDayOffset,
    currentDate,
    selectedMembers,
    totalDays,
    tracks,
    isMemberVisibleOnDate,
    keyDates,
  ]);

  const visibleTracks = useMemo(() => {
    // Only show tracks that are currently active (during migration)
    return tracks
      .filter(
        (t) =>
          isMemberVisibleOnDate(t.person, currentDate) &&
          (dayjs(t.startDate).isSame(currentDate, 'day') ||
            dayjs(t.startDate).isBefore(currentDate)) &&
          (dayjs(t.endDate).isSame(currentDate, 'day') ||
            dayjs(t.endDate).isAfter(currentDate)) &&
          selectedMembers.includes(t.person),
      )
      .map((t) => {
        const fromCoords = locations[t.from];
        const toCoords = locations[t.to];
        if (!fromCoords || !toCoords) return null;

        return {
          ...t,
          coords: [
            [...fromCoords, Z_OFFSET] as [number, number, number],
            [...toCoords, Z_OFFSET] as [number, number, number],
          ] as [[number, number, number], [number, number, number]],
        };
      })
      .filter((t): t is VisibleTrack => t !== null);
  }, [currentDate, selectedMembers, tracks, locations, isMemberVisibleOnDate]);

  return (
    <PageContainer title="Family Tracks - China Edition">
      <ProCard
        direction="column"
        ghost
        gutter={[0, 16]}
        style={{ height: '80vh', position: 'relative' }}
      >
        {loadError && (
          <div
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              zIndex: 200,
              background: 'rgba(255, 77, 79, 0.12)',
              border: '1px solid rgba(255, 77, 79, 0.35)',
              color: '#a8071a',
              padding: 12,
              borderRadius: 8,
            }}
          >
            {loadError}
          </div>
        )}
        <PlaybackControl
          currentDate={currentDate}
          isPlaying={isPlaying}
          onPlayPause={() => setIsPlaying(!isPlaying)}
          currentDayOffset={currentDayOffset}
          onOffsetChange={(v) => {
            setCurrentDayOffset(v);
            setIsPlaying(false);
          }}
          totalDays={totalDays}
          startDate={startDate}
          familyMembers={familyMembers}
          selectedMembers={selectedMembers}
          onSelectedMembersChange={setSelectedMembers}
        />

        <BaseMap onSceneLoaded={setScene}>
          {scene && (
            <>
              <TrajectoryLayer
                scene={scene}
                data={visibleTracks}
                movingData={movingPositions}
                getMemberColor={(person) =>
                  familyMembers.find((m) => m.name === person)?.color || '#999'
                }
              />
              <LocationMarkers
                scene={scene}
                stationaryData={stationaryPositions}
              />
            </>
          )}
        </BaseMap>
      </ProCard>
    </PageContainer>
  );
};

export default FamilyTracks;
