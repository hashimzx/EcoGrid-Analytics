import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GridRegion } from '../../types/grid.ts';
import { formatCarbon, formatCurrency, formatFrequency, formatPower } from '../../utils/formatters.ts';
import { Globe as GlobeIcon, Map as MapIcon, RotateCw, Play, Pause, Compass, Zap, ArrowRight } from 'lucide-react';

interface GlobeViewProps {
  regions: GridRegion[];
  selectedRegionId: string;
  metricView: 'carbon' | 'price' | 'clean';
  onSelectRegion: (id: string) => void;
  onOpenObservatory: (id: string) => void;
}

// Spherical coordinates: lat/lng to Vector3 on sphere of given radius
function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

// Generate procedural procedural world canvas texture for Earth surface
function createProceduralEarthTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Deep ocean gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  oceanGrad.addColorStop(0, '#040914');
  oceanGrad.addColorStop(0.5, '#060F22');
  oceanGrad.addColorStop(1, '#030712');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle longitude & latitude graticule lines
  ctx.strokeStyle = 'rgba(14, 165, 233, 0.08)';
  ctx.lineWidth = 1;
  // Latitudes
  for (let lat = -80; lat <= 80; lat += 20) {
    const y = ((90 - lat) / 180) * canvas.height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  // Longitudes
  for (let lng = -180; lng <= 180; lng += 30) {
    const x = ((lng + 180) / 360) * canvas.width;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  // Draw stylized continent landmass silhouettes (Mercator to equirectangular representation)
  ctx.fillStyle = '#0F2342';
  ctx.strokeStyle = '#1E4070';
  ctx.lineWidth = 2;

  // Approximate major landmass polygons for high-tech holographic appearance
  const drawPoly = (points: [number, number][]) => {
    ctx.beginPath();
    points.forEach(([lng, lat], i) => {
      const x = ((lng + 180) / 360) * canvas.width;
      const y = ((90 - lat) / 180) * canvas.height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };

  // North America
  drawPoly([
    [-165, 65], [-140, 70], [-90, 72], [-60, 60], [-65, 45], [-75, 30], 
    [-80, 25], [-100, 20], [-105, 22], [-120, 34], [-125, 50], [-165, 60]
  ]);
  // South America
  drawPoly([
    [-80, 10], [-60, 10], [-35, -5], [-40, -22], [-55, -35], [-70, -55], 
    [-75, -45], [-80, -10], [-80, 5]
  ]);
  // Europe
  drawPoly([
    [-10, 36], [0, 42], [10, 38], [25, 35], [30, 45], [20, 55], 
    [30, 70], [10, 65], [5, 52], [-5, 48], [-10, 36]
  ]);
  // Great Britain & Ireland
  drawPoly([
    [-10, 51], [-2, 50], [1, 53], [-1, 58], [-5, 58], [-6, 54]
  ]);
  // Africa
  drawPoly([
    [-15, 32], [10, 37], [32, 32], [50, 12], [42, -5], [35, -25], 
    [20, -35], [15, -30], [10, 0], [-15, 12], [-15, 32]
  ]);
  // Eurasia / Asia
  drawPoly([
    [30, 45], [60, 40], [80, 35], [105, 22], [120, 25], [130, 40], 
    [140, 55], [170, 65], [100, 75], [60, 70], [40, 60]
  ]);
  // Pakistan & Indus Basin
  drawPoly([[61, 25], [68, 24], [73, 31], [75, 36], [70, 36], [61, 28]]);
  // India
  drawPoly([[70, 25], [88, 22], [80, 8]]);
  // Japan
  drawPoly([[130, 32], [140, 36], [142, 44], [138, 38]]);
  // Australia
  drawPoly([
    [115, -22], [130, -12], [145, -15], [152, -28], [148, -38], 
    [135, -35], [115, -32]
  ]);

  // Electrical grid circuit network glow lines across landmasses
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
  ctx.lineWidth = 1.5;
  const connections: [[number, number], [number, number]][] = [
    [[-2.5, 54.5], [2.2, 46.6]],   // UK to France
    [[-2.5, 54.5], [9.5, 60.5]],   // UK to Norway
    [[10.4, 51.1], [9.5, 60.5]],   // Germany to Norway
    [[2.2, 46.6], [10.4, 51.1]],   // France to Germany
    [[-119.4, 36.7], [-99.9, 31.9]], // CAISO to ERCOT
    [[-99.9, 31.9], [-77.5, 39.8]],  // ERCOT to PJM
    [[69.35, 30.38], [78.96, 20.59]], // Pakistan to India
    [[69.35, 30.38], [61.0, 36.0]],   // Pakistan CASA-1000 Corridor
    [[78.96, 20.59], [103.82, 1.35]], // India to ASEAN Grid
    [[103.82, 1.35], [139.7, 35.6]],  // Singapore to Japan
    [[151.2, -33.8], [139.7, 35.6]], // APAC line
  ];

  connections.forEach(([p1, p2]) => {
    const x1 = ((p1[0] + 180) / 360) * canvas.width;
    const y1 = ((90 - p1[1]) / 180) * canvas.height;
    const x2 = ((p2[0] + 180) / 360) * canvas.width;
    const y2 = ((90 - p2[1]) / 180) * canvas.height;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Creates an always camera-facing billboard text sprite for country names on the 3D globe
function createCountryLabelSprite(
  flag: string,
  country: string,
  regionName: string,
  metricText: string,
  colorHexStr: string
): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 440;
  canvas.height = 110;
  const ctx = canvas.getContext('2d')!;

  // Translucent dark capsule background with glowing border matching the active metric
  ctx.fillStyle = 'rgba(2, 6, 23, 0.92)';
  ctx.strokeStyle = colorHexStr;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.roundRect(8, 8, canvas.width - 16, canvas.height - 16, 22);
  ctx.fill();
  ctx.stroke();

  // Subtle interior glow line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(12, 12, canvas.width - 24, canvas.height - 24, 18);
  ctx.stroke();

  // Render Country Name & Flag (Big, bold, and high-contrast)
  ctx.font = 'bold 32px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(`${flag}  ${country}`, 24, 20);

  // Render Metric Value with colored badge text
  ctx.font = 'bold 20px "JetBrains Mono", monospace';
  ctx.fillStyle = colorHexStr;
  ctx.fillText(metricText, 24, 66);

  // Region / Operator identifier
  ctx.font = '500 18px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillStyle = '#94A3B8';
  const metricWidth = ctx.measureText(metricText).width;
  ctx.fillText(`· ${regionName.split(' ')[0]}`, 24 + metricWidth + 10, 67);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const spriteMat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(1.4, 0.35, 1);
  return sprite;
}

export const GlobeView: React.FC<GlobeViewProps> = ({
  regions,
  selectedRegionId,
  metricView,
  onSelectRegion,
  onOpenObservatory,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [hoveredRegion, setHoveredRegion] = useState<GridRegion | null>(null);

  // Mutable refs for Three.js render loop to avoid teardowns
  const sceneRef = useRef<THREE.Scene | null>(null);
  const globeRef = useRef<THREE.Group | null>(null);
  const pinsGroupRef = useRef<THREE.Group | null>(null);
  const arcsGroupRef = useRef<THREE.Group | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const rotationVelocityRef = useRef({ x: 0, y: 0.0015 });
  const autoRotateRef = useRef(autoRotate);
  autoRotateRef.current = autoRotate;

  const GLOBE_RADIUS = 5.0;

  // Helper: color for active metric
  const getMetricHex = (r: GridRegion) => {
    if (metricView === 'carbon') {
      if (r.carbonIntensity <= 50) return 0x10B981; // emerald
      if (r.carbonIntensity <= 150) return 0x14B8A6; // teal
      if (r.carbonIntensity <= 280) return 0xF59E0B; // amber
      return 0xEF4444; // red
    }
    if (metricView === 'price') {
      if (r.priceInUsdPerMwh <= 40) return 0x10B981;
      if (r.priceInUsdPerMwh <= 65) return 0x06B6D4;
      if (r.priceInUsdPerMwh <= 85) return 0xF59E0B;
      return 0xEF4444;
    }
    // Clean
    if (r.cleanEnergyPercentage >= 80) return 0x10B981;
    if (r.cleanEnergyPercentage >= 50) return 0x06B6D4;
    return 0xF59E0B;
  };

  // Initialize Three.js Scene
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 960;
    const height = container.clientHeight || 560;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 2, 13);
    cameraRef.current = camera;

    // 3. WebGL Renderer
    const isHeadless = navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent);
    const renderer = new THREE.WebGLRenderer({
      antialias: !isHeadless,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x06B6D4, 1.4);
    dirLight1.position.set(12, 10, 15);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x10B981, 0.9);
    dirLight2.position.set(-15, -8, -10);
    scene.add(dirLight2);

    // 5. Starfield Background Particle Sphere
    const starCount = 600;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      const radius = 40 + Math.random() * 20;
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      starPos[i] = radius * Math.sin(phi) * Math.cos(theta);
      starPos[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPos[i + 2] = radius * Math.cos(phi);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x64748B,
      size: 0.6,
      transparent: true,
      opacity: 0.6,
    });
    const starPoints = new THREE.Points(starGeo, starMat);
    scene.add(starPoints);

    // 6. Globe Master Group
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);
    globeRef.current = globeGroup;

    // 6A. Base Earth Sphere
    const earthTexture = createProceduralEarthTexture();
    const globeGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
    const globeMat = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.7,
      metalness: 0.2,
      emissive: new THREE.Color(0x030B18),
      emissiveIntensity: 0.4,
    });
    const globeMesh = new THREE.Mesh(globeGeo, globeMat);
    globeGroup.add(globeMesh);

    // 6B. Glowing Atmospheric Rim Layer
    const atmosGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.025, 48, 48);
    const atmosMat = new THREE.MeshBasicMaterial({
      color: 0x06B6D4,
      transparent: true,
      opacity: 0.12,
      side: THREE.BackSide,
    });
    const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
    globeGroup.add(atmosMesh);

    // 7. Groups for Pins and Arcs
    const pinsGroup = new THREE.Group();
    globeGroup.add(pinsGroup);
    pinsGroupRef.current = pinsGroup;

    const arcsGroup = new THREE.Group();
    globeGroup.add(arcsGroup);
    arcsGroupRef.current = arcsGroup;

    // 8. Event Handlers: Drag-to-Rotate Globe
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !globeRef.current) return;
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      globeRef.current.rotation.y += deltaX * 0.005;
      globeRef.current.rotation.x += deltaY * 0.005;

      // Constrain vertical pitch
      globeRef.current.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, globeRef.current.rotation.x));

      rotationVelocityRef.current = { x: deltaY * 0.001, y: deltaX * 0.002 };
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!cameraRef.current) return;
      cameraRef.current.position.z = Math.max(7.5, Math.min(22, cameraRef.current.position.z + e.deltaY * 0.01));
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domElement.addEventListener('wheel', onWheel, { passive: false });

    // Touch support for mobile
    let touchStart = { x: 0, y: 0 };
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || !globeRef.current || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - touchStart.x;
      const deltaY = e.touches[0].clientY - touchStart.y;
      globeRef.current.rotation.y += deltaX * 0.006;
      globeRef.current.rotation.x += deltaY * 0.006;
      touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchEnd = () => { isDraggingRef.current = false; };
    domElement.addEventListener('touchstart', onTouchStart);
    domElement.addEventListener('touchmove', onTouchMove);
    domElement.addEventListener('touchend', onTouchEnd);

    // Resize Handler
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      cameraRef.current.aspect = newW / newH;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    // Animation Render Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (globeRef.current) {
        if (!isDraggingRef.current) {
          if (autoRotateRef.current) {
            globeRef.current.rotation.y += 0.002;
          } else {
            // Apply subtle inertia decay
            globeRef.current.rotation.y += rotationVelocityRef.current.y;
            globeRef.current.rotation.x += rotationVelocityRef.current.x;
            rotationVelocityRef.current.x *= 0.95;
            rotationVelocityRef.current.y *= 0.95;
          }
        }
      }

      // Update country label visibility and opacity based on angle facing camera
      if (pinsGroupRef.current && cameraRef.current) {
        const camPos = cameraRef.current.position;
        const tempPos = new THREE.Vector3();
        pinsGroupRef.current.children.forEach((child) => {
          if (child.userData?.isCountryLabel && child instanceof THREE.Sprite) {
            child.getWorldPosition(tempPos);
            // Facing dot product between marker normal and camera vector
            const facingDot = tempPos.normalize().dot(camPos.clone().normalize());
            if (facingDot > 0.08) {
              child.visible = true;
              child.material.opacity = Math.min(1, (facingDot - 0.08) * 3.5);
            } else {
              child.visible = false;
            }
          }
        });
      }

      // Rotate starfield slowly for cosmic atmosphere
      starPoints.rotation.y -= 0.0003;

      renderer.render(scene, camera);
    };
    animate();

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domElement.removeEventListener('wheel', onWheel);
      domElement.removeEventListener('touchstart', onTouchStart);
      domElement.removeEventListener('touchmove', onTouchMove);
      domElement.removeEventListener('touchend', onTouchEnd);
      earthTexture.dispose();
      globeGeo.dispose();
      globeMat.dispose();
      atmosGeo.dispose();
      atmosMat.dispose();
      starGeo.dispose();
      starMat.dispose();
      renderer.dispose();
    };
  }, []);

  // Update Region Pins and Interconnector 3D Arcs when regions or metric changes
  useEffect(() => {
    if (!pinsGroupRef.current || !arcsGroupRef.current) return;
    const pinsGroup = pinsGroupRef.current;
    const arcsGroup = arcsGroupRef.current;

    // Clear previous children
    while (pinsGroup.children.length > 0) {
      const child = pinsGroup.children[0] as THREE.Mesh;
      if (child.geometry) child.geometry.dispose();
      pinsGroup.remove(child);
    }
    while (arcsGroup.children.length > 0) {
      const child = arcsGroup.children[0] as THREE.Mesh;
      if (child.geometry) child.geometry.dispose();
      arcsGroup.remove(child);
    }

    // Add 3D Region Pins
    regions.forEach((region) => {
      const { lat, lng } = region.coordinates;
      const surfacePos = latLngToVector3(lat, lng, GLOBE_RADIUS);
      const elevatedPos = latLngToVector3(lat, lng, GLOBE_RADIUS + 0.35);

      const colorHex = getMetricHex(region);
      const isSelected = region.id === selectedRegionId;

      // Pin Stalk (Line/Cylinder from surface to elevated point)
      const stalkGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.35, 8);
      const stalkMat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.8 });
      const stalkMesh = new THREE.Mesh(stalkGeo, stalkMat);
      stalkMesh.position.copy(surfacePos.clone().lerp(elevatedPos, 0.5));
      stalkMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), surfacePos.clone().normalize());
      pinsGroup.add(stalkMesh);

      // Pin Head (Glowing Beacon Sphere)
      const beaconGeo = new THREE.SphereGeometry(isSelected ? 0.22 : 0.14, 16, 16);
      const beaconMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: new THREE.Color(colorHex),
        emissiveIntensity: isSelected ? 1.0 : 0.6,
        roughness: 0.2,
      });
      const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
      beaconMesh.position.copy(elevatedPos);
      beaconMesh.userData = { regionId: region.id, region };
      pinsGroup.add(beaconMesh);

      // Outer Halo Ring
      const ringGeo = new THREE.RingGeometry(0.18, 0.24, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: isSelected ? 0.9 : 0.5,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.copy(elevatedPos);
      ringMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), surfacePos.clone().normalize());
      pinsGroup.add(ringMesh);

      // Floating 3D Billboard Country Name Label
      const colorHexStr = `#${colorHex.toString(16).padStart(6, '0')}`;
      let metricText = `${region.carbonIntensity} gCO2/kWh`;
      if (metricView === 'price') {
        metricText = `${region.currencySymbol}${region.wholesalePricePerMwh}/MWh`;
      } else if (metricView === 'clean') {
        metricText = `${region.cleanEnergyPercentage}% Clean`;
      }

      const countryLabel = createCountryLabelSprite(
        region.flag,
        region.country,
        region.name,
        metricText,
        colorHexStr
      );
      countryLabel.position.copy(latLngToVector3(lat, lng, GLOBE_RADIUS + 0.65));
      countryLabel.userData = { regionId: region.id, region, isCountryLabel: true };
      pinsGroup.add(countryLabel);
    });

    // Add 3D Great-Circle Interconnector Arcs
    const regionMap = new Map(regions.map(r => [r.id, r]));
    const interconnectorPairs: [string, string][] = [
      ['gb-uk', 'fr-rte'],       // UK to France
      ['gb-uk', 'nordic-pool'],  // UK to Norway
      ['de-smard', 'nordic-pool'], // Germany to Norway
      ['fr-rte', 'de-smard'],    // France to Germany
      ['us-caiso', 'us-ercot'],  // CAISO to Texas
      ['us-ercot', 'us-pjm'],    // Texas to PJM
    ];

    interconnectorPairs.forEach(([idA, idB]) => {
      const regA = regionMap.get(idA);
      const regB = regionMap.get(idB);
      if (!regA || !regB) return;

      const pA = latLngToVector3(regA.coordinates.lat, regA.coordinates.lng, GLOBE_RADIUS);
      const pB = latLngToVector3(regB.coordinates.lat, regB.coordinates.lng, GLOBE_RADIUS);

      // Midpoint elevated above sphere to form a smooth parabolic 3D arc
      const mid = pA.clone().add(pB).multiplyScalar(0.5);
      const distance = pA.distanceTo(pB);
      const arcHeight = GLOBE_RADIUS + Math.min(2.5, Math.max(0.4, distance * 0.35));
      mid.normalize().multiplyScalar(arcHeight);

      const curve = new THREE.QuadraticBezierCurve3(pA, mid, pB);
      const points = curve.getPoints(36);
      const curveGeo = new THREE.BufferGeometry().setFromPoints(points);
      const curveMat = new THREE.LineBasicMaterial({
        color: 0x06B6D4,
        transparent: true,
        opacity: 0.65,
        linewidth: 2,
      });
      const arcLine = new THREE.Line(curveGeo, curveMat);
      arcsGroup.add(arcLine);
    });
  }, [regions, selectedRegionId, metricView]);

  // Raycasting Click & Hover Detection
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!rendererRef.current || !cameraRef.current || !pinsGroupRef.current) return;
    const rect = rendererRef.current.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);
    const intersects = raycaster.intersectObjects(pinsGroupRef.current.children);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      if (hit.userData?.regionId) {
        onSelectRegion(hit.userData.regionId);
        setHoveredRegion(hit.userData.region);
        focusOnRegion(hit.userData.region);
      }
    }
  };

  // Smoothly rotate globe to face selected region
  const focusOnRegion = (reg: GridRegion) => {
    if (!globeRef.current) return;
    const { lat, lng } = reg.coordinates;
    const targetY = -((lng) * (Math.PI / 180)) - Math.PI / 2;
    const targetX = ((lat) * (Math.PI / 180)) * 0.4;

    globeRef.current.rotation.y = targetY;
    globeRef.current.rotation.x = Math.max(-0.6, Math.min(0.6, targetX));
    setAutoRotate(false);
  };

  const activeRegion = hoveredRegion || regions.find(r => r.id === selectedRegionId) || regions[0];

  return (
    <div className="relative rounded-2xl bg-slate-950 border border-slate-800/90 overflow-hidden shadow-2xl">
      {/* 3D WebGL Canvas Container */}
      <div
        ref={mountRef}
        onClick={handleCanvasClick}
        className="w-full h-[540px] cursor-grab active:cursor-grabbing select-none"
      />

      {/* Floating 3D Navigation Controls Toolbar (Bottom Center Dock adhering to Three.js design directive) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 p-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-md shadow-2xl z-20">
        {/* Auto-rotate Toggle */}
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
            autoRotate ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-white'
          }`}
          title="Toggle auto-rotation"
        >
          {autoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{autoRotate ? 'Rotating' : 'Paused'}</span>
        </button>

        <div className="w-px h-4 bg-slate-700" />

        {/* Quick Focus: UK Grid */}
        <button
          onClick={() => {
            const uk = regions.find(r => r.id === 'gb-uk');
            if (uk) { onSelectRegion('gb-uk'); focusOnRegion(uk); }
          }}
          className="px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
        >
          <span>🇬🇧 Focus UK</span>
        </button>

        {/* Quick Focus: Europe */}
        <button
          onClick={() => {
            const nor = regions.find(r => r.id === 'nordic-pool');
            if (nor) { onSelectRegion('nordic-pool'); focusOnRegion(nor); }
          }}
          className="px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
        >
          <span>🇳🇴 Nordics</span>
        </button>

        {/* Quick Focus: Pakistan */}
        <button
          onClick={() => {
            const pk = regions.find(r => r.id === 'pk-ntdc');
            if (pk) { onSelectRegion('pk-ntdc'); focusOnRegion(pk); }
          }}
          className="px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
        >
          <span>🇵🇰 Pakistan</span>
        </button>

        {/* Quick Focus: India */}
        <button
          onClick={() => {
            const ind = regions.find(r => r.id === 'in-posoco');
            if (ind) { onSelectRegion('in-posoco'); focusOnRegion(ind); }
          }}
          className="px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
        >
          <span>🇮🇳 India</span>
        </button>

        {/* Quick Focus: US ISOs */}
        <button
          onClick={() => {
            const ca = regions.find(r => r.id === 'us-caiso');
            if (ca) { onSelectRegion('us-caiso'); focusOnRegion(ca); }
          }}
          className="px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
        >
          <span>🇺🇸 California</span>
        </button>
      </div>

      {/* Floating Selected Region Telemetry HUD (Top Left) */}
      {activeRegion && (
        <div className="absolute top-4 left-4 p-4 rounded-xl bg-slate-900/95 border border-slate-700/80 backdrop-blur-md shadow-2xl max-w-sm w-full z-20 transition-all">
          <div className="flex items-start justify-between gap-3 pb-2 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{activeRegion.flag}</span>
                <div>
                  <h3 className="text-sm font-bold text-white">{activeRegion.name}</h3>
                  <div className="text-[11px] text-slate-400 font-mono">{activeRegion.gridOperator}</div>
                </div>
              </div>
            </div>
            <button
              onClick={() => onOpenObservatory(activeRegion.id)}
              className="px-2.5 py-1 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded flex items-center gap-1 transition-colors whitespace-nowrap"
            >
              <span>Open</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
            <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Carbon Intensity</div>
              <div className="font-mono text-sm font-bold text-emerald-400 mt-0.5">
                {activeRegion.carbonIntensity} <span className="text-[10px] text-slate-400">gCO2/kWh</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Rating: {activeRegion.carbonRating}</div>
            </div>

            <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Wholesale Price</div>
              <div className="font-mono text-sm font-bold text-cyan-400 mt-0.5">
                {formatCurrency(activeRegion.wholesalePricePerMwh, activeRegion.currencySymbol)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                ≈ ${activeRegion.priceInUsdPerMwh} / MWh
              </div>
            </div>

            <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">System Frequency</div>
              <div className="font-mono text-sm font-bold text-amber-400 mt-0.5">
                {formatFrequency(activeRegion.systemFrequencyHz)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Nominal: {activeRegion.nominalFrequencyHz}.00 Hz</div>
            </div>

            <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Current Demand</div>
              <div className="font-mono text-sm font-bold text-white mt-0.5">
                {formatPower(activeRegion.currentDemandMw)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Clean: {activeRegion.cleanEnergyPercentage}%
              </div>
            </div>
          </div>

          <div className="mt-2.5 text-[10px] text-cyan-400 flex items-center justify-between font-mono">
            <span>Drag globe to rotate · Scroll to zoom</span>
            <span className="text-slate-500">Lat: {activeRegion.coordinates.lat}°</span>
          </div>
        </div>
      )}

      {/* Metric Scale Legend (Top Right) */}
      <div className="absolute top-4 right-4 p-3 rounded-lg bg-slate-950/90 border border-slate-800 text-xs hidden sm:block z-20">
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
          {metricView === 'carbon' && 'Carbon Scale (gCO2/kWh)'}
          {metricView === 'price' && 'Price Scale ($/MWh)'}
          {metricView === 'clean' && 'Clean Power Share'}
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Optimal</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
            <span>Low</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Moderate</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>High</span>
          </div>
        </div>
      </div>
    </div>
  );
};
