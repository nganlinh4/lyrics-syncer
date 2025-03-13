import { useState } from 'react';

const useDragHandling = ({ segments, duration, onUpdateLyrics }) => {
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [draggingEdge, setDraggingEdge] = useState(null);
  const [startX, setStartX] = useState(0);
  const [originalStart, setOriginalStart] = useState(0);
  const [originalEnd, setOriginalEnd] = useState(0);
  const [dragCursor, setDragCursor] = useState('move');

  const startDrag = (e, index, edge, timelineRect) => {
    e.preventDefault();
    e.stopPropagation();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    setStartX(clientX - timelineRect.left);
    
    const cursor = edge ? `${edge}-resize` : 'move';
    document.body.style.cursor = cursor;
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';

    const segment = segments[index];
    setOriginalStart(segment.start);
    setOriginalEnd(segment.end);
    setDraggingIndex(index);
    setDraggingEdge(edge);
  };

  const handleDrag = (e, timelineRect) => {
    e.preventDefault();

    if (draggingIndex === null) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const timelineLeft = timelineRect.left;
    
    let currentX = Math.max(0, Math.min(clientX - timelineLeft, timelineRect.width));
    let deltaX = currentX - startX;
    deltaX = Math.max(-startX, Math.min(deltaX, timelineRect.width));
    
    if (timelineRect.width === 0) return;
    
    const timePerPixel = duration / timelineRect.width;
    const deltaTime = deltaX * timePerPixel;
    
    const newSegments = segments.map(seg => ({ ...seg }));
    const currentSegment = newSegments[draggingIndex];
    const minStart = draggingIndex > 0 ? newSegments[draggingIndex - 1].end : 0;
    const maxEnd = draggingIndex < newSegments.length - 1 
      ? newSegments[draggingIndex + 1].start 
      : duration;

    if (draggingEdge === 'left') {
      currentSegment.start = Math.max(minStart, Math.min(currentSegment.end - 0.1, originalStart + deltaTime));
    } else if (draggingEdge === 'right') {
      currentSegment.end = Math.min(maxEnd, Math.max(currentSegment.start + 0.1, originalEnd + deltaTime));
    } else {
      const segmentDuration = originalEnd - originalStart;
      let newStart = originalStart + deltaTime;
      let newEnd = originalEnd + deltaTime;

      if (newStart < minStart) {
        newStart = minStart;
        newEnd = minStart + segmentDuration;
      }

      if (newEnd > maxEnd) {
        newEnd = maxEnd;
        newStart = maxEnd - segmentDuration;
      }

      currentSegment.start = Math.max(minStart, parseFloat(newStart.toFixed(3)));
      currentSegment.end = Math.min(maxEnd, parseFloat(newEnd.toFixed(3)));

      if (draggingIndex < newSegments.length - 1 && Math.abs(newEnd - maxEnd) < 0.01) {
        const pushAmount = deltaTime;
        
        if (pushAmount > 0) {
          for (let i = draggingIndex + 1; i < newSegments.length; i++) {
            const nextSegment = newSegments[i];
            const nextSegmentDuration = nextSegment.end - nextSegment.start;
            let nextStart = nextSegment.start + pushAmount;
            let nextEnd = nextSegment.end + pushAmount;
            const hasNextSegment = i < newSegments.length - 1;
            const nextLimit = hasNextSegment ? newSegments[i + 1].start : duration;

            if (nextEnd > nextLimit) {
              nextEnd = nextLimit;
              nextStart = nextLimit - nextSegmentDuration;
              if (i < newSegments.length - 1) {
                pushAmount = nextEnd - nextSegment.end;
              }
            }

            nextSegment.start = nextStart;
            nextSegment.end = nextEnd;

            if (pushAmount <= 0) break;
          }
        }
      }
    }

    const validatedSegments = newSegments.map(seg => ({
      ...seg,
      start: Math.max(0, parseFloat(seg.start.toFixed(3))),
      end: Math.min(duration, parseFloat(seg.end.toFixed(3)))
    }));

    onUpdateLyrics(validatedSegments);
  };

  const endDrag = () => {
    if (draggingIndex !== null) {
      onUpdateLyrics([...segments]);
    }
    
    setDraggingIndex(null);
    setDraggingEdge(null);
    document.body.style.userSelect = 'auto';
    document.body.style.cursor = 'default';
    document.body.style.webkitUserSelect = 'auto';
    setDragCursor('move');
  };

  return {
    draggingIndex,
    dragCursor,
    startDrag,
    handleDrag,
    endDrag
  };
};

export default useDragHandling;