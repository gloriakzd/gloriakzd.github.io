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