import { PageContainer, ProCard } from '@ant-design/pro-components';
import {
  LineLayer,
  MapboxScene,
  PointLayer,
  PolygonLayer,
} from '@antv/l7-react';
import { Checkbox, Slider, Typography } from 'antd';
import { RDBSource } from 'district-data';
import React, { useEffect, useMemo, useState } from 'react';

const { Title, Text } = Typography;

// Mock Data for Family Tracks
const FAMILY_MEMBERS = [
  { name: 'Father', color: '#1890ff', emoji: '👨' },
  { name: 'Mother', color: '#f5222d', emoji: '👩' },
  { name: 'Child', color: '#52c41a', emoji: '👶' },
];

const LOCATIONS: Record<string, [number, number]> = {
  Beijing: [116.4074, 39.9042],
  Shanghai: [121.4737, 31.2304],
  Shenzhen: [114.0579, 22.5431],
  London: [-0.1278, 51.5074],
  NewYork: [-74.006, 40.7128],
  Hangzhou: [120.1551, 30.2741],
  Chengdu: [104.0668, 30.5728],
  Tokyo: [139.6917, 35.6895],
};

interface Track {
  person: string;
  from: string;
  to: string;
  year: number;
  reason: string;
}

const TRACKS: Track[] = [
  // Father's track
  {
    person: 'Father',
    from: 'Beijing',
    to: 'Shanghai',
    year: 2015,
    reason: 'Work Relocation',
  },
  {
    person: 'Father',
    from: 'Shanghai',
    to: 'Shenzhen',
    year: 2018,
    reason: 'Project Assignment',
  },
  {
    person: 'Father',
    from: 'Shenzhen',
    to: 'Beijing',
    year: 2020,
    reason: 'Return Home',
  },

  // Mother's track
  {
    person: 'Mother',
    from: 'Beijing',
    to: 'Hangzhou',
    year: 2016,
    reason: 'Sabbatical',
  },
  {
    person: 'Mother',
    from: 'Hangzhou',
    to: 'Beijing',
    year: 2017,
    reason: 'Back to Work',
  },
  {
    person: 'Mother',
    from: 'Beijing',
    to: 'Chengdu',
    year: 2019,
    reason: 'Business Trip',
  },
  {
    person: 'Mother',
    from: 'Chengdu',
    to: 'Beijing',
    year: 2019,
    reason: 'Return',
  },

  // Child's track
  {
    person: 'Child',
    from: 'Beijing',
    to: 'London',
    year: 2021,
    reason: 'University Study',
  },
  {
    person: 'Child',
    from: 'London',
    to: 'Beijing',
    year: 2023,
    reason: 'Summer Vacation',
  },
  {
    person: 'Child',
    from: 'Beijing',
    to: 'London',
    year: 2023,
    reason: 'Return to School',
  },
  {
    person: 'Child',
    from: 'London',
    to: 'NewYork',
    year: 2024,
    reason: 'Internship',
  },
];

const Z_OFFSET = 50000; // Elevation in meters to prevent map occlusion

interface Point {
  person: string;
  city: string;
  coordinates: [number, number, number];
  year: number;
  type: string;
  emoji: string;
}

// Generate point data from tracks
const generatePoints = (): Point[] => {
  const points: Point[] = [];
  const processed = new Set<string>();

  TRACKS.forEach((track) => {
    // Add start point
    const startKey = `${track.person}-${track.from}`;
    if (!processed.has(startKey)) {
      const member = FAMILY_MEMBERS.find((m) => m.name === track.person);
      points.push({
        person: track.person,
        city: track.from,
        coordinates: [...LOCATIONS[track.from], Z_OFFSET],
        year: track.year, // Rough approximation
        type: 'residence',
        emoji: member?.emoji || '',
      });
      processed.add(startKey);
    }

    // Add end point
    const endKey = `${track.person}-${track.to}`;
    if (!processed.has(endKey)) {
      const member = FAMILY_MEMBERS.find((m) => m.name === track.person);
      points.push({
        person: track.person,
        city: track.to,
        coordinates: [...LOCATIONS[track.to], Z_OFFSET],
        year: track.year,
        type: 'destination',
        emoji: member?.emoji || '',
      });
      processed.add(endKey);
    }
  });
  return points;
};

