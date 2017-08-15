const canvas = document.querySelector('#canvas');
document.body.style.cursor = 'none';
const engine = new BABYLON.Engine(canvas, true);
engine.isPointerLock = true;
window.addEventListener('resize', () => engine.resize());
const TARGETS = [];
const ENEMIES = [];
let gameRun = true;
BABYLON.Tools.RegisterTopRootEvents([
    {
        name: "keyup",
        handler: onKeyUp
    }, {
        name: "click",
        handler: pickCurrentTarget
    }
]);
const scene = createScene();
const camera = makeCamera();

//should probably break this up but it's not logic heavy, just model generation
function createScene() {
    const scene = new BABYLON.Scene(engine);

    const hdrTexture = new BABYLON.CubeTexture("/levels/assets/assets/textures/testSpecularHDR.dds", scene);
    const skybox = scene.createDefaultSkybox(hdrTexture, true, 10000);
    scene.ambientColor = new BABYLON.Color3(1, 1, 1);

    const light0 = new BABYLON.HemisphericLight("Hemi0", new BABYLON.Vector3(0, 100, 0), scene);
    light0.diffuse = new BABYLON.Color3(1, 1, 1);

    const light1 = new BABYLON.PointLight("Omni", new BABYLON.Vector3(-100, 500, -2), scene);

    const ground = BABYLON.Mesh.CreateGround("ground", 1000, 1000, 5, scene);
    ground.material = new BABYLON.StandardMaterial('texture1', scene);
    ground.material.diffuseTexture = new BABYLON.Texture("/levels/assets/assets/textures/grass.png", scene);

    const water = BABYLON.Mesh.CreateGround("water", 1000, 1000, 5, scene);
    water.material = new BABYLON.WaterMaterial("water_material", scene);
    water.material.bumpTexture = new BABYLON.Texture("/levels/assets/assets/textures/waterbump.png", scene);
    water.material.backFaceCulling = true;
    water.material.windForce = -10;
    water.material.waveHeight = 1.5;
    water.material.bumpHeight = 0.5;
    water.material.waterColor = new BABYLON.Color3(0.047, 0.23, 0.015);
    water.material.windDirection = new BABYLON.Vector2(1, 1);
    water.waterColor = new BABYLON.Color3(0, 0, 0.86);
    water.material.colorBlendFactor = 0.5;
    water.material.addToRenderList(skybox);
    water.material.addToRenderList(ground);

    const mountain = BABYLON.Mesh.CreateGroundFromHeightMap("mountain", "/levels/assets/assets/textures/heightMap.png", 250, 250, 50, 0, 60, scene, false);
    mountain.material = new BABYLON.StandardMaterial("texture1", scene);
    mountain.material.bumpTexture = new BABYLON.Texture("/levels/assets/assets/textures/grassn.png", scene);
    mountain.material.diffuseTexture = new BABYLON.Texture("/levels/assets/assets/textures/grass.jpg", scene);
    mountain.material.diffuseTexture.uScale = 18;
    mountain.material.diffuseTexture.vScale = 18;
    mountain.material.bumpTexture.uScale = 50;
    mountain.material.bumpTexture.vScale = 50;
    mountain.material.specularColor = new BABYLON.Color3.Black();
    mountain.checkCollisions = true;

    //Cannon physics
    scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), new BABYLON.CannonJSPlugin());

    //Babylon physics
    scene.enableGravity = new BABYLON.Vector3(0, -9.81, 0);
    scene.collisionsEnabled = true;
    ground.checkCollisions = true;

    const walls = [];
    for (let i = 0; i < 4; i++) {
        const wall = BABYLON.Mesh.CreateBox("wall", 10, scene, false, BABYLON.Mesh.FRONTSIDE);
        wall.position.y = 10;
        wall.scaling.y = 20;
        wall.isVisible = false;
        wall.checkCollisions = true;
        wall.physicsImpostor = new BABYLON.PhysicsImpostor(wall, BABYLON.PhysicsImpostor.BoxImpostor, {
            mass: 0,
            restitution: 0
        }, scene);
        walls.push(wall);
    }

    const backWall = walls[0];
    backWall.position.z = -500;
    backWall.scaling.x = 100;
    backWall.scaling.z = .1;

    const frontWall = walls[1];
    frontWall.position.z = 500;
    frontWall.scaling.x = 100;
    frontWall.scaling.z = .1;

    const leftWall = walls[2];
    leftWall.position.x = -500;
    leftWall.scaling.x = .1;
    leftWall.scaling.z = 100;

    const rightWall = walls[3];
    rightWall.position.x = 500;
    rightWall.scaling.x = .1;
    rightWall.scaling.z = 100;

    for (let i = 0; i < 20; i++) {
        makeBuilding(scene);
    }
    for (let i = 0; i < 10; i++) {
        makeEnemies(scene);
    }

    return scene;
}

