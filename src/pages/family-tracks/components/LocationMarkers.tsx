import { Marker, PointLayer, type Scene } from '@antv/l7';
import React, { useEffect, useRef, useState } from 'react';
import type { Point } from '../types';

interface LocationMarkersProps {
  scene: Scene;
  stationaryData: {
    lng: number;
    lat: number;
    alt: number;
    members: Point[];
    type: string;
  }[];
}

const LocationMarkers: React.FC<LocationMarkersProps> = ({
  scene,
  stationaryData,
}) => {
  const stationaryLayerRef = useRef<any | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const pointIconSize = 20;
  const popupOffsetY = -pointIconSize / 2;

  // Load Resources
  useEffect(() => {
    if (!scene) return;

    const initResources = () => {
      try {
        // Add image if it doesn't exist (L7 will handle duplicates or we can just try)
        // Ideally we check scene.hasImage but it depends on version.
        // We just add it, assuming this component is the owner of this resource now.
        scene.addImage(
          'location-marker',
          'https://gw.alipayobjects.com/mdn/rms_fcd5b3/afts/img/A*g8cUQ7pPT9YAAAAAAAAAAAAAARQnAQ',
        );
      } catch (e) {
        console.warn('Image loading error or already exists:', e);
      }
      setImagesLoaded(true);
    };

    initResources();
  }, [scene]);

  // Stationary Points Layer
  useEffect(() => {
    if (!scene || !imagesLoaded) return;

    if (stationaryData.length > 0) {
      const sourceData = stationaryData.map((p) => ({
        ...p,
        coords: [p.lng, p.lat, p.alt],
      }));
      if (!stationaryLayerRef.current) {
        const layer = new PointLayer()
          .source(sourceData, {
            parser: { type: 'json', coordinates: 'coords' },
          })
          .shape('location-marker')
          .size(pointIconSize)
          .style({
            opacity: 1,
            zIndex: 20,
          });
        scene.addLayer(layer);
        stationaryLayerRef.current = layer;
      } else {
        stationaryLayerRef.current.setData(sourceData);
      }
    } else if (stationaryLayerRef.current) {
      stationaryLayerRef.current.setData([]);
    }

    // Markers for Stationary Points (using Marker to support multiple simultaneous labels)
    markersRef.current.forEach((m) => {
      m.remove();
    });
    markersRef.current = [];

    stationaryData.forEach((group) => {
      if (group.members.length === 0) return;
      // Create custom DOM for the marker to look like a popup
      const container = document.createElement('div');
      Object.assign(container.style, {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))', // Apply shadow to the whole container to merge bubble and arrow
        position: 'relative',
        paddingBottom: '6px',
      });

      const bubble = document.createElement('div');
      Object.assign(bubble.style, {
        backgroundColor: 'rgba(255, 255, 255, 0.50)',
        borderRadius: '4px',
        padding: '4px 8px',
        // boxShadow removed to let container handle the unified shadow
        display: 'flex',
        gap: '4px',
        fontSize: '20px',
        lineHeight: '1',
        whiteSpace: 'nowrap',
      });
      bubble.innerHTML = group.members
        .map((m) => `<span title="${m.person}">${m.emoji}</span>`)
        .join('');

      const arrow = document.createElement('div');
      Object.assign(arrow.style, {
        width: '0',
        height: '0',
        borderLeft: '6px solid transparent',
        borderRight: '6px solid transparent',
        borderTop: '6px solid rgba(255, 255, 255, 0.50)',
        position: 'absolute',
        bottom: '0',
        left: '50%',
        transform: 'translateX(-50%)',
      });

      container.appendChild(bubble);
      container.appendChild(arrow);

      const marker = new Marker({
        anchor: 'bottom',
        offset: [0, popupOffsetY],
      } as any)
        .setLnglat([group.lng, group.lat, group.alt] as any)
        .setElement(container);

      scene.addMarker(marker);
      markersRef.current.push(marker);
    });
  }, [scene, stationaryData, imagesLoaded]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (stationaryLayerRef.current) {
        scene?.removeLayer(stationaryLayerRef.current);
      }
      markersRef.current.forEach((m) => {
        m.remove();
      });
    };
  }, [scene]);

  return null;
};

export default LocationMarkers;
