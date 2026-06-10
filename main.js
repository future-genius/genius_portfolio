/* ============================================
   Portfolio — XR Engineer Cinematic Visual Core
   Full 3D Spatial Computing Environment
   ============================================ */

'use strict';

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
// 1. THREE.JS CINEMATIC XR BACKGROUND SYSTEM
// ============================================
(function() {
  const canvas = document.getElementById('three-bg-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const isMobile = window.innerWidth < 768 || ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

  let scene, camera, renderer;
  let objects = [];
  let mouse = { x: 0, y: 0 };
  let mouse3D = new THREE.Vector3(0, 0, 0);
  let width = window.innerWidth;
  let height = window.innerHeight;
  let scrollPercent = 0;
  let time = 0;

  let connectionLinesGroup, connectionLines = [], floatingParticles, pVelocities = [];
  const particleCount = isMobile ? 120 : 500;

  // Helper: Hybrid solid+wireframe mesh
  function createHybrid(geometry, wireOpacity, solidOpacity) {
    wireOpacity = wireOpacity !== undefined ? wireOpacity : 0.85;
    solidOpacity = solidOpacity !== undefined ? solidOpacity : 0.92;
    const group = new THREE.Group();
    group.add(new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
      color: 0x000000, transparent: true, opacity: solidOpacity, depthWrite: true
    })));
    group.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: wireOpacity })));
    return group;
  }

  // Helper: Ring line
  function makeRing(radius, segments, opacity, tilt) {
    const pts = [];
    for (let i = 0; i <= segments; i++) pts.push(new THREE.Vector3(Math.cos(i / segments * Math.PI * 2) * radius, 0, Math.sin(i / segments * Math.PI * 2) * radius));
    const ring = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: opacity || 0.6 }));
    if (tilt) ring.rotation.x = tilt;
    return ring;
  }

  function registerObject(group, x, y, z, rx, ry, scale) {
    group.position.set(x, y, z);
    group.rotation.set(rx || 0, ry || 0, 0);
    group.scale.setScalar(scale || 1);
    group.userData = { baseX: x, baseY: y, baseZ: z, baseRotX: rx || 0, baseRotY: ry || 0, baseScale: scale || 1, floatSpeed: 0.25 + Math.random() * 0.2, floatAmp: 0.3 + Math.random() * 0.2, phase: Math.random() * Math.PI * 2, rotSpeedY: 0.003 + Math.random() * 0.004 };
    scene.add(group);
    objects.push(group);
    return group;
  }

  function initThree() {
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.012);

    camera = new THREE.PerspectiveCamera(52, width / height, 0.1, 1200);
    camera.position.set(0, 0, 16);

    renderer = new THREE.WebGLRenderer({ canvas, alpha: false, antialias: !isMobile });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 1.0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dl = new THREE.DirectionalLight(0xffffff, 1.0);
    dl.position.set(5, 15, 10);
    scene.add(dl);

    // Spatial perspective grid floor
    const grid = new THREE.GridHelper(200, 100, 0xffffff, 0xffffff);
    grid.position.y = -8;
    grid.material.transparent = true;
    grid.material.opacity = 0.06;
    scene.add(grid);

    // Bezier cursor connection lines
    connectionLinesGroup = new THREE.Group();
    scene.add(connectionLinesGroup);
    for (let i = 0; i < 4; i++) {
      const geo = new THREE.BufferGeometry().setFromPoints(Array.from({ length: 24 }, () => new THREE.Vector3()));
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending }));
      line.visible = false;
      connectionLinesGroup.add(line);
      connectionLines.push(line);
    }

    // Build all XR scene objects
    createParticles();
    createVRHeadset();
    createARGlasses();
    createHandTracker();
    createIMUCluster();
    createCVCameraRig();
    createNeuralNetwork();
    createPoseSkeleton();
    createSpatialUIPanels();
    createDataPipeline();
    createOrbitingRings();
    createAIDataStreams();
  }

  // ─── PARTICLES ───────────────────────────────────
  function createParticles() {
    const pGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 50;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 50;
      pos[i * 3 + 2] = -8 - Math.random() * 30;
      sizes[i] = 0.5 + Math.random() * 1.5;
      pVelocities.push(new THREE.Vector3((Math.random() - 0.5) * 0.03, 0.08 + Math.random() * 0.18, 0));
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    floatingParticles = new THREE.Points(pGeo, new THREE.PointsMaterial({
      color: 0xffffff, size: 0.12, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, sizeAttenuation: true
    }));
    scene.add(floatingParticles);
  }

  // ─── 1. VR HEADSET (Hero / Y=3) ──────────────────
  function createVRHeadset() {
    const g = new THREE.Group();

    // Main visor body — large and bold
    const visorGeo = new THREE.BoxGeometry(3.8, 2.0, 1.6);
    g.add(createHybrid(visorGeo, 0.9, 0.95));

    // Lens panels — prominent curved elements
    const lens1 = createHybrid(new THREE.CylinderGeometry(0.78, 0.78, 3.4, 14, 1, false, -Math.PI / 2, Math.PI), 0.9, 0.95);
    lens1.rotation.z = Math.PI / 2;
    lens1.position.z = 0.82;
    g.add(lens1);

    // Strap band
    const strapGeo = new THREE.TorusGeometry(2.2, 0.12, 6, 40, Math.PI);
    const strap = createHybrid(strapGeo, 0.7, 0.9);
    strap.rotation.y = Math.PI / 2;
    strap.position.set(0, 0, -0.5);
    g.add(strap);

    // Side caps
    [-1.95, 1.95].forEach(x => {
      const cap = createHybrid(new THREE.CylinderGeometry(0.32, 0.32, 0.35, 10), 0.7, 0.9);
      cap.rotation.z = Math.PI / 2;
      cap.position.x = x;
      g.add(cap);
    });

    // Orbiting telemetry rings
    const ring1 = makeRing(2.9, 72, 0.55, Math.PI / 5);
    const ring2 = makeRing(3.4, 72, 0.38, -Math.PI / 8);
    const ring3 = makeRing(4.0, 72, 0.22);
    ring3.rotation.z = Math.PI / 3;
    g.add(ring1, ring2, ring3);
    g.userData.vrRings = [ring1, ring2, ring3];

    // Scanning beams from lens
    for (let i = -1; i <= 1; i += 2) {
      const beam = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(i * 0.5, 0, 0.85), new THREE.Vector3(i * 2.2, 0, 3.0)]),
        new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 })
      );
      g.add(beam);
    }

    registerObject(g, 0, 3, -12, 0.1, -0.2, 1.4);
  }

  // ─── 2. AR SMART GLASSES (Y=-5) ──────────────────
  function createARGlasses() {
    const g = new THREE.Group();

    // Frames — large torus rings
    [-0.85, 0.85].forEach(x => {
      const frame = createHybrid(new THREE.TorusGeometry(0.7, 0.05, 8, 28), 0.85, 0.9);
      frame.position.x = x;
      g.add(frame);

      // Lens interior tinted plane
      const lens = new THREE.Mesh(new THREE.CircleGeometry(0.64, 24), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.06, side: THREE.DoubleSide }));
      lens.position.set(x, 0, 0.01);
      g.add(lens);

      // Scanning lines that sweep
      for (let s = -1; s <= 1; s++) {
        const scanLine = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x - 0.55, s * 0.0, 0.04), new THREE.Vector3(x + 0.55, s * 0.0, 0.04)]),
          new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 })
        );
        g.add(scanLine);
      }
    });

    // Bridge
    g.add(createHybrid(new THREE.BoxGeometry(0.36, 0.06, 0.06), 0.7, 0.9));

    // Temples
    [-1.58, 1.58].forEach(x => {
      const temple = createHybrid(new THREE.BoxGeometry(0.04, 0.04, 1.6), 0.6, 0.9);
      temple.position.set(x, 0.06, -0.8);
      g.add(temple);
    });

    // AR holographic projection rays
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI;
      const ray = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0.7), new THREE.Vector3(Math.cos(angle) * 1.8, Math.sin(angle) * 0.9, 1.8)]),
        new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending })
      );
      g.add(ray);
    }

    // Scan lines stored for animation
    g.userData.scanY = 0;

    registerObject(g, 2.5, -5, -10, -0.08, 0.4, 1.3);
  }

  // ─── 3. HAND TRACKER (Y=-5) ───────────────────────
  function createHandTracker() {
    const g = new THREE.Group();
    const jMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const bMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 });

    // Joint positions for a full hand (21 joints like MediaPipe)
    const joints = [
      // Wrist
      new THREE.Vector3(0, -0.9, 0),
      // Thumb
      new THREE.Vector3(-0.3, -0.55, 0.12), new THREE.Vector3(-0.55, -0.25, 0.22), new THREE.Vector3(-0.7, 0.0, 0.28), new THREE.Vector3(-0.82, 0.2, 0.32),
      // Index
      new THREE.Vector3(-0.15, -0.15, 0.04), new THREE.Vector3(-0.2, 0.28, 0.0), new THREE.Vector3(-0.22, 0.56, -0.06), new THREE.Vector3(-0.24, 0.74, -0.1),
      // Middle
      new THREE.Vector3(0.0, -0.1, 0.02), new THREE.Vector3(0.0, 0.32, -0.04), new THREE.Vector3(0.0, 0.62, -0.1), new THREE.Vector3(0.0, 0.82, -0.14),
      // Ring
      new THREE.Vector3(0.15, -0.15, 0.04), new THREE.Vector3(0.18, 0.28, 0.0), new THREE.Vector3(0.2, 0.56, -0.06), new THREE.Vector3(0.22, 0.74, -0.1),
      // Pinky
      new THREE.Vector3(0.3, -0.22, 0.1), new THREE.Vector3(0.38, 0.1, 0.06), new THREE.Vector3(0.42, 0.3, 0.0), new THREE.Vector3(0.44, 0.46, -0.04)
    ];

    const bones = [
      [0,1],[1,2],[2,3],[3,4],    // thumb
      [0,5],[5,6],[6,7],[7,8],    // index
      [0,9],[9,10],[10,11],[11,12], // middle
      [0,13],[13,14],[14,15],[15,16], // ring
      [0,17],[17,18],[18,19],[19,20]  // pinky
    ];

    const jGeo = new THREE.SphereGeometry(0.055, 6, 6);
    const jMeshes = joints.map((pos, i) => {
      const size = i === 0 ? 0.1 : 0.055;
      const m = new THREE.Mesh(new THREE.SphereGeometry(size, 6, 6), jMat.clone());
      m.position.copy(pos);
      g.add(m);
      return m;
    });

    const bLines = bones.map(pair => {
      const geo = new THREE.BufferGeometry().setFromPoints([joints[pair[0]], joints[pair[1]]]);
      const l = new THREE.Line(geo, bMat.clone());
      g.add(l);
      return { line: l, a: pair[0], b: pair[1] };
    });

    g.userData.handJoints = joints;
    g.userData.jMeshes = jMeshes;
    g.userData.bLines = bLines;
    g.userData.gestureTime = 0;

    registerObject(g, -2.8, -5, -10, -0.18, 0.25, 1.35);
  }

  // ─── 4. IMU SENSOR CLUSTER (Y=-13) ────────────────
  function createIMUCluster() {
    const g = new THREE.Group();

    // Central MCU chip
    g.add(createHybrid(new THREE.BoxGeometry(0.55, 0.55, 0.55), 0.9, 0.95));

    // PCB board base
    const board = createHybrid(new THREE.BoxGeometry(1.1, 0.08, 0.8), 0.7, 0.9);
    board.position.y = -0.32;
    g.add(board);

    // Three orthogonal gyroscope rings (different axes)
    const r1 = makeRing(1.3, 64, 0.85);
    const r2 = makeRing(1.1, 64, 0.7);
    r2.rotation.x = Math.PI / 2;
    const r3 = makeRing(1.5, 64, 0.55);
    r3.rotation.z = Math.PI / 2;
    g.add(r1, r2, r3);
    g.userData.imuRings = [r1, r2, r3];

    // Telemetry particle cluster orbiting
    const telPts = [];
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const rad = 0.5 + Math.random() * 0.8;
      telPts.push(new THREE.Vector3(Math.cos(angle) * rad, (Math.random() - 0.5) * 0.5, Math.sin(angle) * rad));
    }
    const telGeo = new THREE.BufferGeometry().setFromPoints(telPts);
    g.add(new THREE.Points(telGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.06, transparent: true, opacity: 0.8 })));

    // Axis indicator arrows (3 lines)
    ['x', 'y', 'z'].forEach((axis, i) => {
      const dir = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)][i];
      const arrow = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), dir.clone().multiplyScalar(0.7)]),
        new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 })
      );
      g.add(arrow);
    });

    registerObject(g, -2.5, -13, -11, 0.1, 0.3, 1.5);
  }

  // ─── 5. CV CAMERA RIG (Y=-13) ─────────────────────
  function createCVCameraRig() {
    const g = new THREE.Group();

    // Camera housing body
    g.add(createHybrid(new THREE.BoxGeometry(1.1, 0.7, 0.7), 0.9, 0.95));

    // Lens barrel
    const lens = createHybrid(new THREE.CylinderGeometry(0.26, 0.22, 0.45, 14), 0.85, 0.9);
    lens.rotation.x = Math.PI / 2;
    lens.position.z = 0.4;
    g.add(lens);

    // Lens inner glass
    const lensGlass = new THREE.Mesh(
      new THREE.CircleGeometry(0.2, 16),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, side: THREE.DoubleSide })
    );
    lensGlass.position.z = 0.64;
    g.add(lensGlass);

    // Volumetric scan cone — large and visible
    const coneGeo = new THREE.ConeGeometry(2.8, 5.5, 20, 1, true);
    coneGeo.translate(0, -2.75, 0);
    const scanCone = new THREE.Mesh(coneGeo, new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0.06, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending
    }));
    scanCone.rotation.x = Math.PI / 2;
    scanCone.position.z = 0.6;
    g.add(scanCone);
    g.userData.scanCone = scanCone;

    // Cone wireframe
    const coneWire = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.ConeGeometry(2.8, 5.5, 12, 1, true)),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.28 })
    );
    coneWire.rotation.x = Math.PI / 2;
    coneWire.position.z = 0.6;
    coneWire.geometry.translate(0, -2.75, 0);
    g.add(coneWire);
    g.userData.coneWire = coneWire;

    // Bounding box projection frame at end of scan
    const bbPts = [
      new THREE.Vector3(-1.4, -1.1, 3.5), new THREE.Vector3(1.4, -1.1, 3.5),
      new THREE.Vector3(1.4, -1.1, 3.5), new THREE.Vector3(1.4, 1.1, 3.5),
      new THREE.Vector3(1.4, 1.1, 3.5), new THREE.Vector3(-1.4, 1.1, 3.5),
      new THREE.Vector3(-1.4, 1.1, 3.5), new THREE.Vector3(-1.4, -1.1, 3.5)
    ];
    const bb = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(bbPts),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 }));
    g.add(bb);
    g.userData.bb = bb;

    registerObject(g, 2.8, -13, -11, 0.08, -0.35, 1.4);
  }

  // ─── 6. AI NEURAL NETWORK (Y=-21) ─────────────────
  function createNeuralNetwork() {
    const g = new THREE.Group();
    const layers = [4, 6, 6, 4];
    const nodePos = [];
    const nodeMeshes = [];
    const sGeo = new THREE.SphereGeometry(0.14, 8, 8);

    for (let l = 0; l < layers.length; l++) {
      const x = (l - (layers.length - 1) / 2) * 1.55;
      for (let n = 0; n < layers[l]; n++) {
        const y = (n - (layers[l] - 1) / 2) * 0.75;
        const pos = new THREE.Vector3(x, y, 0);
        nodePos.push({ pos, layer: l });

        const solid = new THREE.Mesh(sGeo, new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.9 }));
        const wire = new THREE.LineSegments(new THREE.EdgesGeometry(sGeo), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 }));
        solid.position.copy(pos); wire.position.copy(pos);
        g.add(solid, wire);
        nodeMeshes.push({ solid, wire });
      }
    }

    // Connections with visible weight lines
    let layerStart = 0;
    for (let l = 0; l < layers.length - 1; l++) {
      const nextStart = layerStart + layers[l];
      for (let i = 0; i < layers[l]; i++) {
        for (let j = 0; j < layers[l + 1]; j++) {
          const p1 = nodePos[layerStart + i].pos;
          const p2 = nodePos[nextStart + j].pos;
          g.add(new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([p1, p2]),
            new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18 })
          ));
        }
      }
      layerStart += layers[l];
    }

    // Animated data packets
    const packets = [];
    for (let i = 0; i < 10; i++) {
      const pm = new THREE.Mesh(new THREE.SphereGeometry(0.055, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      g.add(pm);
      const lIdx = Math.floor(Math.random() * (layers.length - 1));
      let s1 = 0; for (let k = 0; k < lIdx; k++) s1 += layers[k];
      const s2 = s1 + layers[lIdx];
      packets.push({ mesh: pm, from: nodePos[s1 + Math.floor(Math.random() * layers[lIdx])].pos, to: nodePos[s2 + Math.floor(Math.random() * layers[lIdx + 1])].pos, t: Math.random(), speed: 0.008 + Math.random() * 0.015 });
    }

    g.userData.nnPackets = packets;
    g.userData.nnNodes = nodeMeshes;
    g.userData.nnPos = nodePos;
    g.userData.nnLayers = layers;

    registerObject(g, 2.8, -21, -11, 0.18, -0.25, 1.3);
  }

  // ─── 7. POSE SKELETON (Y=-21) ─────────────────────
  function createPoseSkeleton() {
    const g = new THREE.Group();
    const jMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const bMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
    const jGeo = new THREE.SphereGeometry(0.07, 6, 6);

    const poseJoints = Array.from({ length: 18 }, () => {
      const m = new THREE.Mesh(jGeo, jMat);
      g.add(m);
      return m;
    });

    const poseBones = [
      [0, 1], [1, 2], [2, 3],           // spine
      [1, 4], [4, 5], [5, 6],           // left arm
      [1, 7], [7, 8], [8, 9],           // right arm
      [3, 10], [10, 11], [11, 12],      // left leg
      [3, 13], [13, 14], [14, 15],      // right leg
      [0, 16], [0, 17]                  // head markers
    ];

    const pLines = poseBones.map(pair => {
      const geo = new THREE.BufferGeometry();
      const l = new THREE.Line(geo, bMat.clone());
      g.add(l);
      return { line: l, a: pair[0], b: pair[1] };
    });

    g.userData.poseJoints = poseJoints;
    g.userData.poseLines = pLines;
    g.userData.poseTime = 0;

    registerObject(g, -2.8, -21, -11, 0, 0.28, 1.35);
  }

  // ─── 8. SPATIAL UI PANELS (Y=-30) ─────────────────
  function createSpatialUIPanels() {
    // Panel 1: Oscilloscope / telemetry waveform
    const p1 = new THREE.Group();
    p1.add(createHybrid(new THREE.BoxGeometry(2.6, 1.8, 0.04), 0.55, 0.96));
    const wavePoints = Array.from({ length: 48 }, (_, i) => new THREE.Vector3((i / 47) * 2.2 - 1.1, 0, 0.025));
    const waveLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(wavePoints),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 }));
    p1.add(waveLine);
    p1.userData.waveLine = waveLine;
    p1.userData.wavePoints = wavePoints;
    p1.userData.waveFreq = 3.5 + Math.random() * 2;
    // Panel label lines (HUD style)
    for (let i = 0; i < 3; i++) {
      const hline = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-1.1, 0.6 - i * 0.4, 0.025), new THREE.Vector3(0.4 - Math.random() * 0.8, 0.6 - i * 0.4, 0.025)]),
        new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 }));
      p1.add(hline);
    }
    registerObject(p1, -2.5, -30, -11, -0.04, 0.25, 1.3);

    // Panel 2: Bar chart analytics
    const p2 = new THREE.Group();
    p2.add(createHybrid(new THREE.BoxGeometry(2.6, 1.8, 0.04), 0.55, 0.96));
    const bars = [];
    for (let i = 0; i < 6; i++) {
      const bar = createHybrid(new THREE.BoxGeometry(0.18, 0.9, 0.04), 0.8, 0.9);
      bar.position.set((i - 2.5) * 0.35, 0, 0.025);
      p2.add(bar);
      bars.push(bar);
    }
    p2.userData.bars = bars;
    registerObject(p2, 2.5, -30, -11, -0.04, -0.25, 1.3);

    // Panel 3: Depth map grid (center bottom)
    const p3 = new THREE.Group();
    p3.add(createHybrid(new THREE.BoxGeometry(2.2, 1.6, 0.04), 0.55, 0.96));
    const depthGeo = new THREE.PlaneGeometry(1.8, 1.2, 10, 8);
    const depthWire = new THREE.LineSegments(new THREE.EdgesGeometry(depthGeo),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 }));
    depthWire.position.z = 0.025;
    p3.add(depthWire);
    p3.userData.depthWire = depthWire;
    registerObject(p3, 0, -30, -11, -0.04, 0, 1.2);
  }

  // ─── 9. DATA FUSION PIPELINE (Y=-30) ──────────────
  function createDataPipeline() {
    const g = new THREE.Group();
    const nodes = [new THREE.Vector3(-2.2, -1.1, 0), new THREE.Vector3(-0.7, 0.7, 0), new THREE.Vector3(0.7, -0.5, 0), new THREE.Vector3(2.2, 0.9, 0)];
    const nGeo = new THREE.SphereGeometry(0.14, 10, 10);

    nodes.forEach(n => {
      const m = createHybrid(nGeo, 0.85, 0.95);
      m.position.copy(n);
      g.add(m);
    });

    // Pipe lines between nodes
    for (let i = 0; i < nodes.length - 1; i++) {
      g.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([nodes[i], nodes[i + 1]]),
        new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 })
      ));
    }

    // Multiple traveling packets
    const packets = [];
    for (let i = 0; i < 4; i++) {
      const pm = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      g.add(pm);
      packets.push({ mesh: pm, seg: i % (nodes.length - 1), t: Math.random() });
    }
    g.userData.pipePackets = packets;
    g.userData.pipeNodes = nodes;
    registerObject(g, 0, -38, -11, 0, 0, 1.3);
  }

  // ─── 10. LARGE ORBITING RINGS (Background depth) ──
  function createOrbitingRings() {
    const ringData = [
      { r: 12, opacity: 0.12, tilt: 0.3, y: 0, speed: 0.001 },
      { r: 16, opacity: 0.08, tilt: -0.5, y: -5, speed: -0.0008 },
      { r: 20, opacity: 0.055, tilt: 0.7, y: -10, speed: 0.0006 }
    ];
    ringData.forEach(rd => {
      const ring = makeRing(rd.r, 96, rd.opacity, rd.tilt);
      ring.position.y = rd.y;
      ring.position.z = -18;
      ring.userData.orbitSpeed = rd.speed;
      scene.add(ring);
    });
  }

  // ─── 11. AI DATA STREAMS (floating data lines) ────
  function createAIDataStreams() {
    const streamGroup = new THREE.Group();
    const streamParticles = [];

    for (let i = 0; i < (isMobile ? 8 : 20); i++) {
      const pts = Array.from({ length: 12 }, (_, j) => new THREE.Vector3((Math.random() - 0.5) * 40, -50 + j * 3 + Math.random() * 2, -6 - Math.random() * 20));
      const sLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending })
      );
      sLine.userData.streamSpeed = 0.15 + Math.random() * 0.25;
      streamGroup.add(sLine);
      streamParticles.push(sLine);
    }

    scene.add(streamGroup);
    streamGroup.userData.streams = streamParticles;
    // Store ref globally for animation
    window._xrDataStreams = streamGroup;
  }

  // ─── ANIMATION SYSTEM ─────────────────────────────
  function animate() {
    requestAnimationFrame(animate);
    if (document.hidden) return;
    time += 0.01;

    animateParticles();
    animateOrbitingRings();
    animateDataStreams();

    objects.forEach(obj => {
      const ud = obj.userData;
      // Float drift
      obj.position.y = ud.baseY + Math.sin(time * ud.floatSpeed + ud.phase) * ud.floatAmp;
      // Auto-rotation
      obj.rotation.y = ud.baseRotY + time * ud.rotSpeedY;
      obj.rotation.x = ud.baseRotX + Math.sin(time * 0.08) * 0.04;

      // VR headset rings
      if (ud.vrRings) {
        ud.vrRings[0].rotation.y += 0.012;
        ud.vrRings[1].rotation.x -= 0.009;
        ud.vrRings[2].rotation.z += 0.006;
      }
      // IMU gyroscope rings
      if (ud.imuRings) {
        ud.imuRings[0].rotation.y += 0.025;
        ud.imuRings[1].rotation.x -= 0.02;
        ud.imuRings[2].rotation.z += 0.015;
      }
      // CV Camera scan
      if (ud.scanCone) {
        obj.rotation.y = ud.baseRotY + Math.sin(time * 1.2) * 0.45;
        ud.scanCone.material.opacity = 0.045 + Math.abs(Math.sin(time * 4.0)) * 0.04;
        ud.coneWire.material.opacity = 0.22 + Math.abs(Math.sin(time * 4.0)) * 0.12;
        ud.bb.material.opacity = 0.4 + Math.sin(time * 6.0) * 0.15;
      }
      // Neural network packets
      if (ud.nnPackets) animateNeuralNet(obj);
      // Pose skeleton
      if (ud.poseJoints) animatePose(obj);
      // Hand tracker
      if (ud.handJoints) animateHand(obj);
      // Waveform oscilloscope
      if (ud.waveLine) {
        const posAttr = ud.waveLine.geometry.attributes.position;
        for (let i = 0; i < ud.wavePoints.length; i++) {
          const x = ud.wavePoints[i].x;
          posAttr.setY(i, Math.sin(x * ud.waveFreq + time * 5.5) * 0.35 * Math.cos(time * 0.3 + i * 0.1));
        }
        posAttr.needsUpdate = true;
      }
      // Bar charts
      if (ud.bars) {
        ud.bars.forEach((bar, idx) => {
          const h = 0.3 + Math.abs(Math.sin(time * 2.5 + idx * 1.2)) * 0.65;
          bar.scale.y = Math.max(0.08, h);
          bar.position.y = (h * 0.45) - 0.3;
        });
      }
      // Depth map wire warp
      if (ud.depthWire) {
        ud.depthWire.rotation.y += 0.006;
      }
      // Data pipeline
      if (ud.pipePackets) {
        const nodes = ud.pipeNodes;
        ud.pipePackets.forEach(p => {
          p.t += 0.012;
          if (p.t >= 1.0) { p.t = 0; p.seg = (p.seg + 1) % (nodes.length - 1); }
          p.mesh.position.lerpVectors(nodes[p.seg], nodes[p.seg + 1], p.t);
        });
      }
    });

    // Cursor 3D projection
    projectMouse();
    // Magnetic bezier lines
    updateBezier();

    // Camera scroll + parallax
    const targetCamY = 3.0 - scrollPercent * 38.0;
    camera.position.x += (mouse.x * 2.5 - camera.position.x) * 0.045;
    camera.position.y += (targetCamY + mouse.y * 2.0 - camera.position.y) * 0.045;
    camera.lookAt(0, camera.position.y, -14);

    renderer.render(scene, camera);
  }

  function animateParticles() {
    if (!floatingParticles) return;
    const arr = floatingParticles.geometry.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
      arr[i * 3 + 1] += pVelocities[i].y * 0.05;
      if (arr[i * 3 + 1] > 28) arr[i * 3 + 1] = -28;

      const p = new THREE.Vector3(arr[i * 3], arr[i * 3 + 1], arr[i * 3 + 2]);
      const d = p.distanceTo(mouse3D);
      if (d < 5.5) {
        const pull = new THREE.Vector3().subVectors(mouse3D, p).normalize().multiplyScalar((5.5 - d) * 0.018);
        arr[i * 3] += pull.x;
        arr[i * 3 + 1] += pull.y;
      }
      // Gentle oscillation
      arr[i * 3] += Math.sin(time * 0.5 + i * 0.3) * 0.002;
    }
    floatingParticles.geometry.attributes.position.needsUpdate = true;
  }

  function animateOrbitingRings() {
    scene.children.forEach(obj => {
      if (obj.userData && obj.userData.orbitSpeed) {
        obj.rotation.y += obj.userData.orbitSpeed;
      }
    });
  }

  function animateDataStreams() {
    const sg = window._xrDataStreams;
    if (!sg) return;
    sg.userData.streams.forEach(s => {
      s.position.y += s.userData.streamSpeed * 0.05;
      if (s.position.y > 50) s.position.y = -50;
      s.material.opacity = 0.12 + Math.abs(Math.sin(time * 2 + s.userData.streamSpeed)) * 0.1;
    });
  }

  function animateNeuralNet(obj) {
    const ud = obj.userData;
    ud.nnPackets.forEach(p => {
      p.t += p.speed * (mouse3D.distanceTo(obj.position) < 5 ? 2.8 : 1.0);
      if (p.t >= 1.0) {
        p.t = 0;
        const l = Math.floor(Math.random() * (ud.nnLayers.length - 1));
        let s1 = 0; for (let k = 0; k < l; k++) s1 += ud.nnLayers[k];
        const s2 = s1 + ud.nnLayers[l];
        const p1Idx = s1 + Math.floor(Math.random() * ud.nnLayers[l]);
        const p2Idx = s2 + Math.floor(Math.random() * ud.nnLayers[l + 1]);
        p.from = ud.nnPos[p1Idx].pos;
        p.to = ud.nnPos[p2Idx].pos;
        // Pulse target node
        const n = ud.nnNodes[p2Idx];
        if (n) { n.solid.scale.setScalar(1.6); n.wire.scale.setScalar(1.6); }
      }
      p.mesh.position.lerpVectors(p.from, p.to, p.t);
    });
    ud.nnNodes.forEach(n => {
      if (n) {
        const s = n.solid.scale.x;
        const ns = s + (1.0 - s) * 0.06;
        n.solid.scale.setScalar(ns);
        n.wire.scale.setScalar(ns);
      }
    });
  }

  function animatePose(obj) {
    const ud = obj.userData;
    ud.poseTime += 0.012;
    const t = ud.poseTime;
    const j = ud.poseJoints;

    j[0].position.set(0, 1.4 + Math.sin(t * 1.8) * 0.05, 0);   // head
    j[16].position.set(-0.12, 1.5, 0); j[17].position.set(0.12, 1.5, 0); // ears
    j[1].position.set(0, 1.15, 0);
    j[2].position.set(0, 0.72, 0);
    j[3].position.set(0, 0.12, 0);

    j[4].position.set(-0.45, 1.0, 0);
    j[5].position.set(-0.75, 0.58 + Math.sin(t) * 0.16, Math.cos(t) * 0.28);
    j[6].position.set(-0.95, 0.18 + Math.sin(t) * 0.22, Math.cos(t) * 0.36);

    j[7].position.set(0.45, 1.0, 0);
    j[8].position.set(0.75, 0.58 - Math.sin(t) * 0.16, -Math.cos(t) * 0.28);
    j[9].position.set(0.95, 0.18 - Math.sin(t) * 0.22, -Math.cos(t) * 0.36);

    j[10].position.set(-0.22, -0.05, 0);
    j[11].position.set(-0.28, -0.52 + Math.cos(t) * 0.22, Math.sin(t) * 0.3);
    j[12].position.set(-0.32, -1.1 + Math.cos(t) * 0.16, Math.sin(t) * 0.4);

    j[13].position.set(0.22, -0.05, 0);
    j[14].position.set(0.3, -0.52 - Math.cos(t) * 0.22, -Math.sin(t) * 0.3);
    j[15].position.set(0.34, -1.1 - Math.cos(t) * 0.16, -Math.sin(t) * 0.4);

    ud.poseLines.forEach(item => {
      item.line.geometry.setFromPoints([j[item.a].position, j[item.b].position]);
      item.line.geometry.attributes.position.needsUpdate = true;
    });
  }

  function animateHand(obj) {
    const ud = obj.userData;
    ud.gestureTime += 0.008;
    const gt = ud.gestureTime;
    const poseIdx = Math.floor(gt) % 3;
    const nextIdx = (poseIdx + 1) % 3;
    const lerpT = gt % 1;
    const smooth = lerpT * lerpT * (3 - 2 * lerpT);

    // Curl factors: [thumb, index, middle, ring, pinky]
    const curls = [[1, 1, 1, 1, 1], [0.15, 0.2, 0.2, 0.2, 0.2], [0.2, 1, 0.2, 0.2, 0.2]];
    const cf = curls[poseIdx].map((v, i) => THREE.MathUtils.lerp(v, curls[nextIdx][i], smooth));

    const joints = ud.handJoints;
    const jm = ud.jMeshes;

    // Finger groups: [base, mid, tip] indices in joints array
    const fingerGroups = [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16], [17, 18, 19, 20]];
    fingerGroups.forEach((fg, fi) => {
      const basePos = joints[fg[0]].clone();
      const tipOriginal = joints[fg[fg.length - 1]].clone();
      const tipCurled = new THREE.Vector3().lerpVectors(basePos, tipOriginal, cf[fi]);
      jm[fg[fg.length - 1] - 1].position.copy(tipCurled);

      if (fg.length > 2) {
        const midCurled = new THREE.Vector3().lerpVectors(basePos, tipOriginal, cf[fi] * 0.6);
        jm[fg[1] - 1].position.copy(midCurled);
        if (fg.length > 3) {
          const mid2 = new THREE.Vector3().lerpVectors(basePos, tipOriginal, cf[fi] * 0.85);
          jm[fg[2] - 1].position.copy(mid2);
        }
      }
    });

    ud.bLines.forEach(item => {
      const p1 = item.a === 0 ? joints[0] : jm[item.a - 1].position;
      const p2 = jm[item.b - 1].position;
      item.line.geometry.setFromPoints([p1, p2]);
      item.line.geometry.attributes.position.needsUpdate = true;
    });
  }

  function projectMouse() {
    const v = new THREE.Vector3(mouse.x, mouse.y, 0.5).unproject(camera);
    const dir = v.sub(camera.position).normalize();
    const dist = -camera.position.z / dir.z;
    mouse3D.copy(camera.position).add(dir.multiplyScalar(dist));
  }

  function updateBezier() {
    const dList = objects.map(o => ({ obj: o, d: o.position.distanceTo(mouse3D) })).sort((a, b) => a.d - b.d);
    const active = mouse.x !== 0 || mouse.y !== 0;

    for (let i = 0; i < 4; i++) {
      const line = connectionLines[i];
      if (active && i < dList.length && dList[i].d < 10) {
        const from = dList[i].obj.position;
        const to = mouse3D;
        const mid = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);
        const perp = new THREE.Vector3().subVectors(to, from).normalize();
        perp.set(-perp.y, perp.x, 0).normalize().multiplyScalar(1.2);
        const ctrl = mid.clone().add(perp);
        const curve = new THREE.QuadraticBezierCurve3(from, ctrl, to);
        line.geometry.setFromPoints(curve.getPoints(23));
        line.geometry.attributes.position.needsUpdate = true;
        line.visible = true;

        // Magnetic attraction
        const tgt = dList[i].obj;
        const dx = to.x - from.x, dy = to.y - from.y;
        tgt.rotation.x += (dy * 0.1 - (tgt.rotation.x - tgt.userData.baseRotX)) * 0.04;
        tgt.rotation.y += (dx * 0.1 - (tgt.rotation.y - tgt.userData.baseRotY)) * 0.04;
        tgt.position.x += (tgt.userData.baseX + dx * 0.05 - tgt.position.x) * 0.05;
        tgt.position.z += (tgt.userData.baseZ + 0.7 - tgt.position.z) * 0.05;
        tgt.scale.setScalar(tgt.scale.x + (tgt.userData.baseScale * 1.18 - tgt.scale.x) * 0.06);
      } else {
        line.visible = false;
        if (i < dList.length) {
          const tgt = dList[i].obj;
          tgt.position.x += (tgt.userData.baseX - tgt.position.x) * 0.04;
          tgt.position.z += (tgt.userData.baseZ - tgt.position.z) * 0.04;
          tgt.scale.setScalar(tgt.scale.x + (tgt.userData.baseScale - tgt.scale.x) * 0.04);
        }
      }
    }
  }

  // Events
  window.addEventListener('scroll', () => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    scrollPercent = h > 0 ? window.scrollY / h : 0;
  });
  window.addEventListener('mousemove', e => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });
  window.addEventListener('mouseleave', () => { mouse.x = 0; mouse.y = 0; });
  window.addEventListener('resize', () => {
    width = window.innerWidth; height = window.innerHeight;
    if (camera) { camera.aspect = width / height; camera.updateProjectionMatrix(); }
    if (renderer) { renderer.setSize(width, height); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); }
  });

  initThree();
  animate();
})();


