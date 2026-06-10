/* ============================================
   Portfolio — Core Interactive Script
   Futuristic Spatial Computing Theme
   ============================================ */

'use strict';

// Global Utility: Debounce/Throttle
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// ============================================
// 1. THREE.JS SPATIAL 3D BACKGROUND SYSTEM
// ============================================
(function() {
  const canvas = document.getElementById('three-bg-canvas');
  if (!canvas) return;

  const isMobile = window.innerWidth < 768 || ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

  let scene, camera, renderer, gridFloor;
  let objects = [];
  let mouse = { x: 0, y: 0 };
  let mouse3D = new THREE.Vector3(0, 0, 0);
  let width = window.innerWidth;
  let height = window.innerHeight;
  let scrollPercent = 0;

  // Layered scene groups
  let backgroundLayer, midLayer, foregroundLayer;
  let connectionLinesGroup;
  let connectionLines = [];
  let floatingParticles;
  let pVelocities = [];
  const particleCount = isMobile ? 80 : 320;

  // Skeletal hand tracking target joint positions
  const handJointsData = [
    new THREE.Vector3(0, -0.6, 0), // Wrist
    new THREE.Vector3(-0.2, -0.3, 0.08), new THREE.Vector3(-0.4, -0.2, 0.15), // Thumb
    new THREE.Vector3(-0.1, -0.12, 0.02), new THREE.Vector3(-0.18, 0.38, -0.05), // Index
    new THREE.Vector3(0, -0.1, 0.02), new THREE.Vector3(0, 0.45, -0.05), // Middle
    new THREE.Vector3(0.1, -0.12, 0.02), new THREE.Vector3(0.18, 0.4, -0.05), // Ring
    new THREE.Vector3(0.2, -0.18, 0.08), new THREE.Vector3(0.32, 0.28, 0.05) // Pinky
  ];

  // Helper: Create Solid core + Wireframe outline hybrid mesh
  function createHybridMesh(geometry, wireOpacity = 0.65, solidOpacity = 0.85) {
    const group = new THREE.Group();
    const solidMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: solidOpacity,
      depthWrite: true
    });
    const solid = new THREE.Mesh(geometry, solidMat);

    const wireMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: wireOpacity,
      depthWrite: true
    });
    const edges = new THREE.EdgesGeometry(geometry);
    const wire = new THREE.LineSegments(edges, wireMat);

    group.add(solid, wire);
    return group;
  }

  function initThree() {
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.015);

    camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
    camera.position.z = 13;

    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: false,
      antialias: !isMobile
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 1.0);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.95);
    dirLight.position.set(5, 15, 10);
    scene.add(dirLight);

    // Large Spatial Perspective Grid
    gridFloor = new THREE.GridHelper(150, 80, 0xffffff, 0xffffff);
    gridFloor.position.y = -6.5;
    gridFloor.material.transparent = true;
    gridFloor.material.opacity = 0.08;
    scene.add(gridFloor);

    // Setup Curved Bezier Connection Lines for Cursor Magnetism
    connectionLinesGroup = new THREE.Group();
    scene.add(connectionLinesGroup);
    const pointsCount = 20;
    for (let i = 0; i < 3; i++) {
      const lineGeo = new THREE.BufferGeometry().setFromPoints(Array.from({length: pointsCount}, () => new THREE.Vector3()));
      const lineMat = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending
      });
      const line = new THREE.Line(lineGeo, lineMat);
      line.visible = false;
      connectionLinesGroup.add(line);
      connectionLines.push(line);
    }

    // Set up Layer Groups
    backgroundLayer = new THREE.Group();
    midLayer = new THREE.Group();
    foregroundLayer = new THREE.Group();
    backgroundLayer.renderOrder = 0;
    midLayer.renderOrder = 1;
    foregroundLayer.renderOrder = 2;
    scene.add(backgroundLayer, midLayer, foregroundLayer);

    // Create 3D Telemetry Dust Particles
    createParticleDust();

    // Create Immersive Cinematic Assets
    createVRHeadset();
    createARGlasses();
    createHoloHand();
    createIMUSensorCluster();
    createCameraConeRig();
    createAIModelNet();
    createPoseSkeleton();
    createSpatialUIPanels();
    createDataFusionPipeline();
  }

  function createParticleDust() {
    const pGeometry = new THREE.BufferGeometry();
    const pPositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      pPositions[i * 3] = (Math.random() - 0.5) * 35;
      pPositions[i * 3 + 1] = (Math.random() - 0.5) * 35;
      pPositions[i * 3 + 2] = -5 - Math.random() * 20;
      pVelocities.push(new THREE.Vector3((Math.random() - 0.5) * 0.05, 0.15 + Math.random() * 0.25, 0));
    }

    pGeometry.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    const pMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.07,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending
    });

    floatingParticles = new THREE.Points(pGeometry, pMaterial);
    scene.add(floatingParticles);
  }

  function registerObject(group, baseX, baseY, baseZ, rotX, rotY, scale, parent = scene) {
    group.position.set(baseX, baseY, baseZ);
    group.scale.setScalar(scale);

    group.userData = {
      baseX: baseX,
      baseY: baseY,
      baseZ: baseZ,
      baseRotX: rotX,
      baseRotY: rotY,
      baseScale: scale,
      floatSpeed: 0.2 + Math.random() * 0.2,
      floatAmp: 0.25 + Math.random() * 0.15,
      phase: Math.random() * Math.PI * 2,
      rotSpeedX: 0.0005 + Math.random() * 0.001,
      rotSpeedY: 0.0015 + Math.random() * 0.002
    };

    parent.add(group);
    objects.push(group);
  }

  // 1. VR Headset & concentric rings (Hero Area Y = 2.5)
  function createVRHeadset() {
    const vrGroup = new THREE.Group();

    // Visor body
    const visorGeo = new THREE.BoxGeometry(2.3, 1.25, 1.1);
    const visor = createHybridMesh(visorGeo, 0.7, 0.9);
    vrGroup.add(visor);
    
    // Front glowing panel curves
    const panelGeo = new THREE.CylinderGeometry(0.55, 0.55, 2.0, 12, 1, false, -Math.PI/2, Math.PI);
    const panel = createHybridMesh(panelGeo, 0.85, 0.95);
    panel.rotation.z = Math.PI / 2;
    panel.position.set(0, 0, 0.56);
    vrGroup.add(panel);

    // Side mounting caps
    const capGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.25, 8);
    const leftCap = createHybridMesh(capGeo, 0.6, 0.9);
    leftCap.rotation.z = Math.PI / 2;
    leftCap.position.set(-1.18, 0, 0);
    const rightCap = leftCap.clone();
    rightCap.position.x = 1.18;
    vrGroup.add(leftCap, rightCap);

    // Dynamic Telemetry Orbit rings
    const ring1 = new THREE.Line(new THREE.BufferGeometry().setFromPoints(
      Array.from({length: 65}, (_, i) => new THREE.Vector3(Math.cos(i/64*Math.PI*2)*1.9, 0, Math.sin(i/64*Math.PI*2)*1.9))
    ), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.28 }));
    ring1.rotation.x = Math.PI / 6;

    const ring2 = new THREE.Line(new THREE.BufferGeometry().setFromPoints(
      Array.from({length: 65}, (_, i) => new THREE.Vector3(Math.cos(i/64*Math.PI*2)*2.2, 0, Math.sin(i/64*Math.PI*2)*2.2))
    ), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.16 }));
    ring2.rotation.z = Math.PI / 4;

    vrGroup.add(ring1, ring2);
    vrGroup.userData.ring1 = ring1;
    vrGroup.userData.ring2 = ring2;

    registerObject(vrGroup, 0, 2.5, -11, 0.15, -0.25, 1.1);
  }

  // 2. AR Smart Glasses (About Area Y = -4.5)
  function createARGlasses() {
    const arGroup = new THREE.Group();

    // Frames
    const frameGeo = new THREE.TorusGeometry(0.48, 0.03, 6, 20);
    const leftLensFrame = createHybridMesh(frameGeo, 0.65, 0.9);
    leftLensFrame.position.x = -0.58;
    const rightLensFrame = leftLensFrame.clone();
    rightLensFrame.position.x = 0.58;
    arGroup.add(leftLensFrame, rightLensFrame);

    // Lenses
    const lensGeo = new THREE.CylinderGeometry(0.46, 0.46, 0.03, 16);
    lensGeo.rotation.x = Math.PI / 2;
    const leftLens = new THREE.Mesh(lensGeo, new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.85 }));
    const leftLensWire = new THREE.LineSegments(new THREE.EdgesGeometry(lensGeo), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2 }));
    leftLens.add(leftLensWire);
    leftLens.position.x = -0.58;

    const rightLens = leftLens.clone();
    rightLens.position.x = 0.58;
    arGroup.add(leftLens, rightLens);

    // Sweeping laser grids across lenses
    const scanLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-0.4, 0, 0.02), new THREE.Vector3(0.4, 0, 0.02)
    ]), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 }));
    leftLens.add(scanLine);
    const rightScanLine = scanLine.clone();
    rightLens.add(rightScanLine);

    arGroup.userData.scanLines = [scanLine, rightScanLine];

    // Bridge
    const bridgeGeo = new THREE.BoxGeometry(0.24, 0.04, 0.04);
    const bridge = createHybridMesh(bridgeGeo, 0.6, 0.9);
    bridge.position.y = 0.08;
    arGroup.add(bridge);

    // Temples extending backward
    const templeGeo = new THREE.BoxGeometry(0.03, 0.03, 1.1);
    const leftTemple = createHybridMesh(templeGeo, 0.45, 0.9);
    leftTemple.position.set(-1.06, 0.05, -0.55);
    const rightTemple = leftTemple.clone();
    rightTemple.position.x = 1.06;
    arGroup.add(leftTemple, rightTemple);

    registerObject(arGroup, 1.8, -4.5, -10.5, -0.1, 0.35, 1.0);
  }

  // 3. Hand Tracking Rig & animated gestures (About Area Y = -4.5)
  function createHoloHand() {
    const handGroup = new THREE.Group();

    // Wrist joint
    const wrist = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    wrist.position.copy(handJointsData[0]);
    handGroup.add(wrist);

    const jointMeshes = [];
    const boneLines = [];

    const sGeom = new THREE.SphereGeometry(0.048, 5, 5);
    const jMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const bMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 });

    // Generate joint points (10 secondary nodes)
    for (let i = 1; i < handJointsData.length; i++) {
      const mesh = new THREE.Mesh(sGeom, jMat);
      mesh.position.copy(handJointsData[i]);
      handGroup.add(mesh);
      jointMeshes.push(mesh);
    }

    // Connect joint indexes as bones
    const connections = [
      [0, 1], [1, 2], // Thumb
      [0, 3], [3, 4], // Index
      [0, 5], [5, 6], // Middle
      [0, 7], [7, 8], // Ring
      [0, 9], [9, 10] // Pinky
    ];

    connections.forEach(pair => {
      const p1 = handJointsData[pair[0]];
      const p2 = handJointsData[pair[1]];
      const lineGeo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
      const line = new THREE.Line(lineGeo, bMat);
      handGroup.add(line);
      boneLines.push({ line, p1: pair[0], p2: pair[1] });
    });

    handGroup.userData.jointMeshes = jointMeshes;
    handGroup.userData.boneLines = boneLines;

    registerObject(handGroup, -1.8, -4.5, -10.5, -0.2, 0.2, 1.25);
  }

  // 4. IMU Sensor Fusion rings (Skills/Education Y = -11.0)
  function createIMUSensorCluster() {
    const imuGroup = new THREE.Group();

    // Central chip box
    const chipGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
    const chip = createHybridMesh(chipGeo, 0.7, 0.9);
    imuGroup.add(chip);

    // Multi-axis nested tracking rings
    const ring1 = new THREE.Line(new THREE.BufferGeometry().setFromPoints(
      Array.from({length: 49}, (_, i) => new THREE.Vector3(Math.cos(i/48*Math.PI*2)*0.85, 0, Math.sin(i/48*Math.PI*2)*0.85))
    ), new THREE.LineBasicMaterial({ color: 0xffffff }));
    const ring2 = new THREE.Line(new THREE.BufferGeometry().setFromPoints(
      Array.from({length: 49}, (_, i) => new THREE.Vector3(0, Math.cos(i/48*Math.PI*2)*0.72, Math.sin(i/48*Math.PI*2)*0.72))
    ), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.65 }));
    const ring3 = new THREE.Line(new THREE.BufferGeometry().setFromPoints(
      Array.from({length: 49}, (_, i) => new THREE.Vector3(Math.cos(i/48*Math.PI*2)*0.98, Math.sin(i/48*Math.PI*2)*0.98, 0))
    ), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 }));

    imuGroup.add(ring1, ring2, ring3);
    imuGroup.userData.ring1 = ring1;
    imuGroup.userData.ring2 = ring2;
    imuGroup.userData.ring3 = ring3;

    registerObject(imuGroup, -2.0, -11.0, -11, 0.1, 0.25, 1.05);
  }

  // 5. Computer Vision scanning rigs (Skills/Education Y = -11.0)
  function createCameraConeRig() {
    const camGroup = new THREE.Group();

    // Camera body
    const cBodyGeo = new THREE.BoxGeometry(0.68, 0.44, 0.44);
    const cBody = createHybridMesh(cBodyGeo, 0.7, 0.9);
    camGroup.add(cBody);

    // Lens cylinder
    const cLensGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.28, 12);
    const cLens = createHybridMesh(cLensGeo, 0.6, 0.9);
    cLens.rotation.x = Math.PI / 2;
    cLens.position.z = 0.26;
    camGroup.add(cLens);

    // Volumetric scan cone projection
    const coneGeo = new THREE.ConeGeometry(1.6, 4.0, 16, 1, true);
    coneGeo.translate(0, -2.0, 0); // reposition pivot
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const scanCone = new THREE.Mesh(coneGeo, coneMat);
    scanCone.rotation.x = Math.PI / 2;
    scanCone.position.set(0, 0, 0.32);
    camGroup.add(scanCone);
    camGroup.userData.scanCone = scanCone;

    registerObject(camGroup, 2.0, -11.0, -11, 0.1, -0.3, 1.0);
  }

  // 6. AI Neural Network (Certifications Y = -18.5)
  function createAIModelNet() {
    const nnGroup = new THREE.Group();
    const layers = [3, 4, 3];
    const nodePositions = [];
    const nodeMeshes = [];
    const sGeo = new THREE.SphereGeometry(0.1, 8, 8);

    for (let l = 0; l < layers.length; l++) {
      const nodes = layers[l];
      const x = (l - 1) * 1.35;
      for (let n = 0; n < nodes; n++) {
        const y = (n - (nodes - 1) / 2) * 0.72;
        const pos = new THREE.Vector3(x, y, 0);
        nodePositions.push(pos);

        const node = createHybridMesh(sGeo, 0.7, 0.9);
        node.position.copy(pos);
        nnGroup.add(node);
        nodeMeshes.push(node);
      }
    }

    // Node interconnect segments
    let index = 0;
    for (let l = 0; l < layers.length - 1; l++) {
      const current = layers[l];
      const next = layers[l+1];
      const currStart = index;
      const nextStart = index + current;

      for (let i = 0; i < current; i++) {
        for (let j = 0; j < next; j++) {
          const p1 = nodePositions[currStart + i];
          const p2 = nodePositions[nextStart + j];
          const lineGeo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
          const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.14 }));
          nnGroup.add(line);
        }
      }
      index += current;
    }

    // Packet travelers
    const packets = [];
    for (let i = 0; i < 6; i++) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      nnGroup.add(p);

      const layerIdx = Math.floor(Math.random() * (layers.length - 1));
      const currStart = layerIdx === 0 ? 0 : layers[0];
      const nextStart = currStart + layers[layerIdx];
      const p1Idx = currStart + Math.floor(Math.random() * layers[layerIdx]);
      const p2Idx = nextStart + Math.floor(Math.random() * layers[layerIdx+1]);

      packets.push({
        mesh: p,
        p1: nodePositions[p1Idx],
        p2: nodePositions[p2Idx],
        progress: Math.random(),
        speed: 0.007 + Math.random() * 0.012
      });
    }

    nnGroup.userData.packets = packets;
    nnGroup.userData.nodePositions = nodePositions;
    nnGroup.userData.layers = layers;
    nnGroup.userData.nodeMeshes = nodeMeshes;

    registerObject(nnGroup, 2.2, -18.5, -11, 0.2, -0.3, 1.05);
  }

  // 7. Pose estimation skeletal sway (Certifications Y = -18.5)
  function createPoseSkeleton() {
    const poseGroup = new THREE.Group();
    const jointMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const jointGeo = new THREE.SphereGeometry(0.05, 6, 6);
    const boneMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 });

    const joints = [];
    for (let i = 0; i < 16; i++) {
      const mesh = new THREE.Mesh(jointGeo, jointMat);
      joints.push(mesh);
      poseGroup.add(mesh);
    }

    const connections = [
      [0, 1], [1, 2], [2, 3],
      [1, 4], [4, 5], [5, 6],
      [1, 7], [7, 8], [8, 9],
      [3, 10], [10, 11], [11, 12],
      [3, 13], [13, 14], [14, 15]
    ];

    const lines = [];
    connections.forEach(conn => {
      const lineGeo = new THREE.BufferGeometry();
      const line = new THREE.Line(lineGeo, boneMat);
      poseGroup.add(line);
      lines.push({ line, p1: conn[0], p2: conn[1] });
    });

    poseGroup.userData.poseJoints = joints;
    poseGroup.userData.poseLines = lines;

    registerObject(poseGroup, -2.2, -18.5, -11, 0, 0.3, 1.05);
  }

  // 8. Spatial UI panels with dynamic graphs (Projects Y = -26.5)
  function createSpatialUIPanels() {
    // Left UI Panel (Oscilloscope Wave)
    const uiLeft = new THREE.Group();
    const fGeo = new THREE.BoxGeometry(1.6, 1.2, 0.03);
    const panelFrame = createHybridMesh(fGeo, 0.45, 0.95);
    uiLeft.add(panelFrame);

    const wavePoints = [];
    const waveSegs = 32;
    for (let i = 0; i <= waveSegs; i++) {
      wavePoints.push(new THREE.Vector3((i/waveSegs)*1.4 - 0.7, 0, 0.02));
    }
    const waveGeo = new THREE.BufferGeometry().setFromPoints(wavePoints);
    const waveLine = new THREE.Line(waveGeo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 }));
    uiLeft.add(waveLine);
    uiLeft.userData.waveLine = waveLine;
    uiLeft.userData.wavePoints = wavePoints;

    registerObject(uiLeft, -2.0, -26.5, -11, -0.05, 0.2, 1.0);

    // Right UI Panel (Dynamic Bar Charts)
    const uiRight = new THREE.Group();
    const panelFrameRight = panelFrame.clone();
    uiRight.add(panelFrameRight);

    const bars = [];
    const barCount = 4;
    for (let i = 0; i < barCount; i++) {
      const barGeo = new THREE.BoxGeometry(0.12, 0.8, 0.03);
      const bar = createHybridMesh(barGeo, 0.6, 0.9);
      bar.position.set((i - (barCount-1)/2)*0.28, 0, 0.02);
      uiRight.add(bar);
      bars.push(bar);
    }
    uiRight.userData.bars = bars;

    registerObject(uiRight, 2.0, -26.5, -11, -0.05, -0.2, 1.0);
  }

  // 9. Data Fusion Pipeline (Projects Y = -26.5)
  function createDataFusionPipeline() {
    const pipeGroup = new THREE.Group();

    const p1 = new THREE.Vector3(-1.8, -0.8, 0);
    const p2 = new THREE.Vector3(0, 0.8, 0);
    const p3 = new THREE.Vector3(1.8, -0.8, 0);
    const points = [p1, p2, p3];

    const pipeGeo = new THREE.BufferGeometry().setFromPoints(points);
    pipeGroup.add(new THREE.Line(pipeGeo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.16 })));

    const nodeGeo = new THREE.SphereGeometry(0.1, 8, 8);
    points.forEach(p => {
      const m = createHybridMesh(nodeGeo, 0.6, 0.95);
      m.position.copy(p);
      pipeGroup.add(m);
    });

    const packet = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    pipeGroup.add(packet);

    pipeGroup.userData.packet = packet;
    pipeGroup.userData.points = points;
    pipeGroup.userData.progress = 0;

    registerObject(pipeGroup, 0, -26.5, -11, 0, 0, 1.0);
  }

  // Animation Loop
  let time = 0;
  function animate() {
    requestAnimationFrame(animate);

    if (document.hidden) return;

    time += 0.01;

    // 1. Update 3D Particle Dust Flow & Proximity Attraction
    animateParticleDust();

    // 2. Animate Background Procedural Assets
    objects.forEach(obj => {
      const uData = obj.userData;

      // Clean wavy drift
      obj.position.y = uData.baseY + Math.sin(time * uData.floatSpeed + uData.phase) * uData.floatAmp;

      // Base auto-spin
      obj.rotation.x = uData.baseRotX + Math.sin(time * 0.1) * 0.03;
      obj.rotation.y = uData.baseRotY + time * uData.rotSpeedY;

      // VISOR TELEMETRY RINGS
      if (uData.ring1) {
        uData.ring1.rotation.y += 0.01;
        uData.ring2.rotation.x -= 0.008;
      }

      // AR GLASSES SCANNING LINES
      if (uData.scanLines) {
        const lineOffset = Math.sin(time * 3.5) * 0.35;
        uData.scanLines.forEach(line => {
          line.position.y = lineOffset;
        });
      }

      // SKELETAL HAND GESTURE INTERPOLATIONS
      if (uData.jointMeshes) {
        animateHandGestures(obj);
      }

      // IMU RINGS
      if (uData.ring1 && !uData.ring2) {
        // IMU rings rotations
        uData.ring1.rotation.y += 0.02;
        uData.ring2.rotation.x -= 0.015;
        uData.ring3.rotation.z += 0.01;
      }

      // CV CAMERA RIG SCANDING CONE SWEEP
      if (uData.scanCone) {
        obj.rotation.y = uData.baseRotY + Math.sin(time * 1.5) * 0.35;
        uData.scanCone.material.opacity = 0.07 + Math.sin(time * 8.0) * 0.02;
      }

      // NEURAL NET DATA PACKETS
      if (uData.packets) {
        animateNeuralNet(obj);
      }

      // POSE EST. FIGURES SWAYS
      if (uData.poseJoints) {
        animatePoseSkeleton(obj);
      }

      // OSCILLOSCOPE PANEL GRAPHS
      if (uData.waveLine) {
        const line = uData.waveLine;
        const posAttr = line.geometry.attributes.position;
        const count = waveSegs = 32;
        for (let i = 0; i <= count; i++) {
          const x = posAttr.getX(i);
          const yVal = Math.sin(x * 3.0 + time * 6.0) * 0.28 * Math.cos(time * 0.5);
          posAttr.setY(i, yVal);
        }
        posAttr.needsUpdate = true;
      }

      // UI PANEL DYNAMIC BAR CHARTS
      if (uData.bars) {
        uData.bars.forEach((bar, idx) => {
          const clampVal = 0.4 + Math.sin(time * 3.0 + idx * 1.5) * 0.25 + Math.cos(time * 0.8) * 0.15;
          bar.scale.y = Math.max(0.1, clampVal);
          bar.position.y = bar.scale.y * 0.4 - 0.4;
        });
      }

      // DATA PIPELINE TRAVELER
      if (uData.packet && !uData.packets) {
        uData.progress += 0.01;
        if (uData.progress >= 2.0) uData.progress = 0;
        const pts = uData.points;
        const prog = uData.progress;
        if (prog < 1.0) {
          uData.packet.position.lerpVectors(pts[0], pts[1], prog);
        } else {
          uData.packet.position.lerpVectors(pts[1], pts[2], prog - 1.0);
        }
      }
    });

    // 3. Project Cursor to 3D Coordinates
    projectMouseTo3D();

    // 4. Connect Proximity Bezier Lines
    updateBezierProximity();

    // 5. Scroll-Tied Camera Position & Parallax interpolation
    if (camera) {
      const targetCamY = 2.5 - scrollPercent * 29.0;
      camera.position.x += (mouse.x * 2.2 - camera.position.x) * 0.05;
      camera.position.y += (targetCamY + mouse.y * 1.8 - camera.position.y) * 0.05;
      camera.lookAt(new THREE.Vector3(0, camera.position.y, -12.0));
    }

    renderer.render(scene, camera);
  }

  function animateParticleDust() {
    const pArray = floatingParticles.geometry.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
      let x = pArray[i * 3];
      let y = pArray[i * 3 + 1];
      let z = pArray[i * 3 + 2];

      y += pVelocities[i].y * 0.05;
      if (y > 20) y = -20;

      const pPos = new THREE.Vector3(x, y, z);
      const d = pPos.distanceTo(mouse3D);
      // Particle pull to cursor
      if (d < 4.5) {
        const pull = new THREE.Vector3().subVectors(mouse3D, pPos).normalize().multiplyScalar((4.5 - d) * 0.015);
        x += pull.x;
        y += pull.y;
      }

      pArray[i * 3] = x;
      pArray[i * 3 + 1] = y;
      pArray[i * 3 + 2] = z;
    }
    floatingParticles.geometry.attributes.position.needsUpdate = true;
  }

  function animateHandGestures(handObj) {
    const uData = handObj.userData;
    const jointMeshes = uData.jointMeshes;
    const boneLines = uData.boneLines;

    let gTime = time * 0.35;
    let poseIdx = Math.floor(gTime) % 3;
    let nextPoseIdx = (poseIdx + 1) % 3;
    let lerpVal = gTime % 1;
    let t = lerpVal * lerpVal * (3 - 2 * lerpVal);

    // Curl matrices for fingers: [Thumb, Index, Middle, Ring, Pinky]
    const curlMatrix = [
      [1.0, 1.0, 1.0, 1.0, 1.0], // Open Hand
      [0.2, 0.15, 0.15, 0.15, 0.15], // Fist / Pinch
      [0.2, 1.0, 0.15, 0.15, 0.15]  // Pointing
    ];

    const currentCurls = [];
    for (let f = 0; f < 5; f++) {
      const c1 = curlMatrix[poseIdx][f];
      const c2 = curlMatrix[nextPoseIdx][f];
      currentCurls.push(THREE.MathUtils.lerp(c1, c2, t));
    }

    const baseIndices = [1, 3, 5, 7, 9];
    const tipIndices = [2, 4, 6, 8, 10];

    // Recalculate morph coordinates
    const jointsCopy = handJointsData.map(j => j.clone());
    for (let f = 0; f < 5; f++) {
      const base = jointsCopy[baseIndices[f]];
      const tip = jointsCopy[tipIndices[f]];
      const offset = new THREE.Vector3().subVectors(tip, base).multiplyScalar(currentCurls[f]);
      tip.addVectors(base, offset);
      
      // Assign meshes positions
      jointMeshes[baseIndices[f] - 1].position.copy(base);
      jointMeshes[tipIndices[f] - 1].position.copy(tip);
      jointsCopy[tipIndices[f]] = tip;
    }

    // Refit bone lines
    boneLines.forEach(item => {
      const p1 = item.p1 === 0 ? handJointsData[0] : jointsCopy[item.p1];
      const p2 = jointsCopy[item.p2];
      item.line.geometry.setFromPoints([p1, p2]);
      item.line.geometry.attributes.position.needsUpdate = true;
    });
  }

  function animateNeuralNet(nnObj) {
    const uData = nnObj.userData;
    const isMouseNear = mouse3D.distanceTo(nnObj.position) < 4.0;
    
    uData.packets.forEach(packet => {
      // Speed multiplier if mouse is near
      const speedMult = isMouseNear ? 2.5 : 1.0;
      packet.progress += packet.speed * speedMult;
      
      if (packet.progress >= 1.0) {
        packet.progress = 0;
        const layers = uData.layers;
        const lIdx = Math.floor(Math.random() * (layers.length - 1));
        const currStart = lIdx === 0 ? 0 : layers[0];
        const nextStart = currStart + layers[lIdx];
        const p1Idx = currStart + Math.floor(Math.random() * layers[lIdx]);
        const p2Idx = nextStart + Math.floor(Math.random() * layers[lIdx + 1]);
        packet.p1 = uData.nodePositions[p1Idx];
        packet.p2 = uData.nodePositions[p2Idx];

        // Pulse scale of target node sphere
        const nodeMesh = uData.nodeMeshes[p2Idx];
        nodeMesh.scale.setScalar(1.4);
      }
      packet.mesh.position.lerpVectors(packet.p1, packet.p2, packet.progress);
    });

    // Node scale stabilization
    uData.nodeMeshes.forEach(node => {
      node.scale.setScalar(node.scale.x + (1.0 - node.scale.x) * 0.05);
    });
  }

  function animatePoseSkeleton(poseObj) {
    const uData = poseObj.userData;
    const joints = uData.poseJoints;
    const lines = uData.poseLines;
    const cycle = time * 2.2;

    joints[0].position.set(0, 1.15 + Math.sin(cycle * 2) * 0.04, 0);
    joints[1].position.set(0, 0.85, 0);
    joints[2].position.set(0, 0.38, 0);
    joints[3].position.set(0, 0.0, 0);

    joints[4].position.set(-0.38, 0.76, 0);
    joints[5].position.set(-0.62, 0.48 + Math.sin(cycle) * 0.12, Math.cos(cycle) * 0.22);
    joints[6].position.set(-0.76, 0.18 + Math.sin(cycle) * 0.18, Math.cos(cycle) * 0.28);

    joints[7].position.set(0.38, 0.76, 0);
    joints[8].position.set(0.62, 0.48 - Math.sin(cycle) * 0.12, -Math.cos(cycle) * 0.22);
    joints[9].position.set(0.82, 0.18 - Math.sin(cycle) * 0.18, -Math.cos(cycle) * 0.28);

    joints[10].position.set(-0.24, -0.05, 0);
    joints[11].position.set(-0.28, -0.48 + Math.cos(cycle) * 0.18, Math.sin(cycle) * 0.28);
    joints[12].position.set(-0.32, -0.95 + Math.cos(cycle) * 0.14, Math.sin(cycle) * 0.36);

    joints[13].position.set(0.24, -0.05, 0);
    joints[14].position.set(0.3, -0.48 - Math.cos(cycle) * 0.18, -Math.sin(cycle) * 0.28);
    joints[15].position.set(0.34, -0.95 - Math.cos(cycle) * 0.14, -Math.sin(cycle) * 0.36);

    lines.forEach(item => {
      item.line.geometry.setFromPoints([joints[item.p1].position, joints[item.p2].position]);
      item.line.geometry.attributes.position.needsUpdate = true;
    });
  }

  function projectMouseTo3D() {
    const temp = new THREE.Vector3(mouse.x, mouse.y, 0.5);
    temp.unproject(camera);
    const dir = temp.sub(camera.position).normalize();
    const distance = -camera.position.z / dir.z; 
    mouse3D.copy(camera.position).add(dir.multiplyScalar(distance));
  }

  function updateBezierProximity() {
    const distanceList = [];
    objects.forEach(obj => {
      const d = obj.position.distanceTo(mouse3D);
      distanceList.push({ obj, d });
    });
    distanceList.sort((a, b) => a.d - b.d);

    const isMouseActive = (mouse.x !== 0 || mouse.y !== 0);

    for (let i = 0; i < 3; i++) {
      const line = connectionLines[i];
      if (isMouseActive && i < distanceList.length && distanceList[i].d < 8.0) {
        const targetObj = distanceList[i].obj;
        const start = targetObj.position;
        const end = mouse3D;

        // Generate curved Bezier line
        const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        const dir = new THREE.Vector3().subVectors(end, start).normalize();
        const perp = new THREE.Vector3(-dir.y, dir.x, 0).normalize().multiplyScalar(0.8);
        const control = mid.add(perp);

        const curve = new THREE.QuadraticBezierCurve3(start, control, end);
        const pts = curve.getPoints(19);

        line.geometry.setFromPoints(pts);
        line.geometry.attributes.position.needsUpdate = true;
        line.visible = true;

        // Magnetic Attraction & Orienting tilt to cursor
        const dx = mouse3D.x - targetObj.position.x;
        const dy = mouse3D.y - targetObj.position.y;
        const targetRotX = dy * 0.08;
        const targetRotY = dx * 0.08;

        targetObj.rotation.x += (targetRotX - (targetObj.rotation.x - targetObj.userData.baseRotX)) * 0.05;
        targetObj.rotation.y += (targetRotY - (targetObj.rotation.y - targetObj.userData.baseRotY)) * 0.05;

        // Subtle position pull
        targetObj.position.x += (targetObj.userData.baseX + dx * 0.04 - targetObj.position.x) * 0.05;
        // Shift Z-depth slightly towards viewer (tactile depth response)
        const targetZ = targetObj.userData.baseZ + 0.5;
        targetObj.position.z += (targetZ - targetObj.position.z) * 0.05;

        // Proximity scaling
        const targetScale = targetObj.userData.baseScale * 1.15;
        targetObj.scale.setScalar(targetObj.scale.x + (targetScale - targetObj.scale.x) * 0.05);
      } else {
        line.visible = false;
        if (i < distanceList.length) {
          const targetObj = distanceList[i].obj;
          // Return to defaults
          targetObj.position.x += (targetObj.userData.baseX - targetObj.position.x) * 0.05;
          targetObj.position.z += (targetObj.userData.baseZ - targetObj.position.z) * 0.05;
          targetObj.scale.setScalar(targetObj.scale.x + (targetObj.userData.baseScale - targetObj.scale.x) * 0.05);
        }
      }
    }
  }

  // Handle window scrolls
  window.addEventListener('scroll', () => {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    scrollPercent = docHeight > 0 ? window.scrollY / docHeight : 0;
  });

  // Mouse vector events
  window.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  window.addEventListener('mouseleave', () => {
    mouse.x = 0;
    mouse.y = 0;
  });

  window.addEventListener('resize', () => {
    width = window.innerWidth;
    height = window.innerHeight;

    if (camera) {
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    if (renderer) {
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }
  });

  console.log("Three.js Background: Initializing...");
  initThree();
  console.log("Three.js Background: Scene initialized. Objects count:", objects.length);
  
  window.threeBgDebugFrameCount = 0;
  animate();
})(););

  window.addEventListener('resize', () => {
    width = window.innerWidth;
    height = window.innerHeight;

    if (camera) {
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    if (renderer) {
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }
  });

  console.log("Three.js Background: Initializing...");
  initThree();
  console.log("Three.js Background: Scene initialized. Objects count:", objects.length);
  
  window.threeBgDebugFrameCount = 0;
  animate();
})();

