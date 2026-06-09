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

  // Layered scene groups for background / mid / foreground separation
  let backgroundLayer, midLayer, foregroundLayer;
  let depthPlanes = [];
  let telemetryOrbits = [];
  let cameraNodes = [];
  let imuNodes = [];
  let dataStreamLines = [];

  // Connection Probe lines
  let probeLines;

  // Particle Ripple System
  let rippleParticles;
  let particlesVelocities = [];
  let particlesAges = [];
  let particlesLifes = [];
  let nextParticleIdx = 0;
  const particleCount = isMobile ? 35 : 120;

  function initThree() {
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.02);

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

    // Strict Black & White Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.85);
    dirLight.position.set(5, 12, 10);
    scene.add(dirLight);

    // 1. Subtle Grid Floor (Monochrome)
    gridFloor = new THREE.GridHelper(120, 90, 0xffffff, 0xffffff);
    gridFloor.position.y = -6.5;
    gridFloor.material.transparent = true;
    gridFloor.material.opacity = 0.07;
    scene.add(gridFloor);

    // 2. Setup Cursor Probe Connection Lines
    const probeLinesGeo = new THREE.BufferGeometry();
    const probeLinesPositions = new Float32Array(3 * 2 * 3); // 3 connections * 2 points * 3 coordinates
    probeLinesGeo.setAttribute('position', new THREE.BufferAttribute(probeLinesPositions, 3));
    probeLines = new THREE.LineSegments(probeLinesGeo, new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending
    }));
    scene.add(probeLines);

    // Create layered scene groups
    backgroundLayer = new THREE.Group();
    midLayer = new THREE.Group();
    foregroundLayer = new THREE.Group();
    backgroundLayer.renderOrder = 0;
    midLayer.renderOrder = 1;
    foregroundLayer.renderOrder = 2;
    scene.add(backgroundLayer, midLayer, foregroundLayer);

    // 3. Setup Cursor Particle Field Ripple
    createRippleParticles();

    // 4. Generate Procedural 3D Objects
    createDepthMapPlanes();
    createCameraNodes();
    createIMUSensorCluster();
    createSensorGraph();
    createTelemetryOrbit();
    createDataStreams();

    createVRHeadset();
    createARGlasses();
    createHoloHand();
    createControllerModule();
    createCameraCube();
    // On mobile devices, reduce scene complexity for performance
    if (!isMobile) {
      createFaceModel();
      createPoseSkeleton();
      createBoundingBoxes();

      createNeuralNet();
      createWaveformModule();
      createBarCharts();
      createRadialDashboard();
      createDataFusionPipeline();
    } else {
      // lightweight placeholders for mobile
      // small neural node cluster
      const mobileCluster = new THREE.Group();
      const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      for (let i = 0; i < 5; i++) {
        const s = new THREE.Mesh(new THREE.SphereGeometry(0.06, 5, 5), mat);
        s.position.set((i - 2) * 0.18, Math.sin(i) * 0.12, (Math.random() - 0.5) * 0.2);
        mobileCluster.add(s);
      }
      registerObject(mobileCluster, 2.2, 1.2, -11, 0.08, -0.12, 0.95);
    }
  }

  // Create Axis Marker to float around models
  function createAxesMarker(x, y, z) {
    const markerGroup = new THREE.Group();
    markerGroup.position.set(x, y, z);
    const length = 0.55;
    const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2 });

    const xGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(length, 0, 0)]);
    markerGroup.add(new THREE.Line(xGeo, lineMat));

    const yGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, length, 0)]);
    markerGroup.add(new THREE.Line(yGeo, lineMat));

    const zGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, length)]);
    markerGroup.add(new THREE.Line(zGeo, lineMat));

    return markerGroup;
  }

  // Particle Emitter System
  function createRippleParticles() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = -999;
      particlesVelocities.push(new THREE.Vector3());
      particlesAges.push(0);
      particlesLifes.push(0);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.065,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });

    rippleParticles = new THREE.Points(geometry, material);
    scene.add(rippleParticles);
  }

  function emitParticle(x, y, z) {
    const idx = nextParticleIdx;
    const pos = rippleParticles.geometry.attributes.position.array;
    pos[idx * 3] = x;
    pos[idx * 3 + 1] = y;
    pos[idx * 3 + 2] = z;

    particlesVelocities[idx].set(
      (Math.random() - 0.5) * 1.6,
      (Math.random() - 0.5) * 1.6,
      (Math.random() - 0.5) * 1.6
    );
    particlesAges[idx] = 0;
    particlesLifes[idx] = 0.4 + Math.random() * 0.5;

    nextParticleIdx = (nextParticleIdx + 1) % particleCount;
    rippleParticles.geometry.attributes.position.needsUpdate = true;
  }

  function registerObject(group, baseX, baseY, baseZ, rotX, rotY, scale, parent = scene) {
    group.position.set(baseX, baseY, baseZ);
    group.scale.setScalar(scale);

    group.userData = {
      baseX: baseX,
      baseY: baseY,
      baseRotX: rotX,
      baseRotY: rotY,
      baseScale: scale,
      floatSpeed: 0.25 + Math.random() * 0.25,
      floatAmp: 0.35 + Math.random() * 0.2,
      phase: Math.random() * Math.PI * 2,
      rotSpeedX: 0.001 + Math.random() * 0.0015,
      rotSpeedY: 0.002 + Math.random() * 0.002
    };

    parent.add(group);
    objects.push(group);
  }

  // 1. VR Headset (Procedural)
  function createVRHeadset() {
    const vrGroup = new THREE.Group();

    const visorGeo = new THREE.BoxGeometry(2.0, 1.1, 1.1);
    const visorMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.75 });
    const wireMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.35 });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.add(new THREE.Mesh(visorGeo, wireMat));
    vrGroup.add(visor);

    // Front sensor dots
    const sensorGeo = new THREE.SphereGeometry(0.045, 6, 6);
    const sensorMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const positions = [
      [-0.75, -0.35, 0.56], [0.75, -0.35, 0.56],
      [-0.75, 0.35, 0.56], [0.75, 0.35, 0.56]
    ];
    positions.forEach(pos => {
      const sensor = new THREE.Mesh(sensorGeo, sensorMat);
      sensor.position.set(pos[0], pos[1], pos[2]);
      vrGroup.add(sensor);
    });

    const strapGeo = new THREE.TorusGeometry(0.85, 0.04, 6, 28, Math.PI * 1.4);
    const strap = new THREE.Mesh(strapGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.2 }));
    strap.rotation.y = Math.PI / 2;
    strap.position.z = -0.35;
    vrGroup.add(strap);

    registerObject(vrGroup, -7.5, 2.3, -11, 0.2, -0.35, 0.95);
  }

  // 2. AR Glasses (Procedural)
  function createARGlasses() {
    const arGroup = new THREE.Group();

    const frameMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.35 });
    const glassMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.75 });
    const lensWire = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.15 });

    const lensGeo = new THREE.TorusGeometry(0.55, 0.05, 6, 24);
    const cylinderLensGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.04, 16);
    cylinderLensGeo.rotation.x = Math.PI / 2;

    const leftLens = new THREE.Mesh(lensGeo, frameMat);
    leftLens.position.x = -0.62;
    const lGlass = new THREE.Mesh(cylinderLensGeo, glassMat);
    lGlass.add(new THREE.Mesh(cylinderLensGeo, lensWire));
    leftLens.add(lGlass);
    arGroup.add(leftLens);

    const rightLens = new THREE.Mesh(lensGeo, frameMat);
    rightLens.position.x = 0.62;
    const rGlass = new THREE.Mesh(cylinderLensGeo, glassMat);
    rGlass.add(new THREE.Mesh(cylinderLensGeo, lensWire));
    rightLens.add(rGlass);
    arGroup.add(rightLens);

    const bridgeGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.28, 6);
    bridgeGeo.rotation.z = Math.PI / 2;
    const bridge = new THREE.Mesh(bridgeGeo, frameMat);
    bridge.position.y = 0.12;
    arGroup.add(bridge);

    const templeGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.25, 6);
    templeGeo.rotation.x = Math.PI / 2;

    const lTemple = new THREE.Mesh(templeGeo, frameMat);
    lTemple.position.set(-1.12, 0.08, -0.62);
    lTemple.rotation.y = -Math.PI / 20;
    arGroup.add(lTemple);

    const rTemple = new THREE.Mesh(templeGeo, frameMat);
    rTemple.position.set(1.12, 0.08, -0.62);
    rTemple.rotation.y = Math.PI / 20;
    arGroup.add(rTemple);

    registerObject(arGroup, 7.2, -3.2, -8.5, -0.15, 0.45, 1.05);
  }

  // 3. Hand Tracking Skeleton (Procedural)
  function createHoloHand() {
    const handGroup = new THREE.Group();

    const jointGeo = new THREE.SphereGeometry(0.05, 8, 8);
    const jointMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
    const boneMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 });

    const palm = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), jointMat);
    palm.position.set(0, 0, 0);
    handGroup.add(palm);

    const wrist = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), jointMat);
    wrist.position.set(0, -0.75, 0.1);
    handGroup.add(wrist);

    const wristPalmLine = new THREE.BufferGeometry().setFromPoints([wrist.position, palm.position]);
    handGroup.add(new THREE.Line(wristPalmLine, boneMat));

    const fingerConfigs = [
      { angle: -Math.PI / 6.2, length: 0.72, offset: -0.28 },
      { angle: -Math.PI / 18, length: 0.88, offset: -0.1 },
      { angle: Math.PI / 18, length: 0.92, offset: 0.1 },
      { angle: Math.PI / 6.2, length: 0.82, offset: 0.28 },
      { angle: Math.PI / 3.4, length: 0.62, offset: 0.38 }
    ];

    handGroup.userData.joints = [];

    fingerConfigs.forEach((config, fIdx) => {
      let prevPos = new THREE.Vector3(config.offset, 0.18, 0);
      const baseJ = new THREE.Mesh(jointGeo, jointMat);
      baseJ.position.copy(prevPos);
      handGroup.add(baseJ);

      const palmLine = new THREE.BufferGeometry().setFromPoints([palm.position, prevPos]);
      handGroup.add(new THREE.Line(palmLine, boneMat));

      const segments = fIdx === 4 ? 2 : 3;
      const jList = [];

      for (let s = 0; s < segments; s++) {
        const segLen = config.length / segments;
        const nextPos = new THREE.Vector3(
          prevPos.x + Math.sin(config.angle) * segLen,
          prevPos.y + Math.cos(config.angle) * segLen,
          prevPos.z + (Math.random() - 0.5) * 0.04
        );

        const jMesh = new THREE.Mesh(jointGeo, jointMat);
        jMesh.position.copy(nextPos);
        handGroup.add(jMesh);

        const bone = new THREE.BufferGeometry().setFromPoints([prevPos, nextPos]);
        handGroup.add(new THREE.Line(bone, boneMat));

        jList.push(jMesh);
        prevPos = nextPos;
      }
      handGroup.userData.joints.push(jList);
    });

    registerObject(handGroup, -6.8, -3.5, -8, -0.25, 0.25, 1.25);
  }

  // 4. Controller Tracking Device (Procedural)
  function createControllerModule() {
    const ctrlGroup = new THREE.Group();

    const loopGeo = new THREE.TorusGeometry(0.55, 0.045, 6, 28);
    const wireMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.35 });
    const loop = new THREE.Mesh(loopGeo, wireMat);
    loop.rotation.x = Math.PI / 3.8;
    ctrlGroup.add(loop);

    const gripGeo = new THREE.CylinderGeometry(0.075, 0.055, 0.75, 6);
    const grip = new THREE.Mesh(gripGeo, new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.75 }));
    grip.add(new THREE.Mesh(gripGeo, wireMat));
    grip.position.set(0, -0.36, -0.12);
    grip.rotation.x = Math.PI / 5.5;
    ctrlGroup.add(grip);

    registerObject(ctrlGroup, -5.2, -0.8, -8.5, 0.2, -0.15, 1.05);
  }

  function createDepthMapPlanes() {
    const depthGroup = new THREE.Group();
    const planeMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.08, side: THREE.DoubleSide });
    const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12 });

    for (let i = 0; i < 3; i++) {
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(8, 6, 8, 6), planeMat);
      plane.rotation.x = -Math.PI / 2.8;
      plane.position.set(0, -1.4 + i * 0.5, -14.5 + i * 0.35);
      plane.userData.phase = Math.random() * Math.PI * 2;

      const edges = new THREE.EdgesGeometry(plane.geometry);
      const grid = new THREE.LineSegments(edges, lineMat);
      plane.add(grid);
      depthGroup.add(plane);
      depthPlanes.push(plane);
    }

    registerObject(depthGroup, 0, 0, 0, 0, 0, 1, backgroundLayer);
  }

  function createCameraNodes() {
    const camerasGroup = new THREE.Group();
    const nodeMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.82 });
    const ringMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18 });

    const positions = [
      new THREE.Vector3(4.8, 1.8, -10.2),
      new THREE.Vector3(5.6, 0.3, -12.0),
      new THREE.Vector3(3.4, -2.1, -10.8)
    ];

    positions.forEach((pos, index) => {
      const camBody = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.18, 0.18), nodeMat);
      camBody.position.copy(pos);
      camerasGroup.add(camBody);

      const ring = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.TorusGeometry(0.6, 0.01, 4, 24)),
        ringMat
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.copy(pos).add(new THREE.Vector3(0, 0, 0));
      camerasGroup.add(ring);
      cameraNodes.push({ body: camBody, ring });
    });

    registerObject(camerasGroup, 0, 0, 0, 0, 0, 1, midLayer);
  }

  function createIMUSensorCluster() {
    const imuGroup = new THREE.Group();
    const cubeMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 });
    const edgeMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.16 });

    const cubePositions = [
      new THREE.Vector3(-3.8, 1.7, -12.2),
      new THREE.Vector3(-4.4, 0.4, -11.2),
      new THREE.Vector3(-3.2, 0.2, -12.6)
    ];

    cubePositions.forEach((pos, index) => {
      const cube = new THREE.Mesh(new THREE.BoxGeometry(0.28 - index * 0.04, 0.22 - index * 0.04, 0.18), cubeMat);
      cube.position.copy(pos);
      imuGroup.add(cube);
      imuNodes.push(cube);

      const edges = new THREE.EdgesGeometry(cube.geometry);
      imuGroup.add(new THREE.LineSegments(edges, edgeMat));
    });

    const bridgeMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.09 });
    const linkGeo = new THREE.BufferGeometry().setFromPoints(cubePositions);
    imuGroup.add(new THREE.Line(linkGeo, bridgeMat));

    registerObject(imuGroup, 0, 0, 0, 0, 0, 1, midLayer);
  }

  function createSensorGraph() {
    const graphGroup = new THREE.Group();
    const nodeMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
    const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12 });

    const graphPoints = [
      new THREE.Vector3(-1.2, 2.5, -13.4),
      new THREE.Vector3(-0.2, 1.2, -12.8),
      new THREE.Vector3(0.9, 2.6, -13.1),
      new THREE.Vector3(0.1, 0.5, -12.2),
      new THREE.Vector3(1.5, 1.0, -12.7)
    ];

    graphPoints.forEach(point => {
      const node = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), nodeMat);
      node.position.copy(point);
      graphGroup.add(node);
    });

    for (let i = 0; i < graphPoints.length - 1; i++) {
      const segment = new THREE.BufferGeometry().setFromPoints([graphPoints[i], graphPoints[i + 1]]);
      graphGroup.add(new THREE.Line(segment, lineMat));
    }

    registerObject(graphGroup, 0, 0, 0, 0, 0, 1, midLayer);
  }

  function createTelemetryOrbit() {
    const orbitGroup = new THREE.Group();
    const ringMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18 });
    const indicatorMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95 });

    const ring = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.RingGeometry(0.78, 0.84, 32)), ringMat);
    ring.rotation.x = Math.PI / 2;
    orbitGroup.add(ring);

    for (let i = 0; i < 3; i++) {
      const indicator = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), indicatorMat);
      indicator.position.set(Math.cos((i / 3) * Math.PI * 2) * 0.82, Math.sin((i / 3) * Math.PI * 2) * 0.82, 0);
      orbitGroup.add(indicator);
      telemetryOrbits.push({ indicator, angle: (i / 3) * Math.PI * 2 });
    }

    const base = new THREE.Mesh(new THREE.CircleGeometry(0.24, 24), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12 }));
    base.rotation.x = -Math.PI / 2;
    orbitGroup.add(base);

    registerObject(orbitGroup, 0.8, -2.2, -9.2, 0.18, 0.18, 1.05, midLayer);
  }

  function createDataStreams() {
    const streamGroup = new THREE.Group();
    const streamMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending });

    const centers = [
      new THREE.Vector3(-2.2, -1.5, -11.8),
      new THREE.Vector3(1.4, -2.6, -11.2),
      new THREE.Vector3(2.0, 2.1, -12.8)
    ];

    centers.forEach(center => {
      const points = [];
      for (let i = 0; i < 8; i++) {
        points.push(new THREE.Vector3(center.x + i * 0.18 - 0.63, center.y + Math.sin(i * 0.65) * 0.12, center.z + Math.cos(i) * 0.1));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geo, streamMat);
      streamGroup.add(line);
      line.userData.basePoints = points;
      dataStreamLines.push(line);
    });

    registerObject(streamGroup, 0, 0, 0, 0, 0, 1, midLayer);
  }

  // 5. Floating Camera Cubes (Procedural)
  function createCameraCube() {
    const camGroup = new THREE.Group();

    const bodyGeo = new THREE.BoxGeometry(0.72, 0.42, 0.42);
    const bodyMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.75 });
    const wireMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.38 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.add(new THREE.Mesh(bodyGeo, wireMat));
    camGroup.add(body);

    const lensGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.26, 12);
    lensGeo.rotation.x = Math.PI / 2;
    const lens = new THREE.Mesh(lensGeo, bodyMat);
    lens.position.z = 0.22;
    lens.add(new THREE.Mesh(lensGeo, wireMat));
    camGroup.add(lens);

    const frustumPoints = [
      new THREE.Vector3(0, 0, 0.3), new THREE.Vector3(-1.1, -0.85, 2.3),
      new THREE.Vector3(0, 0, 0.3), new THREE.Vector3(1.1, -0.85, 2.3),
      new THREE.Vector3(0, 0, 0.3), new THREE.Vector3(1.1, 0.85, 2.3),
      new THREE.Vector3(0, 0, 0.3), new THREE.Vector3(-1.1, 0.85, 2.3),
      new THREE.Vector3(-1.1, -0.85, 2.3), new THREE.Vector3(1.1, -0.85, 2.3),
      new THREE.Vector3(1.1, -0.85, 2.3), new THREE.Vector3(1.1, 0.85, 2.3),
      new THREE.Vector3(1.1, 0.85, 2.3), new THREE.Vector3(-1.1, 0.85, 2.3),
      new THREE.Vector3(-1.1, 0.85, 2.3), new THREE.Vector3(-1.1, -0.85, 2.3)
    ];
    const frustumGeo = new THREE.BufferGeometry().setFromPoints(frustumPoints);
    const frustumLine = new THREE.LineSegments(frustumGeo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.11 }));
    camGroup.add(frustumLine);

    camGroup.add(createAxesMarker(-0.5, -0.35, 0));

    registerObject(camGroup, -4.6, 3.6, -12.5, 0.2, 0.4, 0.95);
  }

  // 6. Face Detection Model (Procedural)
  function createFaceModel() {
    const faceGroup = new THREE.Group();

    const headGeo = new THREE.IcosahedronGeometry(0.72, 2);
    const headMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.22 });
    const head = new THREE.Mesh(headGeo, headMat);
    faceGroup.add(head);

    // Bounding Box outline
    const boxGeo = new THREE.BoxGeometry(1.5, 1.7, 1.5);
    const boxMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.09 });
    faceGroup.add(new THREE.Mesh(boxGeo, boxMat));

    // Corner Ticks
    const cPoints = [];
    const cs = [0.75, 0.85, 0.75]; // Box dimensions halved
    const tl = 0.18; // Tick length
    for (let x = -1; x <= 1; x += 2) {
      for (let y = -1; y <= 1; y += 2) {
        for (let z = -1; z <= 1; z += 2) {
          const cx = x * cs[0];
          const cy = y * cs[1];
          const cz = z * cs[2];
          cPoints.push(new THREE.Vector3(cx, cy, cz), new THREE.Vector3(cx - x * tl, cy, cz));
          cPoints.push(new THREE.Vector3(cx, cy, cz), new THREE.Vector3(cx, cy - y * tl, cz));
          cPoints.push(new THREE.Vector3(cx, cy, cz), new THREE.Vector3(cx, cy, cz - z * tl));
        }
      }
    }
    const cornersGeo = new THREE.BufferGeometry().setFromPoints(cPoints);
    faceGroup.add(new THREE.LineSegments(cornersGeo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 })));

    registerObject(faceGroup, 3.2, 2.6, -11.5, 0.1, -0.3, 1.0);
  }

  // 7. Pose Estimation Stick-Figure (Procedural)
  function createPoseSkeleton() {
    const poseGroup = new THREE.Group();

    const jointMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 });
    const jointGeo = new THREE.SphereGeometry(0.05, 6, 6);
    const boneMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.28 });

    const joints = [];
    for (let i = 0; i < 16; i++) {
      const mesh = new THREE.Mesh(jointGeo, jointMat);
      joints.push(mesh);
      poseGroup.add(mesh);
    }

    const connections = [
      [0, 1], [1, 2], [2, 3], // Spine
      [1, 4], [4, 5], [5, 6], // Left Arm
      [1, 7], [7, 8], [8, 9], // Right Arm
      [3, 10], [10, 11], [11, 12], // Left Leg
      [3, 13], [13, 14], [14, 15]  // Right Leg
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

    registerObject(poseGroup, -2.4, -4.2, -10.5, 0, 0.35, 0.95);
  }

  // 8. Object Detection Bounding Boxes (Procedural)
  function createBoundingBoxes() {
    const boxGroup = new THREE.Group();

    const boxGeo = new THREE.BoxGeometry(1.35, 1.35, 1.35);
    const boxWire = new THREE.Mesh(boxGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.12 }));
    boxGroup.add(boxWire);

    const cPoints = [];
    const tl = 0.22;
    const d = 0.675;
    for (let x = -1; x <= 1; x += 2) {
      for (let y = -1; y <= 1; y += 2) {
        for (let z = -1; z <= 1; z += 2) {
          const cx = x * d;
          const cy = y * d;
          const cz = z * d;
          cPoints.push(new THREE.Vector3(cx, cy, cz), new THREE.Vector3(cx - x * tl, cy, cz));
          cPoints.push(new THREE.Vector3(cx, cy, cz), new THREE.Vector3(cx, cy - y * tl, cz));
          cPoints.push(new THREE.Vector3(cx, cy, cz), new THREE.Vector3(cx, cy, cz - z * tl));
        }
      }
    }
    const cornersGeo = new THREE.BufferGeometry().setFromPoints(cPoints);
    boxGroup.add(new THREE.LineSegments(cornersGeo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 })));

    const crossGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-0.16, 0, 0), new THREE.Vector3(0.16, 0, 0),
      new THREE.Vector3(0, -0.16, 0), new THREE.Vector3(0, 0.16, 0)
    ]);
    const cross = new THREE.LineSegments(crossGeo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 }));
    boxGroup.add(cross);

    registerObject(boxGroup, 4.2, -4.0, -11.5, -0.15, -0.35, 0.95);
  }

  // 9. Floating Neural Network Graph (AI Layer)
  function createNeuralNet() {
    const nnGroup = new THREE.Group();
    const layers = [3, 4, 2];
    const nodePositions = [];
    const spheres = [];
    const jointGeo = new THREE.SphereGeometry(0.055, 6, 6);
    const nodeMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 });
    const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.08 });

    for (let l = 0; l < layers.length; l++) {
      const nodesInLayer = layers[l];
      const x = (l - 1) * 1.15;
      for (let n = 0; n < nodesInLayer; n++) {
        const y = (n - (nodesInLayer - 1) / 2) * 0.52;
        const pos = new THREE.Vector3(x, y, 0);
        nodePositions.push(pos);

        const sphere = new THREE.Mesh(jointGeo, nodeMat);
        sphere.position.copy(pos);
        nnGroup.add(sphere);
        spheres.push(sphere);
      }
    }

    let nodeIndex = 0;
    for (let l = 0; l < layers.length - 1; l++) {
      const currentCount = layers[l];
      const nextCount = layers[l + 1];
      const currentStart = nodeIndex;
      const nextStart = nodeIndex + currentCount;

      for (let i = 0; i < currentCount; i++) {
        for (let j = 0; j < nextCount; j++) {
          const p1 = nodePositions[currentStart + i];
          const p2 = nodePositions[nextStart + j];
          const lineGeo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
          const line = new THREE.Line(lineGeo, lineMat);
          nnGroup.add(line);
        }
      }
      nodeIndex += currentCount;
    }

    // Packet transmission overlay
    const slidingGroup = new THREE.Group();
    nnGroup.add(slidingGroup);
    nnGroup.userData.slidingNodes = [];

    for (let i = 0; i < 7; i++) {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.032, 5, 5), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      slidingGroup.add(mesh);

      const lIdx = Math.floor(Math.random() * (layers.length - 1));
      const currentStart = lIdx === 0 ? 0 : layers[0];
      const nextStart = currentStart + layers[lIdx];

      const p1Idx = currentStart + Math.floor(Math.random() * layers[lIdx]);
      const p2Idx = nextStart + Math.floor(Math.random() * layers[lIdx + 1]);

      nnGroup.userData.slidingNodes.push({
        mesh,
        p1: nodePositions[p1Idx],
        p2: nodePositions[p2Idx],
        progress: Math.random(),
        speed: 0.008 + Math.random() * 0.012,
        layers,
        nodePositions
      });
    }

    registerObject(nnGroup, 8.2, 3.0, -14.5, 0.25, -0.35, 1.15);
  }

  // 10. Waveform Visualizer (Data Layer)
  function createWaveformModule() {
    const waveGroup = new THREE.Group();

    const pointsCount = 38;
    const points = [];
    for (let i = 0; i < pointsCount; i++) {
      points.push(new THREE.Vector3((i / (pointsCount - 1)) * 3.4 - 1.7, 0, 0));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.42 });
    const line = new THREE.Line(geo, mat);
    waveGroup.add(line);

    waveGroup.add(createAxesMarker(-1.7, 0, 0));

    waveGroup.userData.pointsCount = pointsCount;
    waveGroup.userData.waveLine = line;

    registerObject(waveGroup, 3.4, -0.6, -9.5, 0.15, -0.25, 1.0);
  }

  // 11. Dynamic Bar Charts (Data Layer)
  function createBarCharts() {
    const chartGroup = new THREE.Group();
    const barCount = 6;
    const bars = [];

    const barMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.75 });
    const wireMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.45 });

    for (let i = 0; i < barCount; i++) {
      const barGeo = new THREE.BoxGeometry(0.18, 1.0, 0.18);
      const bar = new THREE.Mesh(barGeo, barMat);
      bar.add(new THREE.Mesh(barGeo, wireMat));

      bar.position.x = (i - (barCount - 1) / 2) * 0.32;
      bar.position.y = 0;
      chartGroup.add(bar);
      bars.push(bar);
    }

    chartGroup.userData.bars = bars;
    registerObject(chartGroup, -1.0, 3.6, -13.5, -0.18, 0.28, 1.05);
  }

  // 12. Radial Dashboard (Data Layer)
  function createRadialDashboard() {
    const dashGroup = new THREE.Group();

    const outerRing = new THREE.Mesh(new THREE.RingGeometry(0.95, 0.98, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.18 }));
    dashGroup.add(outerRing);

    const innerRing = new THREE.Mesh(new THREE.RingGeometry(0.68, 0.70, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.13 }));
    dashGroup.add(innerRing);

    const progressGeo = new THREE.RingGeometry(0.80, 0.86, 32, 1, 0, Math.PI * 1.35);
    const progressMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.45 });
    const progressArc = new THREE.Mesh(progressGeo, progressMat);
    dashGroup.add(progressArc);

    for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(Math.cos(a) * 0.85, Math.sin(a) * 0.85, 0),
        new THREE.Vector3(Math.cos(a) * 0.93, Math.sin(a) * 0.93, 0)
      ]);
      dashGroup.add(new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 })));
    }

    dashGroup.userData.progressArc = progressArc;
    registerObject(dashGroup, 1.0, -3.0, -9.5, 0.18, -0.35, 1.05);
  }

  // 13. Data Fusion Pipeline (Sensor Fusion Layer)
  function createDataFusionPipeline() {
    const pipeGroup = new THREE.Group();

    const p1 = new THREE.Vector3(-1.6, -0.9, 0);
    const p2 = new THREE.Vector3(0, 0.9, 0);
    const p3 = new THREE.Vector3(1.6, -0.9, 0);
    const points = [p1, p2, p3];

    const pipeGeo = new THREE.BufferGeometry().setFromPoints(points);
    pipeGroup.add(new THREE.Line(pipeGeo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.16 })));

    const nodeGeo = new THREE.SphereGeometry(0.11, 8, 8);
    const nodeMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });

    points.forEach(p => {
      const m = new THREE.Mesh(nodeGeo, nodeMat);
      m.position.copy(p);
      pipeGroup.add(m);
    });

    const packet = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    pipeGroup.add(packet);

    pipeGroup.userData.packet = packet;
    pipeGroup.userData.points = points;
    pipeGroup.userData.progress = 0;

    registerObject(pipeGroup, -0.4, 0.6, -12, 0.18, 0.18, 1.05);
  }

  // Animation Loop
  let time = 0;
  function animate() {
    requestAnimationFrame(animate);

    if (document.hidden) return;

    if (window.threeBgDebugFrameCount < 5) {
      window.threeBgDebugFrameCount++;
      console.log("Three.js Background: Rendering frame", window.threeBgDebugFrameCount, "with objects count:", objects.length);
    }

    time += 0.01;

    // 1. Move/Fade mouse particles
    animateRippleParticles();

    // 2. Animate objects
    objects.forEach(obj => {
      const uData = obj.userData;

      // Gravity-free drift
      obj.position.y = uData.baseY + Math.sin(time * uData.floatSpeed + uData.phase) * uData.floatAmp;

      // Base auto rotation
      obj.rotation.x = uData.baseRotX + Math.sin(time * 0.15) * 0.04;
      obj.rotation.y = uData.baseRotY + time * uData.rotSpeedY;

      // Sub-model micro-animations
      // Hand micro waving
      if (uData.joints) {
        uData.joints.forEach((finger, fIdx) => {
          finger.forEach((joint, jIdx) => {
            joint.position.x += Math.sin(time * 3 + fIdx * 1.6 + jIdx * 0.8) * 0.0016;
          });
        });
      }

      // Pose figure sway
      if (uData.poseJoints) {
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

      // Neural Net transmitting packets
      if (uData.slidingNodes) {
        uData.slidingNodes.forEach(item => {
          item.progress += item.speed;
          if (item.progress >= 1.0) {
            item.progress = 0;
            const lIdx = Math.floor(Math.random() * (item.layers.length - 1));
            const currentStart = lIdx === 0 ? 0 : item.layers[0];
            const nextStart = currentStart + item.layers[lIdx];
            const p1Idx = currentStart + Math.floor(Math.random() * item.layers[lIdx]);
            const p2Idx = nextStart + Math.floor(Math.random() * item.layers[lIdx + 1]);
            item.p1 = item.nodePositions[p1Idx];
            item.p2 = item.nodePositions[p2Idx];
          }
          item.mesh.position.lerpVectors(item.p1, item.p2, item.progress);
        });
      }

      // Scrolling Waveform
      if (uData.waveLine) {
        const line = uData.waveLine;
        const posAttr = line.geometry.attributes.position;
        const count = uData.pointsCount;
        for (let i = 0; i < count; i++) {
          const x = posAttr.getX(i);
          const yVal = Math.sin(x * 1.8 + time * 3.8) * 0.3 * Math.sin(time * 0.8 + x);
          posAttr.setY(i, yVal);
        }
        posAttr.needsUpdate = true;
      }

      // Scaling Bar Charts
      if (uData.bars) {
        uData.bars.forEach((bar, idx) => {
          const targetH = 0.2 + Math.sin(time * 2.8 + idx * 1.1) * 0.36 + Math.cos(time * 1.4 - idx) * 0.25;
          const clampVal = Math.max(0.08, targetH + 0.7);
          bar.scale.y = clampVal;
          bar.position.y = clampVal * 0.5 - 0.5;
        });
      }

      // Dashboard Rotator
      if (uData.progressArc) {
        uData.progressArc.rotation.z = -time * 0.6;
      }

      // Fusion Pipe network traveler
      if (uData.packet) {
        uData.progress += 0.009;
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

    // 3. Coordinate Projection of Mouse
    projectMouseTo3D();

    // 4. Connect Probe to closest objects + Magnetic Pull
    updateProbeLines();

    // 4.5 Animate layered system elements
    animateLayerSystems();

    // 5. Camera Parallax
    if (camera) {
      const targetCamX = mouse.x * 2.5;
      const targetCamY = mouse.y * 2.0;
      camera.position.x += (targetCamX - camera.position.x) * 0.04;
      camera.position.y += (targetCamY - camera.position.y) * 0.04;
      camera.lookAt(scene.position);
    }

    renderer.render(scene, camera);
  }

  function projectMouseTo3D() {
    const temp = new THREE.Vector3(mouse.x, mouse.y, 0.5);
    temp.unproject(camera);
    const dir = temp.sub(camera.position).normalize();
    const distance = -camera.position.z / dir.z; // project onto z=0 plane
    mouse3D.copy(camera.position).add(dir.multiplyScalar(distance));
  }

  function updateProbeLines() {
    const distanceList = [];
    objects.forEach(obj => {
      const d = obj.position.distanceTo(mouse3D);
      distanceList.push({ obj, d });
    });
    distanceList.sort((a, b) => a.d - b.d);

    const probeArray = probeLines.geometry.attributes.position.array;
    const isMouseActive = (mouse.x !== 0 || mouse.y !== 0);

    for (let i = 0; i < 3; i++) {
      if (isMouseActive && i < distanceList.length && distanceList[i].d < 7.5) {
        const targetObj = distanceList[i].obj;

        // Line start at mouse probe
        probeArray[i * 6] = mouse3D.x;
        probeArray[i * 6 + 1] = mouse3D.y;
        probeArray[i * 6 + 2] = mouse3D.z;

        // Line end at object
        probeArray[i * 6 + 3] = targetObj.position.x;
        probeArray[i * 6 + 4] = targetObj.position.y;
        probeArray[i * 6 + 5] = targetObj.position.z;

        // Micro magnetic pull / Tilt toward cursor
        const dx = mouse3D.x - targetObj.position.x;
        const dy = mouse3D.y - targetObj.position.y;
        const targetRotX = dy * 0.12;
        const targetRotY = dx * 0.12;

        targetObj.rotation.x += (targetRotX - (targetObj.rotation.x - targetObj.userData.baseRotX)) * 0.06;
        targetObj.rotation.y += (targetRotY - (targetObj.rotation.y - targetObj.userData.baseRotY)) * 0.06;

        // Magnetic attraction (drift slightly toward mouse3D)
        targetObj.position.x += (targetObj.userData.baseX + dx * 0.05 - targetObj.position.x) * 0.06;

        // Node highlight (scale up slightly)
        const scaleFact = targetObj.userData.baseScale * 1.1;
        targetObj.scale.setScalar(targetObj.scale.x + (scaleFact - targetObj.scale.x) * 0.06);
      } else {
        // Hide line segments
        probeArray[i * 6] = 0;
        probeArray[i * 6 + 1] = 0;
        probeArray[i * 6 + 2] = -999;
        probeArray[i * 6 + 3] = 0;
        probeArray[i * 6 + 4] = 0;
        probeArray[i * 6 + 5] = -999;

        if (i < distanceList.length) {
          const targetObj = distanceList[i].obj;
          // drift back to center positions
          targetObj.position.x += (targetObj.userData.baseX - targetObj.position.x) * 0.06;
          // scale back to base
          targetObj.scale.setScalar(targetObj.scale.x + (targetObj.userData.baseScale - targetObj.scale.x) * 0.06);
        }
      }
    }
    probeLines.geometry.attributes.position.needsUpdate = true;
  }

  function animateRippleParticles() {
    const pos = rippleParticles.geometry.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
      if (pos[i * 3 + 2] !== -999) {
        particlesAges[i] += 0.016; // increment age roughly by frame rate
        if (particlesAges[i] >= particlesLifes[i]) {
          // Recycle / Hide particle
          pos[i * 3 + 2] = -999;
        } else {
          // Translate based on velocity
          pos[i * 3] += particlesVelocities[i].x * 0.016;
          pos[i * 3 + 1] += particlesVelocities[i].y * 0.016;
          pos[i * 3 + 2] += particlesVelocities[i].z * 0.016;
        }
      }
    }
    rippleParticles.geometry.attributes.position.needsUpdate = true;
  }

  function animateLayerSystems() {
    const hoverInfluence = Math.max(0, 1 - mouse3D.distanceTo(new THREE.Vector3(0, 0, -12)) * 0.08);

    depthPlanes.forEach((plane, idx) => {
      plane.rotation.z = Math.sin(time * 0.25 + plane.userData.phase) * 0.03;
      plane.position.y = plane.userData.baseY || plane.position.y + Math.sin(time * 0.18 + idx) * 0.001;
      plane.material.opacity = 0.06 + idx * 0.01;
    });

    telemetryOrbits.forEach((orbit) => {
      orbit.angle += 0.015;
      const radius = 0.82 + Math.sin(time * 0.6) * 0.03;
      orbit.indicator.position.set(Math.cos(orbit.angle) * radius, Math.sin(orbit.angle) * radius, 0);
    });

    cameraNodes.forEach(node => {
      const dist = node.body.position.distanceTo(mouse3D);
      const scaleTarget = dist < 2 ? 1.15 : 1.0;
      node.body.scale.setScalar(node.body.scale.x + (scaleTarget - node.body.scale.x) * 0.06);
      node.ring.material.opacity = dist < 2.6 ? 0.4 : 0.14;
    });

    imuNodes.forEach((cube, idx) => {
      cube.rotation.x += 0.0025 + idx * 0.001;
      cube.rotation.y += 0.0015 + idx * 0.0008;
    });

    dataStreamLines.forEach(line => {
      const points = line.userData.basePoints;
      const positions = line.geometry.attributes.position.array;
      points.forEach((point, i) => {
        const offset = Math.sin(time * 2.2 + i * 0.7) * 0.03;
        positions[i * 3 + 1] = point.y + offset;
      });
      line.geometry.attributes.position.needsUpdate = true;
      line.material.opacity = hoverInfluence > 0.2 ? 0.24 : 0.12;
    });
  }

  // Handle Mouse Movements
  window.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    // Emit a couple of ripple particles at projected position
    if (rippleParticles) {
      emitParticle(mouse3D.x, mouse3D.y, mouse3D.z);
      if (Math.random() > 0.5) emitParticle(mouse3D.x, mouse3D.y, mouse3D.z);
    }
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
// 5. HOLOGRAPHIC SKILLS ORBIT SYSTEM
// ============================================
(function() {
  const canvas = document.getElementById('skills-orbit-canvas');
  const viewport = document.getElementById('skills-orbit-viewport');
  const titleEl = document.querySelector('.orbit-center-node .node-title');
  const descEl = document.querySelector('.orbit-center-node .node-desc');
  const skillTags = document.querySelectorAll('.skills-list-panel .skill-tag[data-skill]');

  if (!canvas || !viewport) return;

  const ctx = canvas.getContext('2d');
  let width = (canvas.width = viewport.clientWidth);
  let height = (canvas.height = viewport.clientHeight);

  const cx = width / 2;
  const cy = height / 2;

  // Concentric Orbit Radii
  const orbits = [65, 100, 135];

  // Core Skill Node Coordinates and Properties
  const skillNodes = [
    { id: 'csharp', label: 'C#', orbit: 0, speed: 0.006, angle: 0, desc: 'Object-oriented scripting in Unity', connections: ['unity', 'xrtoolkit'] },
    { id: 'python', label: 'Python', orbit: 0, speed: -0.007, angle: Math.PI, desc: 'Core AI, OpenCV and MediaPipe scripting', connections: ['computervision', 'ai-design'] },
    { id: 'unity', label: 'Unity Engine', orbit: 1, speed: 0.004, angle: Math.PI / 4, desc: '3D game engine and XR scene editor', connections: ['csharp', 'xrtoolkit'] },
    { id: 'computervision', label: 'CV (OpenCV)', orbit: 1, speed: -0.004, angle: (3 * Math.PI) / 4, desc: 'MediaPipe hand tracking & OpenCV frame analysis', connections: ['python', 'ai-design'] },
    { id: 'arduino', label: 'Arduino / IoT', orbit: 1, speed: 0.003, angle: (5 * Math.PI) / 4, desc: 'Microcontroller code & sensor polling', connections: ['sensorfusion'] },
    { id: 'xrtoolkit', label: 'XR Toolkit', orbit: 2, speed: 0.002, angle: Math.PI / 3, desc: 'Locomotion & spatial rays interaction framework', connections: ['unity', 'csharp'] },
    { id: 'sensorfusion', label: 'Sensor Fusion', orbit: 2, speed: -0.002, angle: Math.PI, desc: 'IMU data polling & angular state math', connections: ['arduino'] },
    { id: 'ai-design', label: 'AI Interaction', orbit: 2, speed: 0.003, angle: (7 * Math.PI) / 6, desc: 'AI gesture mapping and custom input filters', connections: ['computervision', 'python'] }
  ];

  let activeNodeId = null;
  let mouse = { x: null, y: null };

  function updatePositions() {
    skillNodes.forEach(node => {
      // Do not rotate if hovering is freezing the action
      if (activeNodeId === null) {
        node.angle += node.speed;
      }
      node.x = cx + Math.cos(node.angle) * orbits[node.orbit];
      node.y = cy + Math.sin(node.angle) * orbits[node.orbit];
    });
  }

  function drawOrbitLines() {
    // Draw orbits
    ctx.setLineDash([4, 6]);
    ctx.lineWidth = 1;
    orbits.forEach(r => {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.setLineDash([]);
  }

  function drawConnections() {
    if (!activeNodeId) return;

    const activeNode = skillNodes.find(n => n.id === activeNodeId);
    if (!activeNode) return;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1.5;

    // Draw ray to central core
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(activeNode.x, activeNode.y);
    ctx.stroke();

    // Draw rays to connected skills
    activeNode.connections.forEach(connId => {
      const connNode = skillNodes.find(n => n.id === connId);
      if (connNode) {
        ctx.beginPath();
        ctx.moveTo(activeNode.x, activeNode.y);
        ctx.lineTo(connNode.x, connNode.y);
        ctx.stroke();

        // Secondary glow on connection node
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.beginPath();
        ctx.arc(connNode.x, connNode.y, 10, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  function drawNodes() {
    skillNodes.forEach(node => {
      const isActive = node.id === activeNodeId;
      
      // Node glass fill
      ctx.fillStyle = isActive ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.9)';
      ctx.strokeStyle = isActive ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = isActive ? 2 : 1.2;

      ctx.beginPath();
      ctx.arc(node.x, node.y, isActive ? 7 : 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Node text label
      ctx.fillStyle = isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.7)';
      ctx.font = isActive ? 'bold 10px Sora, sans-serif' : '500 9px Sora, sans-serif';
      ctx.fillText(node.label, node.x + 10, node.y + 3);

      // If active, draw clean glowing border around node
      if (isActive) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 11, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
  }

  function checkHover() {
    if (mouse.x === null || mouse.y === null) return;
    
    let hoveredNode = null;
    
    for (let node of skillNodes) {
      const d = Math.hypot(mouse.x - node.x, mouse.y - node.y);
      if (d < 16) {
        hoveredNode = node;
        break;
      }
    }

    if (hoveredNode) {
      setActiveSkill(hoveredNode.id, hoveredNode.label, hoveredNode.desc);
    } else {
      // Only reset if we aren't currently hovering a list tag on the left
      const tagHovered = document.querySelector('.skills-list-panel .skill-tag.active-node');
      if (!tagHovered) {
        resetActiveSkill();
      }
    }
  }

  function setActiveSkill(id, label, desc) {
    if (activeNodeId === id) return;
    activeNodeId = id;
    
    // Update center node text
    titleEl.textContent = label;
    descEl.textContent = desc;

    // Highlight HTML list tag
    skillTags.forEach(tag => {
      if (tag.dataset.skill === id) {
        tag.classList.add('active-node');
      } else {
        tag.classList.remove('active-node');
      }
    });
  }

  function resetActiveSkill() {
    if (activeNodeId === null) return;
    activeNodeId = null;
    titleEl.textContent = 'XR Core';
    descEl.textContent = 'Hover a Skill';
    skillTags.forEach(tag => tag.classList.remove('active-node'));
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    updatePositions();
    drawOrbitLines();
    drawConnections();
    drawNodes();
    checkHover();
    requestAnimationFrame(draw);
  }

  // Handle canvas mouse tracking
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    // Account for CSS styling scaling
    mouse.x = (e.clientX - rect.left) * (width / rect.width);
    mouse.y = (e.clientY - rect.top) * (height / rect.height);
  });

  canvas.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
  });

  // Handle HTML list tag mouse interaction
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

  // Adapt to size adjustments
  window.addEventListener('resize', () => {
    width = canvas.width = viewport.clientWidth;
    height = canvas.height = viewport.clientHeight;
  });

  // Run orbit loop
  draw();
})();