// ============================================
// 2. 3D HOVER PARALLAX TILT
// ============================================
(function() {
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return;
  const cards = document.querySelectorAll('.project-card, .cert-card, .achievement-card');
  cards.forEach(card => {
    card.addEventListener('mouseenter', () => { card.style.transition = 'transform 0.1s ease-out, border-color 0.3s, box-shadow 0.3s'; });
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const dx = e.clientX - rect.left - rect.width / 2;
      const dy = e.clientY - rect.top - rect.height / 2;
      card.style.transform = `perspective(1000px) rotateX(${-(dy / (rect.height / 2)) * 8}deg) rotateY(${(dx / (rect.width / 2)) * 8}deg) scale3d(1.02,1.02,1.02)`;
      card.querySelectorAll('.project-image, .cert-image, .achievement-badge-icon').forEach(el => {
        el.style.transform = 'translateZ(15px)'; el.style.transition = 'transform 0.1s ease-out';
      });
    });
    card.addEventListener('mouseleave', () => {
      card.style.transition = 'transform 0.5s cubic-bezier(0.16,1,0.3,1), border-color 0.3s, box-shadow 0.3s';
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
      card.querySelectorAll('.project-image, .cert-image, .achievement-badge-icon').forEach(el => {
        el.style.transform = 'translateZ(0px)'; el.style.transition = 'transform 0.5s cubic-bezier(0.16,1,0.3,1)';
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
      techHtml = `<div class="modal-detail-tech-container"><h4>Technologies</h4><div class="project-tech">${data.tech.split(',').map(t => `<span class="tech-badge">${t.trim()}</span>`).join('')}</div></div>`;
    }
    let actionButtons = '';
    if (data.type === 'project') {
      actionButtons = `<div class="modal-actions">${data.demo ? `<a href="${data.demo}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">Launch Live Demo</a>` : ''}<a href="${data.github}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">Source Code</a></div>`;
    } else if (data.type === 'cert') {
      const certLink = data.link && data.link !== '#' ? `<a href="${data.link}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">Decrypt Certificate (PDF)</a>` : `<span class="btn btn-secondary" style="pointer-events:none;opacity:0.6;">Local Copy Only</span>`;
      actionButtons = `<div class="modal-actions">${certLink}</div>`;
    }
    modalContentContainer.innerHTML = `${data.image ? `<img src="${data.image}" alt="${data.title}" class="modal-detail-img" />` : ''}<span class="modal-detail-label">${data.type === 'project' ? 'Project Details' : 'Verification Document'}</span><h3 class="modal-detail-title">${data.title}</h3><p class="modal-detail-issuer">${data.issuer || ''} ${data.status ? `• ${data.status}` : ''}</p><p class="modal-detail-desc">${data.details || data.description}</p>${techHtml}${actionButtons}`;
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

  document.querySelectorAll('.btn-detail-trigger').forEach(trigger => {
    trigger.addEventListener('click', e => {
      e.stopPropagation();
      const card = trigger.closest('.project-card, .cert-card');
      if (card) openModal(card.dataset);
    });
  });
  document.querySelectorAll('.project-card, .cert-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.tagName.toLowerCase() === 'a') return;
      openModal(card.dataset);
    });
    card.style.cursor = 'pointer';
  });
  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hasAttribute('hidden')) closeModal(); });
})();


