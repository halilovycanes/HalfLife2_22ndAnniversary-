document.addEventListener('DOMContentLoaded', () => {
    const state = {
        isEquipped: false,
        isMouseDown: false,
        isAdvisorAttacking: false,
        grabbedCrate: null,
        mouseX: window.innerWidth / 2,
        mouseY: window.innerHeight / 2,
        offsetX: 0,
        offsetY: 0,
        particles: []
    };

    const nodes = {
        ggPlaceholder: document.getElementById('ggPlaceholder'),
        dockStatus: document.getElementById('dockStatus'),
        ggCursor: document.getElementById('ggCursor'),
        crates: document.querySelectorAll('.hl-crate'),
        canvas: document.getElementById('beamCanvas'),
        advisorImg: document.getElementById('advisorImg'),
        advisorOverlay: document.getElementById('advisorOverlay'),
        tiltCards: document.querySelectorAll('.tilt-card')
    };

    const ctx = nodes.canvas.getContext('2d');

    function syncCanvasSize() {
        nodes.canvas.width = window.innerWidth;
        nodes.canvas.height = window.innerHeight;
    }
    syncCanvasSize();
    window.addEventListener('resize', syncCanvasSize);

    function createParticle(x, y) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 40 + Math.random() * 60;
        return {
            x: x + Math.cos(angle) * dist,
            y: y + Math.sin(angle) * dist,
            targetX: x,
            targetY: y,
            size: 1 + Math.random() * 3,
            speed: 0.05 + Math.random() * 0.08,
            alpha: 1
        };
    }

    function renderBeam() {
        ctx.clearRect(0, 0, nodes.canvas.width, nodes.canvas.height);

        if (state.isEquipped && state.grabbedCrate && state.isMouseDown) {
            const rect = state.grabbedCrate.getBoundingClientRect();
            const crateX = rect.left + rect.width / 2;
            const crateY = rect.top + rect.height / 2;
            const gunX = state.mouseX + 10;
            const gunY = state.mouseY + 10;

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(gunX, gunY);
            ctx.lineTo(crateX, crateY);
            ctx.strokeStyle = 'rgba(255, 157, 0, 0.8)';
            ctx.lineWidth = 12;
            ctx.shadowColor = '#ff6600';
            ctx.shadowBlur = 20;
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(gunX, gunY);
            ctx.lineTo(crateX, crateY);
            ctx.strokeStyle = 'rgba(255, 230, 150, 0.95)';
            ctx.lineWidth = 4;
            ctx.shadowColor = '#ffcc00';
            ctx.shadowBlur = 10;
            ctx.stroke();
            ctx.restore();

            if (state.particles.length < 30) {
                state.particles.push(createParticle(gunX, gunY));
            }

            for (let i = state.particles.length - 1; i >= 0; i--) {
                const p = state.particles[i];
                p.x += (gunX - p.x) * p.speed;
                p.y += (gunY - p.y) * p.speed;
                p.alpha -= 0.02;

                ctx.save();
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 180, 50, ${p.alpha})`;
                ctx.shadowColor = '#ff9d00';
                ctx.shadowBlur = 8;
                ctx.fill();
                ctx.restore();

                if (p.alpha <= 0) state.particles.splice(i, 1);
            }
        } else {
            state.particles = [];
        }

        requestAnimationFrame(renderBeam);
    }
    renderBeam();

    window.addEventListener('mousemove', (e) => {
        if (state.isAdvisorAttacking) return;

        state.mouseX = e.clientX;
        state.mouseY = e.clientY;

        if (state.isEquipped) {
            nodes.ggCursor.style.left = `${state.mouseX}px`;
            nodes.ggCursor.style.top = `${state.mouseY}px`;
        }

        if (state.grabbedCrate && state.isMouseDown) {
            state.grabbedCrate.style.left = `${e.clientX - state.offsetX}px`;
            state.grabbedCrate.style.top = `${e.clientY - state.offsetY}px`;
        }
    });

    nodes.ggPlaceholder.addEventListener('click', (e) => {
        if (state.isAdvisorAttacking) return;
        e.stopPropagation();
        
        state.isEquipped = !state.isEquipped;

        if (state.isEquipped) {
            nodes.ggPlaceholder.style.opacity = '0.3';
            nodes.dockStatus.textContent = 'EQUIPPED - CLICK & HOLD CRATE TO MOVE';
            nodes.dockStatus.style.color = '#00ff66';
            nodes.ggCursor.classList.remove('is-hidden');
            document.body.style.cursor = 'none';
        } else {
            nodes.ggPlaceholder.style.opacity = '1';
            nodes.dockStatus.textContent = 'CLICK TO EQUIP GRAVITY GUN';
            nodes.dockStatus.style.color = '#ff9d00';
            nodes.ggCursor.classList.add('is-hidden');
            document.body.style.cursor = 'default';
            dropCrate();
        }
    });

    nodes.crates.forEach(crate => {
        crate.addEventListener('mousedown', (e) => {
            if (!state.isEquipped || state.isAdvisorAttacking) return;
            e.preventDefault();

            state.isMouseDown = true;
            state.grabbedCrate = crate;
            state.grabbedCrate.classList.add('grabbed');

            const rect = crate.getBoundingClientRect();
            state.offsetX = e.clientX - rect.left;
            state.offsetY = e.clientY - rect.top;

            state.grabbedCrate.style.position = 'fixed';
            state.grabbedCrate.style.left = `${rect.left}px`;
            state.grabbedCrate.style.top = `${rect.top}px`;
        });
    });

    function dropCrate() {
        if (!state.grabbedCrate) return;

        const rect = state.grabbedCrate.getBoundingClientRect();
        state.grabbedCrate.style.position = 'absolute';
        state.grabbedCrate.style.left = `${rect.left + window.scrollX}px`;
        state.grabbedCrate.style.top = `${rect.top + window.scrollY}px`;
        
        state.grabbedCrate.classList.remove('grabbed');
        state.grabbedCrate = null;
    }

    window.addEventListener('mouseup', () => {
        state.isMouseDown = false;
        dropCrate();
    });

    nodes.tiltCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            if (state.isAdvisorAttacking) return;
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            const rotateX = (y / (rect.height / 2)) * -12;
            const rotateY = (x / (rect.width / 2)) * 12;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
        });
    });

    let clickCount = 0;
    let resetTimer = null;

    if (nodes.advisorImg) {
        nodes.advisorImg.parentElement.addEventListener('click', () => {
            if (state.isAdvisorAttacking) return;

            clickCount++;
            nodes.advisorImg.style.transform = 'scale(0.88)';
            setTimeout(() => { nodes.advisorImg.style.transform = 'scale(1)'; }, 100);

            clearTimeout(resetTimer);
            resetTimer = setTimeout(() => { clickCount = 0; }, 1500);

            if (clickCount >= 5) {
                triggerAttack();
                clickCount = 0;
            }
        });
    }

    function triggerAttack() {
        state.isAdvisorAttacking = true;
        document.body.classList.add('is-stunned');
        nodes.advisorOverlay.classList.add('active');

        dropCrate();

        if (state.isEquipped) {
            nodes.ggCursor.style.left = `${window.innerWidth / 2}px`;
            nodes.ggCursor.style.top = `${window.innerHeight / 2}px`;
        }

        setTimeout(() => {
            state.isAdvisorAttacking = false;
            document.body.classList.remove('is-stunned');
            nodes.advisorOverlay.classList.remove('active');
        }, 3500);
    }
});
