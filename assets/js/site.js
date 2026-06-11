const page = document.querySelector(".interactive-page");
const scene = document.querySelector(".scene");
const wavesCanvas = scene?.querySelector(".sparkle-waves");
const wavesContext = wavesCanvas?.getContext("2d", { alpha: true });
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

if (page && scene) {
  let activationTimer = 0;
  let wavesFrame = 0;
  const waveState = {
    width: 0,
    height: 0,
    pointerX: 0.5,
    pointerY: 0.5,
    bursts: [],
  };

  const waveTracks = [
    { y: 0.18, amplitude: 0.026, frequency: 7.4, speed: 0.62, phase: 1.3, width: 1.2, opacity: 0.34, hue: [255, 255, 255] },
    { y: 0.32, amplitude: 0.039, frequency: 6.1, speed: 0.48, phase: 2.8, width: 1.5, opacity: 0.39, hue: [219, 167, 255] },
    { y: 0.49, amplitude: 0.03, frequency: 8.8, speed: 0.7, phase: 0.6, width: 1.15, opacity: 0.31, hue: [165, 88, 255] },
    { y: 0.63, amplitude: 0.036, frequency: 5.6, speed: 0.42, phase: 4.1, width: 1.55, opacity: 0.26, hue: [255, 255, 255] },
    { y: 0.88, amplitude: 0.024, frequency: 7.2, speed: 0.56, phase: 3.2, width: 1.2, opacity: 0.3, hue: [195, 112, 255] },
  ];

  const sparkles = Array.from({ length: 92 }, (_, index) => ({
    track: index % waveTracks.length,
    offset: (index * 0.61803398875) % 1,
    speed: 0.026 + ((index % 7) * 0.004),
    size: 0.75 + ((index % 5) * 0.24),
    phase: index * 1.87,
  }));

  const getWaveY = (track, x, time) => {
    const progress = x / Math.max(waveState.width, 1);
    const pointerPull = (waveState.pointerY - 0.5) * waveState.height * 0.025;
    const mainWave = Math.sin((progress * track.frequency) + (time * track.speed) + track.phase);
    const shimmer = Math.sin((progress * track.frequency * 1.73) - (time * track.speed * 1.4) + track.phase) * 0.32;

    return (waveState.height * track.y)
      + ((mainWave + shimmer) * waveState.height * track.amplitude)
      + pointerPull;
  };

  const resizeWaves = () => {
    if (!wavesCanvas || !wavesContext) {
      return;
    }

    const rect = scene.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    waveState.width = rect.width;
    waveState.height = rect.height;
    wavesCanvas.width = Math.max(1, Math.round(rect.width * dpr));
    wavesCanvas.height = Math.max(1, Math.round(rect.height * dpr));
    wavesContext.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const drawWaveTrack = (context, track, time) => {
    const segment = Math.max(7, waveState.width / 260);
    const [red, green, blue] = track.hue;

    for (let pass = 0; pass < 3; pass += 1) {
      context.beginPath();

      for (let x = -100; x <= waveState.width + 100; x += segment) {
        const drift = ((time * track.speed * 52) + (pass * 14)) % 140;
        const shiftedX = x + drift - 70;
        const y = getWaveY(track, shiftedX, time + (pass * 0.34));

        if (x === -100) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      }

      context.lineCap = "round";
      context.lineJoin = "round";
      context.lineWidth = track.width + (pass * 2.9);
      context.strokeStyle = `rgba(${red}, ${green}, ${blue}, ${track.opacity / (pass + 1.55)})`;
      context.shadowBlur = 20 + (pass * 16);
      context.shadowColor = `rgba(${red}, ${green}, ${blue}, ${0.32 - (pass * 0.06)})`;
      context.stroke();
    }
  };

  const drawSparkles = (context, time) => {
    sparkles.forEach((sparkle) => {
      const track = waveTracks[sparkle.track];
      const progress = (sparkle.offset + (time * sparkle.speed)) % 1;
      const x = (progress * (waveState.width + 180)) - 90;
      const pulse = 0.45 + (Math.sin((time * 5.2) + sparkle.phase) * 0.35);
      const y = getWaveY(track, x, time) + (Math.sin((time * 2.1) + sparkle.phase) * 9);
      const radius = Math.max(0.25, sparkle.size * pulse);

      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fillStyle = `rgba(255, 255, 255, ${0.42 + (pulse * 0.42)})`;
      context.shadowBlur = 17 + (pulse * 18);
      context.shadowColor = "rgba(190, 107, 255, 0.82)";
      context.fill();
    });
  };

  const drawBursts = (context, timestamp) => {
    waveState.bursts = waveState.bursts.filter((burst) => timestamp - burst.createdAt < 950);

    waveState.bursts.forEach((burst) => {
      const age = (timestamp - burst.createdAt) / 950;
      const radius = 18 + (age * 150);
      const alpha = Math.max(0, 1 - age);

      context.beginPath();
      context.arc(burst.x, burst.y, radius, 0, Math.PI * 2);
      context.lineWidth = 1.8 + (age * 4);
      context.strokeStyle = `rgba(232, 196, 255, ${alpha * 0.42})`;
      context.shadowBlur = 26;
      context.shadowColor = "rgba(155, 72, 255, 0.86)";
      context.stroke();

      for (let index = 0; index < 4; index += 1) {
        const angle = (index * Math.PI * 0.5) + (age * 1.2);
        const length = 52 + (age * 130);

        context.beginPath();
        context.moveTo(burst.x, burst.y);
        context.lineTo(burst.x + (Math.cos(angle) * length), burst.y + (Math.sin(angle) * length));
        context.lineWidth = 1.2;
        context.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.28})`;
        context.stroke();
      }
    });
  };

  const drawWaves = (timestamp) => {
    if (!wavesContext || reducedMotion.matches) {
      wavesFrame = 0;
      return;
    }

    if (!waveState.width || !waveState.height) {
      resizeWaves();
    }

    const time = timestamp / 1000;

    wavesContext.clearRect(0, 0, waveState.width, waveState.height);
    wavesContext.save();
    wavesContext.globalCompositeOperation = "lighter";
    wavesContext.globalAlpha = 0.84;

    waveTracks.forEach((track) => drawWaveTrack(wavesContext, track, time));
    drawSparkles(wavesContext, time);
    drawBursts(wavesContext, timestamp);

    wavesContext.restore();
    wavesFrame = window.requestAnimationFrame(drawWaves);
  };

  const startWaves = () => {
    if (!wavesCanvas || !wavesContext) {
      return;
    }

    window.cancelAnimationFrame(wavesFrame);
    resizeWaves();

    if (reducedMotion.matches) {
      wavesContext.clearRect(0, 0, waveState.width, waveState.height);
      return;
    }

    wavesFrame = window.requestAnimationFrame(drawWaves);
  };

  const setPointer = (clientX, clientY) => {
    const rect = scene.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    const tiltX = (x - 50) * 0.22;
    const tiltY = (y - 50) * 0.14;

    page.style.setProperty("--pointer-x", `${x}%`);
    page.style.setProperty("--pointer-y", `${y}%`);
    page.style.setProperty("--tilt-x", `${tiltX}px`);
    page.style.setProperty("--tilt-y", `${tiltY}px`);
    waveState.pointerX = x / 100;
    waveState.pointerY = y / 100;
  };

  const createSpark = (x, y, index) => {
    const spark = document.createElement("span");
    const angle = (index / 9) * Math.PI * 2;
    const distance = 70 + Math.random() * 56;

    spark.className = "spark";
    spark.style.setProperty("--spark-x", `${x}px`);
    spark.style.setProperty("--spark-y", `${y}px`);
    spark.style.setProperty("--spark-dx", `${Math.cos(angle) * distance}px`);
    spark.style.setProperty("--spark-dy", `${Math.sin(angle) * distance}px`);

    scene.appendChild(spark);
    spark.addEventListener("animationend", () => spark.remove(), { once: true });
  };

  const activate = (event) => {
    const rect = scene.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    page.style.setProperty("--pulse-x", `${x}px`);
    page.style.setProperty("--pulse-y", `${y}px`);
    waveState.bursts.push({ x, y, createdAt: performance.now() });
    scene.classList.remove("is-activated");
    window.clearTimeout(activationTimer);

    requestAnimationFrame(() => {
      scene.classList.add("is-activated");
      activationTimer = window.setTimeout(() => scene.classList.remove("is-activated"), 820);
    });

    for (let index = 0; index < 9; index += 1) {
      createSpark(x, y, index);
    }
  };

  scene.addEventListener("pointermove", (event) => setPointer(event.clientX, event.clientY));
  scene.addEventListener("pointerdown", activate);
  reducedMotion.addEventListener("change", startWaves);

  if (wavesCanvas && wavesContext) {
    const sceneObserver = new ResizeObserver(startWaves);
    sceneObserver.observe(scene);
    startWaves();
  }
}
