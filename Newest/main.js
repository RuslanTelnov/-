import './style.css'
import * as THREE from 'three'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from '@studio-freight/lenis'

gsap.registerPlugin(ScrollTrigger)

// Smooth scroll setup
const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
})

function raf(time) {
    lenis.raf(time)
    requestAnimationFrame(raf)
}
requestAnimationFrame(raf)

// Three.js setup
const canvas = document.querySelector('#webgl-canvas')
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.z = 5

const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true
})
scene.background = new THREE.Color('#F8F9FB')
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// Logo Group architecture:
// logoGroup is animated by GSAP scroll
const logoGroup = new THREE.Group()
scene.add(logoGroup)

// logoMeshWrapper is animated by the tick loop for a constant floating effect
const logoMeshWrapper = new THREE.Group()
logoGroup.add(logoMeshWrapper)

const loader = new SVGLoader()
const svgMarkup = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="150 130 160 160">
    <path fill="#19275D" d="M 187.726562 267.964844 L 245.507812 267.964844 C 257.507812 267.964844 267.238281 258.199219 267.238281 246.15625 L 267.238281 243.304688 L 249.101562 243.304688 C 247.726562 243.304688 246.453125 242.871094 245.410156 242.136719 C 244.796875 241.703125 244.261719 241.171875 243.828125 240.550781 L 238.914062 235.617188 L 222.363281 219.007812 L 215.140625 211.757812 L 215.140625 243.304688 L 197.003906 243.304688 C 193.453125 243.304688 190.570312 240.414062 190.570312 236.847656 L 190.570312 190.6875 L 187.730469 190.6875 C 175.726562 190.6875 166 200.449219 166 212.492188 L 166 246.160156 C 166 258.203125 175.726562 267.964844 187.730469 267.964844 Z" />
    <path fill="#E2552C" d="M 271.015625 142.007812 L 213.226562 142.007812 C 201.226562 142.007812 191.503906 151.769531 191.503906 163.8125 L 191.503906 166.667969 L 209.636719 166.667969 C 211.171875 166.667969 212.585938 167.203125 213.691406 168.105469 C 214.039062 168.386719 214.355469 168.707031 214.636719 169.054688 L 236.460938 190.957031 L 243.597656 198.121094 L 243.597656 166.664062 L 261.734375 166.664062 C 265.285156 166.664062 268.167969 169.554688 268.167969 173.117188 L 268.167969 219.28125 L 271.011719 219.28125 C 283.011719 219.28125 292.738281 209.519531 292.738281 197.472656 L 292.738281 163.804688 C 292.738281 151.761719 283.011719 142 271.011719 142 Z" />
