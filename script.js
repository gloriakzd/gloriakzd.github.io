let currentTop = 1;
const totalCards = 3;

function rotateStack() {
    // Get all cards
    const cards = document.querySelectorAll('.project-card');

    // Move current top to back
    const topCard = document.getElementById(`card-${currentTop}`);
    topCard.classList.remove('active-card');

    // Increment top counter
    currentTop = currentTop === totalCards ? 1 : currentTop + 1;

    // Set new top card
    const newTop = document.getElementById(`card-${currentTop}`);
    newTop.classList.add('active-card');

    // Update Z-indexes dynamically
    cards.forEach((card, index) => {
        let cardNum = index + 1;
        // Simple logic to push others back
        if (cardNum === currentTop) {
            card.style.zIndex = "10";
            card.style.opacity = "1";
        } else {
            card.style.zIndex = "1";
            card.style.opacity = "0"; // Hide non-active titles/images to prevent jumbling
        }
    });
}
// Initialize z-indexes on load
rotateStack();





document.addEventListener('DOMContentLoaded', () => {
    const pod = document.querySelector('.myro-content-pod');

    if (pod) {
        pod.addEventListener('mousemove', (e) => {
            const rect = pod.getBoundingClientRect();

            // Calculate mouse position relative to the pod center
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Convert to a percentage movement (-20% to 20%)
            const xMove = ((x / rect.width) - 0.5) * 40;
            const yMove = ((y / rect.height) - 0.5) * 40;

            // 1. Pause the drifting animation
            pod.style.setProperty('--ani-state', 'paused');

            // 2. Use a CSS variable to move the light
            pod.style.setProperty('--x', `${xMove}%`);
            pod.style.setProperty('--y', `${yMove}%`);
        });

        pod.addEventListener('mouseleave', () => {
            // Resume the drifting animation
            pod.style.setProperty('--ani-state', 'running');
            // Reset position variables slowly
            pod.style.setProperty('--x', `0%`);
            pod.style.setProperty('--y', `0%`);
        });
    }
});








// --- Persona Click Listener ---
// 1. SELECT THE ELEMENTS
const personaWindow = document.getElementById('persona-window');
const detailsContainer = document.getElementById('persona-details');

// 2. THE PERSONA CONTENT DATA
const personaData = {
    'dtc': {
        name: "Sadie",
        img: "Images/Personas/SadieJM.png",
        bio: `
            <p class="tagline">"I care about my skin but become easily frustrated when routines feel confusing."</p>
            <div class="bio-section">
                <h4>Frustrations</h4>
                <ul>
                    <li>Routines that feel complicated or lack immediate clarity.</li>
                    <li>Difficulty maintaining consistency during busy periods.</li>
                </ul>
            </div>
            <div class="bio-section">
                <h4>Core Values</h4>
                ${createValueBar("Simplicity", "95%")}
                ${createValueBar("Comfort", "80%")}
                ${createValueBar("Consistency", "60%")}
            </div>`
    },
    'affiliate': {
        name: "Emily",
        img: "Images/Personas/EmilyJM.png",
        bio: `
            <p class="tagline">"I prefer practical, dermatologist-approved insights and value long-term results."</p>
            <div class="bio-section">
                <h4>Frustrations</h4>
                <ul>
                    <li>"Hydrating" products that still cause redness or stinging.</li>
                    <li>Overwhelmed by inconsistent advice online.</li>
                </ul>
            </div>
            <div class="bio-section">
                <h4>Core Values</h4>
                ${createValueBar("Credibility", "98%")}
                ${createValueBar("Simplicity", "90%")}
                ${createValueBar("Comfort", "85%")}
            </div>`
    },
    'retailer': {
        name: "Derreck",
        img: "Images/Personas/DerreckJM.png",
        bio: `
            <p class="tagline">"I value openness and community, gravitating toward inclusive spaces."</p>
            <div class="bio-section">
                <h4>Frustrations</h4>
                <ul>
                    <li>Skincare advice that feels hyper-commercial or disconnected.</li>
                    <li>Fear of judgement when sharing skin concerns.</li>
                </ul>
            </div>
            <div class="bio-section">
                <h4>Core Values</h4>
                ${createValueBar("Inclusivity", "85%")}
                ${createValueBar("Emotional Openness", "98%")}
                ${createValueBar("Comfort", "85%")}
            </div>`
    }
};

// 3. HELPER FUNCTION FOR PROGRESS BARS
function createValueBar(label, width) {
    return `
      <div class="value-bar-container">
          <div class="label-row">
              <span class="value-label">${label}</span>
          </div>
          <div class="bar-bg">
            <div class="bar-fill" style="--width: ${width}"></div>
          </div>
      </div>`;
}

// 4. THE CLICK LISTENER
document.querySelectorAll('.persona-icon-container').forEach(icon => {
    icon.addEventListener('click', () => {
        const type = icon.dataset.persona;
        const data = personaData[type];

        detailsContainer.innerHTML = `
            <div class="window-bar">
                <span class="window-title">${data.name}'s Profile</span>
                <button class="close-btn" onclick="closePersona()">×</button>
            </div>
            <div class="persona-content-area">
                <h3>${data.name}</h3>
                <div class="persona-window-bio">${data.bio}</div>
                <div class="journey-map-section">
                    <h4>User Journey Map</h4>
                    <div class="map-container">
                        <img src="${data.img}" class="persona-window-img" alt="Journey Map">
                    </div>
                </div>
            </div>`;

        personaWindow.style.display = 'block';
        setTimeout(() => { personaWindow.classList.add('active'); }, 10);
    });
});

// 5. CLOSE FUNCTION
function closePersona() {
    personaWindow.classList.remove('active');
    setTimeout(() => { personaWindow.style.display = 'none'; }, 400);
}