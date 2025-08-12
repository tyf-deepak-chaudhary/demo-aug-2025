// register.js - REVISED AND COMPLETE

document.addEventListener('DOMContentLoaded', () => {
    // --- 3D Dynamic Data Network Background (Copied from login.js) ---
    const init3DBackground = () => {
        try {
            if (typeof THREE === 'undefined') {
                console.error('ERROR: Three.js library is not loaded.');
                return;
            }

            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            const renderer = new THREE.WebGLRenderer({
                canvas: document.getElementById('bg-canvas'),
                antialias: true,
            });

            renderer.setClearColor(0x0c0f1a);
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            camera.position.z = 50;

            const nodes = [];
            const nodeCount = 100;
            const connectionDistance = 20;
            const nodeGeometry = new THREE.SphereGeometry(0.3, 16, 16);
            const nodeMaterial = new THREE.MeshBasicMaterial({ color: 0x3b82f6 });

            for (let i = 0; i < nodeCount; i++) {
                const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
                node.position.set(
                    (Math.random() - 0.5) * 100,
                    (Math.random() - 0.5) * 100,
                    (Math.random() - 0.5) * 100
                );
                node.userData.velocity = new THREE.Vector3(
                    (Math.random() - 0.5) * 0.1,
                    (Math.random() - 0.5) * 0.1,
                    (Math.random() - 0.5) * 0.1
                );
                nodes.push(node);
                scene.add(node);
            }

            const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2 });
            const lineGeometry = new THREE.BufferGeometry();
            const linePositions = new Float32Array(nodeCount * nodeCount * 3);
            const lineMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
            scene.add(lineMesh);

            const mousePos = new THREE.Vector3(999, 999, 999);
            document.addEventListener('mousemove', (event) => {
                const vec = new THREE.Vector3();
                vec.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1, 0.5);
                vec.unproject(camera);
                vec.sub(camera.position).normalize();
                const distance = -camera.position.z / vec.z;
                mousePos.copy(camera.position).add(vec.multiplyScalar(distance));
            });
             document.addEventListener('mouseout', () => {
                mousePos.set(999, 999, 999);
            });

            const animate = () => {
                requestAnimationFrame(animate);
                let vertexPos = 0;
                for (let i = 0; i < nodeCount; i++) {
                    nodes[i].position.add(nodes[i].userData.velocity);
                    if (Math.abs(nodes[i].position.x) > 50) nodes[i].userData.velocity.x *= -1;
                    if (Math.abs(nodes[i].position.y) > 50) nodes[i].userData.velocity.y *= -1;
                    if (Math.abs(nodes[i].position.z) > 50) nodes[i].userData.velocity.z *= -1;
                    for (let j = i + 1; j < nodeCount; j++) {
                        const dist = nodes[i].position.distanceTo(nodes[j].position);
                        if (dist < connectionDistance) {
                            linePositions[vertexPos++] = nodes[i].position.x;
                            linePositions[vertexPos++] = nodes[i].position.y;
                            linePositions[vertexPos++] = nodes[i].position.z;
                            linePositions[vertexPos++] = nodes[j].position.x;
                            linePositions[vertexPos++] = nodes[j].position.y;
                            linePositions[vertexPos++] = nodes[j].position.z;
                        }
                    }
                     const distToMouse = nodes[i].position.distanceTo(mousePos);
                     if (distToMouse < connectionDistance) {
                        linePositions[vertexPos++] = nodes[i].position.x;
                        linePositions[vertexPos++] = nodes[i].position.y;
                        linePositions[vertexPos++] = nodes[i].position.z;
                        linePositions[vertexPos++] = mousePos.x;
                        linePositions[vertexPos++] = mousePos.y;
                        linePositions[vertexPos++] = mousePos.z;
                     }
                }
                lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
                lineGeometry.setDrawRange(0, vertexPos / 3);
                renderer.render(scene, camera);
            };
            animate();

            window.addEventListener('resize', () => {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
                renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            });

        } catch (error) {
            console.error("A critical error occurred during 3D background initialization:", error);
            document.body.style.backgroundColor = '#111827';
        }
    };

    // --- Registration Form Logic ---
    const initRegisterForm = () => {
        const API_BASE_URL = 'http://localhost:8080/api';
        const form = document.getElementById('registerForm');
        const registerButton = document.getElementById('registerButton');
        const messageDiv = document.getElementById('message');
        const passwordInput = document.getElementById('password');
        const togglePassword = document.getElementById('togglePassword');
        
        // NEW: Upgraded password toggle logic
        const eyeOpenIcon = document.getElementById('eyeOpenIcon');
        const eyeClosedIcon = document.getElementById('eyeClosedIcon');

        togglePassword.addEventListener('click', () => {
             const isPassword = passwordInput.getAttribute('type') === 'password';
             passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
             eyeOpenIcon.classList.toggle('icon-hidden');
             eyeClosedIcon.classList.toggle('icon-hidden');
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            let isSuccess = false;

            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = passwordInput.value;

            if (!username || !email || !password) {
                showToast('Please fill in all fields.');
                return;
            }

            registerButton.disabled = true;
            registerButton.textContent = 'Registering...';
            registerButton.classList.add('loading');

            try {
                const response = await fetch(`${API_BASE_URL}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password }),
                });

                if (response.ok) {
                    isSuccess = true;
                    showToast('Registration successful! Redirecting...', 'success');
                    setTimeout(() => { window.location.href = 'login.html'; }, 1500);
                } else {
                    const data = await response.json();
                    showToast(data.message || 'Registration failed. Please try again.');
                }
            } catch (error) {
                console.error('Registration request failed:', error);
                showToast('Registration failed. Could not connect to the server.');
            } finally {
                if (!isSuccess) {
                    registerButton.disabled = false;
                    registerButton.textContent = 'Register';
                    registerButton.classList.remove('loading');
                }
            }
        });
    };

    // Initialize both background and form logic
    init3DBackground();
    initRegisterForm();
});