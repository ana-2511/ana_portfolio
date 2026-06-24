// ===== Hero Section: 3D Robot Coding at Computer Simulation =====

(function() {
  const mount = document.getElementById('hero3d');
  if (!mount || typeof THREE === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // --- Setup Scene, Camera, Renderer
  const scene = new THREE.Scene();
  
  // Isometric perspective positioning
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(2.2, 1.8, 3.5);
  camera.lookAt(0, 0.35, 0);

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  
  function resize() {
    const w = mount.clientWidth || 520;
    const h = mount.clientHeight || 520;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  mount.appendChild(renderer.domElement);

  // --- Main Setup Group
  const setupGroup = new THREE.Group();
  setupGroup.position.set(-0.1, -0.2, 0); // Center slightly
  scene.add(setupGroup);

  // --- Materials System
  const plasticWhite = new THREE.MeshStandardMaterial({
    color: 0xeeeeee, metalness: 0.1, roughness: 0.25
  });
  
  const metalDark = new THREE.MeshStandardMaterial({
    color: 0x272d3d, metalness: 0.85, roughness: 0.2
  });

  const glowingCyan = new THREE.MeshBasicMaterial({
    color: 0x6DE3FF, transparent: true, opacity: 0.85
  });

  const keyboardMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b, metalness: 0.4, roughness: 0.3
  });

  // --- 1. THE WORKSPACE DESK
  const deskGeo = new THREE.BoxGeometry(2.2, 0.04, 1.3);
  const deskMat = new THREE.MeshStandardMaterial({
    color: 0x11172a, metalness: 0.4, roughness: 0.6, transparent: true, opacity: 0.4
  });
  const desk = new THREE.Mesh(deskGeo, deskMat);
  desk.position.y = -0.02;
  setupGroup.add(desk);

  // Desk support rim
  const rimGeo = new THREE.BoxGeometry(2.22, 0.02, 1.32);
  const rimMat = new THREE.MeshBasicMaterial({ color: 0xE8B056, transparent: true, opacity: 0.25 });
  const rim = new THREE.Mesh(rimGeo, rimMat);
  rim.position.y = 0.01;
  setupGroup.add(rim);

  // --- 2. COMPUTER MONITOR SETUP
  const monitorGroup = new THREE.Group();
  monitorGroup.position.set(-0.25, 0, -0.25); // Set toward back-left of desk
  monitorGroup.rotation.y = Math.PI / 6; // Turn slightly toward robot
  setupGroup.add(monitorGroup);

  // Monitor Stand Base
  const baseGeo = new THREE.CylinderGeometry(0.14, 0.16, 0.02, 24);
  const standBase = new THREE.Mesh(baseGeo, metalDark);
  standBase.position.y = 0.01;
  monitorGroup.add(standBase);

  // Monitor Neck
  const neckGeo = new THREE.BoxGeometry(0.04, 0.22, 0.04);
  const standNeck = new THREE.Mesh(neckGeo, metalDark);
  standNeck.position.set(0, 0.12, -0.04);
  monitorGroup.add(standNeck);

  // Monitor Frame Body
  const frameGeo = new THREE.BoxGeometry(0.85, 0.54, 0.04);
  const monitorFrame = new THREE.Mesh(frameGeo, metalDark);
  monitorFrame.position.set(0, 0.38, -0.04);
  monitorGroup.add(monitorFrame);

  // Monitor Back Support
  const monitorBackGeo = new THREE.BoxGeometry(0.35, 0.35, 0.04);
  const monitorBack = new THREE.Mesh(monitorBackGeo, metalDark);
  monitorBack.position.set(0, 0.38, -0.07);
  monitorGroup.add(monitorBack);

  // --- Canvas Texture for Scrolling Code Terminal Screen ---
  const screenWidth = 256;
  const screenHeight = 160;
  const screenCanvas = document.createElement('canvas');
  screenCanvas.width = screenWidth;
  screenCanvas.height = screenHeight;
  const screenCtx = screenCanvas.getContext('2d');
  
  const screenTexture = new THREE.CanvasTexture(screenCanvas);
  const screenMat = new THREE.MeshBasicMaterial({ map: screenTexture });
  const screenGeo = new THREE.PlaneGeometry(0.81, 0.50);
  const screenFace = new THREE.Mesh(screenGeo, screenMat);
  screenFace.position.set(0, 0.38, -0.018); // Align on face of frame
  monitorGroup.add(screenFace);

  // Initial screen canvas paint
  screenCtx.fillStyle = '#0f172a'; // dark navy
  screenCtx.fillRect(0, 0, screenWidth, screenHeight);

  // Scrolling code terminal simulation database
  const codeLines = [
    'import tensorflow as tf',
    'model = tf.keras.Sequential()',
    'model.add(layers.Dense(64, act="relu"))',
    'model.add(layers.Dense(10, act="softmax"))',
    '# Training agent pipeline...',
    'Epoch 88/150: loss=0.045 - acc=0.982',
    '>>> Playwright Scraping SKU data',
    'dual_ocr_engine.extract(pdf_stream)',
    'rapidfuzz.reconcile(master_sheet)',
    'Status: AGENT SUCCESS - ROI 240%',
    '>>> init robotic_arm.js IK target',
    'Base Angle: -42.2 deg [OK]',
    'Wrist Roll: 18.5 deg [OK]',
    '>>> traversing 3D Binary Search Tree',
    'Path: 50 -> 70 -> 60 [Node Found!]'
  ];
  let visibleLines = ['>>> Initializing coding environment...', '>>> System online.'];

  // Keyboard
  const keyboardGroup = new THREE.Group();
  keyboardGroup.position.set(-0.10, 0.01, 0.16); // In front of monitor
  keyboardGroup.rotation.y = Math.PI / 6;
  setupGroup.add(keyboardGroup);

  const keyboardBodyGeo = new THREE.BoxGeometry(0.52, 0.015, 0.18);
  const keyboardBody = new THREE.Mesh(keyboardBodyGeo, keyboardMat);
  keyboardGroup.add(keyboardBody);

  // Glowing Key Accent
  const keysGlowGeo = new THREE.BoxGeometry(0.48, 0.018, 0.14);
  const keysGlow = new THREE.Mesh(keysGlowGeo, glowingCyan);
  keysGlow.position.y = 0.002;
  keyboardGroup.add(keysGlow);

  // --- 3. THE CODING ROBOT
  const robotGroup = new THREE.Group();
  robotGroup.position.set(0.35, 0, 0.28); // Set on right-front, typing toward screen
  robotGroup.rotation.y = -Math.PI / 1.35; // Face keyboard
  setupGroup.add(robotGroup);

  // Robot Torso (Rounded Chassis)
  const bodyGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.36, 16);
  const robotBody = new THREE.Mesh(bodyGeo, plasticWhite);
  robotBody.position.y = 0.26;
  robotGroup.add(robotBody);

  // Collar ring
  const collarGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.04, 16);
  const collar = new THREE.Mesh(collarGeo, metalDark);
  collar.position.y = 0.45;
  robotGroup.add(collar);

  // Chest indicator light
  const chestLightGeo = new THREE.SphereGeometry(0.04, 8, 8);
  const chestLight = new THREE.Mesh(chestLightGeo, glowingCyan);
  chestLight.position.set(0, 0.32, 0.16);
  robotGroup.add(chestLight);

  // Robot Head Group (pivots to look around)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.54, 0);
  robotGroup.add(headGroup);

  const headGeo = new THREE.SphereGeometry(0.16, 20, 20);
  const robotHead = new THREE.Mesh(headGeo, plasticWhite);
  headGroup.add(robotHead);

  // Visor Screen
  const visorGeo = new THREE.SphereGeometry(0.165, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2.2);
  visorGeo.rotateX(-Math.PI / 2);
  const visorMat = new THREE.MeshStandardMaterial({
    color: 0x090d16, metalness: 0.9, roughness: 0.05
  });
  const visor = new THREE.Mesh(visorGeo, visorMat);
  visor.position.set(0, 0, 0.02);
  headGroup.add(visor);

  // Glowing Robot Eyes (Blinking Cyan Spheres)
  const eyeLGeo = new THREE.SphereGeometry(0.02, 10, 10);
  const eyeL = new THREE.Mesh(eyeLGeo, glowingCyan);
  eyeL.position.set(-0.06, 0.015, 0.145);
  headGroup.add(eyeL);

  const eyeRGeo = new THREE.SphereGeometry(0.02, 10, 10);
  const eyeR = new THREE.Mesh(eyeRGeo, glowingCyan);
  eyeR.position.set(0.06, 0.015, 0.145);
  headGroup.add(eyeR);

  // Joint Pivots & Arms (Hierarchy)
  // Left arm
  const armLShoulder = new THREE.Group();
  armLShoulder.position.set(-0.21, 0.32, 0.02);
  robotGroup.add(armLShoulder);

  const upperArmLGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.20, 8);
  upperArmLGeo.translate(0, -0.09, 0);
  const upperArmL = new THREE.Mesh(upperArmLGeo, plasticWhite);
  armLShoulder.add(upperArmL);

  const armLElbow = new THREE.Group();
  armLElbow.position.set(0, -0.18, 0);
  armLShoulder.add(armLElbow);

  const lowerArmLGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.18, 8);
  lowerArmLGeo.translate(0, -0.08, 0);
  const lowerArmL = new THREE.Mesh(lowerArmLGeo, metalDark);
  armLElbow.add(lowerArmL);

  const handL = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), glowingCyan);
  handL.position.set(0, -0.17, 0);
  armLElbow.add(handL);

  // Right arm
  const armRShoulder = new THREE.Group();
  armRShoulder.position.set(0.21, 0.32, 0.02);
  robotGroup.add(armRShoulder);

  const upperArmRGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.20, 8);
  upperArmRGeo.translate(0, -0.09, 0);
  const upperArmR = new THREE.Mesh(upperArmRGeo, plasticWhite);
  armRShoulder.add(upperArmR);

  const armRElbow = new THREE.Group();
  armRElbow.position.set(0, -0.18, 0);
  armRShoulder.add(armRElbow);

  const lowerArmRGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.18, 8);
  lowerArmRGeo.translate(0, -0.08, 0);
  const lowerArmR = new THREE.Mesh(lowerArmRGeo, metalDark);
  armRElbow.add(lowerArmR);

  const handR = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), glowingCyan);
  handR.position.set(0, -0.17, 0);
  armRElbow.add(handR);

  // Preset default joint rotations for typing pose
  armLShoulder.rotation.set(0.55, -0.4, 0.1);
  armLElbow.rotation.set(-1.0, 0, 0.1);

  armRShoulder.rotation.set(0.55, 0.4, -0.1);
  armRElbow.rotation.set(-1.0, 0, -0.1);

  // --- Lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.4));
  
  const keyLight = new THREE.PointLight(0xE8B056, 1.4, 12);
  keyLight.position.set(-2, 3, 3);
  scene.add(keyLight);

  const fillLight = new THREE.PointLight(0x6DE3FF, 1.4, 12);
  fillLight.position.set(3, 2, 2);
  scene.add(fillLight);

  // Soft glowing backlight centered behind monitor
  const monitorBacklight = new THREE.PointLight(0x6DE3FF, 1.5, 6);
  monitorBacklight.position.set(-0.35, 0.4, -0.4);
  setupGroup.add(monitorBacklight);

  // --- Mouse Cursor Interaction Coordinates
  let targetRotX = 0, targetRotY = 0;
  let curRotX = 0, curRotY = 0;
  window.addEventListener('mousemove', (e) => {
    const nx = (e.clientX / window.innerWidth) - 0.5;
    const ny = (e.clientY / window.innerHeight) - 0.5;
    targetRotY = nx * 0.9;
    targetRotX = ny * 0.65;
  });

  let scrollOffset = 0;
  window.addEventListener('scroll', () => {
    scrollOffset = window.scrollY * 0.0008;
  }, { passive: true });

  window.addEventListener('resize', resize);

  // --- Scrolling Terminal Screen Text Renderer
  function updateScreenCanvas() {
    if (!screenCtx) return;

    screenCtx.fillStyle = '#0b0f1a';
    screenCtx.fillRect(0, 0, screenWidth, screenHeight);

    // Draw scanning glow overlay
    const scanGrad = screenCtx.createLinearGradient(0, 0, 0, screenHeight);
    scanGrad.addColorStop(0, 'rgba(109, 227, 255, 0.08)');
    scanGrad.addColorStop(0.5, 'rgba(109, 227, 255, 0.02)');
    scanGrad.addColorStop(1, 'rgba(109, 227, 255, 0.08)');
    screenCtx.fillStyle = scanGrad;
    screenCtx.fillRect(0, 0, screenWidth, screenHeight);

    // Render terminal lines
    screenCtx.font = '10px monospace';
    screenCtx.textAlign = 'left';
    screenCtx.textBaseline = 'top';

    const lineHeight = 12;
    const startY = 8;

    visibleLines.forEach((line, idx) => {
      if (line.startsWith('>>>') || line.startsWith('Status:')) {
        screenCtx.fillStyle = '#E8B056'; // Amber alerts
      } else if (line.startsWith('#') || line.startsWith('Epoch')) {
        screenCtx.fillStyle = '#FF6FB1'; // Magenta research logs
      } else {
        screenCtx.fillStyle = '#6DE3FF'; // Cyan general text
      }
      
      // Blinking cursor on last line
      if (idx === visibleLines.length - 1) {
        const cursorBlink = Math.floor(Date.now() / 400) % 2 === 0 ? '_' : '';
        screenCtx.fillText(line + cursorBlink, 8, startY + idx * lineHeight);
      } else {
        screenCtx.fillText(line, 8, startY + idx * lineHeight);
      }
    });

    screenTexture.needsUpdate = true;
  }

  // cadence loop for adding new lines to simulate real time compilation
  let lineTimer = 0;
  function simulateCodingData() {
    lineTimer++;
    if (lineTimer > 110) {
      lineTimer = 0;
      
      // Select random line from DB
      const nextLine = codeLines[Math.floor(Math.random() * codeLines.length)];
      visibleLines.push(nextLine);

      // Keep maximum lines matching screen height
      if (visibleLines.length > 12) {
        visibleLines.shift();
      }
    }
  }

  // --- Spawning Floating "Code Code Sparks" from keyboard/screen
  const codeSparks = [];
  const sparkGeo = new THREE.BoxGeometry(0.015, 0.015, 0.015);
  
  function spawnCodeSpark() {
    const sMat = new THREE.MeshBasicMaterial({
      color: Math.random() > 0.5 ? 0x6DE3FF : 0xE8B056,
      transparent: true,
      opacity: 0.9
    });
    const spark = new THREE.Mesh(sparkGeo, sMat);
    
    // Spawn over keyboard
    const rndX = (Math.random() - 0.5) * 0.3;
    const rndZ = (Math.random() - 0.5) * 0.1;
    spark.position.set(-0.10 + rndX, 0.02, 0.16 + rndZ);
    keyboardGroup.localToWorld(spark.position);

    scene.add(spark);
    codeSparks.push({
      mesh: spark,
      mat: sMat,
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.008,
        0.015 + Math.random() * 0.012,
        (Math.random() - 0.5) * 0.008
      ),
      decay: 0.012 + Math.random() * 0.015
    });
  }

  // --- Animation loop
  let frame = 0;
  function tick() {
    frame++;
    const t = frame * 0.01;

    // 1. Simulate data logs
    simulateCodingData();
    updateScreenCanvas();

    // 2. Typing claw keyframed motion (Very rapid alternating arms typing)
    const typeSpeed = 24;
    armLShoulder.rotation.x = 0.55 + Math.sin(t * typeSpeed) * 0.09;
    armLShoulder.rotation.z = 0.1 + Math.cos(t * typeSpeed) * 0.04;
    armLElbow.rotation.x = -1.0 + Math.sin(t * typeSpeed + Math.PI/2) * 0.14;

    armRShoulder.rotation.x = 0.55 + Math.cos(t * typeSpeed) * 0.09;
    armRShoulder.rotation.z = -0.1 + Math.sin(t * typeSpeed) * 0.04;
    armRElbow.rotation.x = -1.0 + Math.cos(t * typeSpeed + Math.PI/2) * 0.14;

    // Occasional code sparks emitted on typing trigger
    if (frame % 8 === 0) {
      spawnCodeSpark();
    }

    // 3. Move code sparks upwards & fade them
    for (let i = codeSparks.length - 1; i >= 0; i--) {
      const sp = codeSparks[i];
      sp.mesh.position.add(sp.velocity);
      sp.mat.opacity -= sp.decay;
      sp.mesh.rotation.y += 0.04;

      if (sp.mat.opacity <= 0.02) {
        scene.remove(sp.mesh);
        sp.mesh.geometry.dispose();
        sp.mat.dispose();
        codeSparks.splice(i, 1);
      }
    }

    // 4. Robot Head cursor tracking with screen glancing logic
    let targetHeadY = -0.15; // default look at computer screen
    let targetHeadX = 0.1;

    // If mouse coordinate is active, glance back and forth between monitor and mouse
    const lookAtViewerPercentage = Math.sin(t * 0.45); // periodic shifting
    if (lookAtViewerPercentage > 0.1) {
      // Look toward mouse cursor!
      targetHeadY = Math.max(-0.6, Math.min(0.6, targetRotY));
      targetHeadX = Math.max(-0.4, Math.min(0.3, targetRotX));
    }

    // Smooth head transition interpolation
    headGroup.rotation.y += (targetHeadY - headGroup.rotation.y) * 0.08;
    headGroup.rotation.x += (targetHeadX - headGroup.rotation.x) * 0.08;

    // 5. Robot Eye blinking logic
    if (frame % 380 === 0) {
      eyeL.scale.y = 0.15;
      eyeR.scale.y = 0.15;
    } else if (eyeL.scale.y < 1.0) {
      eyeL.scale.y += 0.15;
      eyeR.scale.y += 0.15;
    }

    // 6. Passive breathing body motion
    robotBody.position.y = 0.26 + Math.sin(t * 2) * 0.006;
    headGroup.position.y = 0.54 + Math.sin(t * 2) * 0.005;

    // 7. Core Parallax setup rotations
    curRotX += (targetRotX - curRotX) * 0.05;
    curRotY += (targetRotY - curRotY) * 0.05;
    setupGroup.rotation.y = curRotY * 0.35 + Math.sin(t * 0.15) * 0.02;

    renderer.render(scene, camera);
    animationFrameId = requestAnimationFrame(tick);
  }
  tick();
})();
