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
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const resizeRafRef = useRef<number | null>(null);

  useEffect(() => {
    // If scene already exists, don't recreate
    if (sceneRef.current) return;

    const mapEl = document.getElementById('map');
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

    const resizeMap = () => {
      const rawMap = scene.getMapService().map as any;
      if (rawMap && typeof rawMap.resize === 'function') rawMap.resize();
      scene.render();
    };

    scene.on('loaded', () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      if (mapEl && typeof ResizeObserver !== 'undefined') {
        const observer = new ResizeObserver(() => {
          if (resizeRafRef.current) cancelAnimationFrame(resizeRafRef.current);
          resizeRafRef.current = requestAnimationFrame(() => {
            resizeMap();
          });
        });
        observer.observe(mapEl);
        resizeObserverRef.current = observer;
      }

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

          requestAnimationFrame(() => {
            resizeMap();
            requestAnimationFrame(() => {
              resizeMap();
            });
          });
        });
    });

    return () => {
      if (resizeRafRef.current) cancelAnimationFrame(resizeRafRef.current);
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
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
