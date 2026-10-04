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
  scene.add(rocket);
  let rocketModel;
  let modelCenter;
  let modelSize;

  new GLTFLoader().load('./gslv_mk3.glb', ({ scene: model }) => {
    const bounds = new THREE.Box3().setFromObject(model);
    modelCenter = bounds.getCenter(new THREE.Vector3());
    modelSize = bounds.getSize(new THREE.Vector3());
    rocketModel = model;
    rocket.add(model);
    resize();
    render();
  }, undefined, (error) => console.warn('Contact background model failed to load.', error));

  function resize() {
    const bounds = mount.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    camera.aspect = bounds.width / bounds.height;
    camera.updateProjectionMatrix();
    renderer.setSize(bounds.width, bounds.height);
    if (rocketModel) {
      const distance = camera.position.z - rocket.position.z;
      const verticalHalfFov = THREE.MathUtils.degToRad(camera.fov / 2);
      const horizontalHalfFov = Math.atan(Math.tan(verticalHalfFov) * camera.aspect);
      const halfViewWidth = distance * Math.tan(horizontalHalfFov);
      const halfViewHeight = distance * Math.tan(verticalHalfFov);
      const halfWidth = Math.hypot(modelSize.x, modelSize.z) / 2;
      const halfHeight = (modelSize.y + modelSize.x * .05 + modelSize.z * .05) / 2;
      const edgeMargin = halfViewWidth * .025;
      const heightScale = halfViewHeight * 1.88 / (2 * halfHeight);
      const widthScale = (halfViewWidth - edgeMargin) / halfWidth;
      const scale = Math.min(heightScale, widthScale);
      rocket.position.x = halfViewWidth - halfWidth * scale - edgeMargin;
      rocketModel.position.copy(modelCenter).multiplyScalar(-scale);
      rocketModel.scale.setScalar(scale);
    }
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