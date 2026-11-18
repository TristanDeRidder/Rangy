import { useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { ROAD_LENGTH, toZ } from '../shared/projection.js';
import { COLORS, STATUS_COLOR, STATUS_LABEL } from '../shared/theme.js';
import Tag, { tagLayout } from '../shared/Tag.jsx';
import { rangeLabel, sceneBox, sceneOverlay } from '../../ui/cls.js';

const ROAD_WIDTH = 6;
const POLE = 1.6; // basishoogte van een paal (scène-eenheden)

/** Positie van de markering bij een rit: links of rechts op de baan, zoals in de SVG-versie. */
function markPos(trip, i) {
  const { side, pole } = tagLayout(i);
  const x = (side === 'left' ? -0.45 : 0.45) * (ROAD_WIDTH / 2);
  // verre palen hoger: zo blijven labels in het samengedrukte verre stuk uit elkaar
  return { side, base: [x, 0, toZ(trip.t)], top: [x, POLE * pole * (1 + 2.5 * trip.t), toZ(trip.t)] };
}

/**
 * 3D-weergave van de baan (React Three Fiber).
 * Labels staan als HTML boven het canvas (gedeelde Tag-component); hun plaats wordt
 * berekend door de toppen van de palen naar het scherm te projecteren.
 * frameloop="demand": er wordt alleen gerenderd wanneer de scène verandert.
 * @param {{ scene: import('../../scenario/types.js').Scene }} props
 */
export default function RoadScene3D({ scene }) {
  const [labels, setLabels] = useState({ range: [], tags: [] });
  const label = `3D-baan met bereik tot ${Math.round(scene.rangeKm.low)} km zeker en tot ${Math.round(
    scene.rangeKm.high,
  )} km mogelijk. ${scene.trips.map((t) => `${t.name} ${t.km} km, ${t.type}: ${STATUS_LABEL[t.status]}`).join('. ')}.`;

  return (
    <div className={sceneBox} role="img" aria-label={label}>
      <Canvas
        frameloop="demand"
        dpr={[1, 2]}
        camera={{ position: [0, 5.2, 9.5], fov: 40, near: 0.1, far: 200 }}
        onCreated={({ camera }) => camera.lookAt(0, 0, -11)}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[4, 8, 6]} intensity={1.2} />
        <Road scene={scene} />
        <Markers scene={scene} />
        <Car />
        <WindArrow share={scene.forces.aero} />
        <Projector scene={scene} onChange={setLabels} />
      </Canvas>

      <div className={sceneOverlay}>
        {labels.range.map((r) => (
          <span key={r.km} className={rangeLabel} style={{ top: `${r.y}px` }}>{r.km} KM</span>
        ))}
        {labels.tags.map(({ trip, side, x, y }) => (
          <Tag key={trip.id} trip={trip} side={side} x={`${x}px`} y={`${y}px`} />
        ))}
      </div>
    </div>
  );
}

/** Rekent 3D-punten om naar schermpixels, telkens wanneer de scène of de grootte verandert. */
function Projector({ scene, onChange }) {
  const { camera, size } = useThree();
  useEffect(() => {
    camera.updateMatrixWorld();
    const toScreen = ([x, y, z]) => {
      const v = new Vector3(x, y, z).project(camera);
      return { x: ((v.x + 1) / 2) * size.width, y: ((1 - v.y) / 2) * size.height };
    };
    const tags = scene.trips.map((trip, i) => {
      const { side, top } = markPos(trip, i);
      return { trip, side, ...toScreen(top) };
    });
    const range = [
      { km: Math.round(scene.rangeKm.high / 10) * 10, ...toScreen([-ROAD_WIDTH / 2, 0, toZ(scene.rangeT.high)]) },
      { km: Math.round(scene.rangeKm.low / 10) * 10, ...toScreen([-ROAD_WIDTH / 2, 0, toZ(scene.rangeT.low)]) },
    ];
    onChange({ tags, range });
  }, [scene, size, camera, onChange]);
  return null;
}

/** Een vlak op de baan tussen twee posities t1 en t2. */
function Strip({ t1, t2, color, opacity = 1, y = 0.005, width = ROAD_WIDTH }) {
  const z1 = toZ(t1);
  const z2 = toZ(t2);
  const length = Math.max(0.001, z1 - z2);
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, y, (z1 + z2) / 2]}>
      <planeGeometry args={[width, length]} />
      <meshStandardMaterial color={color} transparent={opacity < 1} opacity={opacity} />
    </mesh>
  );
}

function Road({ scene }) {
  const { low, high } = scene.rangeT;
  const lines = [];
  for (let t = 0.05; t < low; t += 0.05) lines.push(t);
  return (
    <group>
      <Strip t1={0} t2={1} color={COLORS.road} y={0} />
      <Strip t1={0} t2={low} color={COLORS.reach} opacity={0.35} y={0.01} />
      <Strip t1={low} t2={high} color={COLORS.margin} opacity={0.6} y={0.01} />
      {lines.map((t) => (
        <Strip key={t} t1={t} t2={t + 0.002} color={COLORS.reach} y={0.015} />
      ))}
      <Strip t1={low} t2={low + 0.004} color={COLORS.reach} y={0.02} />
    </group>
  );
}

function Markers({ scene }) {
  return scene.trips.map((trip, i) => {
    const { base, top } = markPos(trip, i);
    const color = STATUS_COLOR[trip.status];
    // rit van een ander type dan wat de baan toont: half doorzichtig
    const mat = { color, transparent: trip.dim, opacity: trip.dim ? 0.45 : 1 };
    return (
      <group key={trip.id}>
        <mesh position={[base[0], 0.05, base[2]]}>
          <boxGeometry args={[0.35, 0.1, 0.35]} />
          <meshStandardMaterial {...mat} />
        </mesh>
        <mesh position={[base[0], top[1] / 2, base[2]]}>
          <boxGeometry args={[0.04, top[1], 0.04]} />
          <meshStandardMaterial {...mat} />
        </mesh>
      </group>
    );
  });
}

/** Eenvoudige auto uit blokken: vervang later door een (licht) glTF-model. */
function Car() {
  return (
    <group position={[0, 0, 1.6]}>
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[1.9, 0.6, 3.9]} />
        <meshStandardMaterial color={COLORS.car} />
      </mesh>
      <mesh position={[0, 1.05, 0.2]}>
        <boxGeometry args={[1.5, 0.45, 2.1]} />
        <meshStandardMaterial color={COLORS.carGlass} />
      </mesh>
      {[
        [-0.85, 1.25],
        [0.85, 1.25],
        [-0.85, -1.25],
        [0.85, -1.25],
      ].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 0.32, z]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.33, 0.33, 0.25, 20]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
      ))}
    </group>
  );
}

/** Pijl voor de luchtweerstand: wordt langer naarmate het aandeel groter is. */
function WindArrow({ share }) {
  const length = 0.4 + 2.5 * share;
  return (
    <group position={[0, 0.9, -1.2 - length / 2]} rotation-x={Math.PI / 2}>
      <mesh>
        <cylinderGeometry args={[0.05, 0.05, length, 8]} />
        <meshStandardMaterial color="#5B8DEF" />
      </mesh>
      <mesh position={[0, length / 2 + 0.15, 0]}>
        <coneGeometry args={[0.16, 0.3, 12]} />
        <meshStandardMaterial color="#5B8DEF" />
      </mesh>
    </group>
  );
}
