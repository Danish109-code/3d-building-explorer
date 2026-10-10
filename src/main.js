import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// ============================================
// 1. HTML ELEMENTS
// ============================================

const container = document.querySelector("#canvas-container");
const viewer = document.querySelector(".viewer");
const statusElement = document.querySelector("#viewer-status");
const resetButton = document.querySelector("#reset-camera");

const componentNameElement = document.querySelector("#component-name");
const componentDimensionsElement = document.querySelector(
  "#component-dimensions",
);

// ============================================
// 2. SCENE
// ============================================

const scene = new THREE.Scene();
scene.background = new THREE.Color("#dce5ed");

// ============================================
// 3. CAMERA
// ============================================

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);

const initialCameraPosition = new THREE.Vector3(9, 8, 11);
camera.position.copy(initialCameraPosition);

// ============================================
// 4. RENDERER
// ============================================

const renderer = new THREE.WebGLRenderer({
  antialias: true,
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

container.appendChild(renderer.domElement);

function resizeRenderer() {
  const width = viewer.clientWidth;
  const height = viewer.clientHeight;

  if (width === 0 || height === 0) return;

  renderer.setSize(width, height);

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

resizeRenderer();
window.addEventListener("resize", resizeRenderer);

// ============================================
// 5. LIGHTING
// ============================================

const ambientLight = new THREE.HemisphereLight(0xffffff, 0x8793a2, 2);

scene.add(ambientLight);

const sunlight = new THREE.DirectionalLight(0xffffff, 2.5);
sunlight.position.set(8, 12, 6);
sunlight.castShadow = true;
sunlight.shadow.mapSize.set(2048, 2048);

scene.add(sunlight);

// ============================================
// 6. GROUND AND GRID
// ============================================

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(40, 40),
  new THREE.MeshStandardMaterial({
    color: "#e9eef2",
    roughness: 0.9,
  }),
);

ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.05;
ground.receiveShadow = true;
scene.add(ground);

const grid = new THREE.GridHelper(40, 40, "#8b9bab", "#c0ccd6");

grid.position.y = 0.01;
scene.add(grid);

// ============================================
// 7. BUILDING GROUPS AND MATERIALS
// ============================================

const building = new THREE.Group();
scene.add(building);

const floorGroups = [];
const roofGroup = new THREE.Group();

building.add(roofGroup);

const wallMaterial = new THREE.MeshStandardMaterial({
  color: "#f0eee8",
  roughness: 0.85,
});

const floorMaterial = new THREE.MeshStandardMaterial({
  color: "#b7c4d0",
  roughness: 0.9,
});

const glassMaterial = new THREE.MeshStandardMaterial({
  color: "#65a9c8",
  metalness: 0.15,
  roughness: 0.25,
});

// ============================================
// 8. BUILDING DIMENSIONS
// ============================================

const floorHeight = 2.4;
const buildingWidth = 5;
const buildingDepth = 4;

// ============================================
// 9. HELPER TO CREATE BUILDING COMPONENTS
// ============================================

function createComponent(name, dimensions, position, material) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(dimensions[0], dimensions[1], dimensions[2]),
    material,
  );

  mesh.name = name;
  mesh.position.set(position[0], position[1], position[2]);

  mesh.userData.dimensions = [...dimensions];

  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
}

// ============================================
// 10. CREATE THREE FLOORS
// ============================================

for (let floor = 0; floor < 3; floor++) {
  const floorNumber = floor + 1;
  const baseY = floor * floorHeight;

  const floorGroup = new THREE.Group();
  floorGroup.name = `Floor ${floorNumber}`;

  building.add(floorGroup);
  floorGroups.push(floorGroup);

  // Floor slab
  const slab = createComponent(
    `Floor ${floorNumber} Slab`,
    [buildingWidth + 0.2, 0.18, buildingDepth + 0.2],
    [0, baseY + 0.09, 0],
    floorMaterial,
  );

  floorGroup.add(slab);

  // Exterior walls
  const walls = createComponent(
    `Floor ${floorNumber} Walls`,
    [buildingWidth, floorHeight - 0.18, buildingDepth],
    [0, baseY + floorHeight / 2 + 0.09, 0],
    wallMaterial,
  );

  floorGroup.add(walls);

  // Front windows
  for (let windowIndex = 0; windowIndex < 3; windowIndex++) {
    const x = (windowIndex - 1) * 1.35;

    const windowMesh = createComponent(
      `Floor ${floorNumber} Window ${windowIndex + 1}`,
      [0.8, 0.9, 0.06],
      [x, baseY + 1.25, buildingDepth / 2 + 0.035],
      glassMaterial,
    );

    floorGroup.add(windowMesh);
  }
}

