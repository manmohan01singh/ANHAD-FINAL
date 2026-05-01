/**
 * Animation Helper Utilities
 */

class AnimationHelpers {
    /**
     * Animate a number counter
     */
    static animateNumber(element, start, end, duration = 500) {
        const startTime = performance.now();
        const diff = end - start;

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = this.easeOutExpo(progress);

            element.textContent = Math.floor(start + diff * eased);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    /**
     * Fade In animation
     */
    static fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.display = 'block';

        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            element.style.opacity = progress;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    /**
     * Fade Out animation
     */
    static fadeOut(element, duration = 300) {
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            element.style.opacity = 1 - progress;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.style.display = 'none';
            }
        };

        requestAnimationFrame(animate);
    }

    /**
     * Slide In from Right
     */
    static slideInRight(element, duration = 350) {
        element.style.transform = 'translateX(100%)';
        element.style.display = 'block';

        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = this.easeOutExpo(progress);
            element.style.transform = `translateX(${100 - 100 * eased}%)`;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    /**
     * Scale Pop animation
     */
    static pop(element, scale = 1.1, duration = 200) {
        element.style.transform = 'scale(1)';

        const startTime = performance.now();
        const halfDuration = duration / 2;

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            let currentScale;

            if (elapsed < halfDuration) {
                const progress = elapsed / halfDuration;
                currentScale = 1 + (scale - 1) * this.easeOutExpo(progress);
            } else {
                const progress = (elapsed - halfDuration) / halfDuration;
                currentScale = scale - (scale - 1) * this.easeOutExpo(progress);
            }

            element.style.transform = `scale(${currentScale})`;

            if (elapsed < duration) {
                requestAnimationFrame(animate);
            } else {
                element.style.transform = 'scale(1)';
            }
        };

        requestAnimationFrame(animate);
    }

    /**
     * Stagger children animations
     */
    static staggerChildren(parent, animationClass, delay = 50) {
        const children = Array.from(parent.children);

        children.forEach((child, index) => {
            child.style.animationDelay = `${index * delay}ms`;
            child.classList.add(animationClass);
        });
    }

    /**
     * Easing: Ease Out Expo
     */
    static easeOutExpo(x) {
        return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
    }

    /**
     * Easing: Ease Out Back (with overshoot)
     */
    static easeOutBack(x) {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
    }

    /**
     * Easing: Spring
     */
    static spring(x) {
        const c4 = (2 * Math.PI) / 3;
        return x === 0 ? 0 : x === 1 ? 1 :
            Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnimationHelpers;
}
