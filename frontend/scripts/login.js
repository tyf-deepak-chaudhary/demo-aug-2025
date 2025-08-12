document.addEventListener('DOMContentLoaded', () => {
    // --- NEW: 3D Dynamic Data Network Background ---
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

            // --- Node and Line Setup ---
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

            // Setup for lines connecting the nodes
            const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2 });
            const lineGeometry = new THREE.BufferGeometry();
            const linePositions = new Float32Array(nodeCount * nodeCount * 3); // Max possible lines
            const lineMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
            scene.add(lineMesh);


            // --- Mouse Interaction ---
            const mousePos = new THREE.Vector3(999, 999, 999);
            document.addEventListener('mousemove', (event) => {
                const vec = new THREE.Vector3();
                vec.set(
                    (event.clientX / window.innerWidth) * 2 - 1,
                    -(event.clientY / window.innerHeight) * 2 + 1,
                    0.5
                );
                vec.unproject(camera);
                vec.sub(camera.position).normalize();
                const distance = -camera.position.z / vec.z;
                mousePos.copy(camera.position).add(vec.multiplyScalar(distance));
            });
             document.addEventListener('mouseout', () => {
                mousePos.set(999, 999, 999);
            });


            // --- Animation Loop ---
            const animate = () => {
                requestAnimationFrame(animate);
                let vertexPos = 0;

                // Animate nodes and check for connections
                for (let i = 0; i < nodeCount; i++) {
                    // Move the node
                    nodes[i].position.add(nodes[i].userData.velocity);

                    // Bounce off container walls
                    if (Math.abs(nodes[i].position.x) > 50) nodes[i].userData.velocity.x *= -1;
                    if (Math.abs(nodes[i].position.y) > 50) nodes[i].userData.velocity.y *= -1;
                    if (Math.abs(nodes[i].position.z) > 50) nodes[i].userData.velocity.z *= -1;

                    // Check for connections to other nodes
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

                    // Check for connection to mouse
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

                // Update the line geometry
                lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
                lineGeometry.setDrawRange(0, vertexPos / 3);

                renderer.render(scene, camera);
            };
            animate();

            // Handle window resize
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

    // --- Login Form Logic ---
    const initLoginForm = () => {
        const API_BASE_URL = 'http://localhost:8080/api';
        const loginForm = document.getElementById('loginForm');
        const loginButton = document.getElementById('loginButton');
        const messageDiv = document.getElementById('message');
        const passwordInput = document.getElementById('password');
        const togglePassword = document.getElementById('togglePassword');
        const eyeOpenIcon = document.getElementById('eyeOpenIcon');
        const eyeClosedIcon = document.getElementById('eyeClosedIcon');

        togglePassword.addEventListener('click', () => {
             const isPassword = passwordInput.getAttribute('type') === 'password';
             passwordInput.setAttribute('type', isPassword ? 'text' : 'password');

             // NEW: Toggle the 'icon-hidden' class on both SVGs
             eyeOpenIcon.classList.toggle('icon-hidden');
             eyeClosedIcon.classList.toggle('icon-hidden');
        });

        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            let isSuccess = false; // Flag to track success

            const username = document.getElementById('username').value;
            const password = passwordInput.value;

            if (!username || !password) {
                showToast('Please enter both username and password.');
                return;
            }

            loginButton.disabled = true;
            loginButton.textContent = 'Verifying...';
            loginButton.classList.add('loading');

            try {
                const response = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password }),
                });

                if (response.ok) {
                    isSuccess = true;
                    showToast('Login successful! Redirecting...', 'success');
                    // The path is changed from '/dashboard.html' to 'dashboard.html'
                    setTimeout(() => { window.location.href = 'dashboard.html'; }, 1500);
                } else {
                    showToast(response.status === 401 ? 'Invalid username or password.' : 'An error occurred.');
                }
            } catch (error) {
                console.error('Login request failed:', error);
                showToast('Login failed. Could not connect to the server.');
            } finally {
                if (!isSuccess) {
                    loginButton.disabled = false;
                    loginButton.textContent = 'Login';
                    loginButton.classList.remove('loading');
                }
            }
        });
    };

    init3DBackground();
    initLoginForm();
});