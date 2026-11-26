import { useRef, useState } from 'react';

/**
 * Omstandigheden (gsm) open- en dichtvegen.
 * Open: naar beneden slepen volgt de vinger; los na ver genoeg of snel genoeg = dicht, anders veert hij terug.
 * Dicht: naar boven vegen = open.
 * Een tik blijft een tik (de knop klapt open en dicht); na slepen wordt de klik genegeerd.
 *
 * @param {{ open: boolean, onOpen: () => void, onClose: () => void }} opts
 * @returns {{ dy: number, dragging: boolean, handlers: object }}  dy: verschuiving in px voor de sheet
 */
export function useSheetDrag({ open, onOpen, onClose }) {
  const [dy, setDy] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef(null);
  const moved = useRef(false);

  const finish = (e) => {
    const s = start.current;
    start.current = null;
    setDragging(false);
    setDy(0);
    if (!s || !moved.current) return;
    const d = e.clientY - s.y;
    const v = d / Math.max(1, e.timeStamp - s.t); // px per ms
    if (open && (d > 70 || (d > 20 && v > 0.5))) onClose();
    else if (!open && (d < -30 || (d < -10 && v < -0.5))) onOpen();
  };

  return {
    dy,
    dragging,
    handlers: {
      onPointerDown: (e) => {
        if (e.button !== 0) return;
        start.current = { y: e.clientY, t: e.timeStamp, id: e.pointerId };
        moved.current = false;
      },
      onPointerMove: (e) => {
        const s = start.current;
        if (!s) return;
        const d = e.clientY - s.y;
        if (!moved.current && Math.abs(d) > 6) {
          moved.current = true;
          setDragging(true);
          e.currentTarget.setPointerCapture?.(s.id);
        }
        // open: volgt de vinger naar beneden; dicht: een beetje mee naar boven (veert)
        if (moved.current) setDy(open ? Math.max(0, d) : Math.max(-24, Math.min(0, d) / 3));
      },
      onPointerUp: finish,
      onPointerCancel: () => {
        start.current = null;
        moved.current = false;
        setDragging(false);
        setDy(0);
      },
      onClickCapture: (e) => {
        if (!moved.current) return;
        moved.current = false;
        e.preventDefault();
        e.stopPropagation();
      },
    },
  };
}
