    (function() {
      const nav = document.querySelector('nav');
      const navH = 88;

      window.addEventListener('scroll', () => {
        const y = window.scrollY;
        const offset = Math.min(y, navH);
        nav.style.transform = `translateY(-${offset}px)`;
      }, { passive: true });
    })();

  (function() {
    const reviews = [
      {
        text: "Excelente club, tiene entrenadores calificados, priorizan la salud física y mental de sus deportistas, tienen un programa completo de fortalecimiento y entrenamiento basados en el avance de cada arquero y lo mejor es que al iniciar el club te brinda todos los implementos para que puedas aprender.",
        name: "Melissa Pamela Peralta Zanabria",
        role: "Google",
        image: "images/review-melissa.webp"
      },
      {
        text: "Lo mejor! Excelente profesores en el poco tiempo que estuve. Gran equipo de arquería y te ayudan en todo lo que necesitas.",
        name: "Eros Campos",
        role: "Google",
        image: null
      },
      {
        text: "Excelente campo para practicar este hermoso deporte, buenísimos entrenadores! Lo recomiendo.",
        name: "Nathalie Alva",
        role: "Google",
        image: null
      },
      {
        text: "Excelente lugar al aire libre para practicar el deporte, buen ambiente, buenos profesores y compañeros.",
        name: "Luz Espinoza de Sanchez V.",
        role: "Google",
        image: "images/review-luz.webp"
      },
      {
        text: "Una experiencia única! Super personalizada para probar un deporte nuevo, buen ambiente y personas divertidas.",
        name: "Alexandra Nicolas",
        role: "Google",
        image: null
      }
    ];

    let current = 0;
    const block    = document.getElementById('quoteBlock');
    const textEl   = document.getElementById('quoteText');
    const nameEl   = document.getElementById('quoteName');
    const roleEl   = document.getElementById('quoteRole');
    const avatarEl = document.getElementById('quoteAvatar');
    const imgWrap  = document.getElementById('quoteImageWrap');
    const imgEl    = document.getElementById('quoteImage');
    const prevBtn  = document.getElementById('quotePrev');
    const nextBtn  = document.getElementById('quoteNext');

    function render(idx) {
      const r = reviews[idx];
      textEl.textContent = r.text;
      nameEl.textContent = r.name;
      roleEl.textContent = r.role;
      const initials = r.name.split(' ').slice(0, 2).map(w => w[0]).join('');
      avatarEl.textContent = initials;
      if (r.image) {
        imgEl.src = r.image;
        imgEl.alt = r.name;
        imgWrap.classList.remove('hidden');
        block.classList.remove('no-image');
      } else {
        imgWrap.classList.add('hidden');
        block.classList.add('no-image');
      }
    }

    function go(idx) {
      block.classList.add('fading');
      setTimeout(() => {
        current = (idx + reviews.length) % reviews.length;
        render(current);
        block.classList.remove('fading');
      }, 250);
    }

    prevBtn.addEventListener('click', () => go(current - 1));
    nextBtn.addEventListener('click', () => go(current + 1));

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let timer = prefersReduced ? null : setInterval(() => go(current + 1), 5000);

    function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }
    function startTimer() {
      if (prefersReduced) return;
      stopTimer();
      timer = setInterval(() => go(current + 1), 5000);
    }

    prevBtn.addEventListener('click', startTimer);
    nextBtn.addEventListener('click', startTimer);

    block.addEventListener('mouseenter', stopTimer);
    block.addEventListener('mouseleave', startTimer);
    block.addEventListener('focusin', stopTimer);
    block.addEventListener('focusout', startTimer);

    let touchStartX = 0;
    block.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
    block.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) < 40) return;
      go(dx < 0 ? current + 1 : current - 1);
      startTimer();
    }, { passive: true });

    render(0);
  })();

  (function() {
    const grid = document.querySelector('.services-cards');
    const cards = Array.from(grid.querySelectorAll('.service-card'));
    cards.forEach((card, i) => {
      card.addEventListener('mouseenter', () => {
        grid.className = 'services-cards hover-' + i;
      });
    });
    grid.addEventListener('mouseleave', () => {
      grid.className = 'services-cards';
    });

    cards.forEach((card) => {
      card.addEventListener('click', () => {
        if (window.innerWidth > 1024) return;
        const isActive = card.classList.contains('touch-active');
        cards.forEach(c => c.classList.remove('touch-active'));
        if (!isActive) card.classList.add('touch-active');
      });
    });
  })();

    const scrollTopBtn = document.getElementById('scrollTop');
    window.addEventListener('scroll', () => {
      scrollTopBtn.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });
    scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    (function () {
      function buildSlot(el) {
        const inner = document.createElement('div');
        inner.className = 'slot-digit-inner';
        for (let i = 0; i <= 9; i++) {
          const s = document.createElement('span');
          s.textContent = i;
          inner.appendChild(s);
        }
        el.innerHTML = '';
        el.appendChild(inner);
        inner.style.transition = 'none';
        inner.style.transform = 'translateY(0)';
      }

      function animateSlot(el, delay) {
        const inner = el.querySelector('.slot-digit-inner');
        if (!inner) return;
        const final = parseInt(el.dataset.final, 10);
        inner.style.transition = 'none';
        inner.style.transform = 'translateY(0)';
        requestAnimationFrame(() => requestAnimationFrame(() => {
          setTimeout(() => {
            inner.style.transition = 'transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)';
            inner.style.transform = `translateY(-${final}em)`;
          }, delay);
        }));
      }

      const digits = document.querySelectorAll('.slot-digit');
      digits.forEach(buildSlot);

      function runAnimation() {
        document.querySelectorAll('.stat-num').forEach(statNum => {
          statNum.querySelectorAll('.slot-digit').forEach((el, i) => {
            animateSlot(el, i * 150);
          });
        });
      }

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          runAnimation();
          observer.disconnect();
        });
      }, { threshold: 0.1 });

      document.querySelectorAll('.stat-num').forEach(el => observer.observe(el));

      // fallback: if already in viewport on load, animate after short delay
      setTimeout(() => {
        document.querySelectorAll('.stat-num').forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.top < window.innerHeight && rect.bottom > 0) {
            runAnimation();
            observer.disconnect();
          }
        });
      }, 300);
    })();
