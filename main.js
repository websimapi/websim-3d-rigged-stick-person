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
        
        // Create skeleton with all bones
        const allBones = [
            this.bones.root,
            this.bones.spine,
            this.bones.chest,
            this.bones.neck,
            this.bones.head,
            this.bones.leftShoulder,
            this.bones.leftArm,
            this.bones.leftElbow,
            this.bones.leftForearm,
            this.bones.leftHand,
            this.bones.rightShoulder,
            this.bones.rightArm,
            this.bones.rightElbow,
            this.bones.rightForearm,
            this.bones.rightHand,
            this.bones.leftHip,
            this.bones.leftThigh,
            this.bones.leftKnee,
            this.bones.leftShin,
            this.bones.leftFoot,
            this.bones.leftToes,
            this.bones.rightHip,
            this.bones.rightThigh,
            this.bones.rightKnee,
            this.bones.rightShin,
            this.bones.rightFoot,
            this.bones.rightToes
        ];
        
        // Add finger bones
        Object.values(this.bones.leftFingers).forEach(finger => {
            allBones.push(finger.base, finger.middle, finger.tip);
        });
        
        Object.values(this.bones.rightFingers).forEach(finger => {
            allBones.push(finger.base, finger.middle, finger.tip);
        });
        
        this.skeleton = new THREE.Skeleton(allBones);
        
        // Create skeleton helper for visualization
        const skeletonHelper = new THREE.SkeletonHelper(this.bones.root);
        skeletonHelper.material.color.setHex(0xff0000);
        this.scene.add(skeletonHelper);
        
        // Create animation mixer
        this.mixer = new THREE.AnimationMixer(this.bones.root);
    }
    
    createBones() {
        // Root bone (at feet level)
        this.bones.root = new THREE.Bone();
        this.bones.root.position.set(0, 0, 0);
        
        // Spine (hip level)
        this.bones.spine = new THREE.Bone();
        this.bones.spine.position.set(0, 0.8, 0);
        this.bones.root.add(this.bones.spine);
        
        // Chest (shoulder level)
        this.bones.chest = new THREE.Bone();
        this.bones.chest.position.set(0, 0.6, 0);
        this.bones.spine.add(this.bones.chest);
        
        // Neck
        this.bones.neck = new THREE.Bone();
        this.bones.neck.position.set(0, 0.15, 0);
        this.bones.chest.add(this.bones.neck);
        
        // Head
        this.bones.head = new THREE.Bone();
        this.bones.head.position.set(0, 0.15, 0);
        this.bones.neck.add(this.bones.head);
        
        // Left shoulder
        this.bones.leftShoulder = new THREE.Bone();
        this.bones.leftShoulder.position.set(-0.15, 0, 0);
        this.bones.chest.add(this.bones.leftShoulder);
        
        // Left arm (upper arm)
        this.bones.leftArm = new THREE.Bone();
        this.bones.leftArm.position.set(0, 0, 0);
        this.bones.leftShoulder.add(this.bones.leftArm);
        
        // Left elbow
        this.bones.leftElbow = new THREE.Bone();
        this.bones.leftElbow.position.set(-0.3, 0, 0);
        this.bones.leftArm.add(this.bones.leftElbow);
        
        // Left forearm
        this.bones.leftForearm = new THREE.Bone();
        this.bones.leftForearm.position.set(0, 0, 0);
        this.bones.leftElbow.add(this.bones.leftForearm);
        
        // Left hand
        this.bones.leftHand = new THREE.Bone();
        this.bones.leftHand.position.set(-0.25, 0, 0);
        this.bones.leftForearm.add(this.bones.leftHand);
        
        // Left hand fingers
        this.bones.leftFingers = {};
        const fingerNames = ['thumb', 'index', 'middle', 'ring', 'pinky'];
        const leftFingerPositions = [
            [-0.04, 0.02, 0.015],  // thumb
            [-0.06, 0.03, 0],      // index
            [-0.06, 0.01, 0],      // middle
            [-0.06, -0.01, 0],     // ring
            [-0.06, -0.03, 0]      // pinky
        ];
        
        fingerNames.forEach((name, i) => {
            this.bones.leftFingers[name] = {};
            
            // Finger base
            this.bones.leftFingers[name].base = new THREE.Bone();
            this.bones.leftFingers[name].base.position.set(...leftFingerPositions[i]);
            this.bones.leftHand.add(this.bones.leftFingers[name].base);
            
            // Finger middle
            this.bones.leftFingers[name].middle = new THREE.Bone();
            this.bones.leftFingers[name].middle.position.set(-0.02, 0, 0);
            this.bones.leftFingers[name].base.add(this.bones.leftFingers[name].middle);
            
            // Finger tip
            this.bones.leftFingers[name].tip = new THREE.Bone();
            this.bones.leftFingers[name].tip.position.set(-0.015, 0, 0);
            this.bones.leftFingers[name].middle.add(this.bones.leftFingers[name].tip);
        });
        
        // Right shoulder
        this.bones.rightShoulder = new THREE.Bone();
        this.bones.rightShoulder.position.set(0.15, 0, 0);
        this.bones.chest.add(this.bones.rightShoulder);
        
        // Right arm (upper arm)
        this.bones.rightArm = new THREE.Bone();
        this.bones.rightArm.position.set(0, 0, 0);
        this.bones.rightShoulder.add(this.bones.rightArm);
        
        // Right elbow
        this.bones.rightElbow = new THREE.Bone();
        this.bones.rightElbow.position.set(0.3, 0, 0);
        this.bones.rightArm.add(this.bones.rightElbow);
        
        // Right forearm
        this.bones.rightForearm = new THREE.Bone();
        this.bones.rightForearm.position.set(0, 0, 0);
        this.bones.rightElbow.add(this.bones.rightForearm);
        
        // Right hand
        this.bones.rightHand = new THREE.Bone();
        this.bones.rightHand.position.set(0.25, 0, 0);
        this.bones.rightForearm.add(this.bones.rightHand);
        
        // Right hand fingers
        this.bones.rightFingers = {};
        const rightFingerPositions = [
            [0.04, 0.02, 0.015],   // thumb
            [0.06, 0.03, 0],       // index
            [0.06, 0.01, 0],       // middle
            [0.06, -0.01, 0],      // ring
            [0.06, -0.03, 0]       // pinky
        ];
        
        fingerNames.forEach((name, i) => {
            this.bones.rightFingers[name] = {};
            
            // Finger base
            this.bones.rightFingers[name].base = new THREE.Bone();
            this.bones.rightFingers[name].base.position.set(...rightFingerPositions[i]);
            this.bones.rightHand.add(this.bones.rightFingers[name].base);
            
            // Finger middle
            this.bones.rightFingers[name].middle = new THREE.Bone();
            this.bones.rightFingers[name].middle.position.set(0.02, 0, 0);
            this.bones.rightFingers[name].base.add(this.bones.rightFingers[name].middle);
            
            // Finger tip
            this.bones.rightFingers[name].tip = new THREE.Bone();
            this.bones.rightFingers[name].tip.position.set(0.015, 0, 0);
            this.bones.rightFingers[name].middle.add(this.bones.rightFingers[name].tip);
        });
        
        // Left hip
        this.bones.leftHip = new THREE.Bone();
        this.bones.leftHip.position.set(-0.08, 0, 0);
        this.bones.spine.add(this.bones.leftHip);
        
        // Left thigh
        this.bones.leftThigh = new THREE.Bone();
        this.bones.leftThigh.position.set(0, 0, 0);
        this.bones.leftHip.add(this.bones.leftThigh);
        
        // Left knee
        this.bones.leftKnee = new THREE.Bone();
        this.bones.leftKnee.position.set(0, -0.4, 0);
        this.bones.leftThigh.add(this.bones.leftKnee);
        
        // Left shin
        this.bones.leftShin = new THREE.Bone();
        this.bones.leftShin.position.set(0, 0, 0);
        this.bones.leftKnee.add(this.bones.leftShin);
        
        // Left foot
        this.bones.leftFoot = new THREE.Bone();
        this.bones.leftFoot.position.set(0, -0.4, 0);
        this.bones.leftShin.add(this.bones.leftFoot);
        
        // Left toes
        this.bones.leftToes = new THREE.Bone();
        this.bones.leftToes.position.set(0, 0, 0.1);
        this.bones.leftFoot.add(this.bones.leftToes);
        
        // Right hip
        this.bones.rightHip = new THREE.Bone();
        this.bones.rightHip.position.set(0.08, 0, 0);
        this.bones.spine.add(this.bones.rightHip);
        
        // Right thigh
        this.bones.rightThigh = new THREE.Bone();
        this.bones.rightThigh.position.set(0, 0, 0);
        this.bones.rightHip.add(this.bones.rightThigh);
        
        // Right knee
        this.bones.rightKnee = new THREE.Bone();
        this.bones.rightKnee.position.set(0, -0.4, 0);
        this.bones.rightThigh.add(this.bones.rightKnee);
        
        // Right shin
        this.bones.rightShin = new THREE.Bone();
        this.bones.rightShin.position.set(0, 0, 0);
        this.bones.rightKnee.add(this.bones.rightShin);
        
        // Right foot
        this.bones.rightFoot = new THREE.Bone();
        this.bones.rightFoot.position.set(0, -0.4, 0);
        this.bones.rightShin.add(this.bones.rightFoot);
        
        // Right toes
        this.bones.rightToes = new THREE.Bone();
        this.bones.rightToes.position.set(0, 0, 0.1);
        this.bones.rightFoot.add(this.bones.rightToes);
        
        // Add root to scene
        this.scene.add(this.bones.root);
    }
    
    createMeshes() {
        const stickMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const jointMaterial = new THREE.MeshLambertMaterial({ color: 0xff4444 });
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.12, 16, 16);
        this.meshes.head = new THREE.Mesh(headGeometry, stickMaterial);
        this.meshes.head.castShadow = true;
        this.bones.head.add(this.meshes.head);
        
        // Torso pieces
        const torsoGeometry = new THREE.CylinderGeometry(0.06, 0.08, 0.6, 8);
        this.meshes.torso = new THREE.Mesh(torsoGeometry, stickMaterial);
        this.meshes.torso.position.set(0, 0.3, 0);
        this.meshes.torso.castShadow = true;
        this.bones.chest.add(this.meshes.torso);
        
        // Neck
        const neckGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.15, 8);
        this.meshes.neck = new THREE.Mesh(neckGeometry, stickMaterial);
        this.meshes.neck.position.set(0, 0.075, 0);
        this.meshes.neck.castShadow = true;
        this.bones.neck.add(this.meshes.neck);
        
        // Left upper arm
        const upperArmGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.3, 8);
        this.meshes.leftUpperArm = new THREE.Mesh(upperArmGeometry, stickMaterial);
        this.meshes.leftUpperArm.position.set(-0.15, 0, 0);
        this.meshes.leftUpperArm.rotation.z = Math.PI / 2;
        this.meshes.leftUpperArm.castShadow = true;
        this.bones.leftArm.add(this.meshes.leftUpperArm);
        
        // Left forearm
        const forearmGeometry = new THREE.CylinderGeometry(0.025, 0.025, 0.25, 8);
        this.meshes.leftForearm = new THREE.Mesh(forearmGeometry, stickMaterial);
        this.meshes.leftForearm.position.set(-0.125, 0, 0);
        this.meshes.leftForearm.rotation.z = Math.PI / 2;
        this.meshes.leftForearm.castShadow = true;
        this.bones.leftForearm.add(this.meshes.leftForearm);
        
        // Right upper arm
        this.meshes.rightUpperArm = new THREE.Mesh(upperArmGeometry, stickMaterial);
        this.meshes.rightUpperArm.position.set(0.15, 0, 0);
        this.meshes.rightUpperArm.rotation.z = Math.PI / 2;
        this.meshes.rightUpperArm.castShadow = true;
        this.bones.rightArm.add(this.meshes.rightUpperArm);
        
        // Right forearm
        this.meshes.rightForearm = new THREE.Mesh(forearmGeometry, stickMaterial);
        this.meshes.rightForearm.position.set(0.125, 0, 0);
        this.meshes.rightForearm.rotation.z = Math.PI / 2;
        this.meshes.rightForearm.castShadow = true;
        this.bones.rightForearm.add(this.meshes.rightForearm);
        
        // Hands
        const handGeometry = new THREE.BoxGeometry(0.06, 0.04, 0.02);
        
        this.meshes.leftHand = new THREE.Mesh(handGeometry, stickMaterial);
        this.meshes.leftHand.position.set(-0.03, 0, 0);
        this.meshes.leftHand.castShadow = true;
        this.bones.leftHand.add(this.meshes.leftHand);
        
        this.meshes.rightHand = new THREE.Mesh(handGeometry, stickMaterial);
        this.meshes.rightHand.position.set(0.03, 0, 0);
        this.meshes.rightHand.castShadow = true;
        this.bones.rightHand.add(this.meshes.rightHand);
        
        // Fingers
        const fingerGeometry = new THREE.CylinderGeometry(0.003, 0.003, 0.02, 6);
        
        // Left fingers
        Object.values(this.bones.leftFingers).forEach(finger => {
            const fingerMesh1 = new THREE.Mesh(fingerGeometry, stickMaterial);
            fingerMesh1.position.set(-0.01, 0, 0);
            fingerMesh1.rotation.z = Math.PI / 2;
            fingerMesh1.castShadow = true;
            finger.base.add(fingerMesh1);
            
            const fingerMesh2 = new THREE.Mesh(fingerGeometry, stickMaterial);
            fingerMesh2.position.set(-0.01, 0, 0);
            fingerMesh2.rotation.z = Math.PI / 2;
            fingerMesh2.castShadow = true;
            finger.middle.add(fingerMesh2);
        });
        
        // Right fingers
        Object.values(this.bones.rightFingers).forEach(finger => {
            const fingerMesh1 = new THREE.Mesh(fingerGeometry, stickMaterial);
            fingerMesh1.position.set(0.01, 0, 0);
            fingerMesh1.rotation.z = Math.PI / 2;
            fingerMesh1.castShadow = true;
            finger.base.add(fingerMesh1);
            
            const fingerMesh2 = new THREE.Mesh(fingerGeometry, stickMaterial);
            fingerMesh2.position.set(0.01, 0, 0);
            fingerMesh2.rotation.z = Math.PI / 2;
            fingerMesh2.castShadow = true;
            finger.middle.add(fingerMesh2);
        });
        
        // Left thigh
        const thighGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.4, 8);
        this.meshes.leftThigh = new THREE.Mesh(thighGeometry, stickMaterial);
        this.meshes.leftThigh.position.set(0, -0.2, 0);
        this.meshes.leftThigh.castShadow = true;
        this.bones.leftThigh.add(this.meshes.leftThigh);
        
        // Left shin
        const shinGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.4, 8);
        this.meshes.leftShin = new THREE.Mesh(shinGeometry, stickMaterial);
        this.meshes.leftShin.position.set(0, -0.2, 0);
        this.meshes.leftShin.castShadow = true;
        this.bones.leftShin.add(this.meshes.leftShin);
        
        // Right thigh
        this.meshes.rightThigh = new THREE.Mesh(thighGeometry, stickMaterial);
        this.meshes.rightThigh.position.set(0, -0.2, 0);
        this.meshes.rightThigh.castShadow = true;
        this.bones.rightThigh.add(this.meshes.rightThigh);
        
        // Right shin
        this.meshes.rightShin = new THREE.Mesh(shinGeometry, stickMaterial);
        this.meshes.rightShin.position.set(0, -0.2, 0);
        this.meshes.rightShin.castShadow = true;
        this.bones.rightShin.add(this.meshes.rightShin);
        
        // Feet
        const footGeometry = new THREE.BoxGeometry(0.15, 0.04, 0.08);
        
        this.meshes.leftFoot = new THREE.Mesh(footGeometry, stickMaterial);
        this.meshes.leftFoot.position.set(0, 0, 0.04);
        this.meshes.leftFoot.castShadow = true;
        this.bones.leftFoot.add(this.meshes.leftFoot);
        
        this.meshes.rightFoot = new THREE.Mesh(footGeometry, stickMaterial);
        this.meshes.rightFoot.position.set(0, 0, 0.04);
        this.meshes.rightFoot.castShadow = true;
        this.bones.rightFoot.add(this.meshes.rightFoot);
        
        // Joint spheres for better visualization
        const jointGeometry = new THREE.SphereGeometry(0.035, 8, 8);
        const smallJointGeometry = new THREE.SphereGeometry(0.02, 6, 6);
        
        // Major joints
        const majorJoints = [
            { bone: this.bones.neck, size: 'small' },
            { bone: this.bones.leftShoulder, size: 'normal' },
            { bone: this.bones.rightShoulder, size: 'normal' },
            { bone: this.bones.leftElbow, size: 'normal' },
            { bone: this.bones.rightElbow, size: 'normal' },
            { bone: this.bones.leftHip, size: 'normal' },
            { bone: this.bones.rightHip, size: 'normal' },
            { bone: this.bones.leftKnee, size: 'normal' },
            { bone: this.bones.rightKnee, size: 'normal' },
            { bone: this.bones.leftHand, size: 'small' },
            { bone: this.bones.rightHand, size: 'small' },
            { bone: this.bones.leftFoot, size: 'small' },
            { bone: this.bones.rightFoot, size: 'small' }
        ];
        
        majorJoints.forEach((joint) => {
            const geom = joint.size === 'small' ? smallJointGeometry : jointGeometry;
            const jointMesh = new THREE.Mesh(geom, jointMaterial);
            jointMesh.position.set(0, 0, 0);
            jointMesh.castShadow = true;
            joint.bone.add(jointMesh);
        });
    }
    
    setupControls() {
        // Head and neck controls
        document.getElementById('headRotX').addEventListener('input', (e) => {
            this.bones.head.rotation.x = THREE.MathUtils.degToRad(e.target.value);
        });
        
        document.getElementById('headRotY').addEventListener('input', (e) => {
            this.bones.head.rotation.y = THREE.MathUtils.degToRad(e.target.value);
        });
        
        document.getElementById('neckRotX').addEventListener('input', (e) => {
            this.bones.neck.rotation.x = THREE.MathUtils.degToRad(e.target.value);
        });
        
        document.getElementById('neckRotY').addEventListener('input', (e) => {
            this.bones.neck.rotation.y = THREE.MathUtils.degToRad(e.target.value);
        });
        
        // Left arm controls
        document.getElementById('leftArmRotX').addEventListener('input', (e) => {
            this.bones.leftArm.rotation.x = THREE.MathUtils.degToRad(e.target.value);
        });
        
        document.getElementById('leftArmRotZ').addEventListener('input', (e) => {
            this.bones.leftArm.rotation.z = THREE.MathUtils.degToRad(e.target.value);
        });
        
        document.getElementById('leftElbowRotX').addEventListener('input', (e) => {
            this.bones.leftElbow.rotation.x = THREE.MathUtils.degToRad(e.target.value);
        });
        
        document.getElementById('leftHandRotX').addEventListener('input', (e) => {
            this.bones.leftHand.rotation.x = THREE.MathUtils.degToRad(e.target.value);
        });
        
        document.getElementById('leftHandRotY').addEventListener('input', (e) => {
            this.bones.leftHand.rotation.y = THREE.MathUtils.degToRad(e.target.value);
        });
        
        // Right arm controls
        document.getElementById('rightArmRotX').addEventListener('input', (e) => {
            this.bones.rightArm.rotation.x = THREE.MathUtils.degToRad(e.target.value);
        });
        
        document.getElementById('rightArmRotZ').addEventListener('input', (e) => {
            this.bones.rightArm.rotation.z = THREE.MathUtils.degToRad(e.target.value);
        });
        
        document.getElementById('rightElbowRotX').addEventListener('input', (e) => {
            this.bones.rightElbow.rotation.x = THREE.MathUtils.degToRad(e.target.value);
        });
        
        document.getElementById('rightHandRotX').addEventListener('input', (e) => {
            this.bones.rightHand.rotation.x = THREE.MathUtils.degToRad(e.target.value);
        });
        
        document.getElementById('rightHandRotY').addEventListener('input', (e) => {
            this.bones.rightHand.rotation.y = THREE.MathUtils.degToRad(e.target.value);
        });
        
        // Left leg controls
        document.getElementById('leftLegRotX').addEventListener('input', (e) => {
            this.bones.leftThigh.rotation.x = THREE.MathUtils.degToRad(e.target.value);
        });
        
        document.getElementById('leftKneeRotX').addEventListener('input', (e) => {
            this.bones.leftKnee.rotation.x = THREE.MathUtils.degToRad(e.target.value);
        });
        
        document.getElementById('leftFootRotX').addEventListener('input', (e) => {
            this.bones.leftFoot.rotation.x = THREE.MathUtils.degToRad(e.target.value);
        });
        
        // Right leg controls
        document.getElementById('rightLegRotX').addEventListener('input', (e) => {
            this.bones.rightThigh.rotation.x = THREE.MathUtils.degToRad(e.target.value);
        });
        
        document.getElementById('rightKneeRotX').addEventListener('input', (e) => {
            this.bones.rightKnee.rotation.x = THREE.MathUtils.degToRad(e.target.value);
        });
        
        document.getElementById('rightFootRotX').addEventListener('input', (e) => {
            this.bones.rightFoot.rotation.x = THREE.MathUtils.degToRad(e.target.value);
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