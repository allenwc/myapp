import { Button, Checkbox, Slider, Typography } from 'antd';
import type dayjs from 'dayjs';
import React from 'react';

const { Title, Text } = Typography;

interface PlaybackControlProps {
  currentDate: dayjs.Dayjs;
  isPlaying: boolean;
  onPlayPause: () => void;
  currentDayOffset: number;
  onOffsetChange: (offset: number) => void;
  totalDays: number;
  startDate: dayjs.Dayjs;
  familyMembers: { name: string; color: string; emoji: string }[];
  selectedMembers: string[];
  onSelectedMembersChange: (members: string[]) => void;
}

const PlaybackControl: React.FC<PlaybackControlProps> = ({
  currentDate,
  isPlaying,
  onPlayPause,
  currentDayOffset,
  onOffsetChange,
  totalDays,
  startDate,
  familyMembers,
  selectedMembers,
  onSelectedMembersChange,
}) => {
  return (
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
        width: 320,
      }}
    >
      <Title level={5}>
        时间轴回放
        <div
          style={{
            fontSize: '12px',
            fontWeight: 'normal',
            color: '#666',
            marginTop: 4,
          }}
        >
          {startDate.format('YYYY-MM-DD')} ~{' '}
          {startDate.add(totalDays, 'day').format('YYYY-MM-DD')}
        </div>
      </Title>
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text strong>{currentDate.format('YYYY-MM-DD')}</Text>
          <Button type="primary" size="small" onClick={onPlayPause}>
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
        </div>
        <Slider
          min={0}
          max={totalDays}
          value={currentDayOffset}
          onChange={onOffsetChange}
          tooltip={{
            formatter: (value) =>
              startDate.add(value || 0, 'day').format('YYYY-MM-DD'),
          }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <Text strong>Family Members</Text>
        <div style={{ marginTop: 8 }}>
          <Checkbox.Group
            options={familyMembers.map((m) => ({
              label: m.name,
              value: m.name,
            }))}
            value={selectedMembers}
            onChange={(v) => onSelectedMembersChange(v as string[])}
          />
        </div>
      </div>
    </div>
  );
};

export default PlaybackControl;
