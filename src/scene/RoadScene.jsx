import RoadSceneSVG from './svg/RoadSceneSVG.jsx';

/**
 * De baan. Krijgt het plan van het rekenmodel (buildPlan) en rekent zelf niets.
 * @param {{ plan: import('../scenario/types.js').Plan }} props
 */
export default function RoadScene({ plan }) {
  return <RoadSceneSVG plan={plan} />;
}
