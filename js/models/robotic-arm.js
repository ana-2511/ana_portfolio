// ===== 3D Articulated Robotic Arm Simulation (Robotics) =====

window.initRoboticArmSim = function(container) {
  if (typeof THREE === 'undefined') {
    console.error('Three.js is not loaded.');
    return null;
  }

  // --- Constants & Variables
  let scene, camera, renderer, animationFrameId;
  let robotGroup, baseGroup, shoulderGroup, elbowGroup, wristGroup, gripperL, gripperR;
  let dataBlock = null, deliverBox = null;
  let mouseTarget = new THREE.Vector3(0, 1.2, 1.5);
  
  // Simulation states
  let isMouseTracking = false;
  let isAutomating = false;
  let automationStep = 0;
  let automationTime = 0;

  // Joint Angles (in radians)
  let angleBase = 0;
  let angleShoulder = 0.3;
  let angleElbow = 0.5;
  let angleWrist = 0.2;
  let angleGripper = 0.15; // 0 (closed) to 0.4 (open)

  // DOM Elements binding
  const toggleIK = document.getElementById('robot-ik-toggle');
  const sliderBase = document.getElementById('robot-slider-base');
  const sliderShoulder = document.getElementById('robot-slider-shoulder');
  const sliderElbow = document.getElementById('robot-slider-elbow');
  const sliderWrist = document.getElementById('robot-slider-wrist');
  const sliderGripper = document.getElementById('robot-slider-gripper');
  
  const btnAutomate = document.getElementById('robot-btn-automate');
  
  const txtEffectorX = document.getElementById('robot-val-x');
  const txtEffectorY = document.getElementById('robot-val-y');
  const txtEffectorZ = document.getElementById('robot-val-z');
  const txtStatus = document.getElementById('robot-val-status');

  // --- Initialize Three.js Scene
  function init() {
    scene = new THREE.Scene();
    
    camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(2.8, 3.2, 4.8);
    camera.lookAt(0, 0.8, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // --- Build Robotic Arm Geometry Hierarchy
    robotGroup = new THREE.Group();
    scene.add(robotGroup);

    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x515d74,
      metalness: 0.85,
      roughness: 0.2,
      emissive: 0x11172a,
      emissiveIntensity: 0.1
    });

    const jointMat = new THREE.MeshStandardMaterial({
      color: 0xE8B056,
      metalness: 0.9,
      roughness: 0.15,
      emissive: 0xE8B056,
      emissiveIntensity: 0.25
    });

    const glowCyanMat = new THREE.MeshBasicMaterial({
      color: 0x6DE3FF,
      transparent: true,
      opacity: 0.85
    });

    // 1. BASE
    const baseGeo = new THREE.CylinderGeometry(0.5, 0.6, 0.25, 32);
    const baseMesh = new THREE.Mesh(baseGeo, metalMat);
    baseMesh.position.y = 0.125;
    robotGroup.add(baseMesh);

    // Base Rotating Group
    baseGroup = new THREE.Group();
    baseGroup.position.y = 0.25;
    robotGroup.add(baseGroup);

    const baseTurretGeo = new THREE.SphereGeometry(0.32, 24, 24);
    const baseTurret = new THREE.Mesh(baseTurretGeo, metalMat);
    baseGroup.add(baseTurret);

    // 2. SHOULDER JOINT & ARM 1
    shoulderGroup = new THREE.Group();
    shoulderGroup.position.set(0, 0.15, 0);
    baseGroup.add(shoulderGroup);

    // Shoulder Pivot Visual
    const shoulderPivotGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.4, 16);
    shoulderPivotGeo.rotateX(Math.PI / 2);
    const shoulderPivot = new THREE.Mesh(shoulderPivotGeo, jointMat);
    shoulderGroup.add(shoulderPivot);

    // Arm Segment 1 Link
    const arm1Geo = new THREE.CylinderGeometry(0.08, 0.08, 1.0, 16);
    arm1Geo.translate(0, 0.5, 0);
    const arm1Mesh = new THREE.Mesh(arm1Geo, metalMat);
    shoulderGroup.add(arm1Mesh);

    // Decorative Accent Glow Lines on Arm 1
    const bandGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.06, 16);
    bandGeo.translate(0, 0.5, 0);
    const bandMesh = new THREE.Mesh(bandGeo, glowCyanMat);
    shoulderGroup.add(bandMesh);

    // 3. ELBOW JOINT & ARM 2
    elbowGroup = new THREE.Group();
    elbowGroup.position.set(0, 1.0, 0);
    shoulderGroup.add(elbowGroup);

    // Elbow Pivot Visual
    const elbowPivotGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.35, 16);
    elbowPivotGeo.rotateX(Math.PI / 2);
    const elbowPivot = new THREE.Mesh(elbowPivotGeo, jointMat);
    elbowGroup.add(elbowPivot);

    // Arm Segment 2 Link
    const arm2Geo = new THREE.CylinderGeometry(0.06, 0.06, 0.8, 16);
    arm2Geo.translate(0, 0.4, 0);
    const arm2Mesh = new THREE.Mesh(arm2Geo, metalMat);
    elbowGroup.add(arm2Mesh);

    // 4. WRIST JOINT & END-EFFECTOR
    wristGroup = new THREE.Group();
    wristGroup.position.set(0, 0.8, 0);
    elbowGroup.add(wristGroup);

    // Wrist Pivot Visual
    const wristPivotGeo = new THREE.SphereGeometry(0.09, 16, 16);
    const wristPivot = new THREE.Mesh(wristPivotGeo, jointMat);
    wristGroup.add(wristPivot);

    // Gripper Base/Chassis
    const gripperBaseGeo = new THREE.BoxGeometry(0.18, 0.12, 0.18);
    gripperBaseGeo.translate(0, 0.09, 0);
    const gripperBase = new THREE.Mesh(gripperBaseGeo, metalMat);
    wristGroup.add(gripperBase);

    // 5. CLAW/GRIPPER FINGERS
    const clawGeo = new THREE.BoxGeometry(0.03, 0.18, 0.08);
    
    gripperL = new THREE.Group();
    gripperL.position.set(-0.06, 0.12, 0);
    const clawLMesh = new THREE.Mesh(clawGeo, jointMat);
    clawLMesh.position.y = 0.09;
    gripperL.add(clawLMesh);
    wristGroup.add(gripperL);

    gripperR = new THREE.Group();
    gripperR.position.set(0.06, 0.12, 0);
    const clawRMesh = new THREE.Mesh(clawGeo, jointMat);
    clawRMesh.position.y = 0.09;
    gripperR.add(clawRMesh);
    wristGroup.add(gripperR);

    // --- Environment Elements (VRT Sorting Bin & Block)
    // RPA automation drop-off box
    deliverBox = new THREE.Group();
    deliverBox.position.set(-1.0, 0, 0.8);
    scene.add(deliverBox);

    const boxOuterGeo = new THREE.BoxGeometry(0.5, 0.35, 0.5);
    const boxOuterMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, metalness: 0.5, roughness: 0.6, transparent: true, opacity: 0.8
    });
    const boxOuter = new THREE.Mesh(boxOuterGeo, boxOuterMat);
    boxOuter.position.y = 0.175;
    deliverBox.add(boxOuter);

    const boxRimGeo = new THREE.BoxGeometry(0.52, 0.04, 0.52);
    const boxRim = new THREE.Mesh(boxRimGeo, jointMat);
    boxRim.position.y = 0.35;
    deliverBox.add(boxRim);

    // Setup Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.45));
    
    const keyL = new THREE.PointLight(0xE8B056, 1.4, 15);
    keyL.position.set(4, 5, 2);
    scene.add(keyL);

    const fillL = new THREE.PointLight(0x6DE3FF, 1.0, 15);
    fillL.position.set(-4, 2, 4);
    scene.add(fillL);

    // --- Event Listeners binding
    if (toggleIK) toggleIK.addEventListener('change', handleIKToggle);
    if (btnAutomate) btnAutomate.addEventListener('click', startAutomation);

    // Add manual slider bindings
    const sliders = [sliderBase, sliderShoulder, sliderElbow, sliderWrist, sliderGripper];
    sliders.forEach(sl => {
      if (sl) sl.addEventListener('input', updateSlidersToAngles);
    });

    // Synchronise UI values initially
    syncAnglesToSliders();
    updateJointRotations();

    // Start render loop
    tick();
  }

  // --- Controls Coordination
  function handleIKToggle(e) {
    isMouseTracking = e.target.checked;
    
    // Toggle sliders disabled state
    const sliders = [sliderBase, sliderShoulder, sliderElbow, sliderWrist];
    sliders.forEach(sl => {
      if (sl) sl.disabled = isMouseTracking;
    });

    if (txtStatus) {
      txtStatus.textContent = isMouseTracking ? 'Tracking Cursor' : 'Manual Control';
    }
  }

  function syncAnglesToSliders() {
    if (sliderBase) sliderBase.value = Math.round(angleBase * (180 / Math.PI));
    if (sliderShoulder) sliderShoulder.value = Math.round(angleShoulder * (180 / Math.PI));
    if (sliderElbow) sliderElbow.value = Math.round(angleElbow * (180 / Math.PI));
    if (sliderWrist) sliderWrist.value = Math.round(angleWrist * (180 / Math.PI));
    if (sliderGripper) sliderGripper.value = Math.round(angleGripper * 100);
  }

  function updateSlidersToAngles() {
    if (isMouseTracking || isAutomating) return;

    if (sliderBase) angleBase = parseFloat(sliderBase.value) * (Math.PI / 180);
    if (sliderShoulder) angleShoulder = parseFloat(sliderShoulder.value) * (Math.PI / 180);
    if (sliderElbow) angleElbow = parseFloat(sliderElbow.value) * (Math.PI / 180);
    if (sliderWrist) angleWrist = parseFloat(sliderWrist.value) * (Math.PI / 180);
    if (sliderGripper) angleGripper = parseFloat(sliderGripper.value) / 100;

    updateJointRotations();
  }

  // --- Kinematics Math
  function updateJointRotations() {
    // Apply rotational values to hierarchical local groups
    baseGroup.rotation.y = angleBase;
    shoulderGroup.rotation.z = -angleShoulder; // Negative since Z axes bend outward
    elbowGroup.rotation.z = -angleElbow;
    wristGroup.rotation.z = -angleWrist;

    // Symmetric gripper finger offsets
    gripperL.position.x = -0.04 - angleGripper * 0.15;
    gripperR.position.x = 0.04 + angleGripper * 0.15;

    // Update Slider Value Labels in UI
    const lblBase = document.getElementById('robot-lbl-base');
    const lblShoulder = document.getElementById('robot-lbl-shoulder');
    const lblElbow = document.getElementById('robot-lbl-elbow');
    const lblWrist = document.getElementById('robot-lbl-wrist');
    const lblGripper = document.getElementById('robot-lbl-gripper');

    if (lblBase) lblBase.textContent = `${Math.round(angleBase * (180 / Math.PI))}°`;
    if (lblShoulder) lblShoulder.textContent = `${Math.round(angleShoulder * (180 / Math.PI))}°`;
    if (lblElbow) lblElbow.textContent = `${Math.round(angleElbow * (180 / Math.PI))}°`;
    if (lblWrist) lblWrist.textContent = `${Math.round(angleWrist * (180 / Math.PI))}°`;
    if (lblGripper) lblGripper.textContent = `${Math.round(angleGripper * 100)}%`;

    // Calculate End Effector Position (Approximate Forward Kinematics)
    calculateEndEffectorPosition();
  }

  function calculateEndEffectorPosition() {
    // Vector arithmetic to map local end-effector offset into world space
    const endEffectorOffset = new THREE.Vector3(0, 0.25, 0);
    wristGroup.localToWorld(endEffectorOffset);

    if (txtEffectorX) txtEffectorX.textContent = endEffectorOffset.x.toFixed(2);
    if (txtEffectorY) txtEffectorY.textContent = endEffectorOffset.y.toFixed(2);
    if (txtEffectorZ) txtEffectorZ.textContent = endEffectorOffset.z.toFixed(2);
  }

  // --- Mouse Cursor Interaction (Inverse Kinematics approximation)
  function onMouseMove(e) {
    if (!isMouseTracking || isAutomating) return;

    // Project mouse cursor onto 3D coordinate target plane (facing camera)
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = -(e.clientY / window.innerHeight) * 2 + 1;

    // Geometric mapping based on camera orientation
    mouseTarget.set(nx * 1.8 + 0.4, ny * 1.5 + 1.2, 1.4);
    
    solveIK(mouseTarget);
  }
  window.addEventListener('mousemove', onMouseMove);

  // Simplistic 2-link geometric IK solver
  function solveIK(target) {
    // Base angle faces target directly on horizontal X-Z plane
    angleBase = Math.atan2(target.z, target.x) - Math.PI/4;

    // Project target into 2D plane of the arm
    const radialX = Math.sqrt(target.x * target.x + target.z * target.z) - 0.1; // offset from base
    const heightY = target.y - 0.4; // offset from shoulder height

    const dist = Math.sqrt(radialX * radialX + heightY * heightY);
    const l1 = 1.0; // Length arm 1
    const l2 = 0.8; // Length arm 2

    // Boundary cap to prevent snapping outside arm reach
    const maxReach = (l1 + l2) * 0.95;
    const cleanDist = Math.min(maxReach, Math.max(0.2, dist));

    // Cosine law calculations for joint bending angles
    const cosAngle2 = (cleanDist * cleanDist - l1 * l1 - l2 * l2) / (2 * l1 * l2);
    const cleanCos2 = Math.min(1.0, Math.max(-1.0, cosAngle2));
    
    // Elbow angle bends naturally
    angleElbow = Math.acos(cleanCos2);

    // Shoulder angle points toward radial direction
    const bAngle = Math.atan2(heightY, radialX);
    const aAngle = Math.atan2(l2 * Math.sin(angleElbow), l1 + l2 * Math.cos(angleElbow));
    angleShoulder = Math.PI / 2 - (bAngle + aAngle);

    // Keep wrist relatively level
    angleWrist = Math.PI/2 - angleShoulder - angleElbow;

    // Clamp boundary ranges to prevent hardware collision
    angleShoulder = Math.max(-0.2, Math.min(1.8, angleShoulder));
    angleElbow = Math.max(0.1, Math.min(2.4, angleElbow));
    angleWrist = Math.max(-1.2, Math.min(1.2, angleWrist));

    syncAnglesToSliders();
    updateJointRotations();
  }

  // --- Simulated RPA Pick & Place Keyframed Cycle
  function startAutomation() {
    if (isAutomating) return;
    isAutomating = true;
    isMouseTracking = false;
    if (toggleIK) toggleIK.checked = false;
    
    // Disable inputs during automation
    const inputs = [sliderBase, sliderShoulder, sliderElbow, sliderWrist, sliderGripper, toggleIK, btnAutomate];
    inputs.forEach(el => { if (el) el.disabled = true; });

    if (txtStatus) txtStatus.textContent = 'Running Automation Pipeline';
    if (btnAutomate) btnAutomate.textContent = 'Processing...';

    automationStep = 0;
    automationTime = 0;
  }

  function handleAutomationCycle() {
    automationTime += 0.015;

    // 9-Stage keyframe pipeline
    switch (automationStep) {
      case 0: // 1. Open gripper wide and reach down to "Pick" spot
        lerpAngle('base', 0.2, 0.08);
        lerpAngle('shoulder', 0.8, 0.04);
        lerpAngle('elbow', 1.2, 0.05);
        lerpAngle('wrist', 0.2, 0.04);
        lerpAngle('gripper', 0.4, 0.08); // Open claw
        
        if (checkAnglesDone(0.2, 0.8, 1.2, 0.2, 0.4)) {
          // Spawn glowing block cube at pick location
          const boxGeo = new THREE.BoxGeometry(0.16, 0.16, 0.16);
          const boxMat = new THREE.MeshStandardMaterial({
            color: 0x6DE3FF, emissive: 0x6DE3FF, emissiveIntensity: 0.85
          });
          dataBlock = new THREE.Mesh(boxGeo, boxMat);
          dataBlock.position.set(0.9, 0.08, 0.9); // world pick position
          scene.add(dataBlock);

          automationStep = 1;
        }
        break;

      case 1: // 2. Clamp gripper around data block
        lerpAngle('gripper', 0.03, 0.06);
        if (checkAnglesDone(null, null, null, null, 0.03)) {
          // Attach block to wrist so it travels with arm movement
          wristGroup.attach(dataBlock);
          dataBlock.position.set(0, 0.32, 0); // local offset in claw
          automationStep = 2;
        }
        break;

      case 2: // 3. Lift arm straight up
        lerpAngle('shoulder', 0.2, 0.04);
        lerpAngle('elbow', 0.6, 0.04);
        lerpAngle('wrist', 0.5, 0.04);
        if (checkAnglesDone(null, 0.2, 0.6, 0.5, null)) {
          automationStep = 3;
        }
        break;

      case 3: // 4. Rotate base 125 degrees toward sorting deliver box
        lerpAngle('base', -Math.PI / 2.3, 0.05);
        if (checkAnglesDone(-Math.PI / 2.3, null, null, null, null)) {
          automationStep = 4;
        }
        break;

      case 4: // 5. Reach down over the delivery bin
        lerpAngle('shoulder', 0.7, 0.04);
        lerpAngle('elbow', 1.1, 0.04);
        lerpAngle('wrist', 0.3, 0.04);
        if (checkAnglesDone(null, 0.7, 1.1, 0.3, null)) {
          automationStep = 5;
        }
        break;

      case 5: // 6. Open claws, dropping block
        lerpAngle('gripper', 0.4, 0.1);
        if (checkAnglesDone(null, null, null, null, 0.4)) {
          // Re-attach data block back to scene root for falling simulation
          scene.attach(dataBlock);
          automationStep = 6;
          automationTime = 0; // reset sub-timer
        }
        break;

      case 6: // 7. Animate block falling into bin, and fading out
        dataBlock.position.y -= 0.06;
        dataBlock.material.opacity = Math.max(0, 1.0 - automationTime * 2.5);
        dataBlock.material.transparent = true;
        if (dataBlock.position.y < 0.22 || dataBlock.material.opacity <= 0.01) {
          scene.remove(dataBlock);
          dataBlock.geometry.dispose();
          dataBlock.material.dispose();
          dataBlock = null;
          automationStep = 7;
        }
        break;

      case 7: // 8. Recoil arm, folding up
        lerpAngle('shoulder', 0.2, 0.04);
        lerpAngle('elbow', 0.5, 0.05);
        lerpAngle('wrist', 0.2, 0.04);
        lerpAngle('gripper', 0.15, 0.08); // default closed claw
        if (checkAnglesDone(null, 0.2, 0.5, 0.2, 0.15)) {
          automationStep = 8;
        }
        break;

      case 8: // 9. Return base rotate home
        lerpAngle('base', 0, 0.05);
        if (checkAnglesDone(0, null, null, null, null)) {
          // Completion & Re-enable UI inputs
          isAutomating = false;
          const inputs = [sliderBase, sliderShoulder, sliderElbow, sliderWrist, sliderGripper, toggleIK, btnAutomate];
          inputs.forEach(el => { if (el) el.disabled = false; });

          if (txtStatus) txtStatus.textContent = 'Automation Pipeline Completed';
          if (btnAutomate) btnAutomate.textContent = 'Automate RPA Work';
          
          syncAnglesToSliders();
        }
        break;
    }

    updateJointRotations();
  }

  // --- Lerp Helpers
  function lerpAngle(joint, targetVal, speed) {
    if (joint === 'base') angleBase += (targetVal - angleBase) * speed;
    if (joint === 'shoulder') angleShoulder += (targetVal - angleShoulder) * speed;
    if (joint === 'elbow') angleElbow += (targetVal - angleElbow) * speed;
    if (joint === 'wrist') angleWrist += (targetVal - angleWrist) * speed;
    if (joint === 'gripper') angleGripper += (targetVal - angleGripper) * speed;
  }

  function checkAnglesDone(b, s, e, w, g) {
    const thresh = 0.035;
    if (b !== null && Math.abs(angleBase - b) > thresh) return false;
    if (s !== null && Math.abs(angleShoulder - s) > thresh) return false;
    if (e !== null && Math.abs(angleElbow - e) > thresh) return false;
    if (w !== null && Math.abs(angleWrist - w) > thresh) return false;
    if (g !== null && Math.abs(angleGripper - g) > thresh) return false;
    return true;
  }

  // --- Animation loop
  let frameCount = 0;
  function tick() {
    frameCount++;

    // Process automation timeline if active
    if (isAutomating) {
      handleAutomationCycle();
    }

    // Gentle passive breathing animation when idle (no cursor track/automation)
    if (!isMouseTracking && !isAutomating) {
      const slowSine = Math.sin(frameCount * 0.015);
      // Slight base sway
      robotGroup.rotation.y = Math.sin(frameCount * 0.006) * 0.05;
      // Slight shoulder breathe
      shoulderGroup.rotation.z = -(angleShoulder + slowSine * 0.015);
    } else {
      robotGroup.rotation.set(0, 0, 0); // reset offset
    }

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
    isAutomating = false;
    cancelAnimationFrame(animationFrameId);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('resize', handleResize);

    if (toggleIK) toggleIK.removeEventListener('change', handleIKToggle);
    if (btnAutomate) btnAutomate.removeEventListener('click', startAutomation);

    const sliders = [sliderBase, sliderShoulder, sliderElbow, sliderWrist, sliderGripper];
    sliders.forEach(sl => {
      if (sl) sl.removeEventListener('input', updateSlidersToAngles);
    });

    // Clean up objects
    robotGroup.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });

    if (dataBlock) {
      scene.remove(dataBlock);
      dataBlock.geometry.dispose();
      dataBlock.material.dispose();
    }

    deliverBox.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });

    scene.remove(robotGroup);
    scene.remove(deliverBox);
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
