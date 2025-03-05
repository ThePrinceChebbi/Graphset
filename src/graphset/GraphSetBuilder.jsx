import { useState } from 'react';

const GraphSetBuilder = () => {
  const [graphNodes, setGraphNodes] = useState([
    { id: 0, x: 100, y: 70, label: 'Node 0', fixed: true }
  ]);

  const [connections, setConnections] = useState([]);

  const [functions, setFunctions] = useState([
    { id: 'func1', label: 'Function A', x: 400, y: 50, placed: false },
    { id: 'func2', label: 'Function B', x: 400, y: 120, placed: false },
    { id: 'func3', label: 'Function C', x: 400, y: 190, placed: false },
    { id: 'func4', label: 'Function D', x: 400, y: 260, placed: false }
  ]);

  const [dragging, setDragging] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [nextNodeId, setNextNodeId] = useState(1);

  const [dropZones, setDropZones] = useState([
    { id: 'drop0', nodeId: 0, x: 100, y: 160, occupied: false }
  ]);

  const handleMouseDown = (e, func) => {
    if (func.placed) return;
    const rect = e.target.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setDragging(func.id);
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!dragging) return;

    const updatedFunctions = functions.map(f => {
      if (f.id === dragging) {
        return {
          ...f,
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        };
      }
      return f;
    });

    setFunctions(updatedFunctions);
  };

  const handleMouseUp = () => {
    if (!dragging) return;

    const droppedFunc = functions.find(f => f.id === dragging);

    // Check if dropped on any drop zone
    const dropZone = dropZones.find(zone => {
      if (zone.occupied) return false;

      const distance = Math.sqrt(
          Math.pow(droppedFunc.x - zone.x, 2) +
          Math.pow(droppedFunc.y - zone.y, 2)
      );

      return distance < 60;
    });

    if (dropZone && !droppedFunc.placed) {
      const newNodeId = dropZone.nodeId;

      // Add new node at the drop zone center
      setGraphNodes([
        ...graphNodes,
        {
          id: newNodeId,
          x: dropZone.x,
          y: dropZone.y,
          label: droppedFunc.label,
          funcId: droppedFunc.id
        }
      ]);

      // Add connection from previous node if not the first node
      if (newNodeId > 0) {
        setConnections([
          ...connections,
          { from: newNodeId - 1, to: newNodeId, label: `L${newNodeId}` }
        ]);
      }

      // Mark function as placed
      setFunctions(functions.map(f =>
          f.id === dragging ? { ...f, placed: true } : f
      ));

      // Mark drop zone as occupied and add a new drop zone below the last one
      setDropZones(prevZones => {
        const updatedZones = prevZones.map(zone =>
            zone.id === dropZone.id ? { ...zone, occupied: true } : zone
        );

        const lastZone = updatedZones[updatedZones.length - 1];
        updatedZones.push({
          id: `drop${updatedZones.length}`,
          nodeId: lastZone.nodeId + 1,
          x: lastZone.x,
          y: lastZone.y + 90,
          occupied: false
        });

        return updatedZones;
      });

      setNextNodeId(Math.max(nextNodeId, newNodeId + 1));
    } else {
      // Return to original position if not dropped on a valid zone
      setFunctions(functions.map(f =>
          f.id === dragging && !f.placed ?
              { ...f, x: 400, y: 50 + (parseInt(f.id.replace('func', '')) - 1) * 70 } : f
      ));
    }

    setDragging(null);
  };

  const resetGraph = () => {
    setGraphNodes([{ id: 0, x: 100, y: 70, label: 'Node 0', fixed: true }]);
    setConnections([]);
    setFunctions(functions.map(f => ({ ...f, placed: false })));
    setNextNodeId(1);
    setDropZones([
      { id: 'drop0', nodeId: 0, x: 100, y: 160, occupied: false }
    ]);
  };

  // Get the last node for the return arrow
  const lastNodeIndex = graphNodes.length - 1;
  const hasNodes = graphNodes.length > 1;

  return (
      <div
          className="relative w-full h-screen bg-gray-100 p-4 select-none"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
      >
        <div className="bg-white rounded-lg p-4 shadow-md mb-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Graphset Builder</h1>
          <button
              onClick={resetGraph}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Reset
          </button>
        </div>

        <div className="flex">
          {/* Graphset area */}
          <div className="w-2/3 h-[70vh] bg-white rounded-lg shadow-md p-4 relative">

            {/* Draw connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {/* Rectangular return path from the last node back to the first node */}
              {hasNodes && (
                  <g>
                    <path
                        d={`M ${graphNodes[lastNodeIndex].x} ${graphNodes[lastNodeIndex].y + 32}
                      L ${graphNodes[lastNodeIndex].x + 80} ${graphNodes[lastNodeIndex].y + 32}
                      L ${graphNodes[lastNodeIndex].x + 80} ${graphNodes[0].y - 32}
                      L ${graphNodes[0].x} ${graphNodes[0].y - 32}`}
                        fill="none"
                        stroke="black"
                        strokeWidth="4"
                    />
                  </g>
              )}
            </svg>

            {/* Draw nodes (centered using transform) */}
            {graphNodes.map(node => (
                <div key={node.id} className="absolute" style={{ left: node.x, top: node.y, transform: 'translate(-50%, -50%)' }}>
                  <div className="bg-blue-200 border-2 border-blue-400 rounded p-2 w-20 h-16 flex items-center justify-center text-center">
                    {node.label}
                  </div>
                  {/* Divider bar */}
                  <div className="h-1 w-full bg-gray-600 mt-1"></div>
                </div>
            ))}
          </div>

          {/* Functions palette */}
          <div className="w-1/3 h-[70vh] bg-white rounded-lg shadow-md ml-4 p-4">
            <h2 className="text-lg font-bold mb-4">Functions</h2>
            <div className="space-y-4">
              {functions.map(func => (
                  <div
                      key={func.id}
                      className={`p-2 bg-blue-100 border-2 border-blue-300 rounded cursor-move w-32 text-center ${func.placed ? 'opacity-50' : ''}`}
                      onMouseDown={(e) => handleMouseDown(e, func)}
                      style={{
                        position: dragging === func.id ? 'absolute' : 'relative',
                        left: dragging === func.id ? func.x : 'auto',
                        top: dragging === func.id ? func.y : 'auto',
                        zIndex: dragging === func.id ? 1000 : 1
                      }}
                  >
                    {func.label}
                  </div>
              ))}
            </div>
            <div className="mt-8 p-4 bg-gray-100 rounded">
              <p className="text-sm">Drag functions to the highlighted drop zones to build the graphset.</p>
            </div>
          </div>
        </div>
      </div>
  );
};

export default GraphSetBuilder;
