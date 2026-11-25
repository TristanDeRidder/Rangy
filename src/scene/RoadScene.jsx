import RoadSceneSVG from './svg/RoadSceneSVG.jsx';

/**
 * De baan. Krijgt een kant-en-klaar `scene`-object en rekent zelf niets.
 * @param {{ scene: import('../scenario/types.js').Scene }} props
 */
export default function RoadScene({ scene }) {
  return <RoadSceneSVG scene={scene} />;
}
