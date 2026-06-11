const page = document.querySelector(".interactive-page");
const scene = document.querySelector(".scene");

if (page && scene) {
  let activationTimer = 0;

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
}