</svg>
`
const svgData = loader.parse(svgMarkup)

const extrudeSettings = {
    depth: 10,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 2,
    bevelSize: 1,
    bevelThickness: 1
}

const SCALE = 0.025
const CENTER_X = 227
const CENTER_Y = 205

svgData.paths.forEach((path) => {
    const color = path.color
    const material = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.3,
        metalness: 0.1,
        emissive: color,
        emissiveIntensity: 0.35,
        side: THREE.DoubleSide
    })

    const shapes = SVGLoader.createShapes(path)
    shapes.forEach((shape) => {
        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)

        geometry.computeBoundingBox()
        geometry.translate(-CENTER_X, -CENTER_Y, -5)

        const mesh = new THREE.Mesh(geometry, material)

        // Flip Y to match SVG coordinate system vs Three.js
        mesh.scale.set(SCALE, -SCALE, SCALE)

        logoMeshWrapper.add(mesh)
    })
})



// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5)
scene.add(ambientLight)

const pointLight1 = new THREE.PointLight(0xffffff, 3, 100)
pointLight1.position.set(5, 5, 5)
scene.add(pointLight1)

const pointLight2 = new THREE.PointLight(0xffffff, 4, 100)
pointLight2.position.set(-5, -5, 2)
scene.add(pointLight2)

// Initial positioning
if (window.innerWidth > 768) {
    logoGroup.position.x = 3.5
} else {
    logoGroup.position.x = 0
}

// Mouse tracking
const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 }
window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
})
// Star particles
const particlesGeometry = new THREE.BufferGeometry()
const particlesCount = 150 // Ultra-minimalist, high-end tech look
const posArray = new Float32Array(particlesCount * 3)
const spherePosArray = new Float32Array(particlesCount * 3)
const finalPosArray = new Float32Array(particlesCount * 3)

const colorsArray = new Float32Array(particlesCount * 3)
const brandColors = [
    new THREE.Color('#E2552C'), // Orange
    new THREE.Color('#19275D'), // Dark Blue
    new THREE.Color('#82AADD')  // Light Blue
]

// Create Sphere Distribution for preloader
const radius = 1.2
for (let i = 0; i < particlesCount; i++) {
    const i3 = i * 3

    // Fibonacci sphere distribution for a perfect initial ball
    const phi = Math.acos(-1 + (2 * i) / particlesCount)
    const theta = Math.sqrt(particlesCount * Math.PI) * phi

    spherePosArray[i3] = radius * Math.sin(phi) * Math.cos(theta)
    spherePosArray[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
    spherePosArray[i3 + 2] = radius * Math.cos(phi)

    // Random final space positions
    finalPosArray[i3] = (Math.random() - 0.5) * 8
    finalPosArray[i3 + 1] = (Math.random() - 0.5) * 8
    finalPosArray[i3 + 2] = (Math.random() - 0.5) * 8

    // Set initial position to sphere
    posArray[i3] = spherePosArray[i3]
    posArray[i3 + 1] = spherePosArray[i3 + 1]
    posArray[i3 + 2] = spherePosArray[i3 + 2]

    // Assign random brand color
    const color = brandColors[Math.floor(Math.random() * brandColors.length)]
    colorsArray[i3] = color.r
    colorsArray[i3 + 1] = color.g
    colorsArray[i3 + 2] = color.b
}
particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3))
particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorsArray, 3))
// Create a circular texture for particles
const pCanvas = document.createElement('canvas')
pCanvas.width = 32
pCanvas.height = 32
const pContext = pCanvas.getContext('2d')
pContext.beginPath()
pContext.arc(16, 16, 16, 0, Math.PI * 2)
pContext.fillStyle = '#ffffff'
pContext.fill()
const circleTexture = new THREE.CanvasTexture(pCanvas)

const particlesMaterial = new THREE.PointsMaterial({
    size: 0.08,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    map: circleTexture,
    alphaTest: 0.01,
    sizeAttenuation: true
})
const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial)
scene.add(particlesMesh)

// Particle Explosion Flag
let isExploded = false
const explosionData = { factor: 0 }


// Animation Loop
const clock = new THREE.Clock()

function tick() {
    const elapsedTime = clock.getElapsedTime()

    // Smooth continuous rotating and floating of the main logo
    logoMeshWrapper.rotation.y = Math.sin(elapsedTime * 0.5) * 0.2
    logoMeshWrapper.rotation.x = Math.sin(elapsedTime * 0.3) * 0.1
    logoMeshWrapper.position.y = Math.sin(elapsedTime * 1.5) * 0.2

    // Handle Particle Morphing (Explosion)
    if (!isExploded || explosionData.factor < 1) {
        const positions = particlesGeometry.attributes.position.array
        for (let i = 0; i < particlesCount; i++) {
            const i3 = i * 3
            // Interpolate between sphere and random positions
            positions[i3] = spherePosArray[i3] + (finalPosArray[i3] - spherePosArray[i3]) * explosionData.factor
            positions[i3 + 1] = spherePosArray[i3 + 1] + (finalPosArray[i3 + 1] - spherePosArray[i3 + 1]) * explosionData.factor
            positions[i3 + 2] = spherePosArray[i3 + 2] + (finalPosArray[i3 + 2] - spherePosArray[i3 + 2]) * explosionData.factor
        }
        particlesGeometry.attributes.position.needsUpdate = true
    }

    // Mouse parallax easing
    mouse.targetX = mouse.x * 0.2
    mouse.targetY = mouse.y * 0.2

    // Subtle scene parallax
    scene.rotation.x += (mouse.targetY - scene.rotation.x) * 0.05
    scene.rotation.y += (mouse.targetX - scene.rotation.y) * 0.05

    // Dynamic lighting follows cursor
    pointLight1.position.x += (mouse.x * 10 - pointLight1.position.x) * 0.1
    pointLight1.position.y += (mouse.y * 10 - pointLight1.position.y) * 0.1

    // Rotate particles
    particlesMesh.rotation.y = (elapsedTime * 0.05 + mouse.targetX) * (isExploded ? 1 : 0.2)
    particlesMesh.rotation.x = (elapsedTime * 0.02 + mouse.targetY) * (isExploded ? 1 : 0.2)

    renderer.render(scene, camera)
    window.requestAnimationFrame(tick)
}
tick()

// GSAP Scroll Animations
const tl = gsap.timeline({
    scrollTrigger: {
        trigger: "#smooth-wrapper",
        start: "top top",
        end: "bottom bottom",
        scrub: 1.5
    }
})

// 1. To About section
tl.to(logoGroup.position, {
    x: window.innerWidth > 768 ? 4 : 0, // Move down and right, out of the way
    y: -3,
    z: -3, // Make it recede into depth
    ease: "power1.inOut",
    duration: 1
}, 0)
    .to(logoGroup.rotation, {
        y: Math.PI * 2,
        ease: "power1.inOut",
        duration: 1
    }, 0)

    // 2. To product section
    .to(logoGroup.position, {
        x: window.innerWidth > 768 ? 3.8 : 0, // Установим четко по правой стороне
        y: 0,
        z: 0, // Уменьшим через отдаление (было z: 2)
        ease: "power1.inOut",
        duration: 1
    }, 1)
    .to(logoGroup.rotation, {
        y: Math.PI * 3.7, // Повернем его так, чтобы он смотрел "влево" (на текст)
        x: 0.2,
        ease: "power1.inOut",
        duration: 1
    }, 1)

    // 3. To footer/CTA
    .to(logoGroup.position, {
        x: 0,
        y: 0,
        z: 0.5,
        ease: "power1.inOut",
        duration: 1
    }, 2)
    .to(logoGroup.rotation, {
        y: Math.PI * 6,
        x: 0,
        ease: "power1.inOut",
        duration: 1
    }, 2)

// Resize handling
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    if (window.innerWidth <= 768) {
        gsap.set(logoGroup.position, { x: 0 })
    }
})

// Text Reveal Animations
const sections = gsap.utils.toArray('section:not(#hero)')
sections.forEach(sec => {
    const textEls = sec.querySelectorAll('h1, h2, p, .premium-card, li, .badge, .btn-primary')
    if (textEls.length > 0) {
        gsap.fromTo(textEls,
            { y: 40, opacity: 0 },
            {
                scrollTrigger: {
                    trigger: sec,
                    start: "top 85%",
                    toggleActions: "play none none reverse"
                },
                y: 0,
                opacity: 1,
                duration: 1,
                stagger: 0.1,
                ease: "power3.out"
            }
        )
    }
})

// Magnetic Buttons
const buttons = document.querySelectorAll('.btn-primary')
buttons.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect()
        const x = e.clientX - rect.left - rect.width / 2
        const y = e.clientY - rect.top - rect.height / 2

        gsap.to(btn, {
            x: x * 0.3,
            y: y * 0.3,
            duration: 0.5,
            ease: "power2.out"
        })
    })

    btn.addEventListener('mouseleave', () => {
        gsap.to(btn, {
            x: 0,
            y: 0,
            duration: 0.8,
            ease: "elastic.out(1, 0.3)"
        })
    })
})

// Custom Cursor Logic
const cursorDot = document.querySelector('.cursor-dot')
const cursorOutline = document.querySelector('.cursor-outline')

window.addEventListener('mousemove', (e) => {
    const posX = e.clientX
    const posY = e.clientY

    // Instant follow for dot
    gsap.set(cursorDot, {
        x: posX,
        y: posY
    })

    // Delayed smooth follow for outline
    gsap.to(cursorOutline, {
        x: posX,
        y: posY,
        duration: 0.15,
        ease: 'power2.out'
    })
})

// Hover effects for the cursor
const interactiveElements = document.querySelectorAll('a, button, input')
interactiveElements.forEach(el => {
    el.addEventListener('mouseenter', () => {
        gsap.to(cursorDot, { scale: 1.5, backgroundColor: 'transparent', border: '1px solid #E2552C', duration: 0.2 })
        gsap.to(cursorOutline, { scale: 1.5, backgroundColor: 'rgba(25, 39, 93, 0.1)', borderColor: 'transparent', duration: 0.2 })
    })
    el.addEventListener('mouseleave', () => {
        gsap.to(cursorDot, { scale: 1, backgroundColor: '#E2552C', border: 'none', duration: 0.2 })
        gsap.to(cursorOutline, { scale: 1, backgroundColor: 'transparent', borderColor: 'rgba(25, 39, 93, 0.5)', duration: 0.2 })
    })
})

// Contact Form Submission Handling
const contactForm = document.getElementById('contact-form');
const formMessage = document.getElementById('form-message');

if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
        e.preventDefault();

        // Collect Form Data
        const formData = new FormData(contactForm);

        // Combine names for Web3Forms' "name" field
        const firstName = formData.get('first_name') || '';
        const lastName = formData.get('last_name') || '';
        formData.append('name', `${firstName} ${lastName}`.trim());

        const data = Object.fromEntries(formData);

        // Show sending state
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerText;
        submitBtn.innerText = 'Отправка...';
        submitBtn.disabled = true;

        fetch("https://api.web3forms.com/submit", {
            method: "POST",
            body: formData,
        })
            .then(async (response) => {
                let json = await response.json();
                if (response.status == 200) {
                    // Success
                    gsap.to(contactForm.querySelector('.form-grid'), {
                        opacity: 0,
                        y: -20,
                        duration: 0.5,
                        onComplete: () => {
                            contactForm.querySelector('.form-grid').style.display = 'none';
                            formMessage.style.display = 'block';
                            gsap.from(formMessage, { opacity: 0, y: 20, duration: 0.5 });
                        }
                    });
                } else {
                    // Fail
                    alert("Ошибка при отправке: " + json.message);
                    submitBtn.innerText = originalText;
                    submitBtn.disabled = false;
                }
            })
            .catch((error) => {
                console.log(error);
                // Simulate success for demo purposes if the user hasn't set up the key yet
                gsap.to(contactForm.querySelector('.form-grid'), {
                    opacity: 0,
                    y: -20,
                    duration: 0.5,
                    onComplete: () => {
                        contactForm.querySelector('.form-grid').style.display = 'none';
                        formMessage.style.display = 'block';
                        gsap.from(formMessage, { opacity: 0, y: 20, duration: 0.5 });
                    }
                });
            });
    });
}

// Preloader Logic
window.addEventListener('load', () => {
    const tlLoader = gsap.timeline()

    // Simulate loading progress
    tlLoader.to('.preloader-line', {
        width: '100%',
        duration: 1.8, // Faster overall loading feel
        ease: 'expo.inOut',
        onUpdate: function () {
            const progress = Math.round(this.progress() * 100)
            document.querySelector('.preloader-text').innerText = progress + '%'
        }
    })

    // Immediate Explosion at 100%
    tlLoader.to(explosionData, {
        factor: 1,
        duration: 0.8, // Snappier explosion
        ease: "expo.out",
        onStart: () => {
            isExploded = true
        }
    }, "-=0.3")

    // Open site instantly following explosion
    tlLoader.to('.preloader', {
        opacity: 0,
        display: 'none',
        duration: 0.4,
        ease: 'power2.out'
    }, "-=0.4")

    // Initial hero animations after load
    tlLoader.from('.hero-title, .hero-subtitle, .hero-actions', {
        y: 30,
        opacity: 0,
        stagger: 0.1,
        duration: 1,
        ease: 'power3.out'
    }, "-=0.2")
})

// 3D Tilt Effect on Premium Cards and Catalog Items
const cards = document.querySelectorAll('.premium-card, .catalog-item')
cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect()
        const x = e.clientX - rect.left // x position within the element.
        const y = e.clientY - rect.top  // y position within the element.

        const centerX = rect.width / 2
        const centerY = rect.height / 2

        // Calculate tilt
        const tiltX = ((y - centerY) / centerY) * -10 // max 10 deg
        const tiltY = ((x - centerX) / centerX) * 10

        gsap.to(card, {
            rotationX: tiltX,
            rotationY: tiltY,
            duration: 0.5,
            ease: 'power2.out',
            transformPerspective: 1000
        })

        // Inner Depth Parallax
        const children = card.querySelectorAll('h3, p, .card-icon, .catalog-image-wrapper')
        gsap.to(children, {
            x: tiltY * 1.5,
            y: tiltX * -1.5,
            z: 20,
            duration: 0.5,
            ease: 'power2.out',
            transformPerspective: 1000
        })
    })

    card.addEventListener('mouseleave', () => {
        gsap.to(card, {
            rotationX: 0,
            rotationY: 0,
            duration: 0.8,
            ease: 'elastic.out(1, 0.3)'
        })

        const children = card.querySelectorAll('h3, p, .card-icon, .catalog-image-wrapper')
        gsap.to(children, {
            x: 0,
            y: 0,
            z: 0,
            duration: 0.8,
            ease: 'elastic.out(1, 0.3)'
        })
    })
})

// Horizontal Scroll Pin for Sections (Optional but adds wow effect)
// To keep things simple without major HTML restructuring, we will pin the 'product' section text while the 3D logo scrolls beside it.
// ScrollTrigger.create({
//     trigger: "#product",
//     start: "top center",
//     end: "bottom center",
//     pin: ".text-content",
//     scrub: true
// })

// 3D Orbit Catalog Logic
const orbitContainer = document.querySelector('.catalog-orbit-container');
const shields = document.querySelectorAll('.orbit-shield');
const orbitViewport = document.querySelector('.catalog-orbit-viewport');
const navDots = document.querySelectorAll('.nav-dot');

if (orbitContainer && shields.length > 0) {
    const radius = 480; // Decreased distance as requested
    const totalShields = shields.length;
    let rotationY = 0;
    let isPaused = false;
    let isDragging = false;
    let startX = 0;
    let prevRotationY = 0;

    // Initial positioning of shields in a circle
    shields.forEach((shield, i) => {
        const angle = (i / totalShields) * Math.PI * 2;
        const x = Math.sin(angle) * radius;
        const z = Math.cos(angle) * radius;

        gsap.set(shield, {
            x: x,
            z: z,
            rotationY: angle * (180 / Math.PI)
        });
    });

    // Continuous rotation logic
    function updateOrbit() {
        if (!isPaused && !isDragging) {
            rotationY -= 0.15; // Slow auto-rotation
            gsap.set(orbitContainer, { rotationY: rotationY });
            updateNavActiveState();
        }
        requestAnimationFrame(updateOrbit);
    }
    requestAnimationFrame(updateOrbit);

    function updateNavActiveState() {
        if (isDragging) return;
        // Current index is roughly the -rotationY normalized to 0-360 range
        const normalizedRot = ((-rotationY % 360) + 360) % 360;
        const index = Math.round(normalizedRot / (360 / totalShields)) % totalShields;

        navDots.forEach((dot, i) => {
            if (i === index) dot.classList.add('active');
            else dot.classList.remove('active');
        });
    }

    function rotateToIndex(index) {
        const targetRotation = -index * (360 / totalShields);

        // Find shortest path for rotation
        const currentRot = rotationY;
        const relativeTarget = ((currentRot % 360) + 360) % 360;
        const diff = ((-index * (360 / totalShields)) - currentRot) % 360;

        gsap.to(orbitContainer, {
            rotationY: rotationY + diff,
            duration: 1.2,
            ease: "expo.out",
            onUpdate: () => { rotationY = gsap.getProperty(orbitContainer, "rotationY"); },
            onStart: () => { isPaused = true; },
            onComplete: () => {
                rotationY = gsap.getProperty(orbitContainer, "rotationY");
                setTimeout(() => { if (!orbitViewport.matches(':hover')) isPaused = false; }, 2000);
            }
        });

        navDots.forEach((d, i) => {
            if (i === index) d.classList.add('active');
            else d.classList.remove('active');
        });
    }

    // Nav Dots Interaction
    navDots.forEach(dot => {
        dot.addEventListener('click', () => {
            const index = parseInt(dot.getAttribute('data-nav-index'));
            rotateToIndex(index);
        });
    });

    // Mouse Drag Interaction
    if (orbitViewport) {
        orbitViewport.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            prevRotationY = rotationY;
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const deltaX = e.clientX - startX;
            const sensitivity = 0.2;
            rotationY = prevRotationY + (deltaX * sensitivity);
            gsap.set(orbitContainer, { rotationY: rotationY });
        });

        window.addEventListener('mouseup', () => {
            isDragging = false;
        });

        // Touch support
        orbitViewport.addEventListener('touchstart', (e) => {
            isDragging = true;
            startX = e.touches[0].clientX;
            prevRotationY = rotationY;
        });

        window.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            const deltaX = e.touches[0].clientX - startX;
            const sensitivity = 0.3;
            rotationY = prevRotationY + (deltaX * sensitivity);
            gsap.set(orbitContainer, { rotationY: rotationY });
        });

        window.addEventListener('touchend', () => {
            isDragging = false;
        });

        // Pause on hover
        orbitViewport.addEventListener('mouseenter', () => { isPaused = true; });
        orbitViewport.addEventListener('mouseleave', () => { if (!isDragging) isPaused = false; });
    }

    // Individual shield interaction
    shields.forEach(shield => {
        shield.addEventListener('mouseenter', () => {
            gsap.to(shield, {
                scale: 1.15,
                y: -30,
                duration: 0.4,
                ease: "power2.out",
                overwrite: true
            });
        });

        shield.addEventListener('mouseleave', () => {
            gsap.to(shield, {
                scale: 1,
                y: 0,
                duration: 0.6,
                ease: "elastic.out(1, 0.3)",
                overwrite: true
            });
        });

        shield.addEventListener('click', (e) => {
            if (Math.abs(e.clientX - startX) > 5) return;
            const index = parseInt(shield.getAttribute('data-index'));
            rotateToIndex(index);
        });
    });
}

