import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js';
import { gsap } from 'https://cdn.jsdelivr.net/npm/gsap@3.13.0/index.js';
import { ScrollTrigger } from 'https://cdn.jsdelivr.net/npm/gsap@3.13.0/ScrollTrigger.js';

gsap.registerPlugin(ScrollTrigger);

const mount = document.querySelector('#rocket-stage');
const status = document.querySelector('#model-status');
const loader = document.querySelector('#stage-loader');
const stageError = document.querySelector('#stage-error');
const callout = document.querySelector('#part-callout');
const chapters = [...document.querySelectorAll('.chapter[data-chapter]')];
const progress = document.querySelector('#scroll-progress');
const readout = document.querySelector('#readout-angle');
const partName = document.querySelector('#part-name');
const partIndex = document.querySelector('#part-index');
const calloutLeader = document.querySelector('#callout-leader');
const calloutTargetRing = document.querySelector('#callout-target-ring');
const calloutTargetDot = document.querySelector('#callout-target-dot');
const calloutOverlay = document.querySelector('.callout-overlay');
const getRenderPixelRatio = () => Math.min(Math.max(devicePixelRatio, innerWidth < 760 ? 1.25 : 1.6), innerWidth < 760 ? 1.75 : 2.25);

let renderer;
let rocket;
let rocketModel;
let pointerX = 0;
let pointerY = 0;
let activeChapter = 0;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const scene = new THREE.Scene();
scene.background = null;
const camera = new THREE.PerspectiveCamera(33, innerWidth / innerHeight, .1, 100);
camera.position.set(8.8, 3.3, 15);
camera.lookAt(0, 0, 0);

try {
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(getRenderPixelRatio());
  const stageSize = mount.getBoundingClientRect();
  camera.aspect = stageSize.width / stageSize.height;
  camera.updateProjectionMatrix();
  renderer.setSize(stageSize.width, stageSize.height);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  mount.appendChild(renderer.domElement);
} catch (error) {
  status.textContent = '3D VIEW UNAVAILABLE';
  loader.classList.add('is-hidden');
  stageError.hidden = false;
}