// ============================================
// 4. NAVIGATION SYSTEM
// ============================================
(function() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');
  const menuToggle = document.getElementById('menu-toggle');
  const navMenu = document.getElementById('nav-menu');

  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
      const isOpen = navMenu.classList.contains('active');
      navMenu.classList.toggle('active');
      menuToggle.setAttribute('aria-expanded', !isOpen);
    });
    navLinks.forEach(link => link.addEventListener('click', () => {
      navMenu.classList.remove('active');
      menuToggle.setAttribute('aria-expanded', 'false');
    }));
  }

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
        setTimeout(() => { isScrollingClick = false; }, 1000);
      }
    });
  });

  const observer = new IntersectionObserver(entries => {
    if (isScrollingClick) return;
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => link.classList.toggle('active-dock', link.getAttribute('href') === `#${id}`));
      }
    });
  }, { root: null, threshold: 0.2, rootMargin: '-10% 0px -60% 0px' });
  sections.forEach(s => observer.observe(s));

  const backToTop = document.getElementById('back-to-top');
  if (backToTop) {
    window.addEventListener('scroll', throttle(() => {
      if (window.pageYOffset > 500) backToTop.removeAttribute('hidden');
      else backToTop.setAttribute('hidden', '');
    }, 100));
    backToTop.addEventListener('click', e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
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
  if (!canvas || !viewport || typeof THREE === 'undefined') return;

  let width = viewport.clientWidth;
  let height = viewport.clientHeight;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(44, width / height, 0.1, 100);
  camera.position.set(0, 3.8, 10.5);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const dl = new THREE.DirectionalLight(0xffffff, 1.0);
  dl.position.set(3, 7, 5);
  scene.add(dl);

  // Central icosahedron core
  const coreGroup = new THREE.Group();
  const coreGeo = new THREE.IcosahedronGeometry(0.6, 2);
  coreGroup.add(new THREE.Mesh(coreGeo, new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.9 })));
  coreGroup.add(new THREE.LineSegments(new THREE.EdgesGeometry(coreGeo), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.65 })));
  scene.add(coreGroup);

  // Outer pulse rings around core
  for (let i = 0; i < 3; i++) {
    const r = 0.8 + i * 0.35;
    const pts = Array.from({ length: 65 }, (_, j) => new THREE.Vector3(Math.cos(j / 64 * Math.PI * 2) * r, 0, Math.sin(j / 64 * Math.PI * 2) * r));
    const ring = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15 - i * 0.04 }));
    ring.rotation.x = Math.PI / 2 + i * 0.3;
    coreGroup.add(ring);
  }

  // 3D orbit rings
  const orbitRadii = [2.4, 3.6, 4.9];
  const orbitGroup = new THREE.Group();
  scene.add(orbitGroup);
  orbitRadii.forEach((r, i) => {
    const pts = Array.from({ length: 65 }, (_, j) => new THREE.Vector3(Math.cos(j / 64 * Math.PI * 2) * r, 0, Math.sin(j / 64 * Math.PI * 2) * r));
    const ring = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1 - i * 0.02 }));
    orbitGroup.add(ring);
  });

  // ── Skill mesh builders ──
  function hybrid(geo, wOp, sOp) {
    wOp = wOp || 0.9; sOp = sOp || 0.92;
    const g = new THREE.Group();
    g.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: sOp })));
    g.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: wOp })));
    return g;
  }

  function buildUnityMesh() {
    const g = new THREE.Group();
    const inner = hybrid(new THREE.BoxGeometry(0.4, 0.4, 0.4));
    const outer = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.65, 0.65, 0.65)),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 }));
    g.add(inner, outer);
    return g;
  }

  function buildCVMesh() {
    const g = new THREE.Group();
    g.add(hybrid(new THREE.BoxGeometry(0.26, 0.26, 0.36)));
    // Frustum lines
    const fp = [
      new THREE.Vector3(0, 0, 0.18), new THREE.Vector3(-0.45, -0.45, 1.1),
      new THREE.Vector3(0, 0, 0.18), new THREE.Vector3(0.45, -0.45, 1.1),
      new THREE.Vector3(0, 0, 0.18), new THREE.Vector3(0.45, 0.45, 1.1),
      new THREE.Vector3(0, 0, 0.18), new THREE.Vector3(-0.45, 0.45, 1.1),
      new THREE.Vector3(-0.45, -0.45, 1.1), new THREE.Vector3(0.45, -0.45, 1.1),
      new THREE.Vector3(0.45, -0.45, 1.1), new THREE.Vector3(0.45, 0.45, 1.1),
      new THREE.Vector3(0.45, 0.45, 1.1), new THREE.Vector3(-0.45, 0.45, 1.1),
      new THREE.Vector3(-0.45, 0.45, 1.1), new THREE.Vector3(-0.45, -0.45, 1.1)
    ];
    g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(fp),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 })));
    // Scanning plane
    const scan = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.7), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, side: THREE.DoubleSide }));
    scan.position.z = 0.6;
    g.add(scan);
    g.userData.scanPlane = scan;
    return g;
  }

  function buildPythonMesh() {
    const g = new THREE.Group();
    const pts = [new THREE.Vector3(0, 0.32, 0), new THREE.Vector3(-0.28, -0.14, -0.1), new THREE.Vector3(0.28, -0.14, 0.1), new THREE.Vector3(-0.1, 0.1, 0.28), new THREE.Vector3(0.1, -0.22, -0.22)];
    pts.forEach(p => {
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.9 }));
      const wire = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.SphereGeometry(0.065, 8, 8)), new THREE.LineBasicMaterial({ color: 0xffffff }));
      sphere.position.copy(p); wire.position.copy(p);
      g.add(sphere, wire);
    });
    [[0, 1], [0, 2], [1, 2], [1, 3], [2, 3], [2, 4], [3, 4]].forEach(pair => {
      g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([pts[pair[0]], pts[pair[1]]]),
        new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45 })));
    });
    const pm = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    g.add(pm);
    g.userData.packet = pm; g.userData.pts = pts; g.userData.progress = 0; g.userData.pair = [0, 1];
    return g;
  }

  function buildSensorFusionMesh() {
    const g = new THREE.Group();
    g.add(hybrid(new THREE.SphereGeometry(0.15, 10, 10)));
    const r1 = new THREE.Line(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 33 }, (_, i) => new THREE.Vector3(Math.cos(i / 32 * Math.PI * 2) * 0.48, 0, Math.sin(i / 32 * Math.PI * 2) * 0.48))),
      new THREE.LineBasicMaterial({ color: 0xffffff }));
    const r2 = new THREE.Line(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 33 }, (_, i) => new THREE.Vector3(0, Math.cos(i / 32 * Math.PI * 2) * 0.42, Math.sin(i / 32 * Math.PI * 2) * 0.42))),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 }));
    const r3 = new THREE.Line(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 33 }, (_, i) => new THREE.Vector3(Math.cos(i / 32 * Math.PI * 2) * 0.52, Math.sin(i / 32 * Math.PI * 2) * 0.52, 0))),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45 }));
    g.add(r1, r2, r3);
    g.userData.r1 = r1; g.userData.r2 = r2; g.userData.r3 = r3;
    return g;
  }

  function buildXRToolkitMesh() {
    const g = new THREE.Group();
    const cyl = hybrid(new THREE.CylinderGeometry(0.06, 0.04, 0.4, 8));
    cyl.rotation.x = Math.PI / 4;
    g.add(cyl);
    const beam = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.1, -0.1), new THREE.Vector3(0, 0.95, -0.95)]),
      new THREE.LineBasicMaterial({ color: 0xffffff }));
    g.add(beam);
    g.userData.beam = beam;
    return g;
  }

  function buildArduinoMesh() {
    const g = new THREE.Group();
    g.add(hybrid(new THREE.BoxGeometry(0.6, 0.04, 0.42)));
    const chip = hybrid(new THREE.BoxGeometry(0.16, 0.09, 0.16));
    chip.position.set(-0.12, 0.04, 0);
    g.add(chip);
    const chip2 = hybrid(new THREE.BoxGeometry(0.09, 0.065, 0.09));
    chip2.position.set(0.12, 0.03, -0.08);
    g.add(chip2);
    // Pin rows
    for (let p = -3; p <= 3; p++) {
      const pin = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(p * 0.07, 0, 0.22), new THREE.Vector3(p * 0.07, -0.08, 0.22)]),
        new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 }));
      g.add(pin);
    }
    return g;
  }

  function buildOpenCVMesh() {
    const g = new THREE.Group();
    const gridGeo = new THREE.PlaneGeometry(0.6, 0.6, 6, 6);
    const gridWire = new THREE.LineSegments(new THREE.EdgesGeometry(gridGeo),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.65 }));
    gridWire.rotation.x = -Math.PI / 3;
    g.add(gridWire);
    // Frame corners highlight
    const corners = [[-0.3, -0.3], [0.3, -0.3], [0.3, 0.3], [-0.3, 0.3]].map(([x, y]) => new THREE.Vector3(x, y, 0));
    for (let i = 0; i < 4; i++) {
      const next = (i + 1) % 4;
      g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([corners[i], corners[next]]),
        new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 })));
    }
    g.userData.gridWire = gridWire;
    return g;
  }

  function buildMediaPipeMesh() {
    const g = new THREE.Group();
    const pts = [
      new THREE.Vector3(0, -0.28, 0),    // wrist
      new THREE.Vector3(-0.15, -0.1, 0.05), new THREE.Vector3(-0.26, 0.05, 0.07),  // thumb
      new THREE.Vector3(-0.08, 0.09, 0), new THREE.Vector3(-0.1, 0.3, -0.02),     // index
      new THREE.Vector3(0, 0.12, -0.02), new THREE.Vector3(0, 0.35, -0.04),       // middle
      new THREE.Vector3(0.08, 0.09, 0), new THREE.Vector3(0.09, 0.28, -0.03),     // ring
      new THREE.Vector3(0.16, 0.03, 0.02), new THREE.Vector3(0.2, 0.2, 0.01)      // pinky
    ];
    pts.forEach(p => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.04, 5, 5), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      m.position.copy(p);
      g.add(m);
    });
    [[0, 1], [1, 2], [0, 3], [3, 4], [0, 5], [5, 6], [0, 7], [7, 8], [0, 9], [9, 10]].forEach(pair => {
      g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([pts[pair[0]], pts[pair[1]]]),
        new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 })));
    });
    return g;
  }

  // Skill node definitions
  const skillNodes = [
    { id: 'csharp', label: 'C# / Unity', orbit: 0, speed: 0.005, angle: 0, desc: 'Object-oriented scripting in Unity XR', buildMesh: buildUnityMesh },
    { id: 'python', label: 'Python', orbit: 0, speed: -0.006, angle: Math.PI, desc: 'Core AI, OpenCV and data pipeline scripting', buildMesh: buildPythonMesh },
    { id: 'unity', label: 'Unity Engine', orbit: 1, speed: 0.0038, angle: Math.PI / 4, desc: '3D game engine and XR scene editor', buildMesh: buildUnityMesh },
    { id: 'computervision', label: 'CV (OpenCV)', orbit: 1, speed: -0.0038, angle: (3 * Math.PI) / 4, desc: 'MediaPipe hand tracking & frame analysis', buildMesh: buildCVMesh },
    { id: 'arduino', label: 'Arduino / IoT', orbit: 1, speed: 0.003, angle: (5 * Math.PI) / 4, desc: 'Microcontroller code & sensor polling', buildMesh: buildArduinoMesh },
    { id: 'xrtoolkit', label: 'XR Toolkit', orbit: 2, speed: 0.002, angle: Math.PI / 3, desc: 'Locomotion & spatial ray interaction', buildMesh: buildXRToolkitMesh },
    { id: 'sensorfusion', label: 'Sensor Fusion', orbit: 2, speed: -0.002, angle: Math.PI, desc: 'IMU data polling & angular state math', buildMesh: buildSensorFusionMesh },
    { id: 'ai-design', label: 'MediaPipe / AI', orbit: 2, speed: 0.0025, angle: (7 * Math.PI) / 6, desc: 'AI gesture mapping and landmark tracking', buildMesh: buildMediaPipeMesh },
    { id: 'opencv-edge', label: 'OpenCV Edge', orbit: 2, speed: -0.0018, angle: (4 * Math.PI) / 3, desc: 'Edge detection & real-time vision pipelines', buildMesh: buildOpenCVMesh }
  ];

  // Instantiate meshes
  skillNodes.forEach(node => {
    node.mesh = node.buildMesh();
    node.group = new THREE.Group();
    node.group.add(node.mesh);
    node.mesh.traverse(c => { c.userData.skillId = node.id; });
    scene.add(node.group);
  });

  // Connection lines
  const connectionGroup = new THREE.Group();
  scene.add(connectionGroup);
  let activeNodeId = null;

  // HTML floating labels
  const labelsContainer = Object.assign(document.createElement('div'), {
    style: 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:5;'
  });
  viewport.appendChild(labelsContainer);

  const labelEls = {};
  skillNodes.forEach(node => {
    const el = document.createElement('span');
    el.className = 'orbit-floating-label';
    el.textContent = node.label;
    labelsContainer.appendChild(el);
    labelEls[node.id] = el;
  });

  let mouse = { x: -999, y: -999 };
  const raycaster = new THREE.Raycaster();
  let hoverTargetId = null;

  function updatePositions(t) {
    skillNodes.forEach(node => {
      if (activeNodeId !== node.id) node.angle += node.speed;
      const r = orbitRadii[node.orbit];
      node.group.position.set(Math.cos(node.angle) * r, Math.sin(node.angle * 1.8) * 0.2, Math.sin(node.angle) * r);
      node.mesh.rotation.y += 0.015;
      node.mesh.rotation.x += 0.006;

      if (node.mesh.userData.scanPlane) {
        const sp = node.mesh.userData.scanPlane;
        sp.position.z += 0.01;
        if (sp.position.z > 1.1) sp.position.z = 0.18;
      }
      if (node.mesh.userData.packet) {
        node.mesh.userData.progress += 0.018;
        if (node.mesh.userData.progress >= 1.0) {
          node.mesh.userData.progress = 0;
          const pts = node.mesh.userData.pts;
          let a = Math.floor(Math.random() * pts.length), b;
          do { b = Math.floor(Math.random() * pts.length); } while (b === a);
          node.mesh.userData.pair = [a, b];
        }
        node.mesh.userData.packet.position.lerpVectors(
          node.mesh.userData.pts[node.mesh.userData.pair[0]],
          node.mesh.userData.pts[node.mesh.userData.pair[1]],
          node.mesh.userData.progress
        );
      }
      if (node.mesh.userData.r1) {
        node.mesh.userData.r1.rotation.y += 0.025;
        node.mesh.userData.r2.rotation.x -= 0.02;
        node.mesh.userData.r3.rotation.z += 0.012;
      }
      if (node.mesh.userData.beam) {
        node.mesh.userData.beam.scale.setScalar(0.82 + Math.abs(Math.sin(t * 3)) * 0.2);
      }
      if (node.mesh.userData.gridWire) {
        node.mesh.userData.gridWire.rotation.z += 0.006;
      }
    });

    coreGroup.rotation.y += 0.006;
    coreGroup.rotation.x += 0.003;
    orbitGroup.rotation.y += 0.001;
  }

  function drawConnections() {
    while (connectionGroup.children.length > 0) connectionGroup.remove(connectionGroup.children[0]);
    if (!activeNodeId) return;
    const activeNode = skillNodes.find(n => n.id === activeNodeId);
    if (!activeNode) return;
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), activeNode.group.position]),
      new THREE.LineDashedMaterial({ color: 0xffffff, dashSize: 0.2, gapSize: 0.12, transparent: true, opacity: 0.6 })
    );
    line.computeLineDistances();
    connectionGroup.add(line);
  }

  function updateLabels() {
    const tv = new THREE.Vector3();
    skillNodes.forEach(node => {
      node.group.getWorldPosition(tv);
      tv.project(camera);
      if (tv.z > 1) { labelEls[node.id].style.opacity = '0'; return; }
      const x = (tv.x * 0.5 + 0.5) * width;
      const y = (-tv.y * 0.5 + 0.5) * height;
      const el = labelEls[node.id];
      el.style.transform = `translate(-50%,-100%) translate(${x}px,${y - 14}px)`;
      el.className = node.id === activeNodeId ? 'orbit-floating-label active' : 'orbit-floating-label';
      el.style.opacity = node.id === activeNodeId ? '1' : (activeNodeId ? '0.3' : '0.72');
    });
  }

  function checkHover() {
    if (mouse.x === -999) return;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(scene.children, true);
    let foundId = null;
    for (const h of hits) {
      let o = h.object;
      while (o && o !== scene) {
        if (o.userData && o.userData.skillId) { foundId = o.userData.skillId; break; }
        o = o.parent;
      }
      if (foundId) break;
    }
    if (foundId && foundId !== hoverTargetId) {
      hoverTargetId = foundId;
      const n = skillNodes.find(n => n.id === foundId);
      if (n) setActiveSkill(foundId, n.label, n.desc);
    } else if (!foundId) {
      hoverTargetId = null;
      if (!document.querySelector('.skills-list-panel .skill-tag.active-node')) resetActiveSkill();
    }
  }

  function setActiveSkill(id, label, desc) {
    if (activeNodeId === id) return;
    activeNodeId = id;
    if (titleEl) titleEl.textContent = label;
    if (descEl) descEl.textContent = desc;
    skillTags.forEach(t => t.classList.toggle('active-node', t.dataset.skill === id));
    skillNodes.forEach(n => n.group.scale.setScalar(n.id === id ? 1.5 : 1.0));
  }

  function resetActiveSkill() {
    if (!activeNodeId) return;
    activeNodeId = null;
    if (titleEl) titleEl.textContent = 'XR Core';
    if (descEl) descEl.textContent = 'Hover a Skill';
    skillTags.forEach(t => t.classList.remove('active-node'));
    skillNodes.forEach(n => n.group.scale.setScalar(1.0));
  }

  let orbitTime = 0;
  function draw() {
    requestAnimationFrame(draw);
    if (document.hidden) return;
    orbitTime += 0.01;
    updatePositions(orbitTime);
    checkHover();
    drawConnections();
    updateLabels();
    renderer.render(scene, camera);
  }

  viewport.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  });
  viewport.addEventListener('mouseleave', () => { mouse.x = -999; mouse.y = -999; });

  skillTags.forEach(tag => {
    tag.addEventListener('mouseenter', () => {
      const n = skillNodes.find(n => n.id === tag.dataset.skill);
      if (n) setActiveSkill(n.id, n.label, n.desc);
    });
    tag.addEventListener('mouseleave', resetActiveSkill);
  });

  window.addEventListener('resize', () => {
    width = viewport.clientWidth; height = viewport.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  });

  draw();
})();
