import { LineLayer, PolygonLayer, Scene } from '@antv/l7';
import { Map as L7Map } from '@antv/l7-maps';
import { RDBSource } from 'district-data';
import React, { useEffect, useRef } from 'react';

interface BaseMapProps {
  onSceneLoaded: (scene: Scene) => void;
  children?: React.ReactNode;
}

const BaseMap: React.FC<BaseMapProps> = ({ onSceneLoaded, children }) => {
  const sceneRef = useRef<Scene | null>(null);

  useEffect(() => {
    // If scene already exists, don't recreate
    if (sceneRef.current) return;

    const scene = new Scene({
      id: 'map',
      map: new L7Map({
        center: [111.4453125, 32.84267363195431],
        pitch: 0,
        zoom: 3,
      }),
      logoVisible: false,
    });
    sceneRef.current = scene;

    scene.on('loaded', () => {
      // Load World Data
      const source = new RDBSource({
        version: '2023',
      });

      source
        .getData({
          level: 'province',
          precision: 'low',
        })
        .then((data) => {
          // Create Static World Layers
          const fillLayer = new PolygonLayer()
            .source(data)
            .shape('fill')
            .color('#5886CF')
            .style({
              opacity: 0.8,
            });
          scene.addLayer(fillLayer);

          const lineLayer = new LineLayer()
            .source(data)
            .shape('line')
            .color('#989494')
            .size(0.6)
            .style({
              opacity: 0.8,
            });
          scene.addLayer(lineLayer);

          // Notify parent that scene is ready and base layers are loaded
          onSceneLoaded(scene);
        });
    });

    return () => {
      scene.destroy();
      sceneRef.current = null;
    };
  }, []); // Empty dependency array ensures run once

  return (
    <>
      {children}
      <div
        id="map"
        style={{
          height: '100%',
          width: '100%',
          borderRadius: 8,
          backgroundColor: '#000',
        }}
      />
    </>
  );
};

export default BaseMap;