if (renderer) {
  scene.add(new THREE.HemisphereLight(0xdce3e8, 0x25292e, 2.1));
  const key = new THREE.DirectionalLight(0xffffff, 4.4);
  key.position.set(5, 8, 9);
  scene.add(key);
  const edge = new THREE.DirectionalLight(0x9ba7b3, 3.3);
  edge.position.set(-8, 1, -4);
  scene.add(edge);
  const fill = new THREE.PointLight(0xffffff, 12, 18);
  fill.position.set(2, -4, 7);
  scene.add(fill);

  const starCount = innerWidth < 760 ? 380 : 850;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i += 1) {
    starPositions[i * 3] = (Math.random() - .5) * 30;
    starPositions[i * 3 + 1] = (Math.random() - .5) * 22;
    starPositions[i * 3 + 2] = -5 - Math.random() * 16;
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0xc7cbd0, size: .018, transparent: true, opacity: .6, sizeAttenuation: true }));
  scene.add(stars);

  const root = new THREE.Group();
  scene.add(root);
  rocket = new THREE.Group();
  root.add(rocket);
  const loader3d = new GLTFLoader();
  loader3d.load('./rocket-g25.glb', (gltf) => {
    const model = gltf.scene;
    rocketModel = model;
    const bounds = new THREE.Box3().setFromObject(model);
    const center = bounds.getCenter(new THREE.Vector3());
    const dimensions = bounds.getSize(new THREE.Vector3());
    const scale = 6.1 / Math.max(dimensions.x, dimensions.y, dimensions.z);
    model.position.copy(center).multiplyScalar(-scale);
    model.scale.setScalar(scale);
    model.traverse((object) => {
      if (object.isMesh) {
        object.frustumCulled = true;
        if (object.material) {
          object.material.roughness = Math.max(object.material.roughness ?? .7, .42);
          object.material.metalness = Math.min(object.material.metalness ?? 0, .65);
        }
      }
    });
    rocket.add(model);
    rocket.rotation.y = -.38;
    gsap.fromTo(rocket.scale, { x: .01, y: .01, z: .01 }, { x: 1, y: 1, z: 1, duration: reducedMotion ? 0 : 1.6, ease: 'power3.out' });
    loader.classList.add('is-hidden');
    status.textContent = 'FLIGHT VEHICLE ONLINE';
    callout.classList.toggle('is-visible', activeChapter > 0);
    calloutOverlay.classList.toggle('is-hidden', activeChapter === 0);
  }, (event) => {
    if (event.total) status.textContent = `LOADING ${Math.round(event.loaded / event.total * 100)}%`;
  }, () => {
    loader.classList.add('is-hidden');
    status.textContent = 'MODEL OFFLINE';
    stageError.hidden = false;
  });

  const chapterStates = [
    { x: 2.05, y: .05, z: 0, rx: 0, ry: -.38, rz: -.025, zoom: 1 },
    { x: 2.45, y: -.04, z: .2, rx: .05, ry: .4, rz: -.09, zoom: 1.04 },
    { x: 2.3, y: -.08, z: 0, rx: -.08, ry: 1.35, rz: .035, zoom: 1.02 },
    { x: 2.5, y: .06, z: -.1, rx: .06, ry: 2.8, rz: .07, zoom: 1.1 },
    { x: 2.25, y: .15, z: .3, rx: 0, ry: 4.7, rz: .14, zoom: 1.14 },
  ];
  const partAnchors = {
    1: new THREE.Vector3(0, .385, 0),
    2: new THREE.Vector3(0, .255, 0),
    3: new THREE.Vector3(0, .13, 0),
    4: new THREE.Vector3(0, .025, 0),
  };

  function setChapter(index) {
    activeChapter = index;
    const state = chapterStates[index];
    const mobile = innerWidth < 760;
    gsap.to(root.position, { x: mobile ? 2 : state.x, y: mobile ? state.y - 1.3 : state.y, z: state.z, duration: reducedMotion ? 0 : 1.25, ease: 'power2.inOut', overwrite: true });
    gsap.to(root.rotation, { x: state.rx, y: state.ry, z: state.rz, duration: reducedMotion ? 0 : 1.55, ease: 'power2.inOut', overwrite: true });
    const scale = mobile ? state.zoom * .72 : state.zoom;
    gsap.to(root.scale, { x: scale, y: scale, z: scale, duration: reducedMotion ? 0 : 1.1, ease: 'power2.inOut', overwrite: true });
    chapters.forEach((chapter) => chapter.classList.toggle('is-active', Number(chapter.dataset.chapter) === index));
    const current = chapters.find((chapter) => Number(chapter.dataset.chapter) === index);
    const name = current?.dataset.part ?? 'FLIGHT VEHICLE';
    partName.textContent = name;
    partIndex.textContent = String(index).padStart(2, '0');
    callout.classList.toggle('is-visible', index > 0);
    calloutOverlay.classList.toggle('is-hidden', index === 0);
  }

  function updateCallout() {
    if (!rocketModel || activeChapter === 0 || !partAnchors[activeChapter]) return;
    const bounds = mount.getBoundingClientRect();
    const point = rocketModel.localToWorld(partAnchors[activeChapter].clone()).project(camera);
    const targetX = (point.x + 1) * .5 * bounds.width;
    const targetY = (1 - point.y) * .5 * bounds.height;
    const labelWidth = callout.offsetWidth;
    const labelHeight = callout.offsetHeight;
    const placeRight = targetX + labelWidth + 38 < bounds.width;
    const labelX = THREE.MathUtils.clamp(placeRight ? targetX + 30 : targetX - labelWidth - 30, 10, bounds.width - labelWidth - 10);
    const labelY = THREE.MathUtils.clamp(targetY - labelHeight * .5, 96, bounds.height - labelHeight - 40);
    const edgeX = placeRight ? labelX : labelX + labelWidth;
    const edgeY = labelY + labelHeight * .5;
    const bendX = (targetX + edgeX) * .5;
    callout.style.left = `${labelX}px`;
    callout.style.top = `${labelY}px`;
    calloutLeader.setAttribute('d', `M ${targetX} ${targetY} Q ${bendX} ${targetY}, ${edgeX} ${edgeY}`);
    calloutTargetRing.setAttribute('cx', targetX);
    calloutTargetRing.setAttribute('cy', targetY);
    calloutTargetDot.setAttribute('cx', targetX);
    calloutTargetDot.setAttribute('cy', targetY);
  }

  ScrollTrigger.create({
    trigger: '.mission',
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => { progress.style.height = `${self.progress * 100}%`; },
  });

  chapters.forEach((chapter) => {
    ScrollTrigger.create({
      trigger: chapter,
      start: 'top 54%',
      end: 'bottom 46%',
      onEnter: () => setChapter(Number(chapter.dataset.chapter)),
      onEnterBack: () => setChapter(Number(chapter.dataset.chapter)),
    });
  });

  ScrollTrigger.create({
    trigger: '#top',
    start: 'top 55%',
    end: 'bottom 50%',
    onEnter: () => setChapter(0),
    onEnterBack: () => setChapter(0),
  });

  addEventListener('pointermove', (event) => {
    pointerX = (event.clientX / innerWidth - .5) * 2;
    pointerY = (event.clientY / innerHeight - .5) * 2;
    const reticle = document.querySelector('.pointer-reticle');
    reticle.style.transform = `translate3d(${event.clientX - 12}px, ${event.clientY - 12}px, 0)`;
    if (readout) readout.textContent = `AZ ${String(Math.round((pointerX + 1) * 90)).padStart(3, '0')}°  /  EL ${String(Math.round(14 - pointerY * 8)).padStart(3, '0')}°`;
  }, { passive: true });

  let frame = 0;
  const tick = () => {
    if (!renderer) return;
    frame += 1;
    if (!reducedMotion && rocket) {
      rocket.rotation.x += (pointerY * .045 - rocket.rotation.x) * .025;
      rocket.rotation.y = -.38 + pointerX * .09 + Math.sin(frame * .007) * .025;
    }
    updateCallout();
    stars.rotation.y = pointerX * .012;
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  };
  tick();

  addEventListener('resize', () => {
    const size = mount.getBoundingClientRect();
    camera.aspect = size.width / size.height;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(getRenderPixelRatio());
    renderer.setSize(size.width, size.height);
    setChapter(activeChapter);
  }, { passive: true });
}