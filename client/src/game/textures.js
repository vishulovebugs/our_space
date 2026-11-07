import { TILE_SIZE } from "@pixel-hall/shared";

/**
 * Every texture in the hall is drawn here, at runtime, from rectangles and
 * colours. The project ships no image files.
 */

const CABINET_COLORS = {
  chess: "#e8d56a",
  tankers: "#7cf5c4",
  cave: "#4a7cc2",
};

export function createHallTextures(scene) {
  makeTexture(scene, "tile-floor", TILE_SIZE, TILE_SIZE, drawFloor);
  makeTexture(scene, "tile-wall", TILE_SIZE, TILE_SIZE, drawWall);
  makeTexture(scene, "couch-back", TILE_SIZE, TILE_SIZE, drawCouchBack);
  makeTexture(scene, "couch-seat", TILE_SIZE, TILE_SIZE, drawCouchSeat);
  makeTexture(scene, "tv", TILE_SIZE * 6, TILE_SIZE * 2, drawTv);
  makeTexture(scene, "door", TILE_SIZE * 2, TILE_SIZE, drawDoor);

  for (const [cabinet, color] of Object.entries(CABINET_COLORS)) {
    makeTexture(scene, `arcade-${cabinet}`, TILE_SIZE, TILE_SIZE * 2, (context) => drawArcade(context, color));
  }
}

function makeTexture(scene, key, width, height, draw) {
  if (scene.textures.exists(key)) scene.textures.remove(key);

  const texture = scene.textures.createCanvas(key, width, height);
  draw(texture.getContext(), width, height);
  texture.refresh();
}

function drawFloor(context) {
  context.fillStyle = "#1b1b28";
  context.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

  // A soft checker, then two darker specks for texture.
  context.fillStyle = "#20202f";
  context.fillRect(0, 0, 8, 8);
  context.fillRect(8, 8, 8, 8);

  context.fillStyle = "#161622";
  context.fillRect(3, 5, 2, 2);
  context.fillRect(10, 12, 2, 2);
}

function drawWall(context) {
  context.fillStyle = "#34344a";
  context.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

  context.fillStyle = "#3f3f5c";
  context.fillRect(0, 0, TILE_SIZE, 2);

  context.fillStyle = "#26263a";
  context.fillRect(0, 7, TILE_SIZE, 1);
  context.fillRect(7, 8, 1, 8);
  context.fillRect(0, 15, TILE_SIZE, 1);
}

function drawCouchBack(context) {
  context.fillStyle = "#5a35a0";
  context.fillRect(0, 2, TILE_SIZE, TILE_SIZE - 4);

  context.fillStyle = "#7b4bd1";
  context.fillRect(2, 4, TILE_SIZE - 4, 6);

  context.fillStyle = "#9a6bf0";
  context.fillRect(3, 5, TILE_SIZE - 6, 2);

  context.fillStyle = "#3d2270";
  context.fillRect(0, TILE_SIZE - 4, TILE_SIZE, 2);
}

function drawCouchSeat(context) {
  context.fillStyle = "#3d2270";
  context.fillRect(0, 4, TILE_SIZE, TILE_SIZE - 4);

  context.fillStyle = "#7b4bd1";
  context.fillRect(1, 6, TILE_SIZE - 2, 8);

  context.fillStyle = "#9a6bf0";
  context.fillRect(3, 8, TILE_SIZE - 6, 2);
}

function drawTv(context, width, height) {
  context.fillStyle = "#141420";
  context.fillRect(0, 0, width, height);

  context.fillStyle = "#2b2b3a";
  context.fillRect(2, 2, width - 4, height - 6);

  context.fillStyle = "#12303a";
  context.fillRect(6, 6, width - 12, height - 14);

  // Scanlines, so the screen reads as a CRT even when it is blank.
  context.fillStyle = "#1d4a58";
  for (let y = 8; y < height - 8; y += 4) {
    context.fillRect(6, y, width - 12, 1);
  }

  context.fillStyle = "#3f3f5c";
  context.fillRect(width / 2 - 6, height - 4, 12, 2);
}

function drawDoor(context, width, height) {
  context.fillStyle = "#2a1c14";
  context.fillRect(0, 0, width, height);

  context.fillStyle = "#6b4a2f";
  context.fillRect(2, 0, width - 4, height);

  context.fillStyle = "#8a6242";
  context.fillRect(4, 2, 10, height - 4);
  context.fillRect(18, 2, 10, height - 4);

  context.fillStyle = "#f0f0f0";
  context.fillRect(15, 8, 2, 2);
}

function drawArcade(context, accent) {
  context.fillStyle = "#1f2430";
  context.fillRect(0, 0, TILE_SIZE, TILE_SIZE * 2);

  context.fillStyle = "#34344a";
  context.fillRect(1, 1, TILE_SIZE - 2, TILE_SIZE * 2 - 2);

  // Marquee, screen, control panel.
  context.fillStyle = accent;
  context.fillRect(3, 3, TILE_SIZE - 6, 5);

  context.fillStyle = "#0b0b12";
  context.fillRect(3, 10, TILE_SIZE - 6, 9);

  context.fillStyle = accent;
  context.fillRect(5, 13, TILE_SIZE - 10, 3);

  context.fillStyle = "#4a4a66";
  context.fillRect(3, 22, TILE_SIZE - 6, 4);
}
