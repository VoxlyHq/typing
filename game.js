                // Game state
                const state = {
                    score: 0,
                    health: 100,
                    currentLanguage: 'en',
                    zombies: [],
                    activeZombies: [],
                    camera: null,
                    scene: null,
                    renderer: null,
                    path: [],
                    pathPosition: 0,
                    pathSpeed: 0.005,
                    lastZombieTime: 0,
                    zombieInterval: 3000,
                    gameRunning: false
                };

                // Words for zombies
                const words = {
                    en: [
                        'zombie', 'brain', 'undead', 'apocalypse', 'survive',
                        'horror', 'infected', 'outbreak', 'shamble', 'bite',
                        'virus', 'epidemic', 'quarantine', 'decompose', 'flesh',
                        'corpse', 'reanimated', 'groan', 'shuffle', 'lurk',
                        'terror', 'rotting', 'nightmare', 'gruesome', 'macabre',
                        'death', 'putrid', 'stagger', 'ghoul', 'cadaver',
                        'decay', 'reanimate', 'blood', 'walking', 'dead'
                    ],
                    th: [
                        'ซอมบี้', 'สมอง', 'ไม่ตาย', 'หายนะ', 'รอดชีวิต',
                        'สยอง', 'ติดเชื้อ', 'ระบาด', 'เดินโซเซ', 'กัด',
                        'ไวรัส', 'โรคระบาด', 'กักกัน', 'เน่า', 'เนื้อ',
                        'ศพ', 'ฟื้นคืนชีพ', 'ครวญคราง', 'เดินลากขา', 'ซุ่มซ่อน',
                        'ความกลัว', 'เน่าเปื่อย', 'ฝันร้าย', 'น่าสยดสยอง', 'สยองขวัญ',
                        'ความตาย', 'เน่าเหม็น', 'โซเซ', 'ผีดิบ', 'ซากศพ',
                        'เน่าเปื่อย', 'ฟื้นคืนชีพ', 'เลือด', 'เดิน', 'ตาย'
                    ]
                };

                // DOM elements
                const overlay = document.getElementById('overlay');
                const scoreElement = document.getElementById('score');
                const healthElement = document.getElementById('health');
                const languageToggle = document.getElementById('language-toggle');
                const startScreen = document.getElementById('start-screen');
                const startButton = document.getElementById('start-button');
                const gameOverScreen = document.getElementById('game-over');
                const restartButton = document.getElementById('restart-button');
                const finalScoreElement = document.getElementById('final-score');

                // Initialize the 3D world
                function initThreeJS() {
                    // Create scene
                    state.scene = new THREE.Scene();
                    state.scene.background = new THREE.Color(0x111111);
                    state.scene.fog = new THREE.Fog(0x111111, 10, 50);

                    // Create camera
                    state.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
                    state.camera.position.set(0, 2, 0);
                    state.camera.lookAt(0, 2, -10);

                    // Create renderer
                    state.renderer = new THREE.WebGLRenderer({ antialias: true });
                    state.renderer.setSize(window.innerWidth, window.innerHeight);
                    state.renderer.shadowMap.enabled = true;
                    document.getElementById('game-container').appendChild(state.renderer.domElement);

                    // Add lights
                    const ambientLight = new THREE.AmbientLight(0x404040);
                    state.scene.add(ambientLight);

                    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
                    directionalLight.position.set(0, 10, 10);
                    directionalLight.castShadow = true;
                    state.scene.add(directionalLight);

                    // Create ground
                    const groundGeometry = new THREE.PlaneGeometry(100, 100);
                    const groundMaterial = new THREE.MeshStandardMaterial({ 
                        color: 0x333333,
                        roughness: 0.8,
                        metalness: 0.2
                    });
                    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
                    ground.rotation.x = -Math.PI / 2;
                    ground.receiveShadow = true;
                    state.scene.add(ground);

                    // Create walls
                    createWalls();

                    // Generate path
                    generatePath();

                    // Create zombies
                    createZombies();

                    // Handle window resize
                    window.addEventListener('resize', () => {
                        state.camera.aspect = window.innerWidth / window.innerHeight;
                        state.camera.updateProjectionMatrix();
                        state.renderer.setSize(window.innerWidth, window.innerHeight);
                    });

                    // Start the animation loop
                    animate();
                }

                // Create walls for the path
                function createWalls() {
                    // Left wall
                    const leftWallGeometry = new THREE.BoxGeometry(2, 4, 100);
                    const wallMaterial = new THREE.MeshStandardMaterial({ 
                        color: 0x8B4513,
                        roughness: 0.7,
                        metalness: 0.2
                    });
                    const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
                    leftWall.position.set(-6, 2, -50);
                    leftWall.castShadow = true;
                    leftWall.receiveShadow = true;
                    state.scene.add(leftWall);

                    // Right wall
                    const rightWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
                    rightWall.position.set(6, 2, -50);
                    rightWall.castShadow = true;
                    rightWall.receiveShadow = true;
                    state.scene.add(rightWall);

                    // Add some decoration to walls
                    for (let i = 0; i < 10; i++) {
                        const decorGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
                        const decorMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
                        
                        // Left wall decoration
                        const leftDecor = new THREE.Mesh(decorGeometry, decorMaterial);
                        leftDecor.position.set(-5, 2.5, -10 * i - 5);
                        state.scene.add(leftDecor);
                        
                        // Right wall decoration
                        const rightDecor = new THREE.Mesh(decorGeometry, decorMaterial);
                        rightDecor.position.set(5, 2.5, -10 * i - 5);
                        state.scene.add(rightDecor);
                    }
                }

                // Generate a path for the camera to follow
                function generatePath() {
                    // Simple straight path for now
                    state.path = [];
                    for (let i = 0; i < 1000; i++) {
                        // Start at origin and move forward in z-direction
                        // Add some gentle curves using sine
                        const x = Math.sin(i * 0.05) * 2;
                        const y = 2 + Math.sin(i * 0.02) * 0.5;
                        const z = -i * 0.5;
                        state.path.push(new THREE.Vector3(x, y, z));
                    }
                }

                // Create zombie meshes
                function createZombies() {
                    const zombieGeometry = new THREE.BoxGeometry(1, 2, 0.5);
                    
                    for (let i = 0; i < 20; i++) {
                        const zombieMaterial = new THREE.MeshStandardMaterial({ 
                            color: new THREE.Color(0.2 + Math.random() * 0.2, 0.5 + Math.random() * 0.3, 0.2),
                            roughness: 0.8,
                            metalness: 0.2
                        });
                        
                        const zombie = new THREE.Mesh(zombieGeometry, zombieMaterial);
                        zombie.castShadow = true;
                        zombie.visible = false;
                        zombie.userData = { active: false };
                        state.zombies.push(zombie);
                        state.scene.add(zombie);
                    }
                }

                // Spawn a zombie with text
                function spawnZombie() {
                    // Find inactive zombie
                    const inactiveZombies = state.zombies.filter(zombie => !zombie.userData.active);
                    if (inactiveZombies.length === 0) return;
                    
                    const zombie = inactiveZombies[Math.floor(Math.random() * inactiveZombies.length)];
                    zombie.userData.active = true;
                    
                    // Position zombie relative to camera
                    const cameraPosition = state.camera.position.clone();
                    const cameraDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(state.camera.quaternion);
                    
                    // Random position ahead of camera
                    const distance = 10 + Math.random() * 10;
                    const offset = (Math.random() > 0.5 ? 1 : -1) * (2 + Math.random() * 3);
                    
                    zombie.position.copy(cameraPosition)
                        .add(cameraDirection.multiplyScalar(distance))
                        .add(new THREE.Vector3(offset, 0, 0));
                    
                    // Face the camera
                    zombie.lookAt(state.camera.position);
                    
                    // Add random word text
                    const language = state.currentLanguage;
                    const wordList = words[language];
                    const word = wordList[Math.floor(Math.random() * wordList.length)];
                    
                    const textElement = document.createElement('div');
                    textElement.className = 'zombie-text';
                    textElement.innerHTML = word;
                    textElement.dataset.targetText = word;
                    textElement.dataset.currentText = '';
                    
                    overlay.appendChild(textElement);
                    
                    // Add to active zombies
                    state.activeZombies.push({
                        mesh: zombie,
                        textElement: textElement,
                        word: word,
                        typed: '',
                        position: zombie.position.clone(),
                        speed: 0.02 + Math.random() * 0.02,
                        damage: 10,
                        createdTime: Date.now()
                    });
                    
                    zombie.visible = true;
                }

                // Update position of zombie text elements to match 3D positions
                function updateZombieTextPositions() {
                    state.activeZombies.forEach(zombie => {
                        // Convert 3D position to screen position
                        const position = zombie.mesh.position.clone();
                        position.project(state.camera);
                        
                        const x = (position.x * 0.5 + 0.5) * window.innerWidth;
                        const y = (position.y * -0.5 + 0.5) * window.innerHeight;
                        
                        zombie.textElement.style.left = x + 'px';
                        zombie.textElement.style.top = y + 'px';
                        
                        // Move zombie towards camera
                        const direction = state.camera.position.clone().sub(zombie.mesh.position).normalize();
                        zombie.mesh.position.add(direction.multiplyScalar(zombie.speed));
                        
                        // Check if zombie is too close
                        const distance = zombie.mesh.position.distanceTo(state.camera.position);
                        if (distance < 2) {
                            // Zombie attacks player
                            state.health -= zombie.damage;
                            healthElement.textContent = `Health: ${state.health}`;
                            
                            // Remove zombie
                            removeZombie(zombie);
                            
                            // Check game over
                            if (state.health <= 0) {
                                gameOver();
                            }
                        }
                    });
                }

                // Remove a zombie
                function removeZombie(zombie) {
                    zombie.mesh.visible = false;
                    zombie.mesh.userData.active = false;
                    overlay.removeChild(zombie.textElement);
                    state.activeZombies = state.activeZombies.filter(z => z !== zombie);
                }

                // Move camera along the path
                function moveCamera() {
                    if (state.pathPosition < state.path.length - 1) {
                        const targetPosition = state.path[Math.floor(state.pathPosition)];
                        state.camera.position.copy(targetPosition);
                        
                        // Look ahead on the path
                        const lookAtIndex = Math.min(Math.floor(state.pathPosition) + 10, state.path.length - 1);
                        state.camera.lookAt(state.path[lookAtIndex]);
                        
                        state.pathPosition += state.pathSpeed;
                    } else {
                        // End of path, wrap back to start
                        state.pathPosition = 0;
                    }
                }

                // Animation loop
                function animate() {
                    requestAnimationFrame(animate);
                    
                    if (state.gameRunning) {
                        moveCamera();
                        
                        // Spawn zombies periodically
                        const now = Date.now();
                        if (now - state.lastZombieTime > state.zombieInterval) {
                            spawnZombie();
                            state.lastZombieTime = now;
                            
                            // Make game harder over time
                            state.zombieInterval = Math.max(1500, state.zombieInterval - 50);
                        }
                        
                        updateZombieTextPositions();
                    }
                    
                    state.renderer.render(state.scene, state.camera);
                }

                // Handle typing
                function handleKeyDown(e) {
                    if (!state.gameRunning) return;
                    
                    // Skip modifier keys
                    if (e.ctrlKey || e.altKey || e.metaKey) return;
                    
                    // Get pressed key
                    let key = e.key;
                    
                    // Find active zombie that matches the current typing
                    let matchedZombie = null;
                    
                    for (const zombie of state.activeZombies) {
                        const remainingText = zombie.word.substring(zombie.typed.length);
                        
                        if (remainingText.startsWith(key)) {
                            matchedZombie = zombie;
                            break;
                        }
                    }
                    
                    if (matchedZombie) {
                        // Update typed text
                        matchedZombie.typed += key;
                        
                        // Update visual display
                        const typedPart = matchedZombie.word.substring(0, matchedZombie.typed.length);
                        const remainingPart = matchedZombie.word.substring(matchedZombie.typed.length);
                        matchedZombie.textElement.innerHTML = `<span class="typed-text">${typedPart}</span>${remainingPart}`;
                        
                        // Check if word is fully typed
                        if (matchedZombie.typed === matchedZombie.word) {
                            // Zombie defeated!
                            state.score += 10;
                            scoreElement.textContent = `Score: ${state.score}`;
                            
                            // Remove zombie
                            removeZombie(matchedZombie);
                        }
                    }
                }

                // Toggle language
                function toggleLanguage() {
                    state.currentLanguage = state.currentLanguage === 'en' ? 'th' : 'en';
                    languageToggle.textContent = state.currentLanguage === 'en' ? 'EN / TH' : 'TH / EN';
                }

                // Game over
                function gameOver() {
                    state.gameRunning = false;
                    finalScoreElement.textContent = state.score;
                    gameOverScreen.style.display = 'flex';
                    
                    // Clear active zombies
                    state.activeZombies.forEach(zombie => {
                        zombie.mesh.visible = false;
                        zombie.mesh.userData.active = false;
                        overlay.removeChild(zombie.textElement);
                    });
                    state.activeZombies = [];
                }

                // Reset game
                function resetGame() {
                    state.score = 0;
                    state.health = 100;
                    state.pathPosition = 0;
                    state.lastZombieTime = 0;
                    state.zombieInterval = 3000;
                    
                    scoreElement.textContent = `Score: ${state.score}`;
                    healthElement.textContent = `Health: ${state.health}`;
                    
                    gameOverScreen.style.display = 'none';
                    state.gameRunning = true;
                }

                // Start game
                function startGame() {
                    startScreen.style.display = 'none';
                    state.gameRunning = true;
                }

                // Event listeners
                document.addEventListener('keydown', handleKeyDown);
                languageToggle.addEventListener('click', toggleLanguage);
                startButton.addEventListener('click', startGame);
                restartButton.addEventListener('click', resetGame);

                // Initialize game
                initThreeJS();
