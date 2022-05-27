import * as THREE from 'https://cdn.skypack.dev/three@0.129.0/build/three.module.js';// './utils/three.js-master/build/three.module.js';
import {GLTFLoader} from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js';//'./utils/three.js-master/examples/jsm/loaders/GLTFLoader.js';

function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  }
}

class PatternsSlideshow extends HTMLElement {
  constructor() {
    super();

    // Global variables
    this.container = this.querySelector('.patterns-slideshow--container');
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.canvas = this.renderer.domElement;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      100,
      window.innerWidth / window.innerHeight,
      0.01,
      1000
    );
    this.sceneGroup = new THREE.Group();
    this.scene.add(this.sceneGroup);

    // Mouse utils
    this.mouseDrag = false;
    this.mousePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -2);
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.mouseIntersectionPoint = new THREE.Vector3();

    // Element dimensions
    this.container$width = this.container.offsetWidth;
    this.container$height = this.container.offsetHeight;

    // config rendere, scene & camera
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ReinhardToneMapping;
    this.renderer.toneExposure = 2.3;
    this.renderer.setSize(this.container$width, this.container$height);
    this.scene.background = new THREE.Color(0xf1f1f1);
    this.scene.fog = new THREE.Fog(0xf1f1f1, 20, 100);
    this.camera.position.set(0, 0, 5);

    // Initial material
    this.media = [
      'https://cdn.shopify.com/s/files/1/2895/0628/files/0000_ROSE_STRIPE-min.jpg?v=1653307569',
      'https://cdn.shopify.com/s/files/1/2895/0628/files/0002_LIPS_-min.jpg?v=1653306053'
    ];
    this.textures = [];

    // Initialize
    this.container.appendChild(this.canvas);
    this.startCanvas();
  }
  
  startCanvas() {
    this.initialize(() => {
      this.setupResize();
      this.addObjects();
      this.attachEvents();
      this.play();
    });
  }

  initialize(cb) {
    const promises = [];
    let _this = this;
    _this.media.forEach((url, i) => {
      let promise = new Promise(resolve => {
        _this.textures[i] = new THREE.TextureLoader().load(url, resolve);
      });
      promises.push(promise);
    });
    Promise.all(promises).then(() => cb());
  }

  setupResize() {
    window.addEventListener('resize', debounce(this.resize.bind(this), 100));
  }

  resize() {
    this.container$width = this.container.offsetWidth;
    this.container$height = this.container.offsetHeight;
    this.renderer.setSize(this.container$width, this.container$height, false);
    this.camera.aspect = this.container$width/this.container$width;

    this.camera.updateProjectionMatrix();
  }

  addObjects() {
    let _this = this;
    let blendLoader = new GLTFLoader();

    for(let i=0; i<_this.textures.length; i++) {
      const texture_mtl = new THREE.MeshPhongMaterial({ map: _this.textures[i], shininess: 10 });
      const material_map = [
        { childID: "ceiling", mtl: texture_mtl },
        { childID: "floor", mtl: texture_mtl },
        { childID: "right", mtl: texture_mtl },
        { childID: "left", mtl: texture_mtl },
        { childID: "back", mtl: texture_mtl },
      ];

      blendLoader.load('./assets/box_test.gltf', function(gltf) {
        let gltfScene = gltf.scene;
        gltfScene.scale.set(1.75, 2.25, 1.25);
        gltfScene.position.set(0, 0.3, 1);
        // Add custom material
        for (let obj of material_map) {
          _this.attachTextureObj(gltfScene, obj.childID, obj.mtl);
        }
        _this.sceneGroup.add(gltfScene);
      },undefined, function() {
        throw new Error('An error happend');
      });
      
    }
  }

  attachTextureObj(parent, type, mtl) {
    parent.traverse(o => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        if (o.name.includes(type)) {
          o.material = mtl;
          o.nameID = type;
        }
      }
    });
  }

  attachEvents() {
    this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this), false);
    this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this), false);
    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this), false);
  }
  
  onMouseDown(event) {
    this.mouseDrag = true;
  }

  onMouseUp(event) {
    this.mouseDrag = false;
  }

  onMouseMove(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 0.1 - 0.05;
    this.mouse.y = - (event.clientY / window.innerHeight) * 0.05 + 0.025;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    this.raycaster.ray.intersectPlane(this.mousePlane, this.mouseIntersectionPoint);
    this.sceneGroup.lookAt(this.mouseIntersectionPoint);

    // Dispatch drag
    if (this.mouseDrag) {
      console.log('dragging');
    }
  }

  play() {
    // hemiLight
    let hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
    hemiLight.position.set(0, 0, 5);
    this.scene.add(hemiLight);
    // dirLight
    let dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(0, 0, 4);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize = new THREE.Vector2(1024, 1024);
    this.scene.add(dirLight);

    // Render
    this.render();
  }

  render() {
    requestAnimationFrame(this.render.bind(this));
    this.renderer.render(this.scene, this.camera);
    this.camera.updateProjectionMatrix();
  }

  debounce() {
    return function debounce(fn, wait) {
      let t;
      return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), wait);
      }
    }
  }

}

customElements.define('patterns-slideshow', PatternsSlideshow);