// ============================================
// 11. ROOF
// ============================================

const roof = createComponent(
  "Roof",
  [buildingWidth + 0.3, 0.2, buildingDepth + 0.3],
  [0, 3 * floorHeight + 0.1, 0],
  floorMaterial,
);

roofGroup.add(roof);

// ============================================
// 12. FLOOR VISIBILITY CHECKBOXES
// ============================================

floorGroups.forEach((floorGroup, index) => {
  const checkbox = document.querySelector(`#floor-${index + 1}`);

  checkbox.addEventListener("change", () => {
    floorGroup.visible = checkbox.checked;
    clearSelectionIfHidden();
  });
});

const roofCheckbox = document.querySelector("#roof-toggle");

roofCheckbox.addEventListener("change", () => {
  roofGroup.visible = roofCheckbox.checked;
  clearSelectionIfHidden();
});

// ============================================
// 13. ISOLATE FLOOR CONTROLS
// ============================================

function isolateFloor(selectedIndex) {
  floorGroups.forEach((floorGroup, index) => {
    const checkbox = document.querySelector(`#floor-${index + 1}`);

    floorGroup.visible = index === selectedIndex;
    checkbox.checked = floorGroup.visible;
  });

  roofGroup.visible = false;
  roofCheckbox.checked = false;

  clearSelection();
}

document
  .querySelector("#isolate-floor-1")
  .addEventListener("click", () => isolateFloor(0));

document
  .querySelector("#isolate-floor-2")
  .addEventListener("click", () => isolateFloor(1));

document
  .querySelector("#isolate-floor-3")
  .addEventListener("click", () => isolateFloor(2));

document.querySelector("#show-all-floors").addEventListener("click", () => {
  floorGroups.forEach((floorGroup, index) => {
    floorGroup.visible = true;

    document.querySelector(`#floor-${index + 1}`).checked = true;
  });

  roofGroup.visible = true;
  roofCheckbox.checked = true;

  clearSelection();
});

// ============================================
// 14. CAMERA CONTROLS
// ============================================

const controls = new OrbitControls(camera, renderer.domElement);

controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.target.set(0, 3.4, 0);
controls.minDistance = 5;
controls.maxDistance = 25;
controls.maxPolarAngle = Math.PI / 2 - 0.03;

controls.update();

resetButton.addEventListener("click", () => {
  camera.position.copy(initialCameraPosition);
  controls.target.set(0, 3.4, 0);
  controls.update();
});

// ============================================
// 15. COMPONENT INSPECTOR
// ============================================

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const highlightMaterial = new THREE.MeshStandardMaterial({
  color: "#ffd166",
  emissive: "#664400",
  roughness: 0.65,
});

let selectedComponent = null;
let originalSelectedMaterial = null;

function clearSelection() {
  if (selectedComponent && originalSelectedMaterial) {
    selectedComponent.material = originalSelectedMaterial;
  }

  selectedComponent = null;
  originalSelectedMaterial = null;

  componentNameElement.textContent = "None selected";
  componentDimensionsElement.textContent = "—";
}

function clearSelectionIfHidden() {
  if (!selectedComponent) return;

  let parent = selectedComponent;
  let isVisible = true;

  while (parent && parent !== scene) {
    if (!parent.visible) {
      isVisible = false;
      break;
    }

    parent = parent.parent;
  }

  if (!isVisible) {
    clearSelection();
  }
}

renderer.domElement.addEventListener("click", (event) => {
  const rect = renderer.domElement.getBoundingClientRect();

  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);

  const meshes = [];

  building.traverse((object) => {
    if (object.isMesh && object.visible) {
      let parent = object.parent;
      let visible = true;

      while (parent && parent !== scene) {
        if (!parent.visible) {
          visible = false;
          break;
        }

        parent = parent.parent;
      }

      if (visible) meshes.push(object);
    }
  });

  const hits = raycaster.intersectObjects(meshes, false);

  clearSelection();

  if (hits.length === 0) return;

  selectedComponent = hits[0].object;
  originalSelectedMaterial = selectedComponent.material;

  selectedComponent.material = highlightMaterial;

  componentNameElement.textContent = selectedComponent.name;

  const dimensions = selectedComponent.userData.dimensions;

  componentDimensionsElement.textContent = dimensions
    ? dimensions.map((value) => `${value.toFixed(2)} m`).join(" × ")
    : "Not available";
});

// ============================================
// 16. RENDER LOOP
// ============================================

statusElement.textContent = "Ready";

function animate() {
  requestAnimationFrame(animate);

  controls.update();
  renderer.render(scene, camera);
}

animate();
