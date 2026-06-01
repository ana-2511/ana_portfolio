// ===== 3D Binary Search Tree (BST) Simulation (Computer Science) =====

window.initBinaryTreeSim = function(container) {
  if (typeof THREE === 'undefined') {
    console.error('Three.js is not loaded.');
    return null;
  }

  // --- Constants & Variables
  let scene, camera, renderer, animationFrameId;
  let treeGroup, nodesGroup, linesGroup;
  let treeData = null; // recursive BST structure
  let searchInProgress = false;

  // DOM Elements binding
  const inputSearch = document.getElementById('cs-input-search');
  const btnSearch = document.getElementById('cs-btn-search');
  const btnInsert = document.getElementById('cs-btn-insert');
  const btnRebalance = document.getElementById('cs-btn-rebalance');
  
  const txtPathLog = document.getElementById('cs-val-path');
  const txtStatus = document.getElementById('cs-val-status');

  // --- Initialize Three.js Scene
  function init() {
    scene = new THREE.Scene();
    
    camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0.5, 7.8);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    treeGroup = new THREE.Group();
    scene.add(treeGroup);

    nodesGroup = new THREE.Group();
    linesGroup = new THREE.Group();
    treeGroup.add(linesGroup);
    treeGroup.add(nodesGroup); // Render nodes on top of lines

    // Setup Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const kLight = new THREE.PointLight(0xE8B056, 1.2, 12);
    kLight.position.set(-3, 3, 4);
    scene.add(kLight);
    
    const rLight = new THREE.PointLight(0x6DE3FF, 1.2, 12);
    rLight.position.set(3, -2, 4);
    scene.add(rLight);

    // --- Build Default Balanced BST Structure
    // Coordinates: (x, y, z) based on tree level
    const initialTreeStructure = {
      val: 50, x: 0, y: 1.5, z: 0, scale: 1,
      left: {
        val: 30, x: -1.5, y: 0.5, z: 0, scale: 1,
        left: {
          val: 15, x: -2.3, y: -0.5, z: 0, scale: 1,
          left: null, right: null
        },
        right: {
          val: 38, x: -0.8, y: -0.5, z: 0, scale: 1,
          left: null, right: null
        }
      },
      right: {
        val: 70, x: 1.5, y: 0.5, z: 0, scale: 1,
        left: {
          val: 60, x: 0.8, y: -0.5, z: 0, scale: 1,
          left: null, right: null
        },
        right: {
          val: 85, x: 2.3, y: -0.5, z: 0, scale: 1,
          left: null, right: null
        }
      }
    };

    treeData = initialTreeStructure;
    rebuildTree3D();

    // --- Event Listeners binding
    if (btnSearch) btnSearch.addEventListener('click', startSearchProcess);
    if (btnInsert) btnInsert.addEventListener('click', startInsertionProcess);
    if (btnRebalance) btnRebalance.addEventListener('click', startRebalanceProcess);
    if (inputSearch) {
      inputSearch.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') startSearchProcess();
      });
    }

    // Start render loop
    tick();
  }

  // --- Dynamic Node Label Generation via Canvas Textures
  function createTextSprite(text, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Circular background base for labels
    ctx.fillStyle = 'rgba(11, 15, 26, 0.85)';
    ctx.strokeStyle = color || '#E8B056';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(64, 64, 48, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    // Text rendering inside circle
    ctx.fillStyle = '#F4E9D8';
    ctx.font = 'bold 36px "JetBrains Mono", Courier, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text.toString(), 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(mat);
    
    // Size scale in 3D viewport
    sprite.scale.set(0.68, 0.68, 1);
    return sprite;
  }

  // --- Recursive BST 3D Mesh Constructor
  const sphereGeo = new THREE.SphereGeometry(0.18, 22, 22);

  function rebuildTree3D() {
    // Clear old visual children
    while(nodesGroup.children.length > 0) {
      const child = nodesGroup.children[0];
      if (child.sprite) child.sprite.material.map.dispose();
      child.geometry.dispose();
      child.material.dispose();
      nodesGroup.remove(child);
    }
    
    while(linesGroup.children.length > 0) {
      const child = linesGroup.children[0];
      child.geometry.dispose();
      child.material.dispose();
      linesGroup.remove(child);
    }

    // Recursive traversal to build geometries
    function traverse(node, parent) {
      if (!node) return;

      // 1. Render node sphere
      const color = node.glowColor || 0xB57AFF; // Default violet glow
      const mat = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.5,
        metalness: 0.1,
        roughness: 0.3
      });
      const mesh = new THREE.Mesh(sphereGeo, mat);
      mesh.position.set(node.x, node.y, node.z);
      mesh.scale.setScalar(node.scale || 1.0);
      mesh.val = node.val;
      mesh.nodeRef = node; // bind logical reference
      nodesGroup.add(mesh);

      // Add soft ring halo
      const haloGeo = new THREE.RingGeometry(0.25, 0.35, 24);
      const haloMat = new THREE.MeshBasicMaterial({
        color: color, transparent: true, opacity: 0.12, side: THREE.DoubleSide
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.position.copy(mesh.position);
      mesh.add(halo);
      mesh.halo = halo;

      // 2. Attach billboard number label sprite
      const sprite = createTextSprite(node.val, color);
      sprite.position.set(0, 0, 0.02); // slight forward offset
      mesh.add(sprite);
      mesh.sprite = sprite;

      // 3. Render connection line from parent
      if (parent) {
        const lineMat = new THREE.LineBasicMaterial({
          color: 0x7d8aa8, transparent: true, opacity: 0.2, linewidth: 2
        });
        const pts = [new THREE.Vector3(parent.x, parent.y, parent.z), new THREE.Vector3(node.x, node.y, node.z)];
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        const line = new THREE.Line(geo, lineMat);
        line.fromVal = parent.val;
        line.toVal = node.val;
        linesGroup.add(line);
      }

      // Recurse children
      traverse(node.left, node);
      traverse(node.right, node);
    }

    traverse(treeData, null);
  }

  // --- Recursive BST Golden Pathfinder Algorithm
  function startSearchProcess() {
    if (searchInProgress || !inputSearch) return;

    const val = parseInt(inputSearch.value, 10);
    if (isNaN(val)) {
      if (txtStatus) txtStatus.textContent = 'Enter a valid number';
      return;
    }

    searchInProgress = true;
    if (btnSearch) btnSearch.disabled = true;
    if (btnInsert) btnInsert.disabled = true;
    if (btnRebalance) btnRebalance.disabled = true;
    if (txtStatus) txtStatus.textContent = 'Searching...';
    if (txtPathLog) txtPathLog.textContent = 'Traversing: ';

    // Reset styles back to default before highlighting path
    resetTreeVisualStates();

    const path = [];
    
    // Collect coordinates recursive path
    function searchTree(node) {
      if (!node) return;
      path.push(node);

      if (val === node.val) {
        node.found = true;
        return;
      }
      if (val < node.val) {
        searchTree(node.left);
      } else {
        searchTree(node.right);
      }
    }

    searchTree(treeData);
    
    // Animate golden tracer wave step-by-step
    animateSearchTrace(path, val, 0);
  }

  function resetTreeVisualStates() {
    nodesGroup.children.forEach(mesh => {
      mesh.material.color.setHex(0xB57AFF); // reset to original violet
      mesh.material.emissive.setHex(0xB57AFF);
      mesh.material.emissiveIntensity = 0.5;
      mesh.scale.setScalar(1.0);
      mesh.halo.material.color.setHex(0xB57AFF);
      mesh.halo.material.opacity = 0.12;
      mesh.sprite.material.map.dispose();
      mesh.remove(mesh.sprite);
      
      const resettedSprite = createTextSprite(mesh.val, '#B57AFF');
      resettedSprite.position.set(0, 0, 0.02);
      mesh.add(resettedSprite);
      mesh.sprite = resettedSprite;
    });

    linesGroup.children.forEach(line => {
      line.material.color.setHex(0x7d8aa8);
      line.material.opacity = 0.2;
    });
  }

  function animateSearchTrace(path, targetVal, step) {
    if (step >= path.length) {
      // Complete: Did we find it?
      const lastNode = path[path.length - 1];
      if (lastNode && lastNode.val === targetVal) {
        // FOUND
        highlightFoundNode(lastNode);
        if (txtStatus) txtStatus.textContent = 'Value Found';
        if (txtPathLog) txtPathLog.textContent += ` [Found ${targetVal}!]`;
      } else {
        // NOT FOUND
        highlightNotFound();
        if (txtStatus) txtStatus.textContent = 'Not Found';
        if (txtPathLog) txtPathLog.textContent += ` -> Leaf [Not Found]`;
      }

      // Re-enable buttons
      setTimeout(() => {
        searchInProgress = false;
        if (btnSearch) btnSearch.disabled = false;
        if (btnInsert) btnInsert.disabled = false;
        if (btnRebalance) btnRebalance.disabled = false;
      }, 1500);
      return;
    }

    const node = path[step];
    
    // Update path log UI
    if (step > 0) txtPathLog.textContent += ' -> ';
    txtPathLog.textContent += node.val;

    // Golden highlight on node mesh
    const mesh = findMeshByValue(node.val);
    if (mesh) {
      // Golden yellow glow
      mesh.material.color.setHex(0xE8B056);
      mesh.material.emissive.setHex(0xE8B056);
      mesh.material.emissiveIntensity = 2.0;
      mesh.scale.setScalar(1.22);
      mesh.halo.material.color.setHex(0xE8B056);
      mesh.halo.material.opacity = 0.45;
      
      // Update label border
      mesh.sprite.material.map.dispose();
      mesh.remove(mesh.sprite);
      const activeSprite = createTextSprite(node.val, '#E8B056');
      activeSprite.position.set(0, 0, 0.02);
      mesh.add(activeSprite);
      mesh.sprite = activeSprite;
    }

    // Golden tracer line from previous parent
    if (step > 0) {
      const prevNode = path[step - 1];
      const line = findLineByEdge(prevNode.val, node.val);
      if (line) {
        line.material.color.setHex(0xE8B056);
        line.material.opacity = 0.85;
      }
    }

    // Delay before moving down next branch
    setTimeout(() => {
      animateSearchTrace(path, targetVal, step + 1);
    }, 600);
  }

  function highlightFoundNode(node) {
    const mesh = findMeshByValue(node.val);
    if (mesh) {
      // Flash Vibrant Green
      mesh.material.color.setHex(0x5BA89B); // Teal green
      mesh.material.emissive.setHex(0x5BA89B);
      mesh.material.emissiveIntensity = 3.5;
      mesh.scale.setScalar(1.35);
      mesh.halo.material.color.setHex(0x5BA89B);
      mesh.halo.material.opacity = 0.8;

      mesh.sprite.material.map.dispose();
      mesh.remove(mesh.sprite);
      const tealSprite = createTextSprite(node.val, '#5BA89B');
      tealSprite.position.set(0, 0, 0.02);
      mesh.add(tealSprite);
      mesh.sprite = tealSprite;

      // Dynamic expansion rings ripple
      let rippleCount = 0;
      const rippleGeo = new THREE.RingGeometry(0.35, 0.38, 28);
      const rippleMat = new THREE.MeshBasicMaterial({
        color: 0x5BA89B, transparent: true, opacity: 0.8, side: THREE.DoubleSide
      });
      const ripple = new THREE.Mesh(rippleGeo, rippleMat);
      ripple.position.copy(mesh.position);
      nodesGroup.add(ripple);

      function wave() {
        rippleCount += 0.025;
        ripple.scale.setScalar(1 + rippleCount * 3.5);
        rippleMat.opacity = Math.max(0, 0.8 - rippleCount * 1.25);
        ripple.quaternion.copy(camera.quaternion);

        if (rippleMat.opacity > 0.02) {
          requestAnimationFrame(wave);
        } else {
          nodesGroup.remove(ripple);
          rippleGeo.dispose();
          rippleMat.dispose();
        }
      }
      wave();
    }
  }

  function highlightNotFound() {
    // Flash scene slightly red in the status HUD / overlays
    if (txtStatus) txtStatus.textContent = 'Not Found';
    
    // Flash all lines to red briefly
    linesGroup.children.forEach(l => {
      if (l.material.color.getHex() !== 0xE8B056) {
        l.material.color.setHex(0xD88A8A);
        l.material.opacity = 0.4;
      }
    });

    setTimeout(() => {
      linesGroup.children.forEach(l => {
        if (l.material.color.getHex() !== 0xE8B056) {
          l.material.color.setHex(0x7d8aa8);
          l.material.opacity = 0.2;
        }
      });
    }, 600);
  }

  // --- Insertion Process (Self-Balanced tree feel)
  function startInsertionProcess() {
    if (searchInProgress) return;

    // Generate unique random number from 1 to 95
    let val = 1 + Math.floor(Math.random() * 95);
    while (containsVal(treeData, val)) {
      val = 1 + Math.floor(Math.random() * 95);
    }

    if (txtStatus) txtStatus.textContent = `Inserting: ${val}`;
    if (txtPathLog) txtPathLog.textContent = `Path: `;

    // 1. Recursive tree search to append parent node link
    const newLeaf = {
      val, x: 0, y: 0, z: 0, scale: 0.01,
      left: null, right: null,
      glowColor: 0x6DE3FF // Cyan highlight for new node
    };

    function insert(node, parent) {
      if (val < node.val) {
        if (!node.left) {
          // Found coordinate spacing dynamically based on level depth
          const levelXOffset = Math.max(0.4, Math.abs(node.x - (parent ? parent.x : 0)) * 0.55);
          newLeaf.x = node.x - levelXOffset;
          newLeaf.y = node.y - 0.95;
          node.left = newLeaf;
        } else {
          insert(node.left, node);
        }
      } else {
        if (!node.right) {
          const levelXOffset = Math.max(0.4, Math.abs(node.x - (parent ? parent.x : 0)) * 0.55);
          newLeaf.x = node.x + levelXOffset;
          newLeaf.y = node.y - 0.95;
          node.right = newLeaf;
        } else {
          insert(node.right, node);
        }
      }
    }

    insert(treeData, null);
    rebuildTree3D();

    // 2. Animate mesh scaling up (elastic bounce)
    const newMesh = findMeshByValue(val);
    if (newMesh) {
      let t = 0;
      function grow() {
        t += 0.045;
        // Elastic overshoot math
        const scaleVal = Math.sin(t * Math.PI) * 0.35 + t;
        newMesh.scale.setScalar(Math.min(1.0, scaleVal));
        if (t < 1.0) {
          requestAnimationFrame(grow);
        } else {
          newMesh.scale.setScalar(1.0);
          // Update status
          if (txtStatus) txtStatus.textContent = `Inserted ${val}`;
        }
      }
      grow();
    }
  }

  // --- Dynamic 3D AVL Rebalance Translation
  function startRebalanceProcess() {
    if (searchInProgress) return;

    if (txtStatus) txtStatus.textContent = 'Performing AVL Rotations';
    
    // Balanced coordinates mapping for tree nodes
    const balancedLayout = {
      50: { x: 0, y: 1.5 },
      30: { x: -1.5, y: 0.5 },
      70: { x: 1.5, y: 0.5 },
      15: { x: -2.3, y: -0.5 },
      38: { x: -0.8, y: -0.5 },
      60: { x: 0.8, y: -0.5 },
      85: { x: 2.3, y: -0.5 }
    };

    // Logical reset back to clean structure
    treeData = {
      val: 50, x: 0, y: 1.5, z: 0, scale: 1.0,
      left: {
        val: 30, x: -1.5, y: 0.5, z: 0, scale: 1.0,
        left: { val: 15, x: -2.3, y: -0.5, z: 0, scale: 1.0, left: null, right: null },
        right: { val: 38, x: -0.8, y: -0.5, z: 0, scale: 1.0, left: null, right: null }
      },
      right: {
        val: 70, x: 1.5, y: 0.5, z: 0, scale: 1.0,
        left: { val: 60, x: 0.8, y: -0.5, z: 0, scale: 1.0, left: null, right: null },
        right: { val: 85, x: 2.3, y: -0.5, z: 0, scale: 1.0, left: null, right: null }
      }
    };

    // Smooth Coordinate Translation Loop
    let progress = 0;
    const startPositions = {};
    
    nodesGroup.children.forEach(mesh => {
      startPositions[mesh.val] = mesh.position.clone();
    });

    function translate() {
      progress += 0.035;
      
      nodesGroup.children.forEach(mesh => {
        const start = startPositions[mesh.val];
        const endTarget = balancedLayout[mesh.val];
        
        if (start && endTarget) {
          // Lerp coordinate shifts
          mesh.position.x = THREE.MathUtils.lerp(start.x, endTarget.x, progress);
          mesh.position.y = THREE.MathUtils.lerp(start.y, endTarget.y, progress);
        } else {
          // Shrink extra inserted leaf nodes down to fade out
          mesh.scale.setScalar(Math.max(0.01, mesh.scale.x - 0.05));
        }
      });

      // Update Parent-Child lines dynamically while translating coordinates
      updateLinePoints();

      if (progress < 1.0) {
        requestAnimationFrame(translate);
      } else {
        // Redraw whole tree cleanly to clear unneeded node objects
        rebuildTree3D();
        resetTreeVisualStates();
        if (txtStatus) txtStatus.textContent = 'Balanced Tree Restored';
        if (txtPathLog) txtPathLog.textContent = 'Status: Complete';
      }
    }

    translate();
  }

  function updateLinePoints() {
    linesGroup.children.forEach(line => {
      const fromMesh = findMeshByValue(line.fromVal);
      const toMesh = findMeshByValue(line.toVal);
      
      if (fromMesh && toMesh) {
        const pts = [fromMesh.position.clone(), toMesh.position.clone()];
        line.geometry.dispose();
        line.geometry = new THREE.BufferGeometry().setFromPoints(pts);
      }
    });
  }

  // --- Visual Search Helpers
  function findMeshByValue(val) {
    return nodesGroup.children.find(m => m.val === val);
  }

  function findLineByEdge(fromVal, toVal) {
    return linesGroup.children.find(l => l.fromVal === fromVal && l.toVal === toVal);
  }

  function containsVal(node, val) {
    if (!node) return false;
    if (node.val === val) return true;
    return containsVal(node.left, val) || containsVal(node.right, val);
  }

  // --- Animation loop
  let frameCount = 0;
  let targetRotX = 0, targetRotY = 0;
  let currentRotX = 0, currentRotY = 0;

  function onMouseMove(e) {
    const nx = (e.clientX / window.innerWidth) - 0.5;
    const ny = (e.clientY / window.innerHeight) - 0.5;
    targetRotY = nx * 0.4;
    targetRotX = ny * 0.25;
  }
  window.addEventListener('mousemove', onMouseMove);

  function tick() {
    frameCount++;
    const time = frameCount * 0.01;

    // Subtle passive floating/breathing rotation
    currentRotX += (targetRotX - currentRotX) * 0.05;
    currentRotY += (targetRotY - currentRotY) * 0.05;

    treeGroup.rotation.x = currentRotX + Math.sin(time * 0.4) * 0.02;
    treeGroup.rotation.y = currentRotY + time * 0.03; // Gentle persistent turn

    // Keep sprites facing camera billboard style
    nodesGroup.children.forEach(mesh => {
      if (mesh.sprite) {
        mesh.sprite.quaternion.copy(camera.quaternion);
      }
      if (mesh.halo) {
        mesh.halo.quaternion.copy(camera.quaternion);
      }
    });

    renderer.render(scene, camera);
    animationFrameId = requestAnimationFrame(tick);
  }

  // --- Resize handler
  function handleResize() {
    if (!renderer || !camera) return;
    renderer.setSize(container.clientWidth, container.clientHeight);
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', handleResize);

  // --- Public Unmount & Cleanup API
  function destroy() {
    searchInProgress = false;
    cancelAnimationFrame(animationFrameId);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('resize', handleResize);

    if (btnSearch) btnSearch.removeEventListener('click', startSearchProcess);
    if (btnInsert) btnInsert.removeEventListener('click', startInsertionProcess);
    if (btnRebalance) btnRebalance.removeEventListener('click', startRebalanceProcess);

    // Clean up Three.js objects
    treeGroup.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
      if (child.sprite) child.sprite.material.map.dispose();
    });

    scene.remove(treeGroup);
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
