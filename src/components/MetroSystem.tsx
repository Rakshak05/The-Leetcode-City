"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { CityBuilding } from "@/lib/github";

interface TrackSegment {
  start: THREE.Vector3;
  end: THREE.Vector3;
  name: string;
}

// ─── Elevated Metro Station Platform ──────────────────────────────
interface MetroStationProps {
  position: [number, number, number];
  name: string;
}

function MetroStation({ position, name }: MetroStationProps) {
  return (
    <group position={position}>
      {/* 1. Large pillars holding the station */}
      {[-16, 16].map((x) =>
        [-30, 0, 30].map((z) => (
          <mesh key={`sp-${x}-${z}`} position={[x, 20, z]}>
            <cylinderGeometry args={[2.5, 3.2, 40, 6]} />
            <meshStandardMaterial color="#3a3d45" roughness={0.8} />
          </mesh>
        ))
      )}

      {/* 2. Platform slab at Y=40 */}
      <mesh position={[0, 39, 0]}>
        <boxGeometry args={[45, 2, 90]} />
        <meshStandardMaterial color="#2d2d30" roughness={0.9} />
      </mesh>
      
      {/* 3. Platform Roof canopy */}
      <mesh position={[0, 58, 0]}>
        <boxGeometry args={[48, 1, 94]} />
        <meshStandardMaterial color="#4a4c52" roughness={0.8} />
      </mesh>
      {[-22, 22].map((x) =>
        [-40, -20, 20, 40].map((z) => (
          <mesh key={`roof-p-${x}-${z}`} position={[x, 49, z]}>
            <cylinderGeometry args={[0.4, 0.45, 20, 5]} />
            <meshStandardMaterial color="#222" />
          </mesh>
        ))
      )}

      {/* 4. Glass platform screens with neon glow strips */}
      {[-21, 21].map((x) => (
        <group key={`screen-${x}`} position={[x, 42.5, 0]}>
          <mesh>
            <boxGeometry args={[0.4, 5, 80]} />
            <meshStandardMaterial color="#00ffcc" transparent opacity={0.3} roughness={0.2} />
          </mesh>
          {/* Glowing strip */}
          <mesh position={[0, 2.5, 0]}>
            <boxGeometry args={[0.5, 0.2, 80]} />
            <meshStandardMaterial color="#ffa116" emissive="#ffa116" emissiveIntensity={2.5} toneMapped={false} />
          </mesh>
        </group>
      ))}

      {/* 5. Stairs to ground */}
      <group position={[0, 20, -50]} rotation={[0.4, 0, 0]}>
        <mesh>
          <boxGeometry args={[10, 2, 60]} />
          <meshStandardMaterial color="#404348" />
        </mesh>
      </group>

      {/* 6. Glowing neon signboard */}
      <group position={[0, 50, 46]}>
        <mesh>
          <boxGeometry args={[26, 6, 0.6]} />
          <meshStandardMaterial color="#0d0d0f" />
        </mesh>
        <mesh position={[0, 0, 0.35]}>
          <boxGeometry args={[24, 4, 0.1]} />
          <meshStandardMaterial color="#ffa116" emissive="#ffa116" emissiveIntensity={3} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0, 0.42]}>
          <boxGeometry args={[22, 3, 0.1]} />
          <meshStandardMaterial color="#0a0a0d" />
        </mesh>
      </group>
    </group>
  );
}

// ─── Animated Metro Train ─────────────────────────────────────────
interface TrainProps {
  segment: TrackSegment;
  speedMultiplier?: number;
}

function MetroTrain({ segment, speedMultiplier = 1.0 }: TrainProps) {
  const trainRef = useRef<THREE.Group>(null);
  
  const dir = useMemo(() => new THREE.Vector3().subVectors(segment.end, segment.start), [segment]);
  const length = useMemo(() => dir.length(), [dir]);
  const normDir = useMemo(() => dir.clone().normalize(), [dir]);
  const angle = useMemo(() => Math.atan2(dir.x, dir.z), [dir]);

  useFrame(({ clock }) => {
    if (!trainRef.current) return;
    
    const time = clock.getElapsedTime() * 0.08 * speedMultiplier;
    const progress = (Math.sin(time * Math.PI - Math.PI / 2) + 1) / 2;
    
    const trainPos = new THREE.Vector3().addScaledVector(normDir, progress * length).add(segment.start);
    trainRef.current.position.copy(trainPos);
    
    const bob = Math.sin(clock.getElapsedTime() * 8) * 0.15;
    trainRef.current.position.y = segment.start.y + bob;
  });

  return (
    <group ref={trainRef} rotation={[0, angle, 0]}>
      {[-24, 0, 24].map((offsetZ) => (
        <group key={offsetZ} position={[0, 2.5, offsetZ]}>
          {/* Coach Body */}
          <mesh>
            <boxGeometry args={[6.5, 5, 22]} />
            <meshStandardMaterial color="#a0a5ad" metalness={0.85} roughness={0.2} />
          </mesh>
          {/* Window bands */}
          {[-8, -4, 0, 4, 8].map((wZ) => (
            [-1.1, 1.1].map((side) => (
              <group key={`win-${wZ}-${side}`} position={[3.3 * side, 1.2, wZ]}>
                <mesh>
                  <boxGeometry args={[0.1, 1.5, 2.2]} />
                  <meshStandardMaterial color="#00ffcc" emissive="#00ffcc" emissiveIntensity={1.8} toneMapped={false} />
                </mesh>
              </group>
            ))
          ))}
          {/* Orange streak */}
          <mesh position={[0, -1.2, 0]}>
            <boxGeometry args={[6.7, 0.4, 22.2]} />
            <meshStandardMaterial color="#ffa116" emissive="#ffa116" emissiveIntensity={1.5} toneMapped={false} />
          </mesh>
        </group>
      ))}
      {/* Headlight */}
      <mesh position={[0, 2.2, 37]}>
        <sphereGeometry args={[0.8, 8, 6]} />
        <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={4} toneMapped={false} />
      </mesh>
    </group>
  );
}

