let scene = new THREE.Scene();
scene.background = new THREE.Color(0xdddddd);
let camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth/window.innerHeight,
  0.001,
  1000
);
camera.position.set(0, 1, 2);

let renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneExposure = 2.3;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

document.body.appendChild(renderer.domElement);

let spotLight_1 = new THREE.SpotLight(0xffeeb1, 4);
let spotLight_2 = new THREE.SpotLight(0xffeeb1, 4);
spotLight_1.castShadow = true;
spotLight_2.castShadow = true;

scene.add(spotLight_1, spotLight_2);

let blendLoader = new GLTFLoader();
blendLoader.load('./assets/CornellBox-Patterns.glb', function(glb) {
  let glbRoot = glb.scene;
  glbRoot.scale.set(0.2, 0.4, 0.7);
  glbRoot.position.set(0, 0.65, 0);
  scene.add(glbRoot);
},undefined, function() {
  throw new Error('An error happend');
});




function animateBox() {
  requestAnimationFrame(animateBox);
  // Update spotLight source/position
  spotLight_1.position.set(
    camera.position.x + 1,
    camera.position.y + 1,
    camera.position.z + 0.1,
  );
  spotLight_2.position.set(
    camera.position.x - 1,
    camera.position.y - 1,
    camera.position.z - 0.1,
  );
  renderer.render(scene, camera);
}

animateBox();
