function spawnTap(event){

  const bubble = document.createElement("div");

  bubble.innerText = "+12";

  bubble.style.position = "fixed";

  bubble.style.left = event.clientX + "px";
  bubble.style.top = event.clientY + "px";

  bubble.style.color = "#ffcf54";

  bubble.style.fontSize = "28px";
  bubble.style.fontWeight = "800";

  bubble.style.pointerEvents = "none";

  bubble.style.zIndex = "9999";

  bubble.style.transition = "all 1s ease";

  document.body.appendChild(bubble);

  setTimeout(() => {
    bubble.style.transform = "translateY(-80px)";
    bubble.style.opacity = "0";
  }, 10);

  setTimeout(() => {
    bubble.remove();
  }, 1000);

}
