import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js';

const mount = document.querySelector('.contact-model');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, 1, .1, 100);
camera.position.set(0, 0, 15);

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 760 ? 1.25 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  mount.appendChild(renderer.domElement);
} catch (error) {
  console.warn('Contact background model is unavailable.', error);
}

if (renderer) {
  scene.add(new THREE.HemisphereLight(0xe3e9ed, 0x202529, 2));
  const key = new THREE.DirectionalLight(0xffffff, 3.5);
  key.position.set(5, 8, 8);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x9ba7b3, 2.5);
  rim.position.set(-6, 2, -5);
  scene.add(rim);

  const rocket = new THREE.Group();
  const isMobile = innerWidth < 760;
  rocket.position.set(isMobile ? 1 : 3.2, isMobile ? -.2 : -1.1, 0);
  scene.add(rocket);

  new GLTFLoader().load('./gslv_mk3.glb', ({ scene: model }) => {
    const bounds = new THREE.Box3().setFromObject(model);
    const center = bounds.getCenter(new THREE.Vector3());
    const dimensions = bounds.getSize(new THREE.Vector3());
    const scale = (isMobile ? 7.2 : 9.5) / Math.max(dimensions.x, dimensions.y, dimensions.z);
    model.position.copy(center).multiplyScalar(-scale);
    model.scale.setScalar(scale);
    rocket.add(model);
    render();
  }, undefined, (error) => console.warn('Contact background model failed to load.', error));

  function resize() {
    const bounds = mount.getBoundingClientRect();
    camera.aspect = bounds.width / bounds.height;
    camera.updateProjectionMatrix();
    renderer.setSize(bounds.width, bounds.height);
    rocket.position.x = innerWidth < 760 ? 1 : 3.2;
    rocket.position.y = innerWidth < 760 ? -.2 : -1.1;
    render();
  }

  function render() {
    renderer.render(scene, camera);
  }

  if (!reducedMotion) {
    const animate = () => {
      rocket.rotation.y += .003;
      rocket.rotation.x = Math.sin(performance.now() * .00035) * .045;
      render();
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  resize();
  addEventListener('resize', resize, { passive: true });
}