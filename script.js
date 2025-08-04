
    // Global variables
    let canvas, ctx;
    let nodes = [];
    let edges = [];
    let nodeId = 0;
    let mode = 'add-node';
    let algorithm = 'bfs';
    let startNode = null;
    let endNode = null;
    let isRunning = false;
    let isPaused = false;
    let stepMode = false;
    let speed = 1000;
    let dragging = null;
    let edgeStart = null;

    // Resize variables
    let isResizingCanvas = false;
    let isResizingBottom = false;
    let startY = 0;
    let startHeight = 0;

    // Algorithm state for step-by-step visualization
    let algorithmSteps = [];
    let currentStep = 0;
    let visitedNodes = new Set();
    let pathNodes = [];
    let currentNodes = new Set();
    let queueStackNodes = [];
    let totalDistance = 0;

    // Algorithm definitions with accurate implementations
    const algorithms = {
      'bfs': {
        name: 'Breadth-First Search (BFS)',
        description: 'BFS explores nodes level by level using a queue (FIFO). It guarantees the shortest path in unweighted graphs by visiting all nodes at distance k before visiting nodes at distance k+1.',
        timeComplexity: 'O(V + E)',
        spaceComplexity: 'O(V)',
        dataStructure: 'Queue (FIFO)'
      },
      'dfs': {
        name: 'Depth-First Search (DFS)',
        description: 'DFS explores as far as possible along each branch using a stack (LIFO). It may not find the shortest path but uses less memory and is useful for topological sorting and cycle detection.',
        timeComplexity: 'O(V + E)',
        spaceComplexity: 'O(V)',
        dataStructure: 'Stack (LIFO)'
      },
      'dijkstra': {
        name: "Dijkstra's Shortest Path Algorithm",
        description: "Dijkstra's algorithm finds the shortest path in weighted graphs with non-negative weights. It maintains distances and uses a priority queue to always process the closest unvisited node.",
        timeComplexity: 'O((V + E) log V)',
        spaceComplexity: 'O(V)',
        dataStructure: 'Priority Queue'
      },
      'astar': {
        name: 'A* Search Algorithm',
        description: 'A* uses heuristics to guide search toward the goal efficiently. It combines actual cost from start (g) with heuristic estimate to goal (h) to find optimal paths faster than Dijkstra.',
        timeComplexity: 'O(b^d)',
        spaceComplexity: 'O(b^d)',
        dataStructure: 'Priority Queue + Heuristic'
      }
    };

    // Initialize application
    function init() {
      canvas = document.getElementById('graph-canvas');
      ctx = canvas.getContext('2d');
      
      setupCanvas();
      setupEventListeners();
      setupResizeHandlers();
      updateUI();
      draw();
    }

    function setupCanvas() {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
    }

    function setupResizeHandlers() {
      const canvasResizeHandle = document.getElementById('resize-handle-canvas');
      const bottomResizeHandle = document.getElementById('resize-handle-bottom');

      // Canvas resize functionality
      canvasResizeHandle.addEventListener('mousedown', (e) => {
        isResizingCanvas = true;
        startY = e.clientY;
        startHeight = canvas.offsetHeight;
        document.body.style.cursor = 'ns-resize';
        e.preventDefault();
      });

      // Bottom panel resize functionality
      bottomResizeHandle.addEventListener('mousedown', (e) => {
        isResizingBottom = true;
        startY = e.clientY;
        startHeight = document.getElementById('bottom-section').offsetHeight;
        document.body.style.cursor = 'ns-resize';
        e.preventDefault();
      });

      // Global mouse move handler
      document.addEventListener('mousemove', (e) => {
        if (isResizingCanvas) {
          const deltaY = e.clientY - startY;
          const newHeight = Math.max(300, Math.min(window.innerHeight * 0.8, startHeight + deltaY));
          canvas.style.height = newHeight + 'px';
          setupCanvas();
          draw();
        }
        
        if (isResizingBottom) {
          const deltaY = e.clientY - startY;
          const newHeight = Math.max(200, Math.min(window.innerHeight * 0.6, startHeight - deltaY));
          document.getElementById('bottom-section').style.height = newHeight + 'px';
        }
      });

      // Global mouse up handler
      document.addEventListener('mouseup', () => {
        isResizingCanvas = false;
        isResizingBottom = false;
        document.body.style.cursor = '';
      });
    }

    function setupEventListeners() {
      // Control toggle
      document.getElementById('control-toggle').addEventListener('click', toggleControlBar);
      
      // Tool buttons
      document.getElementById('add-node').addEventListener('click', () => setMode('add-node'));
      document.getElementById('add-edge').addEventListener('click', () => setMode('add-edge'));
      document.getElementById('move-node').addEventListener('click', () => setMode('move-node'));
      document.getElementById('remove-entity').addEventListener('click', () => setMode('remove-entity'));
      
      // Algorithm selection
      document.getElementById('algorithm').addEventListener('change', (e) => {
        algorithm = e.target.value;
        resetVisualization(); // Add this line
        updateAlgorithmInfo();
      });
      
      // Main control buttons
      document.getElementById('run').addEventListener('click', startAlgorithm);
      document.getElementById('pause').addEventListener('click', pauseAlgorithm);
      document.getElementById('step-mode').addEventListener('click', toggleStepMode);
      document.getElementById('reset').addEventListener('click', resetVisualization);
      
      // Step control buttons
      document.getElementById('prev-step').addEventListener('click', previousStep);
      document.getElementById('next-step').addEventListener('click', nextStep);
      document.getElementById('auto-play').addEventListener('click', autoPlay);
      
      // Speed control
      document.getElementById('speed').addEventListener('input', (e) => {
        speed = parseInt(e.target.value);
        document.getElementById('speed-value').textContent = speed + 'ms';
      });
      
      // Utility buttons
      document.getElementById('generate-random').addEventListener('click', generateSampleGraph);
      document.getElementById('clear-graph').addEventListener('click', clearGraph);
      document.getElementById('fit-to-screen').addEventListener('click', fitToScreen);
      document.getElementById('center-graph').addEventListener('click', centerGraph);
      document.getElementById('screenshot').addEventListener('click', takeScreenshot);
      
      // Canvas events
      canvas.addEventListener('mousedown', handleMouseDown);
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('mouseup', handleMouseUp);
      canvas.addEventListener('dblclick', handleDoubleClick);
      
      // Keyboard shortcuts
      document.addEventListener('keydown', handleKeyPress);
      
      // Window resize
      window.addEventListener('resize', handleResize);
    }

    function toggleControlBar() {
      const toolbar = document.getElementById('toolbar');
      const toggleBtn = document.getElementById('control-toggle');
      const mainContainer = document.getElementById('main-container');
      
      toolbar.classList.toggle('hidden');
      mainContainer.classList.toggle('toolbar-hidden');
      
      const icon = toggleBtn.querySelector('i');
      if (toolbar.classList.contains('hidden')) {
        icon.className = 'fas fa-chevron-down';
        toggleBtn.title = 'Show Control Bar';
        showToast('Control bar hidden for maximum visualization space! 👁️', 'success');
      } else {
        icon.className = 'fas fa-bars';
        toggleBtn.title = 'Hide Control Bar';
        showToast('Control bar shown! 📋', 'success');
      }
      
      // Adjust canvas after toolbar change
      setTimeout(() => {
        setupCanvas();
        draw();
      }, 300);
    }

    function handleKeyPress(e) {
      if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
          case 'r':
            e.preventDefault();
            if (!isRunning) startAlgorithm();
            break;
          case 'p':
            e.preventDefault();
            if (isRunning) pauseAlgorithm();
            break;
          case 'x':
            e.preventDefault();
            resetVisualization();
            break;
          case 's':
            e.preventDefault();
            toggleStepMode();
            break;
          case 'h':
            e.preventDefault();
            toggleControlBar();
            break;
        }
      }
      
      if (stepMode && algorithmSteps.length > 0) {
        switch(e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            previousStep();
            break;
          case 'ArrowRight':
            e.preventDefault();
            nextStep();
            break;
          case ' ':
            e.preventDefault();
            autoPlay();
            break;
        }
      }
    }

    function handleResize() {
      setupCanvas();
      draw();
    }

    function setMode(newMode) {
      mode = newMode;
      
      // Update button states
      document.querySelectorAll('.tool-group button').forEach(btn => btn.classList.remove('active'));
      document.getElementById(newMode).classList.add('active');
      
      showToast(`${newMode.replace('-', ' ')} mode activated! 🎯`, 'success');
    }

    function updateAlgorithmInfo() {
      const algo = algorithms[algorithm];
      if (algo) {
        document.getElementById('algo-name').textContent = algo.name;
        document.getElementById('algo-description').textContent = algo.description;
        document.getElementById('time-complexity').textContent = algo.timeComplexity;
        document.getElementById('space-complexity').textContent = algo.spaceComplexity;
        document.getElementById('ds-name').textContent = algo.dataStructure;
      }
    }

    function updateUI() {
      document.getElementById('stat-nodes').textContent = nodes.length;
      document.getElementById('stat-edges').textContent = edges.length;
      document.getElementById('stat-steps').textContent = currentStep;
      document.getElementById('stat-visited').textContent = visitedNodes.size;
      document.getElementById('path-length-stat').textContent = pathNodes.length > 0 ? pathNodes.length : '-';
      document.getElementById('stat-distance').textContent = totalDistance > 0 ? totalDistance.toFixed(1) : '-';
      
      updateStepInfo();
      updateDataStructureVisualization();
      updateAlgorithmInfo();
    }

    function updateStepInfo() {
      const stepCounter = document.getElementById('step-counter');
      const stepTitle = document.getElementById('step-title');
      const stepDescription = document.getElementById('step-description');
      
      if (algorithmSteps.length > 0 && currentStep < algorithmSteps.length) {
        const step = algorithmSteps[currentStep];
        stepCounter.textContent = currentStep + 1;
        stepTitle.textContent = step.title;
        stepDescription.textContent = step.description;
      } else if (isRunning) {
        stepCounter.textContent = currentStep + 1;
        stepTitle.textContent = 'Algorithm Running';
        stepDescription.textContent = 'Processing graph nodes...';
      } else {
        stepCounter.textContent = '0';
        stepTitle.textContent = 'Ready to Start';
        stepDescription.textContent = 'Select an algorithm and click "Start Learning" to begin the step-by-step visualization.';
      }
    }

    function updateDataStructureVisualization() {
      const queueStackViz = document.getElementById('queue-stack-viz');
      const visitedViz = document.getElementById('visited-viz');
      
      // Update queue/stack visualization
      if (queueStackNodes.length > 0) {
        queueStackViz.innerHTML = '';
        queueStackNodes.forEach((nodeId, index) => {
          const item = document.createElement('div');
          item.className = algorithm === 'dfs' ? 'stack-item' : 'queue-item';
          item.textContent = nodeId;
          item.title = algorithm === 'dfs' ? `Stack position: ${queueStackNodes.length - index}` : `Queue position: ${index + 1}`;
          queueStackViz.appendChild(item);
        });
      } else {
        queueStackViz.innerHTML = '<span style="color: #64748b; font-size: 0.875rem;">Empty</span>';
      }
      
      // Update visited nodes visualization
      if (visitedNodes.size > 0) {
        visitedViz.innerHTML = '';
        Array.from(visitedNodes).forEach(nodeId => {
          const item = document.createElement('div');
          item.className = 'queue-item';
          item.style.background = '#fbbf24';
          item.style.color = '#1e293b';
          item.textContent = nodeId;
          visitedViz.appendChild(item);
        });
      } else {
        visitedViz.innerHTML = '<span style="color: #64748b; font-size: 0.875rem;">None</span>';
      }
    }

    function showToast(message, type = 'success') {
      const toast = document.createElement('div');
      toast.className = `toast ${type}`;
      toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
          <span>${message}</span>
        </div>
      `;
      
      document.body.appendChild(toast);
      
      setTimeout(() => toast.classList.add('show'), 100);
      
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
          if (document.body.contains(toast)) {
            document.body.removeChild(toast);
          }
        }, 300);
      }, 3000);
    }

    // Canvas event handlers
    function handleMouseDown(e) {
      if (isRunning) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      switch (mode) {
        case 'add-node':
          addNode(x, y);
          break;
        case 'add-edge':
          handleEdgeCreation(x, y);
          break;
        case 'move-node':
          startNodeDrag(x, y);
          break;
        case 'remove-entity':
          removeEntity(x, y);
          break;
      }
    }

    function handleMouseMove(e) {
      if (dragging && mode === 'move-node') {
        const rect = canvas.getBoundingClientRect();
        dragging.x = e.clientX - rect.left;
        dragging.y = e.clientY - rect.top;
        draw();
      }
    }

    function handleMouseUp(e) {
      dragging = null;
    }

    function handleDoubleClick(e) {
      if (isRunning) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const node = getNodeAt(x, y);
      
      if (node) {
        if (!startNode) {
          startNode = node;
          showToast('Start node set! 🎯', 'success');
        } else if (!endNode && node !== startNode) {
          endNode = node;
          showToast('End node set! Ready to learn! 🚀', 'success');
        } else {
          startNode = node;
          endNode = null;
          showToast('Nodes reset! 🔄', 'warning');
        }
        draw();
        updateUI();
      }
    }

    // Graph manipulation methods
    function addNode(x, y) {
      const node = {
        id: nodeId++,
        x: x,
        y: y,
        neighbors: []
      };
      nodes.push(node);
      draw();
      updateUI();
      showToast(`Node ${node.id} added! 🎯`, 'success');
    }

    function handleEdgeCreation(x, y) {
      const node = getNodeAt(x, y);
      if (node) {
        if (!edgeStart) {
          edgeStart = node;
          draw();
        } else if (edgeStart !== node) {
          if (!hasEdge(edgeStart, node)) {
            const weight = ['dijkstra', 'astar'].includes(algorithm) ? 
                         Math.floor(Math.random() * 9) + 1 : 1;
            addEdge(edgeStart, node, weight);
            showToast(`Edge created between ${edgeStart.id} and ${node.id}! 🔗`, 'success');
          } else {
            showToast('Edge already exists! ⚠️', 'warning');
          }
          edgeStart = null;
        } else {
          showToast('Cannot connect node to itself! ❌', 'error');
          edgeStart = null;
        }
      }
    }

    function addEdge(nodeA, nodeB, weight = 1) {
      const edge = { 
        nodeA: nodeA, 
        nodeB: nodeB, 
        weight: weight 
      };
      edges.push(edge);
      
      if (!nodeA.neighbors.includes(nodeB)) nodeA.neighbors.push(nodeB);
      if (!nodeB.neighbors.includes(nodeA)) nodeB.neighbors.push(nodeA);
      
      draw();
      updateUI();
    }

    function startNodeDrag(x, y) {
      const node = getNodeAt(x, y);
      if (node) {
        dragging = node;
        canvas.style.cursor = 'grabbing';
      }
    }

    function removeEntity(x, y) {
      const node = getNodeAt(x, y);
      if (node) {
        removeNode(node);
        return;
      }
      
      const edge = getEdgeAt(x, y);
      if (edge) {
        removeEdge(edge);
      }
    }

    function removeNode(node) {
      edges = edges.filter(edge => 
        edge.nodeA !== node && edge.nodeB !== node
      );
      
      nodes.forEach(n => {
        n.neighbors = n.neighbors.filter(neighbor => neighbor !== node);
      });
      
      nodes = nodes.filter(n => n !== node);
      
      if (startNode === node) startNode = null;
      if (endNode === node) endNode = null;
      
      draw();
      updateUI();
      showToast(`Node ${node.id} removed! 🗑️`, 'success');
    }

    function removeEdge(edge) {
      edges = edges.filter(e => e !== edge);
      
      edge.nodeA.neighbors = edge.nodeA.neighbors.filter(n => n !== edge.nodeB);
      edge.nodeB.neighbors = edge.nodeB.neighbors.filter(n => n !== edge.nodeA);
      
      draw();
      updateUI();
      showToast('Edge removed! 🗑️', 'success');
    }

    // Utility methods
    function getNodeAt(x, y) {
      return nodes.find(node => {
        const distance = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2);
        return distance <= 25;
      });
    }

    function getEdgeAt(x, y) {
      return edges.find(edge => {
        const distance = pointToLineDistance(
          x, y, 
          edge.nodeA.x, edge.nodeA.y,
          edge.nodeB.x, edge.nodeB.y
        );
        return distance <= 8;
      });
    }

    function pointToLineDistance(px, py, x1, y1, x2, y2) {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const length = Math.sqrt(dx * dx + dy * dy);
      
      if (length === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
      
      const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (length * length)));
      const projectionX = x1 + t * dx;
      const projectionY = y1 + t * dy;
      
      return Math.sqrt((px - projectionX) ** 2 + (py - projectionY) ** 2);
    }

    function hasEdge(nodeA, nodeB) {
      return edges.some(edge => 
        (edge.nodeA === nodeA && edge.nodeB === nodeB) ||
        (edge.nodeA === nodeB && edge.nodeB === nodeA)
      );
    }

    // Enhanced drawing methods
    function draw() {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      
      // Draw edges first
      edges.forEach(edge => drawEdge(edge));
      
      // Draw nodes with enhanced visual states
      nodes.forEach(node => drawNode(node));
      
      // Highlight edge start if creating edge
      if (edgeStart && mode === 'add-edge') {
        drawNodeHighlight(edgeStart, '#3b82f6');
      }
      
      // Draw path arrows if path exists
      if (pathNodes.length > 1) {
        drawPathArrows();
      }
    }

    function drawNode(node) {
      const radius = 24;
      
      // Determine node state and colors
      let fillColor = '#ffffff';
      let strokeColor = '#3b82f6';
      let strokeWidth = 3;
      let shouldPulse = false;
      let shouldGlow = false;
      
      if (node === startNode) {
        fillColor = '#10b981';
        strokeColor = '#059669';
        strokeWidth = 4;
        shouldGlow = true;
      } else if (node === endNode) {
        fillColor = '#ef4444';
        strokeColor = '#dc2626';
        strokeWidth = 4;
        shouldGlow = true;
      } else if (currentNodes.has(node.id)) {
        fillColor = '#06b6d4';
        strokeColor = '#0891b2';
        strokeWidth = 5;
        shouldPulse = true;
      } else if (queueStackNodes.includes(node.id)) {
        fillColor = '#8b5cf6';
        strokeColor = '#7c3aed';
        strokeWidth = 4;
      } else if (pathNodes.includes(node.id)) {
        fillColor = '#f59e0b';
        strokeColor = '#d97706';
        strokeWidth = 4;
        shouldGlow = true;
      } else if (visitedNodes.has(node.id)) {
        fillColor = '#fbbf24';
        strokeColor = '#f59e0b';
        strokeWidth = 3;
      }
      
      // Apply pulse effect for current node
      const currentRadius = shouldPulse ? radius + Math.sin(Date.now() * 0.008) * 4 : radius;
      
      // Draw node shadow and glow
      ctx.save();
      if (shouldGlow) {
        ctx.shadowColor = strokeColor;
        ctx.shadowBlur = 15;
      } else {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 6;
      }
      ctx.shadowOffsetY = 3;
      
      // Draw node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, currentRadius, 0, 2 * Math.PI);
      ctx.fillStyle = fillColor;
      ctx.fill();
      
      ctx.restore();
      
      // Draw node border
      ctx.beginPath();
      ctx.arc(node.x, node.y, currentRadius, 0, 2 * Math.PI);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.stroke();
      
      // Draw node label
      ctx.fillStyle = (node === startNode || node === endNode || 
                      pathNodes.includes(node.id) || currentNodes.has(node.id)) ? '#ffffff' : '#1e293b';
      ctx.font = 'bold 16px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.id, node.x, node.y);
      
      // Draw special indicators
      if (node === startNode) {
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 11px Inter';
        ctx.fillText('START', node.x, node.y + 35);
      } else if (node === endNode) {
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 11px Inter';
        ctx.fillText('END', node.x, node.y + 35);
      }
    }

    function drawNodeHighlight(node, color) {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(node.x, node.y, 30, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.restore();
    }

    function drawEdge(edge) {
      let strokeColor = '#64748b';
      let strokeWidth = 3;
      let shouldGlow = false;
      
      // Highlight path edges
      if (pathNodes.includes(edge.nodeA.id) && pathNodes.includes(edge.nodeB.id)) {
        const indexA = pathNodes.indexOf(edge.nodeA.id);
        const indexB = pathNodes.indexOf(edge.nodeB.id);
        if (Math.abs(indexA - indexB) === 1) {
          strokeColor = '#f59e0b';
          strokeWidth = 6;
          shouldGlow = true;
        }
      }
      
      ctx.save();
      
      // Add glow effect for path edges
      if (shouldGlow) {
        ctx.shadowColor = strokeColor;
        ctx.shadowBlur = 10;
      }
      
      // Draw edge
      ctx.beginPath();
      ctx.moveTo(edge.nodeA.x, edge.nodeA.y);
      ctx.lineTo(edge.nodeB.x, edge.nodeB.y);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      ctx.stroke();
      
      ctx.restore();
      
      // Draw weight for weighted algorithms
      if (edge.weight !== 1 && ['dijkstra', 'astar'].includes(algorithm)) {
        const midX = (edge.nodeA.x + edge.nodeB.x) / 2;
        const midY = (edge.nodeA.y + edge.nodeB.y) / 2;
        
        // Draw weight background
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(midX, midY, 14, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        
        // Draw weight text
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 12px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(edge.weight, midX, midY);
      }
    }

    function drawPathArrows() {
      for (let i = 0; i < pathNodes.length - 1; i++) {
        const fromNode = nodes.find(n => n.id === pathNodes[i]);
        const toNode = nodes.find(n => n.id === pathNodes[i + 1]);
        
        if (fromNode && toNode) {
          drawArrow(fromNode.x, fromNode.y, toNode.x, toNode.y, '#f59e0b');
        }
      }
    }

    function drawArrow(fromX, fromY, toX, toY, color) {
      const headlen = 18;
      const dx = toX - fromX;
      const dy = toY - fromY;
      const angle = Math.atan2(dy, dx);
      
      // Adjust start and end points to not overlap with nodes
      const nodeRadius = 24;
      const length = Math.sqrt(dx * dx + dy * dy);
      const unitX = dx / length;
      const unitY = dy / length;
      
      const startX = fromX + unitX * nodeRadius;
      const startY = fromY + unitY * nodeRadius;
      const endX = toX - unitX * nodeRadius;
      const endY = toY - unitY * nodeRadius;
      
      ctx.save();
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 4;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      
      // Draw arrow head
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(endX - headlen * Math.cos(angle - Math.PI / 6), endY - headlen * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(endX - headlen * Math.cos(angle + Math.PI / 6), endY - headlen * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
      
      ctx.restore();
    }

    // Algorithm implementations (same as previous version)
    async function startAlgorithm() {
      if (!startNode || !endNode) {
        showToast('Please set start and end nodes by double-clicking! 🎯', 'error');
        return;
      }
      
      if (nodes.length < 2) {
        showToast('Graph needs at least 2 nodes! 📊', 'error');
        return;
      }
      
      if (startNode === endNode) {
        showToast('Start and end nodes must be different! ⚠️', 'error');
        return;
      }
      
      // Reset state
      isRunning = true;
      isPaused = false;
      algorithmSteps = [];
      currentStep = 0;
      visitedNodes.clear();
      pathNodes = [];
      currentNodes.clear();
      queueStackNodes = [];
      totalDistance = 0;
      
      // Update UI
      document.getElementById('run').disabled = true;
      document.getElementById('pause').disabled = false;
      document.getElementById('reset').disabled = false;
      
      showToast('Algorithm started! Watch the step-by-step visualization! 🎓', 'success');
      
      try {
        await generateAlgorithmSteps();
        
        if (stepMode) {
          document.getElementById('step-controls').style.display = 'flex';
          document.getElementById('next-step').disabled = false;
          showStepAtIndex(0);
        } else {
          await runStepsAutomatically();
        }
      } catch (error) {
        console.error('Algorithm error:', error);
        showToast('Algorithm execution failed! ❌', 'error');
      }
      
      isRunning = false;
      document.getElementById('run').disabled = false;
      document.getElementById('pause').disabled = true;
    }

    async function generateAlgorithmSteps() {
      switch(algorithm) {
        case 'bfs':
          await generateBFSSteps();
          break;
        case 'dfs':
          await generateDFSSteps();
          break;
        case 'dijkstra':
          await generateDijkstraSteps();
          break;
        case 'astar':
          await generateAStarSteps();
          break;
      }
    }

    // BFS Implementation
    async function generateBFSSteps() {
      const queue = [startNode];
      const visited = new Set([startNode.id]);
      const parent = new Map();
      let stepNumber = 0;
      
      algorithmSteps.push({
        title: 'Initialize BFS',
        description: `Starting BFS from node ${startNode.id}. Added to queue and marked as visited. BFS uses FIFO (First In, First Out) principle.`,
        visitedNodes: new Set([startNode.id]),
        currentNodes: new Set(),
        queueStackNodes: [startNode.id],
        pathNodes: [],
        stepNumber: ++stepNumber
      });
      
      while (queue.length > 0) {
        const current = queue.shift();
        
        algorithmSteps.push({
          title: `Process Node ${current.id}`,
          description: `Dequeued node ${current.id} from front of queue. Now checking if it's our target node ${endNode.id}.`,
          visitedNodes: new Set(visited),
          currentNodes: new Set([current.id]),
          queueStackNodes: queue.map(n => n.id),
          pathNodes: [],
          stepNumber: ++stepNumber
        });
        
        if (current === endNode) {
          const path = reconstructPath(parent, endNode.id);
          totalDistance = path.length - 1;
          algorithmSteps.push({
            title: 'Goal Found! 🎉',
            description: `Found target node ${endNode.id}! BFS guarantees this is the shortest path with ${path.length - 1} edges.`,
            visitedNodes: new Set(visited),
            currentNodes: new Set([current.id]),
            queueStackNodes: [],
            pathNodes: path,
            stepNumber: ++stepNumber
          });
          return;
        }
        
        const unvisitedNeighbors = current.neighbors.filter(n => !visited.has(n.id));
        
        if (unvisitedNeighbors.length > 0) {
          for (const neighbor of unvisitedNeighbors) {
            visited.add(neighbor.id);
            parent.set(neighbor.id, current.id);
            queue.push(neighbor);
          }
          
          algorithmSteps.push({
            title: 'Explore Neighbors',
            description: `Added unvisited neighbors of node ${current.id} to queue: [${unvisitedNeighbors.map(n => n.id).join(', ')}]. They'll be processed level by level.`,
            visitedNodes: new Set(visited),
            currentNodes: new Set(),
            queueStackNodes: queue.map(n => n.id),
            pathNodes: [],
            stepNumber: ++stepNumber
          });
        } else {
          algorithmSteps.push({
            title: 'No New Neighbors',
            description: `Node ${current.id} has no unvisited neighbors. All neighbors were already visited or added to queue.`,
            visitedNodes: new Set(visited),
            currentNodes: new Set(),
            queueStackNodes: queue.map(n => n.id),
            pathNodes: [],
            stepNumber: ++stepNumber
          });
        }
      }
      
      algorithmSteps.push({
        title: 'No Path Found',
        description: `Queue is empty and target node ${endNode.id} was not reached. No path exists in this connected component.`,
        visitedNodes: new Set(visited),
        currentNodes: new Set(),
        queueStackNodes: [],
        pathNodes: [],
        stepNumber: ++stepNumber
      });
    }

    // DFS Implementation
    async function generateDFSSteps() {
      const stack = [startNode];
      const visited = new Set();
      const parent = new Map();
      let stepNumber = 0;
      
      algorithmSteps.push({
        title: 'Initialize DFS',
        description: `Starting DFS from node ${startNode.id}. Added to stack. DFS uses LIFO (Last In, First Out) principle.`,
        visitedNodes: new Set(),
        currentNodes: new Set(),
        queueStackNodes: [startNode.id],
        pathNodes: [],
        stepNumber: ++stepNumber
      });
      
      while (stack.length > 0) {
        const current = stack.pop();
        
        if (visited.has(current.id)) {
          algorithmSteps.push({
            title: `Skip Visited Node ${current.id}`,
            description: `Node ${current.id} was already visited. This happens in DFS when multiple paths lead to the same node.`,
            visitedNodes: new Set(visited),
            currentNodes: new Set(),
            queueStackNodes: stack.map(n => n.id),
            pathNodes: [],
            stepNumber: ++stepNumber
          });
          continue;
        }
        
        visited.add(current.id);
        
        algorithmSteps.push({
          title: `Visit Node ${current.id}`,
          description: `Popped node ${current.id} from stack and marked as visited. Checking if it's our target node ${endNode.id}.`,
          visitedNodes: new Set(visited),
          currentNodes: new Set([current.id]),
          queueStackNodes: stack.map(n => n.id),
          pathNodes: [],
          stepNumber: ++stepNumber
        });
        
        if (current === endNode) {
          const path = reconstructPath(parent, endNode.id);
          totalDistance = path.length - 1;
          algorithmSteps.push({
            title: 'Goal Found! 🎉',
            description: `Found target node ${endNode.id}! Note: DFS may not find the shortest path, just a valid path.`,
            visitedNodes: new Set(visited),
            currentNodes: new Set([current.id]),
            queueStackNodes: [],
            pathNodes: path,
            stepNumber: ++stepNumber
          });
          return;
        }
        
        const unvisitedNeighbors = current.neighbors.filter(n => !visited.has(n.id));
        
        if (unvisitedNeighbors.length > 0) {
          const neighborsToAdd = [...unvisitedNeighbors].reverse();
          for (const neighbor of neighborsToAdd) {
            if (!visited.has(neighbor.id)) {
              parent.set(neighbor.id, current.id);
              stack.push(neighbor);
            }
          }
          
          algorithmSteps.push({
            title: 'Add Neighbors to Stack',
            description: `Added unvisited neighbors of node ${current.id} to stack: [${unvisitedNeighbors.map(n => n.id).join(', ')}]. DFS will explore deeply before backtracking.`,
            visitedNodes: new Set(visited),
            currentNodes: new Set(),
            queueStackNodes: stack.map(n => n.id),
            pathNodes: [],
            stepNumber: ++stepNumber
          });
        } else {
          algorithmSteps.push({
            title: 'Backtrack',
            description: `Node ${current.id} has no unvisited neighbors. DFS will backtrack to explore other branches.`,
            visitedNodes: new Set(visited),
            currentNodes: new Set(),
            queueStackNodes: stack.map(n => n.id),
            pathNodes: [],
            stepNumber: ++stepNumber
          });
        }
      }
      
      algorithmSteps.push({
        title: 'No Path Found',
        description: `Stack is empty and target node ${endNode.id} was not reached. No path exists in this connected component.`,
        visitedNodes: new Set(visited),
        currentNodes: new Set(),
        queueStackNodes: [],
        pathNodes: [],
        stepNumber: ++stepNumber
      });
    }

    // Dijkstra's Algorithm Implementation  
    async function generateDijkstraSteps() {
      const distances = new Map();
      const previous = new Map();
      const unvisited = new Set();
      let stepNumber = 0;
      
      nodes.forEach(node => {
        distances.set(node.id, node === startNode ? 0 : Infinity);
        unvisited.add(node.id);
      });
      
      algorithmSteps.push({
        title: 'Initialize Dijkstra',
        description: `Set distance to start node ${startNode.id} = 0, all others = ∞. Dijkstra always processes the closest unvisited node.`,
        visitedNodes: new Set(),
        currentNodes: new Set(),
        queueStackNodes: Array.from(unvisited),
        pathNodes: [],
        stepNumber: ++stepNumber
      });
      
      while (unvisited.size > 0) {
        let current = null;
        let minDistance = Infinity;
        
        for (const nodeId of unvisited) {
          if (distances.get(nodeId) < minDistance) {
            minDistance = distances.get(nodeId);
            current = nodes.find(n => n.id === nodeId);
          }
        }
        
        if (!current || distances.get(current.id) === Infinity) {
          algorithmSteps.push({
            title: 'No More Reachable Nodes',
            description: 'All remaining unvisited nodes have infinite distance. They are not reachable from the start node.',
            visitedNodes: new Set(nodes.map(n => n.id).filter(id => !unvisited.has(id))),
            currentNodes: new Set(),
            queueStackNodes: Array.from(unvisited),
            pathNodes: [],
            stepNumber: ++stepNumber
          });
          break;
        }
        
        unvisited.delete(current.id);
        
        algorithmSteps.push({
          title: `Process Node ${current.id}`,
          description: `Selected node ${current.id} with shortest distance (${distances.get(current.id)}). Permanently settled - optimal distance found.`,
          visitedNodes: new Set(nodes.map(n => n.id).filter(id => !unvisited.has(id))),
          currentNodes: new Set([current.id]),
          queueStackNodes: Array.from(unvisited),
          pathNodes: [],
          stepNumber: ++stepNumber
        });
        
        if (current === endNode) {
          const path = reconstructPath(previous, endNode.id);
          totalDistance = distances.get(endNode.id);
          algorithmSteps.push({
            title: 'Shortest Path Found! 🎉',
            description: `Reached target node ${endNode.id}! Optimal distance: ${distances.get(endNode.id)}. Dijkstra guarantees this is the shortest path.`,
            visitedNodes: new Set(nodes.map(n => n.id).filter(id => !unvisited.has(id))),
            currentNodes: new Set([current.id]),
            queueStackNodes: [],
            pathNodes: path,
            stepNumber: ++stepNumber
          });
          return;
        }
        
        let updatedNeighbors = [];
        for (const neighbor of current.neighbors) {
          if (unvisited.has(neighbor.id)) {
            const edge = edges.find(e => 
              (e.nodeA === current && e.nodeB === neighbor) ||
              (e.nodeA === neighbor && e.nodeB === current)
            );
            const weight = edge ? edge.weight : 1;
            const altDistance = distances.get(current.id) + weight;
            
            if (altDistance < distances.get(neighbor.id)) {
              distances.set(neighbor.id, altDistance);
              previous.set(neighbor.id, current.id);
              updatedNeighbors.push({node: neighbor, newDist: altDistance});
            }
          }
        }
        
        if (updatedNeighbors.length > 0) {
          algorithmSteps.push({
            title: 'Relax Edges',
            description: `Updated distances through node ${current.id}: ${updatedNeighbors.map(u => `${u.node.id}=${u.newDist}`).join(', ')}. Found shorter paths!`,
            visitedNodes: new Set(nodes.map(n => n.id).filter(id => !unvisited.has(id))),
            currentNodes: new Set(updatedNeighbors.map(u => u.node.id)),
            queueStackNodes: Array.from(unvisited),
            pathNodes: [],
            stepNumber: ++stepNumber
          });
        }
      }
      
      algorithmSteps.push({
        title: 'No Path Found',
        description: `All reachable nodes processed. Target node ${endNode.id} is not reachable from start node ${startNode.id}.`,
        visitedNodes: new Set(nodes.map(n => n.id).filter(id => !unvisited.has(id))),
        currentNodes: new Set(),
        queueStackNodes: [],
        pathNodes: [],
        stepNumber: ++stepNumber
      });
    }

    // A* Algorithm Implementation
    async function generateAStarSteps() {
      const openSet = [startNode];
      const closedSet = new Set();
      const gScore = new Map();
      const fScore = new Map();
      const cameFrom = new Map();
      let stepNumber = 0;
      
      nodes.forEach(node => {
        gScore.set(node.id, node === startNode ? 0 : Infinity);
        fScore.set(node.id, node === startNode ? heuristic(node, endNode) : Infinity);
      });
      
      algorithmSteps.push({
        title: 'Initialize A*',
        description: `Starting A* search. Node ${startNode.id} added to open set with f-score = g(${gScore.get(startNode.id)}) + h(${heuristic(startNode, endNode).toFixed(1)}) = ${fScore.get(startNode.id).toFixed(1)}`,
        visitedNodes: new Set(),
        currentNodes: new Set(),
        queueStackNodes: [startNode.id],
        pathNodes: [],
        stepNumber: ++stepNumber
      });
      
      while (openSet.length > 0) {
        let current = openSet.reduce((lowest, node) => 
          fScore.get(node.id) < fScore.get(lowest.id) ? node : lowest
        );
        
        algorithmSteps.push({
          title: `Process Node ${current.id}`,
          description: `Selected node ${current.id} with lowest f-score (${fScore.get(current.id).toFixed(1)}). Moving from open to closed set.`,
          visitedNodes: new Set(closedSet),
          currentNodes: new Set([current.id]),
          queueStackNodes: openSet.filter(n => n !== current).map(n => n.id),
          pathNodes: [],
          stepNumber: ++stepNumber
        });
        
        if (current === endNode) {
          const path = reconstructPath(cameFrom, endNode.id);
          totalDistance = gScore.get(endNode.id);
          algorithmSteps.push({
            title: 'Optimal Path Found! 🎉',
            description: `Reached target node ${endNode.id}! A* found optimal path with cost ${gScore.get(endNode.id).toFixed(1)} using heuristic guidance.`,
            visitedNodes: new Set(closedSet),
            currentNodes: new Set([current.id]),
            queueStackNodes: [],
            pathNodes: path,
            stepNumber: ++stepNumber
          });
          return;
        }
        
        openSet.splice(openSet.indexOf(current), 1);
        closedSet.add(current.id);
        
        let updatedNeighbors = [];
        for (const neighbor of current.neighbors) {
          if (closedSet.has(neighbor.id)) continue;
          
          const edge = edges.find(e => 
            (e.nodeA === current && e.nodeB === neighbor) ||
            (e.nodeA === neighbor && e.nodeB === current)
          );
          const weight = edge ? edge.weight : 1;
          const tentativeGScore = gScore.get(current.id) + weight;
          
          if (!openSet.includes(neighbor)) {
            openSet.push(neighbor);
          } else if (tentativeGScore >= gScore.get(neighbor.id)) {
            continue;
          }
          
          cameFrom.set(neighbor.id, current.id);
          gScore.set(neighbor.id, tentativeGScore);
          const hCost = heuristic(neighbor, endNode);
          fScore.set(neighbor.id, tentativeGScore + hCost);
          
          updatedNeighbors.push({
            node: neighbor,
            g: tentativeGScore,
            h: hCost,
            f: tentativeGScore + hCost
          });
        }
        
        if (updatedNeighbors.length > 0) {
          algorithmSteps.push({
            title: 'Update Neighbors',
            description: `Updated neighbors: ${updatedNeighbors.map(u => `${u.node.id}(f=${u.f.toFixed(1)})`).join(', ')}. Lower f-scores will be explored first.`,
            visitedNodes: new Set(closedSet),
            currentNodes: new Set(updatedNeighbors.map(u => u.node.id)),
            queueStackNodes: openSet.map(n => n.id),
            pathNodes: [],
            stepNumber: ++stepNumber
          });
        }
      }
      
      algorithmSteps.push({
        title: 'No Path Found',
        description: `Open set is empty. No path exists between start node ${startNode.id} and target node ${endNode.id}.`,
        visitedNodes: new Set(closedSet),
        currentNodes: new Set(),
        queueStackNodes: [],
        pathNodes: [],
        stepNumber: ++stepNumber
      });
    }

    function heuristic(nodeA, nodeB) {
      const dx = Math.abs(nodeA.x - nodeB.x);
      const dy = Math.abs(nodeA.y - nodeB.y);
      return Math.sqrt(dx * dx + dy * dy) / 50;
    }

    function reconstructPath(parent, endId) {
      const path = [endId];
      let current = endId;
      
      while (parent.has(current)) {
        current = parent.get(current);
        path.unshift(current);
      }
      
      return path;
    }

    async function runStepsAutomatically() {
      for (let i = 0; i < algorithmSteps.length && !isPaused; i++) {
        showStepAtIndex(i);
        await delay(speed);
        
        if (isPaused) break;
      }
    }

    function showStepAtIndex(index) {
      if (index < 0 || index >= algorithmSteps.length) return;
      
      currentStep = index;
      const step = algorithmSteps[index];
      
      visitedNodes = new Set(step.visitedNodes);
      currentNodes = new Set(step.currentNodes);
      queueStackNodes = step.queueStackNodes;
      pathNodes = step.pathNodes;
      
      updateUI();
      draw();
      
      document.getElementById('prev-step').disabled = index === 0;
      document.getElementById('next-step').disabled = index === algorithmSteps.length - 1;
      
      if (step.pathNodes.length > 0) {
        showToast('Path found! 🎉', 'success');
      }
    }

    // Control functions
    function toggleStepMode() {
      stepMode = !stepMode;
      const btn = document.getElementById('step-mode');
      
      if (stepMode) {
        btn.classList.add('active');
        btn.innerHTML = '<i class="fas fa-step-forward"></i> Step Mode ON';
        showToast('Step mode enabled! Perfect for learning! 📚', 'success');
      } else {
        btn.classList.remove('active');
        btn.innerHTML = '<i class="fas fa-step-forward"></i> Step Mode';
        document.getElementById('step-controls').style.display = 'none';
        showToast('Step mode disabled. Auto-run enabled! 🚀', 'success');
      }
    }

    function pauseAlgorithm() {
      isPaused = !isPaused;
      const btn = document.getElementById('pause');
      btn.innerHTML = isPaused ? '<i class="fas fa-play"></i> Resume' : '<i class="fas fa-pause"></i> Pause';
      showToast(isPaused ? 'Algorithm paused ⏸️' : 'Algorithm resumed ▶️', 'success');
    }

    function resetVisualization() {
      isRunning = false;
      isPaused = false;
      stepMode = false;
      algorithmSteps = [];
      currentStep = 0;
      visitedNodes.clear();
      pathNodes = [];
      currentNodes.clear();
      queueStackNodes = [];
      totalDistance = 0;
      edgeStart = null;
      
      document.getElementById('run').disabled = false;
      document.getElementById('pause').disabled = true;
      document.getElementById('pause').innerHTML = '<i class="fas fa-pause"></i> Pause';
      document.getElementById('step-mode').classList.remove('active');
      document.getElementById('step-mode').innerHTML = '<i class="fas fa-step-forward"></i> Step Mode';
      document.getElementById('step-controls').style.display = 'none';
      
      canvas.style.cursor = 'crosshair';
      draw();
      updateUI();
      showToast('Visualization reset! 🔄', 'success');
    }

    function previousStep() {
      if (currentStep > 0) {
        showStepAtIndex(currentStep - 1);
        showToast('Previous step! ⬅️', 'success');
      }
    }

    function nextStep() {
      if (currentStep < algorithmSteps.length - 1) {
        showStepAtIndex(currentStep + 1);
        showToast('Next step! ➡️', 'success');
      }
    }

    async function autoPlay() {
      if (algorithmSteps.length === 0) return;
      
      const btn = document.getElementById('auto-play');
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Playing...';
      
      for (let i = currentStep; i < algorithmSteps.length; i++) {
        showStepAtIndex(i);
        await delay(speed);
      }
      
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-play"></i>';
    }

    function delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Utility functions
    function generateSampleGraph() {
      nodes = [];
      edges = [];
      nodeId = 0;
      startNode = null;
      endNode = null;
      resetVisualization();
      
      const rect = canvas.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const positions = [
        {x: centerX - 200, y: centerY - 100}, // 0
        {x: centerX, y: centerY - 150},       // 1
        {x: centerX + 200, y: centerY - 100}, // 2
        {x: centerX - 250, y: centerY},       // 3
        {x: centerX - 80, y: centerY},        // 4
        {x: centerX + 80, y: centerY},        // 5
        {x: centerX + 250, y: centerY},       // 6
        {x: centerX - 200, y: centerY + 100}, // 7
        {x: centerX, y: centerY + 150},       // 8
        {x: centerX + 200, y: centerY + 100}  // 9
      ];
      
      positions.forEach(pos => {
        nodes.push({
          id: nodeId++,
          x: pos.x,
          y: pos.y,
          neighbors: []
        });
      });
      
      const connections = [
        [0, 1, 4], [1, 2, 3], [0, 3, 5], [1, 4, 2], [2, 5, 4], [2, 6, 3],
        [3, 4, 3], [4, 5, 2], [5, 6, 5], [3, 7, 4], [4, 7, 6], [4, 8, 3],
        [5, 8, 4], [5, 9, 2], [6, 9, 3], [7, 8, 3], [8, 9, 4]
      ];
      
      connections.forEach(([a, b, weight]) => {
        addEdge(nodes[a], nodes[b], weight);
      });
      
      startNode = nodes[0];
      endNode = nodes[9];
      
      draw();
      updateUI();
      showToast('Educational sample graph created! Perfect for learning algorithms! 📊', 'success');
    }

    function clearGraph() {
      nodes = [];
      edges = [];
      nodeId = 0;
      startNode = null;
      endNode = null;
      resetVisualization();
      
      draw();
      updateUI();
      showToast('Graph cleared! 🧹', 'success');
    }

    function fitToScreen() {
      if (nodes.length === 0) return;
      
      const rect = canvas.getBoundingClientRect();
      const margin = 60;
      
      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;
      
      nodes.forEach(node => {
        minX = Math.min(minX, node.x);
        maxX = Math.max(maxX, node.x);
        minY = Math.min(minY, node.y);
        maxY = Math.max(maxY, node.y);
      });
      
      const graphWidth = maxX - minX;
      const graphHeight = maxY - minY;
      const availableWidth = rect.width - 2 * margin;
      const availableHeight = rect.height - 2 * margin;
      
      if (graphWidth === 0 && graphHeight === 0) return;
      
      const scale = Math.min(availableWidth / graphWidth, availableHeight / graphHeight, 1);
      const offsetX = (rect.width - graphWidth * scale) / 2 - minX * scale;
      const offsetY = (rect.height - graphHeight * scale) / 2 - minY * scale;
      
      nodes.forEach(node => {
        node.x = node.x * scale + offsetX;
        node.y = node.y * scale + offsetY;
      });
      
      draw();
      showToast('Graph fitted to screen perfectly! 📏', 'success');
    }

    function centerGraph() {
      if (nodes.length === 0) return;
      
      const rect = canvas.getBoundingClientRect();
      
      let centerX = 0, centerY = 0;
      nodes.forEach(node => {
        centerX += node.x;
        centerY += node.y;
      });
      centerX /= nodes.length;
      centerY /= nodes.length;
      
      const offsetX = rect.width / 2 - centerX;
      const offsetY = rect.height / 2 - centerY;
      
      nodes.forEach(node => {
        node.x += offsetX;
        node.y += offsetY;
      });
      
      draw();
      showToast('Graph centered perfectly! 🎯', 'success');
    }

    function takeScreenshot() {
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      
      tempCtx.fillStyle = '#ffffff';
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      tempCtx.drawImage(canvas, 0, 0);
      
      const link = document.createElement('a');
      link.download = `graph-algorithm-${algorithm}-${Date.now()}.png`;
      link.href = tempCanvas.toDataURL();
      link.click();
      
      showToast('Screenshot saved! 📷', 'success');
    }

    // Initialize the application when DOM is loaded
    document.addEventListener('DOMContentLoaded', init);

