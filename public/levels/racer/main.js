/**
Built with adaptations (didn't want to fuss with prototypical inheritance)
following a tutorial at http://pixelcodr.com/tutos/plane/plane.html

Tutorial creator is Julian Chenard, one of Babylon's contributing devs;
all things considered, his work taught me how to use this library
*/
const canvas = document.querySelector('#canvas');
const engine = new BABYLON.Engine(canvas, true);
window.addEventListener('resize', () => engine.resize());
const scene = createScene();
var ship;
makeShip(2, scene);
var camera;
var ground;
var light0;
let gameRun = true;

function createScene() {
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3(0,0,0)
    scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
    scene.fogDensity = 0.0001;
    scene.fogColor = new BABYLON.Color4.FromHexString("#9599a0");

    camera = new BABYLON.FreeCamera('camera', new BABYLON.Vector3(0, 5, -30), scene);
    camera.setTarget(new BABYLON.Vector3(0, 0, 20));
    camera.maxZ = 1000;
    camera.position.y = 7
    camera.speed = 4

    light0 = new BABYLON.SpotLight("Spot0", new BABYLON.Vector3(0, 0, 2), new BABYLON.Vector3(0, 0, 1), 0.8, 2, scene);
    light0.diffuse = new BABYLON.Color3(1, 0, 0);
    light0.specular = new BABYLON.Color3(1, 1, 1);

    const hLight = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0, 0.5, 0), scene);
    hLight.intensity = 0.6;

    const dirLight = new BABYLON.DirectionalLight("dir", new BABYLON.Vector3(0, -0.5, 0.5), scene);
    dirLight.position = new BABYLON.Vector3(0.1, 100, -100);
    dirLight.intensity = 0.4;
    dirLight.diffuse = BABYLON.Color3.FromInts(204, 196, 255);

    return scene
}

function makeShip(size, scene) {
    BABYLON.SceneLoader.ImportMesh("", "/levels/assets/assets/meshes/", "tie.babylon", scene, meshes => {
        const tie = meshes[0]
        tie.killed = false;

        tie.position.x = 0;
        tie.position.z = 0;
        tie.position.y = size / 2;

        tie.scaling.x = 4;
        tie.scaling.y = 4;
        tie.scaling.z = 4;

        tie.speed = 13;
        tie.moveLeft = false;
        tie.moveRight = false;
        tie.moveUp = false;
        tie.moveDown = false;

        tie.move = () => {
            if (tie.moveRight) {
                tie.position.x += 2;
                camera.position.x += 2;
            }
            if (tie.moveLeft) {
                tie.position.x -= 2;
                camera.position.x -= 2;
            }
            if (tie.moveUp) {
                tie.position.y += 2;
                camera.position.y += 2;
            }
            if (tie.moveDown) {
                tie.position.y -= 2;
                camera.position.y -= 2;
            }
        }
        ship = tie;
    });
}

BABYLON.Tools.RegisterTopRootEvents([
    {
        name: "keydown",
        handler: onKeyDown
    }, {
        name: "keyup",
        handler: onKeyUp
    }
]);

function onKeyDown(e) {
    if (e.keyCode === 65) {
        ship.moveLeft = true;
        ship.moveRight = false;
    }
    if (e.keyCode === 68) {
        ship.moveRight = true;
        ship.moveLeft = false;
    }
    if (e.keyCode === 87) {
        ship.moveUp = true;
        ship.moveDown = false;
    }
    if (e.keyCode === 83) {
        ship.moveDown = true;
        ship.moveUp = false;
    }
}

function onKeyUp(e) {
    ship.moveLeft = false;
    ship.moveRight = false;
    ship.moveUp = false;
    ship.moveDown = false;
}

function randomNumber (min, max) {
    if (min === max) {
        return min;
    }
    let random = Math.random();
    return ((random * (max - min)) + min );
}

function makeAsteroid () {
    const minZ = camera.position.z + 500;
    const maxZ = camera.position.z + 1500;
    const minX = camera.position.x - 100;
    const maxX = camera.position.x + 100;
    const minY = camera.position.y + 100;
    const maxY = camera.position.y - 100;
    const minSize = 2;
    const maxSize = 10;

    const randomX = randomNumber(minX, maxX);
    const randomZ = randomNumber(minZ, maxZ);
    const randomY = randomNumber(minY, maxY);
    const randomSize = randomNumber(minSize, maxSize);

    const asteroid = BABYLON.Mesh.CreateSphere('asteroid', 10, randomSize, scene);

    asteroid.scaling.x = randomNumber(2, 3);
    asteroid.scaling.y = randomNumber(2, 3);
    asteroid.scaling.z = randomNumber(2, 3);

    asteroid.position.x = randomX;
    asteroid.position.y = randomY;
    asteroid.position.z = randomZ;

    asteroid.material = new BABYLON.StandardMaterial('texture1', scene);
    asteroid.material.diffuseTexture = new BABYLON.Texture("/levels/assets/assets/textures/rock.png", scene);
    asteroid.material.bumpTexture = new BABYLON.Texture("/levels/assets/assets/textures/rockn.png", scene);

    asteroid.actionManager = new BABYLON.ActionManager(scene);
    const trigger = { trigger: BABYLON.ActionManager.OnIntersectionEnterTrigger, parameter: ship };
    const killShip = new BABYLON.SwitchBooleanAction(trigger, ship, 'killed');
    asteroid.actionManager.registerAction(killShip);
}

const astInt = setInterval(makeAsteroid, 100);

function endAnimation() {
    gameRun = false;
    clearInterval(score)
    clearInterval(astInt)
    document.querySelector('.modalBackground').style.display = 'block'
}

//easy but even easier to google;
// https://stackoverflow.com/questions/5517597/plain-count-up-timer-in-javascript
let sec = 0;
function pad ( val ) { return val > 9 ? val : "0" + val; }
const score = setInterval( function(){
    document.getElementById("ammoLabel").innerHTML = `TIME: ${pad(++sec%60)}`;
    document.querySelector("#levels_score").value = pad(++sec%60)
}, 1000);

engine.runRenderLoop(() => {
    if (ship && !ship.killed && gameRun) {
        ship.move();
        camera.position.z += ship.speed;
        ship.position.z += ship.speed;
    }
    if (ship && ship.killed) {
        endAnimation();
    }
    scene.render();
})
