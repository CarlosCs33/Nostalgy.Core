//Fondo de agua
$(document).ready(function(){
    $('.banner').ripples({
        resolution: 500,
        dropRadius: 20,
        perturbance: 0.03
    })
})

//Formulario
$('#retroForm').on('submit', function(e) {
    e.preventDefault();
    
    // Cambiar texto del botón
    const btn = $(this).find('button');
    const originalText = btn.text();
    
    btn.text('ENVIANDO...').css('transform', 'scale(0.95)');
    
    setTimeout(function() {
        // Simulamos envío exitoso
        alert("¡Zumbido enviado con éxito! \n(Mensaje recibido en el servidor Nostalgy)");
        btn.text(originalText).css('transform', 'scale(1)');
        $('#retroForm')[0].reset(); // Limpiar formulario
    }, 1500);
});

//Formulario
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('fishTank');
    if (!container) return;

    // --- ESCENA ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.04); 

    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 5; 

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // --- LUCES ---
    const ambientLight = new THREE.AmbientLight(0x404040, 3);
    scene.add(ambientLight);
    const spotLight = new THREE.SpotLight(0x00ffaa, 8);
    spotLight.position.set(2, 10, 5);
    scene.add(spotLight);
    const blueLight = new THREE.PointLight(0x0044ff, 3, 10);
    blueLight.position.set(-5, -2, 2);
    scene.add(blueLight);

    // --- VARIABLES ---
    let mixer = null; 
    const fishContainer = new THREE.Group();
    scene.add(fishContainer);
    let fishModel = null;

    // --- CARGA DEL MODELO ---
    const loader = new THREE.GLTFLoader();

    loader.load('recursos/fish.glb', function (gltf) {
        fishModel = gltf.scene;
        
        // --- ⚡ TU ESCALA PERSONALIZADA ⚡ ---
        const isMobile = window.innerWidth < 768;
        // Si es móvil usa 0.4, si es PC usa tu 0.7
        const initialScale = isMobile ? 0.4 : 0.7; 
        
        fishModel.scale.set(initialScale, initialScale, initialScale); 
        fishModel.position.set(0, 0, 0);

        // AJUSTE DE ROTACIÓN INICIAL
        fishModel.rotation.y = Math.PI / 2; 

        if (gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(fishModel);
            const action = mixer.clipAction(gltf.animations[0]);
            action.timeScale = 2.5; // Velocidad de aleteo rápida
            action.play();
        }

        fishContainer.add(fishModel);
    }, undefined, function(e){ console.warn('Error carga'); });

    // --- MOUSE ---
    let mouseX = 0;
    let mouseY = 0;
    
    container.addEventListener('mousemove', (event) => {
        const rect = container.getBoundingClientRect();
        mouseX = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
        mouseY = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;
    });
    
    container.addEventListener('mouseleave', () => { mouseX = 0; mouseY = 0; });

    // --- ANIMACIÓN ---
    const clock = new THREE.Clock();
    let currentRotationY = 0; 
    let currentRotationZ = 0;

    function animate() {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();
        if (mixer) mixer.update(delta);

        // 1. MOVIMIENTO
        const targetX = mouseX * 3.5; 
        const targetY = mouseY * 2.0; 

        fishContainer.position.x += (targetX - fishContainer.position.x) * 3.5 * delta;
        fishContainer.position.y += (targetY - fishContainer.position.y) * 3.5 * delta;

        // 2. ROTACIÓN
        if (fishModel) {
            const dx = targetX - fishContainer.position.x;
            const dy = targetY - fishContainer.position.y;
            const distance = Math.sqrt(dx*dx + dy*dy);

            if (distance > 0.2) {
                if (dx > 0.1) currentRotationY = 0;          
                if (dx < -0.1) currentRotationY = Math.PI;   
                currentRotationZ = Math.atan2(dy, Math.abs(dx)) * 0.3;
            } else {
                currentRotationZ = 0;
            }

            fishContainer.rotation.y += (currentRotationY - fishContainer.rotation.y) * 8 * delta;
            
            if (Math.abs(currentRotationY - fishContainer.rotation.y) > Math.PI) {
                 if (currentRotationY > fishContainer.rotation.y) fishContainer.rotation.y += Math.PI * 2;
                 else fishContainer.rotation.y -= Math.PI * 2;
            }

            fishContainer.rotation.z += (currentRotationZ - fishContainer.rotation.z) * 8 * delta;
        }

        // Flotación
        fishContainer.position.y += Math.sin(clock.getElapsedTime() * 3) * 0.005;

        renderer.render(scene, camera);
    }

    animate();

    // --- RESIZE: MANTIENE TU ESCALA 0.7 AL CAMBIAR TAMAÑO ---
    window.addEventListener('resize', () => {
        if(container && renderer) {
            renderer.setSize(container.clientWidth, container.clientHeight);
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();

            if (fishModel) {
                const isMobile = window.innerWidth < 768;
                // Aquí también aplicamos tu lógica de escala
                const newScale = isMobile ? 0.4 : 0.7;
                fishModel.scale.set(newScale, newScale, newScale);
            }
        }
    });
});