import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Rect, Text, Circle, Image as KonvaImage, Transformer, Group, Line } from 'react-konva';
import useImage from 'use-image';
import { CoverElement, KdpConfig } from './types.ts';

const URLImage = ({ shapeProps, isSelected, onSelect, onChange }: any) => {
  const shapeRef = useRef<any>(null);
  const trRef = useRef<any>(null);
  const [image] = useImage(shapeProps.src, 'anonymous');

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <React.Fragment>
      <KonvaImage
        onClick={onSelect}
        onTap={onSelect}
        ref={shapeRef}
        {...shapeProps}
        image={image}
        draggable
        onDragEnd={(e) => {
          onChange({
            ...shapeProps,
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={(e) => {
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          onChange({
            ...shapeProps,
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(5, node.height() * scaleY),
          });
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) return oldBox;
            return newBox;
          }}
        />
      )}
    </React.Fragment>
  );
};

const ElementNode = ({ shapeProps, isSelected, onSelect, onChange }: any) => {
  const shapeRef = useRef<any>(null);
  const trRef = useRef<any>(null);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  const commonProps = {
    onClick: onSelect,
    onTap: onSelect,
    ref: shapeRef,
    ...shapeProps,
    draggable: true,
    onDragEnd: (e: any) => {
      onChange({ ...shapeProps, x: e.target.x(), y: e.target.y() });
    },
    onTransformEnd: (e: any) => {
      const node = shapeRef.current;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      node.scaleX(1);
      node.scaleY(1);
      onChange({
        ...shapeProps,
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
        width: Math.max(5, node.width() * scaleX),
        height: Math.max(5, node.height() * scaleY),
      });
    },
  };

  let node = null;
  if (shapeProps.type === 'rect') {
    node = <Rect {...commonProps} />;
  } else if (shapeProps.type === 'circle') {
    // Circle uses radius, but we mapped it to width/height for simplicity. 
    // Just map width to radius*2
    node = <Circle {...commonProps} radius={shapeProps.width / 2} scaleX={1} scaleY={1} />;
  } else if (shapeProps.type === 'text') {
    node = <Text {...commonProps} />;
  }

  return (
    <React.Fragment>
      {node}
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) return oldBox;
            return newBox;
          }}
        />
      )}
    </React.Fragment>
  );
};

interface KdpCanvasProps {
  config: KdpConfig;
  elements: CoverElement[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onChange: (newElements: CoverElement[]) => void;
  stageRef: React.RefObject<any>;
  zoom: number;
}

export const KdpCanvas: React.FC<KdpCanvasProps> = ({ config, elements, selectedId, onSelect, onChange, stageRef, zoom }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // KDP Math
  const PPI = 100; // 100 pixels per inch for screen working resolution
  const paperMultiplier = config.paperType === 'white' ? 0.002252 : 0.0025;
  const spineWidthInches = config.pageCount * paperMultiplier;
  
  const trimW = config.trimWidth * PPI;
  const trimH = config.trimHeight * PPI;
  const bleed = config.bleed * PPI;
  const spineW = spineWidthInches * PPI;

  const totalWidth = (trimW * 2) + spineW + (bleed * 2);
  const totalHeight = trimH + (bleed * 2);

  const spineX = trimW + bleed;
  
  const checkDeselect = (e: any) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      onSelect(null);
    }
  };

  return (
    <div ref={containerRef} className="w-full h-full overflow-auto bg-slate-100 flex items-center justify-center p-8 relative">
      <div 
        style={{ 
          width: totalWidth * zoom, 
          height: totalHeight * zoom, 
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          background: 'white'
        }}
      >
        <Stage
          width={totalWidth * zoom}
          height={totalHeight * zoom}
          scaleX={zoom}
          scaleY={zoom}
          onMouseDown={checkDeselect}
          onTouchStart={checkDeselect}
          ref={stageRef}
        >
          {/* Background & Guides Layer */}
          <Layer>
            <Rect width={totalWidth} height={totalHeight} fill="#ffffff" />
            
            {/* Bleed Lines */}
            <Rect 
              x={bleed} y={bleed} 
              width={totalWidth - (bleed*2)} height={totalHeight - (bleed*2)} 
              stroke="rgba(255,0,0,0.3)" strokeWidth={1} dash={[5, 5]} 
              listening={false} 
            />
            
            {/* Spine Lines */}
            <Rect 
              x={spineX} y={0} 
              width={spineW} height={totalHeight} 
              stroke="rgba(0,0,255,0.3)" strokeWidth={1} dash={[5, 5]} 
              listening={false} 
            />
            
            {/* Barcode Area Placeholder (Back Cover bottom-right) */}
            <Rect
              x={bleed + trimW - (2 * PPI) - (0.25 * PPI)}
              y={totalHeight - bleed - (1.2 * PPI) - (0.25 * PPI)}
              width={2 * PPI}
              height={1.2 * PPI}
              fill="rgba(255,255,255,0.8)"
              stroke="rgba(0,0,0,0.2)"
              strokeWidth={1}
              listening={false}
            />
            <Text
              x={bleed + trimW - (2 * PPI) - (0.25 * PPI)}
              y={totalHeight - bleed - (1.2 * PPI) - (0.25 * PPI) + (0.5 * PPI)}
              width={2 * PPI}
              text="Barcode Area"
              align="center"
              fill="rgba(0,0,0,0.3)"
              fontSize={14}
              listening={false}
            />
          </Layer>

          {/* User Elements Layer */}
          <Layer>
            {elements.map((el, i) => {
              if (el.type === 'image') {
                return (
                  <URLImage
                    key={el.id}
                    shapeProps={el}
                    isSelected={el.id === selectedId}
                    onSelect={() => onSelect(el.id)}
                    onChange={(newAttrs: CoverElement) => {
                      const newEl = [...elements];
                      newEl[i] = newAttrs;
                      onChange(newEl);
                    }}
                  />
                );
              }
              return (
                <ElementNode
                  key={el.id}
                  shapeProps={el}
                  isSelected={el.id === selectedId}
                  onSelect={() => onSelect(el.id)}
                  onChange={(newAttrs: CoverElement) => {
                    const newEl = [...elements];
                    newEl[i] = newAttrs;
                    onChange(newEl);
                  }}
                />
              );
            })}
          </Layer>
        </Stage>
      </div>
    </div>
  );
};