const FamilyTracks: React.FC = () => {
  const [yearRange, setYearRange] = useState<[number, number]>([2010, 2025]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([
    'Father',
    'Mother',
    'Child',
  ]);
  const [worldData, setWorldData] = useState<any>(null);

  useEffect(() => {
    const source = new RDBSource({
      version: '2023',
    });

    source
      .getData({
        level: 'province',
        precision: 'low',
      })
      .then((data) => {
        setWorldData(data);
      });
  }, []);

  const filteredTracks = useMemo(() => {
    return TRACKS.filter(
      (t) =>
        t.year >= yearRange[0] &&
        t.year <= yearRange[1] &&
        selectedMembers.includes(t.person),
    ).map((t) => ({
      ...t,
      coords: [
        [...LOCATIONS[t.from], Z_OFFSET],
        [...LOCATIONS[t.to], Z_OFFSET],
      ],
    }));
  }, [yearRange, selectedMembers]);

  const filteredPoints = useMemo(() => {
    const points = generatePoints();
    // Simple filter: include points if they are part of any visible track
    // Or just show all points for selected members
    return points.filter((p) => selectedMembers.includes(p.person));
  }, [selectedMembers]);

  return (
    <PageContainer title="Family Residence Tracks">
      <ProCard
        direction="column"
        ghost
        gutter={[0, 16]}
        style={{ height: '80vh', position: 'relative' }}
      >
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: 20,
            zIndex: 100,
            background: 'rgba(255,255,255,0.9)',
            padding: 16,
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            width: 300,
          }}
        >
          <Title level={5}>Filters</Title>
          <div style={{ marginBottom: 16 }}>
            <Text strong>Family Members</Text>
            <div style={{ marginTop: 8 }}>
              <Checkbox.Group
                options={FAMILY_MEMBERS.map((m) => ({
                  label: m.name,
                  value: m.name,
                }))}
                value={selectedMembers}
                onChange={(v) => setSelectedMembers(v as string[])}
              />
            </div>
          </div>
          <div>
            <Text strong>
              Time Range: {yearRange[0]} - {yearRange[1]}
            </Text>
            <Slider
              range
              min={2010}
              max={2025}
              value={yearRange}
              onChange={(v) => setYearRange(v as [number, number])}
            />
          </div>
        </div>

        <MapboxScene
          map={{
            center: [105, 35],
            pitch: 40,
            style: 'blank', // Using blank to match existing project style, or 'dark' if supported
            zoom: 3,
          }}
          style={{
            height: '100%',
            width: '100%',
            borderRadius: 8,
            backgroundColor: '#000', // Set background black for visibility if style is blank
          }}
        >
          {/* World Base Map */}
          {worldData && (
            <PolygonLayer
              key="world-fill"
              source={{
                data: worldData,
              }}
              color={{
                values: '#2c2c2c', // Dark grey for land
              }}
              shape={{
                values: 'fill',
              }}
              style={{
                opacity: 1,
                zIndex: 0,
              }}
            />
          )}
          {worldData && (
            <LineLayer
              key="world-line"
              source={{
                data: worldData,
              }}
              color={{
                values: '#444', // Slightly lighter for borders
              }}
              size={{
                values: 0.5,
              }}
              shape={{
                values: 'line',
              }}
              style={{
                opacity: 1,
                zIndex: 1,
              }}
            />
          )}

          {/* Trajectory Lines */}
          {filteredTracks.length > 0 && (
            <LineLayer
              key="lines"
              source={{
                data: filteredTracks,
                parser: {
                  type: 'json',
                  coordinates: 'coords',
                },
              }}
              size={{
                values: 2,
              }}
              color={{
                field: 'person',
                values: (person: string) =>
                  FAMILY_MEMBERS.find((m) => m.name === person)?.color ||
                  '#999',
              }}
              shape={{
                values: 'arc3d',
              }}
              style={{
                opacity: 0.8,
                segmentNumber: 60,
                zIndex: 10,
              }}
              animate={{
                interval: 1,
                trailLength: 2,
                duration: 2,
              }}
            />
          )}

          {/* Location Points */}
          {filteredPoints.length > 0 && (
            <PointLayer
              key="points"
              source={{
                data: filteredPoints,
                parser: {
                  type: 'json',
                  coordinates: 'coordinates',
                },
              }}
              shape={{
                values: 'cylinder',
              }}
              color={{
                field: 'person',
                values: (person: string) =>
                  FAMILY_MEMBERS.find((m) => m.name === person)?.color ||
                  '#999',
              }}
              size={{
                values: [10, 10],
              }}
              style={{
                opacity: 0.9,
                zIndex: 20,
              }}
              active={{
                option: {
                  color: 'yellow',
                },
              }}
            ></PointLayer>
          )}

          {/* Emoji Labels */}
          {filteredPoints.length > 0 && (
            <PointLayer
              key="emoji-labels"
              source={{
                data: filteredPoints,
                parser: {
                  type: 'json',
                  coordinates: 'coordinates',
                },
              }}
              shape={{
                field: 'emoji',
                values: 'text',
              }}
              size={{
                values: 24,
              }}
              style={{
                opacity: 1,
                zIndex: 25,
                textAnchor: 'center',
                textOffset: [0, -20], // Offset to float above the cylinder
                padding: [2, 2],
              }}
            />
          )}
        </MapboxScene>
      </ProCard>
    </PageContainer>
  );
};

export default FamilyTracks;
