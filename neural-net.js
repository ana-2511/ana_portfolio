// ===== 3D Neural Network Simulation (AI/ML) =====

window.initNeuralNetSim = function(container) {
  if (typeof THREE === 'undefined') {
    console.error('Three.js is not loaded.');
    return null;
  }

  // --- Constants & Variables
  let scene, camera, renderer, animationFrameId;
  let networkGroup, nodes = [], connections = [], pulses = [], particles;
  let isTraining = false;
  let epoch = 0;
  const maxEpochs = 150;
  let currentLoss = 0.95;
  let currentAcc = 0.32;
  let lossHistory = [];

  // DOM Elements binding
  const btnFeed = document.getElementById('ai-btn-feed');
  const btnTrain = document.getElementById('ai-btn-train');
  const txtStatus = document.getElementById('ai-val-status');
  const txtEpoch = document.getElementById('ai-val-epoch');
  const txtLoss = document.getElementById('ai-val-loss');
  const txtAcc = document.getElementById('ai-val-acc');
  const chartCanvas = document.getElementById('aiLossChart');
  let chartCtx = chartCanvas ? chartCanvas.getContext('2d') : null;

  // --- Initialize Three.js Scene
  function init() {
    scene = new THREE.Scene();
    
    camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 7.8);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // --- Build Network Structure
    networkGroup = new THREE.Group();
    scene.add(networkGroup);

    // Structure definitions (amber, magenta, violet, cyan)
    const layers = [
      { count: 4, x: -2.3, color: 0xE8B056, label: 'Input' },
      { count: 6, x: -0.7, color: 0xFF6FB1, label: 'Hidden 1' },
      { count: 6, x: 0.9, color: 0xB57AFF, label: 'Hidden 2' },
      { count: 3, x: 2.3, color: 0x6DE3FF, label: 'Output' }
    ];

    const spacing = 0.72;
    const sphereGeo = new THREE.SphereGeometry(0.14, 24, 24);

    // Build Node Meshes
    layers.forEach((layer, li) => {
      const layerNodes = [];
      const startY = -(layer.count - 1) * spacing / 2;

      for (let i = 0; i < layer.count; i++) {
        // Material with emissive glow
        const mat = new THREE.MeshStandardMaterial({
          color: layer.color,
          emissive: layer.color,
          emissiveIntensity: 0.6,
          metalness: 0.2,
          roughness: 0.3
        });
        const mesh = new THREE.Mesh(sphereGeo, mat);
        mesh.position.set(layer.x, startY + i * spacing, 0);
        networkGroup.add(mesh);

        // Add soft halo ring
        const haloGeo = new THREE.RingGeometry(0.20, 0.28, 24);
        const haloMat = new THREE.MeshBasicMaterial({
          color: layer.color,
          transparent: true,
          opacity: 0.14,
          side: THREE.DoubleSide
        });
        const halo = new THREE.Mesh(haloGeo, haloMat);
        halo.position.copy(mesh.position);
        networkGroup.add(halo);

        layerNodes.push({
          mesh,
          halo,
          baseColor: layer.color,
          fireIntensity: 0,
          position: mesh.position.clone()
        });
      }
      nodes.push(layerNodes);
    });

    // --- Build Synaptic Connections
    const connMat = new THREE.LineBasicMaterial({
      color: 0x7d8aa8,
      transparent: true,
      opacity: 0.12
    });

    for (let l = 0; l < nodes.length - 1; l++) {
      const fromLayer = nodes[l];
      const toLayer = nodes[l + 1];

      fromLayer.forEach(fromNode => {
        toLayer.forEach(toNode => {
          const pts = [fromNode.position, toNode.position];
          const geo = new THREE.BufferGeometry().setFromPoints(pts);
          const line = new THREE.Line(geo, connMat);
          networkGroup.add(line);
          connections.push({ from: fromNode, to: toNode });
        });
      });
    }

    // --- Ambient Data Dust
    const partCount = 70;
    const partGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(partCount * 3);

    for (let i = 0; i < partCount; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4 - 0.5;
    }

    partGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const partMat = new THREE.PointsMaterial({
      color: 0x6DE3FF,
      size: 0.035,
      transparent: true,
      opacity: 0.45,
      sizeAttenuation: true
    });
    particles = new THREE.Points(partGeo, partMat);
    scene.add(particles);

    // --- Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    
    const kLight = new THREE.PointLight(0xE8B056, 1.2, 12);
    kLight.position.set(-3, 2, 4);
    scene.add(kLight);

    const rLight = new THREE.PointLight(0x6DE3FF, 1.2, 12);
    rLight.position.set(3, -2, 4);
    scene.add(rLight);

    // --- Event Listeners binding
    if (btnFeed) btnFeed.addEventListener('click', manualTriggerPulse);
    if (btnTrain) btnTrain.addEventListener('click', toggleTraining);

    // Draw initial empty chart
    drawChart();
    
    // Start loop
    tick();
  }

  // --- Pulse Spawning Logic
  const pulseGeo = new THREE.SphereGeometry(0.06, 10, 10);
  
  function spawnPulse(connection, customSpeed) {
    const color = connection.to.baseColor;
    const mat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.95
    });
    const mesh = new THREE.Mesh(pulseGeo, mat);
    mesh.position.copy(connection.from.position);
    networkGroup.add(mesh);

    pulses.push({
      mesh,
      from: connection.from.position.clone(),
      to: connection.to.position.clone(),
      targetNode: connection.to,
      t: 0,
      speed: customSpeed || (0.015 + Math.random() * 0.012)
    });
  }

  // Manual Trigger: Sends wave layer by layer
  function manualTriggerPulse() {
    if (isTraining) return;
    
    // Spawn pulses from input to hidden1
    connections.forEach(conn => {
      // Find input layer connections
      if (nodes[0].includes(conn.from)) {
        spawnPulse(conn, 0.02);
      }
    });

    // Ripple effect after delay to simulate network latency
    setTimeout(() => {
      connections.forEach(conn => {
        if (nodes[1].includes(conn.from)) spawnPulse(conn, 0.02);
      });
    }, 450);

    setTimeout(() => {
      connections.forEach(conn => {
        if (nodes[2].includes(conn.from)) spawnPulse(conn, 0.02);
      });
    }, 900);
  }

  // --- Simulated Training Cycle
  let trainingTimer = 0;
  function toggleTraining() {
    if (isTraining) {
      // Pause
      isTraining = false;
      if (btnTrain) btnTrain.textContent = 'Train Neural Net';
      if (btnTrain) btnTrain.classList.remove('btn-active');
      if (txtStatus) txtStatus.textContent = 'Idle';
      if (txtStatus) txtStatus.classList.remove('active-pulse');
      if (btnFeed) btnFeed.disabled = false;
    } else {
      // Start/Resume
      isTraining = true;
      if (btnTrain) btnTrain.textContent = 'Pause Training';
      if (btnTrain) btnTrain.classList.add('btn-active');
      if (txtStatus) txtStatus.textContent = 'Training';
      if (txtStatus) txtStatus.classList.add('active-pulse');
      if (btnFeed) btnFeed.disabled = true;

      // Reset if completed previously
      if (epoch >= maxEpochs) {
        epoch = 0;
        currentLoss = 0.95;
        currentAcc = 0.32;
        lossHistory = [];
        drawChart();
      }
    }
  }

  function handleTrainingLogic() {
    trainingTimer++;
    // Adjust pulsing cadence in training mode
    if (trainingTimer % 3 === 0) {
      // Spawn random connections
      const randomConn = connections[Math.floor(Math.random() * connections.length)];
      spawnPulse(randomConn, 0.035 + Math.random() * 0.02);
    }

    if (trainingTimer % 8 === 0) {
      epoch += 1;
      
      // Simulated SGD loss decline and accuracy rise
      const noise = (Math.random() - 0.48) * 0.03;
      currentLoss = Math.max(0.021, currentLoss - (0.95 / maxEpochs) * 1.1 + noise);
      currentAcc = Math.min(0.984, currentAcc + (0.66 / maxEpochs) * 1.05 - noise / 2);

      lossHistory.push(currentLoss);

      // Update UI Text
      if (txtEpoch) txtEpoch.textContent = `${epoch} / ${maxEpochs}`;
      if (txtLoss) txtLoss.textContent = currentLoss.toFixed(4);
      if (txtAcc) txtAcc.textContent = `${(currentAcc * 100).toFixed(2)}%`;

      drawChart();

      // Check training completion
      if (epoch >= maxEpochs) {
        isTraining = false;
        if (btnTrain) btnTrain.textContent = 'Re-Train Network';
        if (btnTrain) btnTrain.classList.remove('btn-active');
        if (txtStatus) txtStatus.textContent = 'Completed';
        if (txtStatus) txtStatus.classList.remove('active-pulse');
        if (btnFeed) btnFeed.disabled = false;
      }
    }
  }

  // --- Render 2D Loss Convergence Line Chart
  function drawChart() {
    if (!chartCtx || !chartCanvas) return;
    
    const w = chartCanvas.width;
    const h = chartCanvas.height;
    chartCtx.clearRect(0, 0, w, h);

    // Draw Grid Lines
    chartCtx.strokeStyle = 'rgba(244, 233, 216, 0.05)';
    chartCtx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      chartCtx.beginPath();
      chartCtx.moveTo(x, 0);
      chartCtx.lineTo(x, h);
      chartCtx.stroke();
    }
    for (let y = 0; y < h; y += 25) {
      chartCtx.beginPath();
      chartCtx.moveTo(0, y);
      chartCtx.lineTo(w, y);
      chartCtx.stroke();
    }

    if (lossHistory.length === 0) {
      // Draw placeholder text
      chartCtx.fillStyle = 'rgba(244, 233, 216, 0.25)';
      chartCtx.font = '10px monospace';
      chartCtx.textAlign = 'center';
      chartCtx.fillText('Click Train to plot loss curve', w / 2, h / 2 + 3);
      return;
    }

    // Plot Loss Path
    chartCtx.beginPath();
    chartCtx.strokeStyle = '#E8B056';
    chartCtx.lineWidth = 2;

    const padLeft = 10;
    const padRight = 10;
    const usableW = w - padLeft - padRight;
    
    lossHistory.forEach((loss, i) => {
      const posX = padLeft + (i / maxEpochs) * usableW;
      const posY = h - 8 - (loss / 1.0) * (h - 16); // Normalise to height
      
      if (i === 0) {
        chartCtx.moveTo(posX, posY);
      } else {
        chartCtx.lineTo(posX, posY);
      }
    });
    chartCtx.stroke();

    // Draw area fill under curve (glow feel)
    chartCtx.lineTo(padLeft + ((lossHistory.length - 1) / maxEpochs) * usableW, h);
    chartCtx.lineTo(padLeft, h);
    chartCtx.closePath();
    chartCtx.fillStyle = 'rgba(232, 176, 86, 0.08)';
    chartCtx.fill();
  }

  // --- Animation loop
  let frameCount = 0;
  let targetRotX = 0, targetRotY = 0;
  let currentRotX = 0, currentRotY = 0;

  // Track mouse for subtle rotation parallax
  function onMouseMove(e) {
    const nx = (e.clientX / window.innerWidth) - 0.5;
    const ny = (e.clientY / window.innerHeight) - 0.5;
    targetRotY = nx * 0.45;
    targetRotX = ny * 0.3;
  }
  window.addEventListener('mousemove', onMouseMove);

  function tick() {
    frameCount++;
    const time = frameCount * 0.01;

    // Simulate training updates if active
    if (isTraining) {
      handleTrainingLogic();
    }

    // --- Update + Propagate Pulses
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i];
      p.t += p.speed;

      if (p.t >= 1) {
        // Neuron fires!
        p.targetNode.fireIntensity = 1.0;
        networkGroup.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        pulses.splice(i, 1);
      } else {
        // Lerp position
        p.mesh.position.lerpVectors(p.from, p.to, p.t);
        // Fade out slightly towards end of connection
        p.mesh.material.opacity = 1.0 - p.t * 0.25;
      }
    }

    // --- Update Neuron Emissive & Scales (decay curve)
    nodes.forEach(layer => {
      layer.forEach(n => {
        if (n.fireIntensity > 0.01) {
          n.fireIntensity *= 0.88; // decay
          n.mesh.material.emissiveIntensity = 0.6 + n.fireIntensity * 2.6;
          n.mesh.scale.setScalar(1 + n.fireIntensity * 0.5);
          n.halo.material.opacity = 0.14 + n.fireIntensity * 0.45;
          n.halo.scale.setScalar(1 + n.fireIntensity * 0.3);
        } else {
          n.fireIntensity = 0;
          n.mesh.material.emissiveIntensity = 0.6;
          n.mesh.scale.setScalar(1);
          n.halo.material.opacity = 0.14;
          n.halo.scale.setScalar(1);
        }
        
        // Face camera for rings (halos)
        n.halo.quaternion.copy(camera.quaternion);
      });
    });

    // --- Particle idle drift
    if (particles) {
      particles.rotation.y = time * 0.04;
      particles.rotation.x = Math.sin(time * 0.02) * 0.04;
    }

    // --- Parallax + Auto Rotations
    currentRotX += (targetRotX - currentRotX) * 0.05;
    currentRotY += (targetRotY - currentRotY) * 0.05;

    networkGroup.rotation.x = currentRotX + Math.sin(time * 0.4) * 0.03;
    networkGroup.rotation.y = currentRotY + time * 0.07; // Slow steady spin

    renderer.render(scene, camera);
    animationFrameId = requestAnimationFrame(tick);
  }

  // --- Resize handler
  function handleResize() {
    if (!renderer || !camera) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    drawChart();
  }
  window.addEventListener('resize', handleResize);

  // --- Public Unmount & Cleanup API
  function destroy() {
    isTraining = false;
    cancelAnimationFrame(animationFrameId);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('resize', handleResize);

    if (btnFeed) btnFeed.removeEventListener('click', manualTriggerPulse);
    if (btnTrain) btnTrain.removeEventListener('click', toggleTraining);

    // Clean up Three.js objects
    networkGroup.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });

    scene.remove(networkGroup);
    if (particles) scene.remove(particles);
    renderer.dispose();
    
    if (renderer.domElement) {
      renderer.domElement.remove();
    }
  }

  // Initialize
  init();

  return {
    destroy
  };
};
