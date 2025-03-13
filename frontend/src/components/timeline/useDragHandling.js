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
    setDragCursor(cursor);

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
    
    if (timelineRect.width === 0) return;
    
    const timePerPixel = duration / timelineRect.width;
    const deltaTime = deltaX * timePerPixel;
    
    const newSegments = [...segments];
    const currentSegment = { ...newSegments[draggingIndex] };

    if (draggingEdge === 'left') {
      // Only basic boundary check to prevent negative start time
      currentSegment.start = Math.max(0, originalStart + deltaTime);
    } else if (draggingEdge === 'right') {
      // Only basic boundary check to prevent exceeding duration
      currentSegment.end = Math.min(duration, originalEnd + deltaTime);
    } else {
      // Dragging whole segment - allow free movement with only basic boundaries
      let newStart = originalStart + deltaTime;
      let newEnd = originalEnd + deltaTime;
      
      // Basic boundary checks - only prevent going negative if on left and beyond duration
      if (newStart < 0) {
        const offset = -newStart;
        newStart = 0;
        newEnd = Math.min(duration, originalEnd - originalStart + offset);
      }
      
      if (newEnd > duration) {
        const offset = newEnd - duration;
        newEnd = duration;
        newStart = Math.max(0, originalStart + originalEnd - duration - offset);
      }
      
      currentSegment.start = newStart;
      currentSegment.end = newEnd;
    }

    // Update the current segment
    newSegments[draggingIndex] = currentSegment;

    // Update all segments with minimal validation
    const validatedSegments = newSegments.map(seg => ({
      ...seg,
      start: Math.max(0, seg.start),
      end: Math.min(duration, seg.end)
    }));

    onUpdateLyrics(validatedSegments);
  };

  const endDrag = () => {
    setDraggingIndex(null);
    setDraggingEdge(null);
    document.body.style.cursor = 'default';
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