function makeCamera() {
    const camera = new BABYLON.FreeCamera("FreeCamera", new BABYLON.Vector3(-480, 500, -480), scene);

    camera.applyGravity = true;
    camera.angularSensibility = 1500;
    camera.ellipsoid = new BABYLON.Vector3(2, 5, 2);
    camera.attachControl(canvas, true);
    camera.checkCollisions = true;
    camera._needMoveForGravity = true;
    camera.setTarget(new BABYLON.Vector3(0, 450, 0));

    camera.ammo = 30;
    camera.score = 0;
    camera.life = 150;

    const startPost = BABYLON.Mesh.CreateBox('building', 30, scene);
    startPost.scaling.y = 8;
    startPost.position = new BABYLON.Vector3(-480, 25, -480);
    startPost.checkCollisions = true;
    startPost.material = new BABYLON.StandardMaterial("texture1", scene);
    startPost.material.diffuseTexture = new BABYLON.Texture("/levels/assets/assets/textures/albedo.png", scene);

    return camera
}

function jumpCamera(cam) {
    //had lots of issues with this. Ended up using code from iiceman's example here-
    //thread: http://www.html5gamedevs.com/topic/12198-camera-jump/
    //code: http://www.babylonjs-playground.com/#XN87O%232
    cam.animations = [];

    const a = new BABYLON.Animation("a", "position.y", 20, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);

    // Animation keys
    const keys = [];
    keys.push({frame: 0, value: cam.position.y});
    keys.push({
        frame: 10,
        value: cam.position.y + 23
    });
    keys.push({frame: 20, value: cam.position.y});
    a.setKeys(keys);

    const easingFunction = new BABYLON.CircleEase();
    easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
    a.setEasingFunction(easingFunction);
    cam.animations.push(a);
    scene.beginAnimation(cam, 0, 20, false);
}

function onKeyUp(event) {
    if (event.keyCode === 32) {
        jumpCamera(camera);
    }
}

function makeBuilding(scene) {
    //adapted from http://pixelcodr.com/tutos/plane/plane.html
    const randomX = Math.random() * -1000 + 500;
    const randomZ = Math.random() * -1000 + 500;

    const building = BABYLON.Mesh.CreateBox('building', 25, scene);

    building.scaling.x = Math.random() * 2 + 4;
    building.scaling.y = Math.random() * 4 + 4;
    building.scaling.z = Math.random() + 2;

    building.position.x = randomX;
    building.position.z = randomZ;
    building.position.y = 25;

    building.material = new BABYLON.StandardMaterial("texture1", scene);
    building.material.diffuseTexture = new BABYLON.Texture("/levels/assets/assets/textures/albedo.png", scene);

    makeTargets(scene, building.position.x, building.position.z);

    building.checkCollisions = true;
    building.physicsImpostor = new BABYLON.PhysicsImpostor(building, BABYLON.PhysicsImpostor.BoxImpostor, {
        mass: 0,
        restitution: 1
    }, scene);
}

function pickCurrentTarget() {
    //this guy is my hero
    //http://www.html5gamedevs.com/topic/18591-interaction-with-meshes-while-the-pointer-is-locked/
    //http://www.babylonjs-playground.com/#1WIOXI
    if (camera.ammo > 0) {
        const ray = new BABYLON.Ray(camera.position, camera.getTarget().subtract(camera.position));
        const pickInfo = scene.pickWithRay(ray, (mesh) => mesh);
        camera.ammo -= 1;
        document.querySelector("#ammoLabel").innerHTML = "AMMO : " + camera.ammo;
        renderBullet();

        if (pickInfo.hit && pickInfo.pickedMesh.id === 'target') {
            let x = camera.getTarget().subtract(camera.position).x * 400;
            let y = camera.getTarget().subtract(camera.position).y * 400;
            let z = camera.getTarget().subtract(camera.position).z * 400;
            pickInfo.pickedMesh.applyImpulse(new BABYLON.Vector3(x, y, z), pickInfo.pickedMesh.getAbsolutePosition());
        }
        if (pickInfo.hit && pickInfo.pickedMesh.id === 'enemy') {
            const enemy = pickInfo.pickedMesh;
            enemy.physicsImpostor = new BABYLON.PhysicsImpostor(enemy, BABYLON.PhysicsImpostor.BoxImpostor, {
                mass: 1,
                restitution: 0
            }, scene);
            let x = camera.getTarget().subtract(camera.position).x * 40;
            let y = camera.getTarget().subtract(camera.position).y * 40;
            let z = camera.getTarget().subtract(camera.position).z * 40;
            enemy.applyImpulse(new BABYLON.Vector3(x, y, z), pickInfo.pickedMesh.getAbsolutePosition());
        }
    }
}

