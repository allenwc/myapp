import { LineLayer, Marker, type Scene } from '@antv/l7';
import React, { useEffect, useRef } from 'react';
import type { Point, VisibleTrack } from '../types';

interface TrajectoryLayerProps {
  scene: Scene;
  data: VisibleTrack[];
  movingData: {
    lng: number;
    lat: number;
    alt: number;
    members: Point[];
    type: string;
  }[];
  getMemberColor: (person: string) => string;
}

const TrajectoryLayer: React.FC<TrajectoryLayerProps> = ({
  scene,
  data,
  movingData,
  getMemberColor,
}) => {
  const layerRef = useRef<any | null>(null);
  const markersRef = useRef<Marker[]>([]);

  // Trajectory Lines
  useEffect(() => {
    if (!scene) return;

    if (data.length > 0) {
      if (!layerRef.current) {
        const layer = new LineLayer()
          .source(data, {
            parser: { type: 'json', coordinates: 'coords' },
          })
          .size(2)
          .color('person', (person) => getMemberColor(person))
          .shape('line')
          .style({
            opacity: 0.8,
            segmentNumber: 60,
            zIndex: 10,
          })
          .animate({
            interval: 1,
            trailLength: 2,
            duration: 2,
          });
        scene.addLayer(layer);
        layerRef.current = layer;
      } else {
        layerRef.current.setData(data);
      }
    } else if (layerRef.current) {
      layerRef.current.setData([]);
    }

    return () => {
      if (layerRef.current) {
        scene.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [scene, data, getMemberColor]);

  // Moving Markers (Emojis)
  useEffect(() => {
    if (!scene) return;

    // Clear old markers
    markersRef.current.forEach((m) => {
      m.remove();
    });
    markersRef.current = [];

    movingData.forEach((group) => {
      const el = document.createElement('div');
      el.style.fontSize = '24px';
      el.style.lineHeight = '1';
      el.style.cursor = 'pointer';
      el.style.userSelect = 'none';
      // No background, just the emoji
      el.innerHTML = group.members
        .map((m) => `<span title="${m.person}">${m.emoji}</span>`)
        .join('');

      const marker = new Marker({ anchor: 'center' } as any)
        .setLnglat([group.lng, group.lat, group.alt] as any)
        .setElement(el);

      scene.addMarker(marker);
      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach((m) => {
        m.remove();
      });
      markersRef.current = [];
    };
  }, [scene, movingData]);

  return null;
};

export default TrajectoryLayer;
