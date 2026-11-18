import { lazy, Suspense } from 'react';
import RoadSceneSVG from './svg/RoadSceneSVG.jsx';

// three.js wordt pas geladen wanneer de 3D-versie echt nodig is
const RoadScene3D = lazy(() => import('./three/RoadScene3D.jsx'));

/**
 * Enige plek die kiest tussen 3D en SVG.
 * Beide krijgen exact hetzelfde `scene`-object en rekenen zelf niets.
 * @param {{ scene: import('../scenario/types.js').Scene, mode: '3d' | 'svg' }} props
 */
export default function RoadScene({ scene, mode }) {
  if (mode !== '3d') return <RoadSceneSVG scene={scene} />;
  return (
    // Tijdens het laden van three.js toont de SVG-versie al hetzelfde beeld
    <Suspense fallback={<RoadSceneSVG scene={scene} />}>
      <RoadScene3D scene={scene} />
    </Suspense>
  );
}