function renderBullet() {
    // Bullet creation from http://www.html5gamedevs.com/topic/10702-how-to-set-the-direction-for-bullets/
    //http://www.babylonjs-playground.com/#VWXHP#3
    const bullet = BABYLON.Mesh.CreateSphere('bullet', 3, 0.3, scene);
    const startPos = camera.position;

    bullet.position = new BABYLON.Vector3(startPos.x, startPos.y, startPos.z);
    bullet.material = new BABYLON.StandardMaterial('texture1', scene);
    bullet.material.diffuseColor = new BABYLON.Color3(0, 0, 0);

    const invView = new BABYLON.Matrix();
    camera.getViewMatrix().invertToRef(invView);
    const direction = BABYLON.Vector3.TransformNormal(new BABYLON.Vector3(0, 0, 1), invView);

    direction.normalize();

    scene.registerBeforeRender(() => bullet.position.addInPlace(direction));
}

function makeTargets(scene, x, z) {
    const target = BABYLON.Mesh.CreateSphere("target", 100.0, 10.0, scene);
    target.position = new BABYLON.Vector3(x, 100, z)
    target.physicsImpostor = new BABYLON.PhysicsImpostor(target, BABYLON.PhysicsImpostor.SphereImpostor, {
        mass: 1,
        restitution: 1
    }, scene);
    TARGETS.push(target)
}

function makeEnemies(scene) {
    const randomX = Math.random() * -1000 + 500
    const randomZ = Math.random() * -1000 + 500
    const enemy = BABYLON.Mesh.CreateBox("enemy", 15, scene);
    enemy.position = new BABYLON.Vector3(randomX, 30, randomZ);
    enemy.velocity = {}
    enemy.velocity.z = .75;
    enemy.velocity.x = .75;
    enemy.material = new BABYLON.StandardMaterial("texture1", scene);
    enemy.material.diffuseTexture = new BABYLON.Texture("/levels/assets/assets/textures/crappic.jpg", scene);
    scene.registerBeforeRender(() => castRay(enemy));
    ENEMIES.push(enemy);
}

function moveEnemy(enemy) {
    enemy.position.z += enemy.velocity.z;
    enemy.position.x += enemy.velocity.x;
    if (enemy.position.z >= 500 || enemy.position.z <= -500) {
        enemy.velocity.z = -enemy.velocity.z;
    }
    if (enemy.position.x >= 500 || enemy.position.x <= -500) {
        enemy.velocity.x = -enemy.velocity.x;
    }
}

function vecToLocal(vector, mesh) {
    // https://www.babylonjs-playground.com/#KNE0O#4
    const m = mesh.getWorldMatrix();
    const v = BABYLON.Vector3.TransformCoordinates(vector, m);
    return v;
}

function castRay(enemy) {
    // adapted from this tutorial/example
    // https://www.babylonjs-playground.com/#KNE0O#4
    const origin = enemy.position
    let forward = vecToLocal(new BABYLON.Vector3(0, 0, -1), enemy)

    let direction = forward.subtract(origin);
    direction = BABYLON.Vector3.Normalize(direction);

    const length = 150;

    const ray = new BABYLON.Ray(origin, direction, length);
    const rayHelper = new BABYLON.RayHelper(ray);
    rayHelper.show(scene);
    setTimeout(() => {
        rayHelper.hide()
    }, 750);

    const camHit = ray.intersectsBoxMinMax(camera.position, new BABYLON.Vector3(camera.position.x + 1, camera.position.y + 1, camera.position.z + 1))
    // so, I would think the ray could only hit things within its length. But it doesn't. A workaround is here- pythagorean's theorem in 3d to find distance
    if (camHit) {
        if (Math.abs(Math.sqrt(Math.pow(camera.position.x - enemy.position.x, 2) + Math.pow(camera.position.y - enemy.position.y, 2) + Math.pow(camera.position.z - enemy.position.z, 2))) < 100) {
            camera.life--;
            document.querySelector("#lifeLabel").innerHTML = "LIFE : " + camera.life;
        }
    }
}

function creepyStare() {
    ENEMIES.forEach(enemy => {
        enemy.lookAt(camera.position)
    })
}

function clean() {
    for (let i = 0; i < TARGETS.length; i++) {
        if (TARGETS[i].position.y < 0) {
            TARGETS[i].dispose();
            TARGETS.splice(i, 1);
            camera.score += 50;
            i--
        }
    }
    for (let i = 0; i < ENEMIES.length; i++) {
        if (ENEMIES[i].position.y < -150) {
            ENEMIES[i].dispose();
            ENEMIES.splice(i, 1);
            camera.score += 25;
            i--
        }
    }
    document.querySelector("#scoreLabel").innerHTML = "SCORE : " + camera.score;
    document.querySelector("#levels_score").value = camera.score
}

function winCheck() {
    if (camera.life <= 0 || camera.ammo === 0) {
        gameRun = false
        document.querySelector('.modalBackground').style.display = 'block'
    }
}

engine.runRenderLoop(() => {
    if (gameRun) {
        scene.render();
        creepyStare();
        clean();
        winCheck();
        ENEMIES.forEach(enemy => moveEnemy(enemy))
    }
});