// ─── Main Elevated Track & Pillars Assembly ───────────────────────
// Phase 3: Stations are placed OUTSIDE the city boundary, connected
// by elevated tracks that cross over water.
export default function MetroSystem({ buildings }: { buildings?: CityBuilding[] }) {
  // Compute city extents from actual building positions
  const cityExtent = useMemo(() => {
    if (!buildings || buildings.length === 0) return { maxX: 500, maxZ: 500 };
    let maxX = 0, maxZ = 0;
    for (const b of buildings) {
      maxX = Math.max(maxX, Math.abs(b.position[0]) + b.width / 2);
      maxZ = Math.max(maxZ, Math.abs(b.position[2]) + b.depth / 2);
    }
    return { maxX, maxZ };
  }, [buildings]);

  // Station positions: placed outside the city at cardinal points
  const stationOffset = 200; // How far beyond city edge
  const stationPositions = useMemo(() => ({
    north: [0, 0, -(cityExtent.maxZ + stationOffset)] as [number, number, number],
    south: [0, 0, (cityExtent.maxZ + stationOffset)] as [number, number, number],
    east:  [(cityExtent.maxX + stationOffset), 0, 0] as [number, number, number],
    west:  [-(cityExtent.maxX + stationOffset), 0, 0] as [number, number, number],
  }), [cityExtent, stationOffset]);

  // Define elevated track paths (Y=40) connecting stations through the city
  const trackSegments = useMemo<TrackSegment[]>(() => {
    const list: TrackSegment[] = [];

    // North-South line (through city center)
    list.push({
      start: new THREE.Vector3(stationPositions.north[0], 40, stationPositions.north[2]),
      end: new THREE.Vector3(stationPositions.south[0], 40, stationPositions.south[2]),
      name: "north-south-line"
    });

    // East-West line (through city center)
    list.push({
      start: new THREE.Vector3(stationPositions.east[0], 40, stationPositions.east[2]),
      end: new THREE.Vector3(stationPositions.west[0], 40, stationPositions.west[2]),
      name: "east-west-line"
    });

    return list;
  }, [stationPositions]);

  const railsAndPillars = useMemo(() => {
    const pillars: React.ReactNode[] = [];
    const rails: React.ReactNode[] = [];
    const step = 300;

    trackSegments.forEach((segment) => {
      const dir = new THREE.Vector3().subVectors(segment.end, segment.start);
      const length = dir.length();
      const normDir = dir.clone().normalize();
      const angle = Math.atan2(dir.x, dir.z);
      const center = new THREE.Vector3().addVectors(segment.start, segment.end).multiplyScalar(0.5);

      // Track beams
      rails.push(
        <group key={`track-${segment.name}`} position={[center.x, 39.5, center.z]} rotation={[0, angle, 0]}>
          {/* Main viaduct bed */}
          <mesh>
            <boxGeometry args={[14, 1.2, length]} />
            <meshStandardMaterial color="#50525c" roughness={0.8} />
          </mesh>
          {/* Left Rail */}
          <mesh position={[-3.5, 1.0, 0]}>
            <boxGeometry args={[0.5, 0.4, length]} />
            <meshStandardMaterial color="#ffa116" emissive="#ffa116" emissiveIntensity={1.0} toneMapped={false} />
          </mesh>
          {/* Right Rail */}
          <mesh position={[3.5, 1.0, 0]}>
            <boxGeometry args={[0.5, 0.4, length]} />
            <meshStandardMaterial color="#ffa116" emissive="#ffa116" emissiveIntensity={1.0} toneMapped={false} />
          </mesh>
        </group>
      );

      // Support pillars
      for (let d = step; d < length - step; d += step) {
        const pos = new THREE.Vector3().addScaledVector(normDir, d).add(segment.start);
        pillars.push(
          <group key={`metro-pill-${segment.name}-${d}`}>
            <mesh position={[pos.x, 20, pos.z]}>
              <cylinderGeometry args={[2.8, 3.8, 40, 6]} />
              <meshStandardMaterial color="#42454f" roughness={0.85} />
            </mesh>
            <mesh position={[pos.x, 39, pos.z]} rotation={[0, angle, 0]}>
              <boxGeometry args={[16, 2, 4.5]} />
              <meshStandardMaterial color="#32353d" roughness={0.9} />
            </mesh>
          </group>
        );
      }
    });

    return { pillars, rails };
  }, [trackSegments]);

  return (
    <group>
      {/* Rails & Pillars */}
      {railsAndPillars.rails}
      {railsAndPillars.pillars}

      {/* Stations at cardinal points outside the city */}
      <MetroStation position={stationPositions.north} name="NORTH TERMINAL" />
      <MetroStation position={stationPositions.south} name="SOUTH TERMINAL" />
      <MetroStation position={stationPositions.east} name="EAST TERMINAL" />
      <MetroStation position={stationPositions.west} name="WEST TERMINAL" />

      {/* Animated Metro Trains */}
      {trackSegments.map((seg, idx) => (
        <MetroTrain key={`train-${idx}`} segment={seg} speedMultiplier={idx % 2 === 0 ? 1.0 : 1.2} />
      ))}
    </group>
  );
}
