import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class StickPerson {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.skeleton = null;
        this.bones = {};
        this.meshes = {};
        this.mixer = null;
        this.clock = new THREE.Clock();
        
        this.init();
        this.createStickPerson();
        this.setupControls();
        this.animate();
    }
    
    init() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x222222);
        
        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(5, 5, 5);
        
        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.getElementById('container').appendChild(this.renderer.domElement);
        
        // Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
        
        // Ground
        const groundGeometry = new THREE.PlaneGeometry(20, 20);
        const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Grid helper
        const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x444444);
        this.scene.add(gridHelper);
        
        // Axes helper
        const axesHelper = new THREE.AxesHelper(2);
        this.scene.add(axesHelper);
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    createStickPerson() {
        // Create bone hierarchy
        this.createBones();
        
        // Create meshes and bind to bones
        this.createMeshes();
        
        // Create skeleton
        this.skeleton = new THREE.Skeleton([
            this.bones.root,
            this.bones.spine,
            this.bones.head,
            this.bones.leftShoulder,
            this.bones.leftArm,
            this.bones.leftForearm,
            this.bones.rightShoulder,
            this.bones.rightArm,
            this.bones.rightForearm,
            this.bones.leftHip,
            this.bones.leftThigh,
            this.bones.leftShin,
            this.bones.rightHip,
            this.bones.rightThigh,
            this.bones.rightShin
        ]);
        
        // Create skeleton helper for visualization
        const skeletonHelper = new THREE.SkeletonHelper(this.bones.root);
        skeletonHelper.material.color.setHex(0xff0000);
        this.scene.add(skeletonHelper);
        
        // Create animation mixer
        this.mixer = new THREE.AnimationMixer(this.bones.root);
    }
    
    createBones() {
        // Root bone (at origin)
        this.bones.root = new THREE.Bone();
        this.bones.root.position.set(0, 0, 0);
        
        // Spine (torso)
        this.bones.spine = new THREE.Bone();
        this.bones.spine.position.set(0, 1, 0);
        this.bones.root.add(this.bones.spine);
        
        // Head
        this.bones.head = new THREE.Bone();
        this.bones.head.position.set(0, 1.5, 0);
        this.bones.spine.add(this.bones.head);
        
        // Left arm chain - adjusted positions for proper connection
        this.bones.leftShoulder = new THREE.Bone();
        this.bones.leftShoulder.position.set(-0.5, 1.2, 0);
        this.bones.spine.add(this.bones.leftShoulder);
        
        this.bones.leftArm = new THREE.Bone();
        this.bones.leftArm.position.set(-0.7, 0, 0);
        this.bones.leftShoulder.add(this.bones.leftArm);
        
        this.bones.leftForearm = new THREE.Bone();
        this.bones.leftForearm.position.set(-0.7, 0, 0);
        this.bones.leftArm.add(this.bones.leftForearm);
        
        // Right arm chain - adjusted positions for proper connection
        this.bones.rightShoulder = new THREE.Bone();
        this.bones.rightShoulder.position.set(0.5, 1.2, 0);
        this.bones.spine.add(this.bones.rightShoulder);
        
        this.bones.rightArm = new THREE.Bone();
        this.bones.rightArm.position.set(0.7, 0, 0);
        this.bones.rightShoulder.add(this.bones.rightArm);
        
        this.bones.rightForearm = new THREE.Bone();
        this.bones.rightForearm.position.set(0.7, 0, 0);
        this.bones.rightArm.add(this.bones.rightForearm);
        
        // Left leg chain - adjusted positions for proper connection
        this.bones.leftHip = new THREE.Bone();
        this.bones.leftHip.position.set(-0.3, 0.2, 0);
        this.bones.root.add(this.bones.leftHip);
        
        this.bones.leftThigh = new THREE.Bone();
        this.bones.leftThigh.position.set(0, -0.8, 0);
        this.bones.leftHip.add(this.bones.leftThigh);
        
        this.bones.leftShin = new THREE.Bone();
        this.bones.leftShin.position.set(0, -0.8, 0);
        this.bones.leftThigh.add(this.bones.leftShin);
        
        // Right leg chain - adjusted positions for proper connection
        this.bones.rightHip = new THREE.Bone();
        this.bones.rightHip.position.set(0.3, 0.2, 0);
        this.bones.root.add(this.bones.rightHip);
        
        this.bones.rightThigh = new THREE.Bone();
        this.bones.rightThigh.position.set(0, -0.8, 0);
        this.bones.rightHip.add(this.bones.rightThigh);
        
        this.bones.rightShin = new THREE.Bone();
        this.bones.rightShin.position.set(0, -0.8, 0);
        this.bones.rightThigh.add(this.bones.rightShin);
        
        // Add root to scene
        this.scene.add(this.bones.root);
    }
    
    createMeshes() {
        const stickMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const jointMaterial = new THREE.MeshLambertMaterial({ color: 0xff4444 });
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        this.meshes.head = new THREE.Mesh(headGeometry, stickMaterial);
        this.meshes.head.position.copy(this.bones.head.position);
        this.meshes.head.castShadow = true;
        this.bones.spine.add(this.meshes.head);
        
        // Torso
        const torsoGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.5, 8);
        this.meshes.torso = new THREE.Mesh(torsoGeometry, stickMaterial);
        this.meshes.torso.position.set(0, 0.75, 0);
        this.meshes.torso.castShadow = true;
        this.bones.spine.add(this.meshes.torso);
        
        // Arms - positioned to connect at joints
        const armGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.7, 8);
        
        this.meshes.leftArm = new THREE.Mesh(armGeometry, stickMaterial);
        this.meshes.leftArm.position.set(-0.35, 0, 0);
        this.meshes.leftArm.rotation.z = Math.PI / 2;
        this.meshes.leftArm.castShadow = true;
        this.bones.leftShoulder.add(this.meshes.leftArm);
        
        this.meshes.leftForearm = new THREE.Mesh(armGeometry, stickMaterial);
        this.meshes.leftForearm.position.set(-0.35, 0, 0);
        this.meshes.leftForearm.rotation.z = Math.PI / 2;
        this.meshes.leftForearm.castShadow = true;
        this.bones.leftArm.add(this.meshes.leftForearm);
        
        this.meshes.rightArm = new THREE.Mesh(armGeometry, stickMaterial);
        this.meshes.rightArm.position.set(0.35, 0, 0);
        this.meshes.rightArm.rotation.z = Math.PI / 2;
        this.meshes.rightArm.castShadow = true;
        this.bones.rightShoulder.add(this.meshes.rightArm);
        
        this.meshes.rightForearm = new THREE.Mesh(armGeometry, stickMaterial);
        this.meshes.rightForearm.position.set(0.35, 0, 0);
        this.meshes.rightForearm.rotation.z = Math.PI / 2;
        this.meshes.rightForearm.castShadow = true;
        this.bones.rightArm.add(this.meshes.rightForearm);
        
        // Legs - positioned to connect at joints
        const legGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8);
        
        this.meshes.leftThigh = new THREE.Mesh(legGeometry, stickMaterial);
        this.meshes.leftThigh.position.set(0, -0.4, 0);
        this.meshes.leftThigh.castShadow = true;
        this.bones.leftHip.add(this.meshes.leftThigh);
        
        this.meshes.leftShin = new THREE.Mesh(legGeometry, stickMaterial);
        this.meshes.leftShin.position.set(0, -0.4, 0);
        this.meshes.leftShin.castShadow = true;
        this.bones.leftThigh.add(this.meshes.leftShin);
        
        this.meshes.rightThigh = new THREE.Mesh(legGeometry, stickMaterial);
        this.meshes.rightThigh.position.set(0, -0.4, 0);
        this.meshes.rightThigh.castShadow = true;
        this.bones.rightHip.add(this.meshes.rightThigh);
        
        this.meshes.rightShin = new THREE.Mesh(legGeometry, stickMaterial);
        this.meshes.rightShin.position.set(0, -0.4, 0);
        this.meshes.rightShin.castShadow = true;
        this.bones.rightThigh.add(this.meshes.rightShin);
        
        // Joint spheres for better visualization
        const jointGeometry = new THREE.SphereGeometry(0.08, 8, 8);
        
        // Add joints at key positions
        const joints = [
            { bone: this.bones.leftShoulder, pos: [0, 0, 0] },
            { bone: this.bones.rightShoulder, pos: [0, 0, 0] },
            { bone: this.bones.leftArm, pos: [0, 0, 0] },
            { bone: this.bones.rightArm, pos: [0, 0, 0] },
            { bone: this.bones.leftHip, pos: [0, 0, 0] },
            { bone: this.bones.rightHip, pos: [0, 0, 0] },
            { bone: this.bones.leftThigh, pos: [0, 0, 0] },
            { bone: this.bones.rightThigh, pos: [0, 0, 0] }
        ];
        
        joints.forEach((joint, index) => {
            const jointMesh = new THREE.Mesh(jointGeometry, jointMaterial);
            jointMesh.position.set(...joint.pos);
            jointMesh.castShadow = true;
            joint.bone.add(jointMesh);
        });
    }
    
    setupControls() {
        // Head controls
        document.getElementById('headRotX').addEventListener('input', (e) => {
            this.bones.head.rotation.x = THREE.MathUtils.degToRad(e.target.value);
        });
        
        document.getElementById('headRotY').addEventListener('input', (e) => {
            this.bones.head.rotation.y = THREE.MathUtils.degToRad(e.target.value);
        });
        
        // Left arm controls
        document.getElementById('leftArmRotX').addEventListener('input', (e) => {
            this.bones.leftArm.rotation.x = THREE.MathUtils.degToRad(e.target.value);
        });
        
        document.getElementById('leftArmRotZ').addEventListener('input', (e) => {
            this.bones.leftArm.rotation.z = THREE.MathUtils.degToRad(e.target.value);
        });
        
        // Right arm controls
        document.getElementById('rightArmRotX').addEventListener('input', (e) => {
            this.bones.rightArm.rotation.x = THREE.MathUtils.degToRad(e.target.value);
        });
        
        document.getElementById('rightArmRotZ').addEventListener('input', (e) => {
            this.bones.rightArm.rotation.z = THREE.MathUtils.degToRad(e.target.value);
        });
        
        // Left leg controls
        document.getElementById('leftLegRotX').addEventListener('input', (e) => {
            this.bones.leftThigh.rotation.x = THREE.MathUtils.degToRad(e.target.value);
        });
        
        // Right leg controls
        document.getElementById('rightLegRotX').addEventListener('input', (e) => {
            this.bones.rightThigh.rotation.x = THREE.MathUtils.degToRad(e.target.value);
        });
    }
    
    resetPose() {
        // Reset all bone rotations
        Object.values(this.bones).forEach(bone => {
            bone.rotation.set(0, 0, 0);
        });
        
        // Reset all control sliders
        document.querySelectorAll('input[type="range"]').forEach(slider => {
            slider.value = 0;
        });
    }
    
    testAnimation() {
        // Simple test animation - wave arms
        const duration = 2;
        const keyframes = [];
        
        // Create keyframe tracks for left arm
        const leftArmTrack = new THREE.NumberKeyframeTrack(
            '.bones[leftArm].rotation[z]',
            [0, 0.5, 1, 1.5, 2],
            [0, -Math.PI/2, 0, Math.PI/2, 0]
        );
        
        // Create keyframe tracks for right arm
        const rightArmTrack = new THREE.NumberKeyframeTrack(
            '.bones[rightArm].rotation[z]',
            [0, 0.5, 1, 1.5, 2],
            [0, Math.PI/2, 0, -Math.PI/2, 0]
        );
        
        // Create animation clip
        const clip = new THREE.AnimationClip('wave', duration, [leftArmTrack, rightArmTrack]);
        const action = this.mixer.clipAction(clip);
        action.play();
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const deltaTime = this.clock.getDelta();
        
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }
        
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the stick person when the page loads
const stickPerson = new StickPerson();

// Make it globally available for the HTML controls
window.stickPerson = stickPerson;