// ============================================
// 2. 3D HOVER PARALLAX TILT EFFECT
// ============================================
(function() {
  // Disable 3D tilt effects on touch devices for performance & layout stability
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return;

  const tiltCards = document.querySelectorAll('.project-card, .cert-card, .achievement-card');

  tiltCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transition = 'transform 0.1s ease-out, border-color 0.3s, box-shadow 0.3s';
    });

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left; // x coordinate inside element
      const y = e.clientY - rect.top;  // y coordinate inside element
      
      const xc = rect.width / 2;
      const yc = rect.height / 2;
      
      const dx = x - xc;
      const dy = y - yc;

      // Scale limits for standard rotation: max 8 degrees
      const tiltX = -(dy / yc) * 8;
      const tiltY = (dx / xc) * 8;

      card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`;

      // Apply inner parallax to children (e.g. image, description text)
      const innerElements = card.querySelectorAll('.project-image, .cert-image, .achievement-badge-icon');
      innerElements.forEach(el => {
        el.style.transform = 'translateZ(15px)';
        el.style.transition = 'transform 0.1s ease-out';
      });
    });

    card.addEventListener('mouseleave', () => {
      card.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s, box-shadow 0.3s';
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      
      const innerElements = card.querySelectorAll('.project-image, .cert-image, .achievement-badge-icon');
      innerElements.forEach(el => {
        el.style.transform = 'translateZ(0px)';
        el.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
      });
    });
  });
})();


// ============================================
// 3. DYNAMIC DETAILS MODAL SYSTEM
// ============================================
(function() {
  const modal = document.getElementById('spatial-modal');
  const modalClose = document.getElementById('modal-close');
  const modalContentContainer = document.getElementById('modal-content-container');

  if (!modal || !modalClose || !modalContentContainer) return;

  function openModal(data) {
    let techHtml = '';
    if (data.tech) {
      const techList = data.tech.split(',').map(t => t.trim());
      techHtml = `
        <div class="modal-detail-tech-container">
          <h4>Technologies</h4>
          <div class="project-tech">
            ${techList.map(t => `<span class="tech-badge">${t}</span>`).join('')}
          </div>
        </div>
      `;
    }

    let actionButtons = '';
    if (data.type === 'project') {
      const demoBtn = data.demo 
        ? `<a href="${data.demo}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">Launch Live Demo</a>` 
        : '';
      actionButtons = `
        <div class="modal-actions">
          ${demoBtn}
          <a href="${data.github}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">Source Code</a>
        </div>
      `;
    } else if (data.type === 'cert') {
      const certLink = data.link && data.link !== '#' 
        ? `<a href="${data.link}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">Decrypt Certificate (PDF)</a>`
        : `<span class="btn btn-secondary" style="pointer-events:none; opacity:0.6;">Local Copy Only</span>`;
      actionButtons = `
        <div class="modal-actions">
          ${certLink}
        </div>
      `;
    }

    modalContentContainer.innerHTML = `
      ${data.image ? `<img src="${data.image}" alt="${data.title}" class="modal-detail-img" />` : ''}
      <span class="modal-detail-label">${data.type === 'project' ? 'Project Details' : 'Verification Document'}</span>
      <h3 class="modal-detail-title">${data.title}</h3>
      <p class="modal-detail-issuer">${data.issuer || ''} ${data.status ? `• ${data.status}` : ''}</p>
      <p class="modal-detail-desc">${data.details || data.description}</p>
      ${techHtml}
      ${actionButtons}
    `;

    modal.removeAttribute('hidden');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    modalClose.focus();
  }

  function closeModal() {
    modal.setAttribute('hidden', '');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // Hook details triggers
  document.querySelectorAll('.btn-detail-trigger').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = trigger.closest('.project-card, .cert-card');
      if (card) {
        openModal(card.dataset);
      }
    });
  });

  // Also support clicking the card itself to open
  document.querySelectorAll('.project-card, .cert-card').forEach(card => {
    card.addEventListener('click', (e) => {
      // Avoid firing if they clicked an anchor direct link
      if (e.target.tagName.toLowerCase() === 'a') return;
      openModal(card.dataset);
    });
    card.style.cursor = 'pointer';
  });

  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hasAttribute('hidden')) {
      closeModal();
    }
  });
})();

// ============================================
// 4. NAVIGATION SYSTEM & CAMERA SCROLL
// ============================================
(function() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');
  const menuToggle = document.getElementById('menu-toggle');
  const navMenu = document.getElementById('nav-menu');

  // Mobile menu toggle
  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
      const isOpen = navMenu.classList.contains('active');
      navMenu.classList.toggle('active');
      menuToggle.setAttribute('aria-expanded', !isOpen);
    });

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Smooth camera scroll transitions and capsule navigation indicator
  let isScrollingClick = false;

  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (!href || href === '#' || !href.startsWith('#')) return;

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        isScrollingClick = true;
        
        navLinks.forEach(l => l.classList.remove('active-dock'));
        this.classList.add('active-dock');

        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        setTimeout(() => {
          isScrollingClick = false;
        }, 1000);
      }
    });
  });

  // Track scroll position to update active navbar items
  const observerOptions = {
    root: null,
    threshold: 0.2,
    rootMargin: '-10% 0px -60% 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    if (isScrollingClick) return;

    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active-dock');
          } else {
            link.classList.remove('active-dock');
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach(section => observer.observe(section));

  // Back to top button logic
  const backToTop = document.getElementById('back-to-top');
  if (backToTop) {
    window.addEventListener('scroll', throttle(() => {
      if (window.pageYOffset > 500) {
        backToTop.removeAttribute('hidden');
      } else {
        backToTop.setAttribute('hidden', '');
      }
    }, 100));

    backToTop.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
})();

// ============================================
// 5. HOLOGRAPHIC 3D SKILLS ORBIT SYSTEM
// ============================================
(function() {
  const canvas = document.getElementById('skills-orbit-canvas');
  const viewport = document.getElementById('skills-orbit-viewport');
  const titleEl = document.querySelector('.orbit-center-node .node-title');
  const descEl = document.querySelector('.orbit-center-node .node-desc');
  const skillTags = document.querySelectorAll('.skills-list-panel .skill-tag[data-skill]');

  if (!canvas || !viewport) return;

  let width = viewport.clientWidth;
  let height = viewport.clientHeight;

  // 1. Initialize Three.js Scene for Skills Orbit
  const scene = new THREE.Scene();
  
  // Camera tilted slightly downward to show 3D depth of orbits
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(0, 4.0, 9.5);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // 2. Lighting for 3D elements
  const ambient = new THREE.AmbientLight(0xffffff, 0.45);
  scene.add(ambient);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.95);
  dirLight.position.set(2, 6, 4);
  scene.add(dirLight);

  // 3. Central Core Node
  const coreGroup = new THREE.Group();
  const coreSolid = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.55, 2),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.9 })
  );
  const coreWire = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.55, 2)),
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 })
  );
  coreGroup.add(coreSolid, coreWire);
  scene.add(coreGroup);

  // 4. Concentric 3D Orbit Rings
  const orbitRadii = [2.2, 3.4, 4.6];
  const orbitGroup = new THREE.Group();
  scene.add(orbitGroup);

  orbitRadii.forEach((r) => {
    const points = [];
    const segments = 64;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(theta) * r, 0, Math.sin(theta) * r));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.08
    });
    const line = new THREE.Line(geo, mat);
    orbitGroup.add(line);
  });

  // 5. Custom Mesh Builders for Skill Nodes
  function createUnityMesh() {
    const group = new THREE.Group();
    const geom = new THREE.BoxGeometry(0.35, 0.35, 0.35);
    const solid = new THREE.Mesh(geom, new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.9 }));
    const wire = new THREE.LineSegments(new THREE.EdgesGeometry(geom), new THREE.LineBasicMaterial({ color: 0xffffff }));
    const outerGeom = new THREE.BoxGeometry(0.55, 0.55, 0.55);
    const outerWire = new THREE.LineSegments(new THREE.EdgesGeometry(outerGeom), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.28 }));
    group.add(solid, wire, outerWire);
    return group;
  }

  function createCVMesh() {
    const group = new THREE.Group();
    const bodyGeom = new THREE.BoxGeometry(0.2, 0.2, 0.3);
    const body = new THREE.Mesh(bodyGeom, new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.9 }));
    const bodyWire = new THREE.LineSegments(new THREE.EdgesGeometry(bodyGeom), new THREE.LineBasicMaterial({ color: 0xffffff }));
    group.add(body, bodyWire);
    
    const fPts = [
      new THREE.Vector3(0, 0, 0.15), new THREE.Vector3(-0.35, -0.35, 0.95),
      new THREE.Vector3(0, 0, 0.15), new THREE.Vector3(0.35, -0.35, 0.95),
      new THREE.Vector3(0, 0, 0.15), new THREE.Vector3(0.35, 0.35, 0.95),
      new THREE.Vector3(0, 0, 0.15), new THREE.Vector3(-0.35, 0.35, 0.95),
      new THREE.Vector3(-0.35, -0.35, 0.95), new THREE.Vector3(0.35, -0.35, 0.95),
      new THREE.Vector3(0.35, -0.35, 0.95), new THREE.Vector3(0.35, 0.35, 0.95),
      new THREE.Vector3(0.35, 0.35, 0.95), new THREE.Vector3(-0.35, 0.35, 0.95),
      new THREE.Vector3(-0.35, 0.35, 0.95), new THREE.Vector3(-0.35, -0.35, 0.95)
    ];
    const fGeo = new THREE.BufferGeometry().setFromPoints(fPts);
    const fWire = new THREE.LineSegments(fGeo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 }));
    group.add(fWire);

    const scanGeo = new THREE.PlaneGeometry(0.5, 0.5);
    const scan = new THREE.Mesh(scanGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.28 }));
    scan.position.z = 0.5;
    group.add(scan);
    group.userData.scanPlane = scan;
    return group;
  }

  function createPythonMesh() {
    const group = new THREE.Group();
    const pts = [
      new THREE.Vector3(0, 0.28, 0),
      new THREE.Vector3(-0.22, -0.12, -0.08),
      new THREE.Vector3(0.22, -0.12, 0.08),
      new THREE.Vector3(-0.08, 0.08, 0.22),
      new THREE.Vector3(0.08, -0.18, -0.18)
    ];
    const sGeom = new THREE.SphereGeometry(0.05, 6, 6);
    pts.forEach(p => {
      const sp = new THREE.Mesh(sGeom, new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.9 }));
      sp.position.copy(p);
      const wire = new THREE.LineSegments(new THREE.EdgesGeometry(sGeom), new THREE.LineBasicMaterial({ color: 0xffffff }));
      wire.position.copy(p);
      group.add(sp, wire);
    });

    const links = [[0,1], [0,2], [1,2], [1,3], [2,3], [2,4], [3,4]];
    links.forEach(pair => {
      const lineGeo = new THREE.BufferGeometry().setFromPoints([pts[pair[0]], pts[pair[1]]]);
      const l = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 }));
      group.add(l);
    });

    const packet = new THREE.Mesh(new THREE.SphereGeometry(0.03, 4, 4), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    group.add(packet);
    group.userData.packet = packet;
    group.userData.pts = pts;
    group.userData.progress = 0;
    group.userData.pair = [0, 1];
    return group;
  }

  function createSensorFusionMesh() {
    const group = new THREE.Group();
    const sGeom = new THREE.SphereGeometry(0.12, 8, 8);
    const core = new THREE.Mesh(sGeom, new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.9 }));
    const coreEdge = new THREE.LineSegments(new THREE.EdgesGeometry(sGeom), new THREE.LineBasicMaterial({ color: 0xffffff }));
    group.add(core, coreEdge);

    const r1 = new THREE.Line(new THREE.BufferGeometry().setFromPoints(
      Array.from({length: 33}, (_, i) => new THREE.Vector3(Math.cos(i/32*Math.PI*2)*0.4, 0, Math.sin(i/32*Math.PI*2)*0.4))
    ), new THREE.LineBasicMaterial({ color: 0xffffff }));
    const r2 = new THREE.Line(new THREE.BufferGeometry().setFromPoints(
      Array.from({length: 33}, (_, i) => new THREE.Vector3(0, Math.cos(i/32*Math.PI*2)*0.35, Math.sin(i/32*Math.PI*2)*0.35))
    ), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 }));
    const r3 = new THREE.Line(new THREE.BufferGeometry().setFromPoints(
      Array.from({length: 33}, (_, i) => new THREE.Vector3(Math.cos(i/32*Math.PI*2)*0.45, Math.sin(i/32*Math.PI*2)*0.45, 0))
    ), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 }));

    group.add(r1, r2, r3);
    group.userData.r1 = r1;
    group.userData.r2 = r2;
    group.userData.r3 = r3;
    return group;
  }

  function createXRToolkitMesh() {
    const group = new THREE.Group();
    const cylGeom = new THREE.CylinderGeometry(0.05, 0.035, 0.32, 6);
    const ctrl = new THREE.Mesh(cylGeom, new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.9 }));
    const ctrlWire = new THREE.LineSegments(new THREE.EdgesGeometry(cylGeom), new THREE.LineBasicMaterial({ color: 0xffffff }));
    ctrl.rotation.x = Math.PI / 4;
    ctrlWire.rotation.x = Math.PI / 4;
    group.add(ctrl, ctrlWire);

    const beamPts = [new THREE.Vector3(0, 0.08, -0.08), new THREE.Vector3(0, 0.75, -0.75)];
    const beamGeo = new THREE.BufferGeometry().setFromPoints(beamPts);
    const beam = new THREE.Line(beamGeo, new THREE.LineBasicMaterial({ color: 0xffffff }));
    group.add(beam);
    group.userData.beam = beam;
    return group;
  }

  function createArduinoMesh() {
    const group = new THREE.Group();
    const boardGeom = new THREE.BoxGeometry(0.46, 0.03, 0.32);
    const board = new THREE.Mesh(boardGeom, new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.9 }));
    const boardWire = new THREE.LineSegments(new THREE.EdgesGeometry(boardGeom), new THREE.LineBasicMaterial({ color: 0xffffff }));
    group.add(board, boardWire);

    const chipGeom = new THREE.BoxGeometry(0.13, 0.07, 0.13);
    const chip = new THREE.Mesh(chipGeom, new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.9 }));
    const chipWire = new THREE.LineSegments(new THREE.EdgesGeometry(chipGeom), new THREE.LineBasicMaterial({ color: 0xffffff }));
    chip.position.set(-0.09, 0.03, 0);
    chipWire.position.set(-0.09, 0.03, 0);
    group.add(chip, chipWire);

    const chip2Geom = new THREE.BoxGeometry(0.07, 0.05, 0.07);
    const chip2 = new THREE.Mesh(chip2Geom, new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.9 }));
    const chip2Wire = new THREE.LineSegments(new THREE.EdgesGeometry(chip2Geom), new THREE.LineBasicMaterial({ color: 0xffffff }));
    chip2.position.set(0.1, 0.02, -0.06);
    chip2Wire.position.set(0.1, 0.02, -0.06);
    group.add(chip2, chip2Wire);
    return group;
  }

  function createOpenCVMesh() {
    const group = new THREE.Group();
    const gridGeo = new THREE.PlaneGeometry(0.5, 0.5, 5, 5);
    const gridWire = new THREE.LineSegments(new THREE.EdgesGeometry(gridGeo), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 }));
    gridWire.rotation.x = -Math.PI / 3;
    group.add(gridWire);
    group.userData.gridGeo = gridGeo;
    group.userData.gridWire = gridWire;
    return group;
  }

  function createMediaPipeMesh() {
    const group = new THREE.Group();
    const pts = [
      new THREE.Vector3(0, -0.25, 0),
      new THREE.Vector3(-0.13, -0.08, 0.04),
      new THREE.Vector3(-0.22, 0.04, 0.06),
      new THREE.Vector3(-0.07, 0.08, 0),
      new THREE.Vector3(-0.09, 0.25, -0.02),
      new THREE.Vector3(0, 0.1, -0.02),
      new THREE.Vector3(0, 0.3, -0.04),
      new THREE.Vector3(0.07, 0.07, -0.01),
      new THREE.Vector3(0.08, 0.24, -0.03),
      new THREE.Vector3(0.14, 0.02, 0.02),
      new THREE.Vector3(0.17, 0.17, 0.01)
    ];
    const sGeom = new THREE.SphereGeometry(0.03, 4, 4);
    pts.forEach(p => {
      const mark = new THREE.Mesh(sGeom, new THREE.MeshBasicMaterial({ color: 0xffffff }));
      mark.position.copy(p);
      group.add(mark);
    });

    const conns = [[0,1], [1,2], [0,3], [3,4], [0,5], [5,6], [0,7], [7,8], [0,9], [9,10]];
    conns.forEach(pair => {
      const lineGeo = new THREE.BufferGeometry().setFromPoints([pts[pair[0]], pts[pair[1]]]);
      const l = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 }));
      group.add(l);
    });
    return group;
  }

  // 6. Skill Nodes Registration Data
  const skillNodes = [
    { id: 'csharp', label: 'C#', orbit: 0, speed: 0.004, angle: 0, desc: 'Object-oriented scripting in Unity', mesh: createUnityMesh() },
    { id: 'python', label: 'Python', orbit: 0, speed: -0.005, angle: Math.PI, desc: 'Core AI, OpenCV and MediaPipe scripting', mesh: createPythonMesh() },
    { id: 'unity', label: 'Unity Engine', orbit: 1, speed: 0.003, angle: Math.PI / 4, desc: '3D game engine and XR scene editor', mesh: createUnityMesh() },
    { id: 'computervision', label: 'CV (OpenCV)', orbit: 1, speed: -0.003, angle: (3 * Math.PI) / 4, desc: 'MediaPipe hand tracking & OpenCV frame analysis', mesh: createCVMesh() },
    { id: 'arduino', label: 'Arduino / IoT', orbit: 1, speed: 0.002, angle: (5 * Math.PI) / 4, desc: 'Microcontroller code & sensor polling', mesh: createArduinoMesh() },
    { id: 'xrtoolkit', label: 'XR Toolkit', orbit: 2, speed: 0.0015, angle: Math.PI / 3, desc: 'Locomotion & spatial rays interaction framework', mesh: createXRToolkitMesh() },
    { id: 'sensorfusion', label: 'Sensor Fusion', orbit: 2, speed: -0.0015, angle: Math.PI, desc: 'IMU data polling & angular state math', mesh: createSensorFusionMesh() },
    { id: 'ai-design', label: 'AI Interaction', orbit: 2, speed: 0.002, angle: (7 * Math.PI) / 6, desc: 'AI gesture mapping and custom input filters', mesh: createOpenCVMesh() }
  ];

  // Add all meshes to the scene and register their orbits
  skillNodes.forEach(node => {
    node.group = new THREE.Group();
    node.group.add(node.mesh);
    node.mesh.userData = { skillId: node.id };
    node.mesh.traverse(child => {
      child.userData = { skillId: node.id };
    });
    scene.add(node.group);
  });

  // 7. Dynamic Data Connection Lines
  const connectionGroup = new THREE.Group();
  scene.add(connectionGroup);
  let activeNodeId = null;

  // 8. Generate Floating HTML Labels
  const labelsContainer = document.createElement('div');
  labelsContainer.style.position = 'absolute';
  labelsContainer.style.top = '0';
  labelsContainer.style.left = '0';
  labelsContainer.style.width = '100%';
  labelsContainer.style.height = '100%';
  labelsContainer.style.pointerEvents = 'none';
  labelsContainer.style.zIndex = '5';
  viewport.appendChild(labelsContainer);

  const labelElements = {};
  skillNodes.forEach(node => {
    const el = document.createElement('span');
    el.className = 'orbit-floating-label';
    el.textContent = node.label;
    labelsContainer.appendChild(el);
    labelElements[node.id] = el;
  });

  // 9. Input Tracking
  let mouse = { x: -999, y: -999 };
  let raycaster = new THREE.Raycaster();
  let hoverTargetId = null;

  function updatePositions() {
    skillNodes.forEach(node => {
      if (activeNodeId !== node.id) {
        node.angle += node.speed;
      }
      
      const r = orbitRadii[node.orbit];
      const targetX = Math.cos(node.angle) * r;
      const targetZ = Math.sin(node.angle) * r;
      const targetY = Math.sin(node.angle * 2.0) * 0.15;
      
      node.group.position.set(targetX, targetY, targetZ);

      node.mesh.rotation.y += 0.012;
      node.mesh.rotation.x += 0.005;

      if (node.mesh.userData.scanPlane) {
        const scan = node.mesh.userData.scanPlane;
        scan.position.z += 0.008;
        if (scan.position.z > 0.95) scan.position.z = 0.15;
      }
      if (node.mesh.userData.packet) {
        const uData = node.mesh.userData;
        uData.progress += 0.015;
        if (uData.progress >= 1.0) {
          uData.progress = 0;
          const currPairIdx = Math.floor(Math.random() * uData.pts.length);
          let nextPairIdx = Math.floor(Math.random() * uData.pts.length);
          while (nextPairIdx === currPairIdx) {
            nextPairIdx = Math.floor(Math.random() * uData.pts.length);
          }
          uData.pair = [currPairIdx, nextPairIdx];
        }
        uData.packet.position.lerpVectors(uData.pts[uData.pair[0]], uData.pts[uData.pair[1]], uData.progress);
      }
      if (node.mesh.userData.r1) {
        node.mesh.userData.r1.rotation.y += 0.02;
        node.mesh.userData.r2.rotation.x -= 0.015;
        node.mesh.userData.r3.rotation.z += 0.01;
      }
      if (node.mesh.userData.beam) {
        const scale = 0.85 + Math.sin(Date.now() * 0.01) * 0.15;
        node.mesh.userData.beam.scale.set(1, scale, scale);
      }
      if (node.mesh.userData.gridWire) {
        node.mesh.userData.gridWire.rotation.z += 0.005;
      }
    });

    coreGroup.rotation.y += 0.005;
    coreGroup.rotation.x += 0.003;
  }

  function drawConnections() {
    while (connectionGroup.children.length > 0) {
      const obj = connectionGroup.children[0];
      connectionGroup.remove(obj);
    }

    if (activeNodeId) {
      const activeNode = skillNodes.find(n => n.id === activeNodeId);
      if (activeNode) {
        const pts = [new THREE.Vector3(0, 0, 0), activeNode.group.position];
        const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
        const lineMat = new THREE.LineDashedMaterial({
          color: 0xffffff,
          dashSize: 0.15,
          gapSize: 0.1,
          transparent: true,
          opacity: 0.5
        });
        const line = new THREE.Line(lineGeo, lineMat);
        line.computeLineDistances();
        connectionGroup.add(line);
      }
    }
  }

  function updateLabels() {
    const tempV = new THREE.Vector3();
    skillNodes.forEach(node => {
      node.group.getWorldPosition(tempV);
      tempV.project(camera);

      if (tempV.z > 1) {
        labelElements[node.id].style.opacity = '0';
        return;
      }

      const x = (tempV.x * 0.5 + 0.5) * width;
      const y = (-(tempV.y * 0.5) + 0.5) * height;

      const el = labelElements[node.id];
      el.style.transform = `translate(-50%, -100%) translate(${x}px, ${y - 12}px)`;

      const isActive = node.id === activeNodeId;
      if (isActive) {
        el.className = 'orbit-floating-label active';
        el.style.opacity = '1';
      } else {
        el.className = 'orbit-floating-label';
        el.style.opacity = activeNodeId ? '0.25' : '0.75';
      }
    });
  }

  function checkHover() {
    if (mouse.x === -999 && mouse.y === -999) return;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    let foundId = null;
    for (let i = 0; i < intersects.length; i++) {
      let targetObj = intersects[i].object;
      while (targetObj && targetObj !== scene) {
        if (targetObj.userData && targetObj.userData.skillId) {
          foundId = targetObj.userData.skillId;
          break;
        }
        targetObj = targetObj.parent;
      }
      if (foundId) break;
    }

    if (foundId) {
      if (hoverTargetId !== foundId) {
        hoverTargetId = foundId;
        const node = skillNodes.find(n => n.id === foundId);
        if (node) {
          setActiveSkill(foundId, node.label, node.desc);
        }
      }
    } else {
      hoverTargetId = null;
      const sidebarHovered = document.querySelector('.skills-list-panel .skill-tag.active-node');
      if (!sidebarHovered) {
        resetActiveSkill();
      }
    }
  }

  function setActiveSkill(id, label, desc) {
    if (activeNodeId === id) return;
    activeNodeId = id;

    titleEl.textContent = label;
    descEl.textContent = desc;

    skillTags.forEach(tag => {
      if (tag.dataset.skill === id) {
        tag.classList.add('active-node');
      } else {
        tag.classList.remove('active-node');
      }
    });

    skillNodes.forEach(node => {
      const targetScale = node.id === id ? 1.45 : 1.0;
      node.group.scale.set(targetScale, targetScale, targetScale);
    });
  }

  function resetActiveSkill() {
    if (activeNodeId === null) return;
    activeNodeId = null;
    titleEl.textContent = 'XR Core';
    descEl.textContent = 'Hover a Skill';
    skillTags.forEach(tag => tag.classList.remove('active-node'));

    skillNodes.forEach(node => {
      node.group.scale.set(1.0, 1.0, 1.0);
    });
  }

  function draw() {
    requestAnimationFrame(draw);
    
    if (document.hidden) return;

    updatePositions();
    checkHover();
    drawConnections();
    updateLabels();

    renderer.render(scene, camera);
  }

  viewport.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  });

  viewport.addEventListener('mouseleave', () => {
    mouse.x = -999;
    mouse.y = -999;
  });

  skillTags.forEach(tag => {
    tag.addEventListener('mouseenter', () => {
      const skillId = tag.dataset.skill;
      const node = skillNodes.find(n => n.id === skillId);
      if (node) {
        setActiveSkill(skillId, node.label, node.desc);
      }
    });

    tag.addEventListener('mouseleave', () => {
      resetActiveSkill();
    });
  });

  window.addEventListener('resize', () => {
    width = canvas.width = viewport.clientWidth;
    height = canvas.height = viewport.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  });

  draw();
})();
