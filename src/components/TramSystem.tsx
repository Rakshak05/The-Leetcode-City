"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { CityBuilding } from "@/lib/github";
import { DISTRICT_COLORS } from "@/lib/github";

interface LocalTramProps {
  center: [number, number, number];
  color: string;
  radius: number;
  speed: number;
}

function LocalTramLoop({ center, color, radius, speed }: LocalTramProps) {
  const tramRef = useRef<THREE.Group>(null);
  
  // Build circular track geometry
  const trackGeometry = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const segments = 64;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(
        center[0] + Math.cos(angle) * radius,
        center[1] + 1,
        center[2] + Math.sin(angle) * radius,
      ));
    }
    return new THREE.CatmullRomCurve3(pts, true);
  }, [center, radius]);

  useFrame(({ clock }) => {
    if (!tramRef.current || !trackGeometry) return;
    
    const t = (clock.getElapsedTime() * speed) % 1;
    const pos = trackGeometry.getPointAt(t);
    const tangent = trackGeometry.getTangentAt(t);
    
    tramRef.current.position.copy(pos);
    tramRef.current.rotation.y = Math.atan2(tangent.x, tangent.z);
  });


  return (
    <group>
      {/* Rail track (visible line) */}
      {/* Circular track rail (torus ring at ground level) */}
      <mesh position={[center[0], center[1] + 0.3, center[2]]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.3, 4, 64]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} toneMapped={false} transparent opacity={0.5} />
      </mesh>
      
      {/* Tram Car */}
      <group ref={tramRef}>
        {/* Body */}
        <mesh position={[0, 2, 0]}>
          <boxGeometry args={[4, 3.5, 12]} />
          <meshStandardMaterial color={color} metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Windows */}
        {[-4, -2, 0, 2, 4].map((z) => (
          [-1.1, 1.1].map((side) => (
            <mesh key={`tw-${z}-${side}`} position={[2.1 * side, 2.2, z]}>
              <boxGeometry args={[0.1, 1.2, 1.4]} />
              <meshStandardMaterial color="#00ffcc" emissive="#00ffcc" emissiveIntensity={1.5} toneMapped={false} />
            </mesh>
          ))
        ))}
        {/* Headlight */}
        <mesh position={[0, 1.8, 6.1]}>
          <sphereGeometry args={[0.4, 6, 6]} />
          <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={4} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

// Phase 3: TramSystem computes district centers from buildings array
// and places local tram loops around each district's center.
export default function TramSystem({ buildings }: { buildings?: CityBuilding[] }) {
  // Compute district centers from buildings
  const districtCenters = useMemo(() => {
    if (!buildings || buildings.length === 0) return [];

    const groups: Record<string, { sumX: number; sumZ: number; count: number }> = {};
    for (const b of buildings) {
      const did = b.district ?? 'fullstack';
      if (!groups[did]) groups[did] = { sumX: 0, sumZ: 0, count: 0 };
      groups[did].sumX += b.position[0];
      groups[did].sumZ += b.position[2];
      groups[did].count++;
    }

    return Object.entries(groups)
      .filter(([, g]) => g.count >= 3) // Only districts with enough buildings
      .map(([did, g], idx) => ({
        id: did,
        center: [g.sumX / g.count, 0, g.sumZ / g.count] as [number, number, number],
        color: DISTRICT_COLORS[did] ?? '#ffa116',
        radius: 120 + (idx % 4) * 10,
        speed: 0.09 + (idx % 3) * 0.015,
      }));
  }, [buildings]);

  if (districtCenters.length === 0) {
    return (
      <group>
        <LocalTramLoop center={[0, 0, 0]} color="#ffa116" radius={200} speed={0.10} />
      </group>
    );
  }

  return (
    <group>
      {districtCenters.map((dc) => {
        // Skip districts too close to origin (would overlap with downtown)
        const [cx, , cz] = dc.center;
        if (Math.abs(cx) < 50 && Math.abs(cz) < 50 && dc.id !== 'downtown') return null;
        return (
          <LocalTramLoop
            key={`tram-${dc.id}`}
            center={dc.center}
            color={dc.color}
            radius={dc.radius}
            speed={dc.speed}
          />
        );
      })}
    </group>
  );
}
