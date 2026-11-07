/**
 * Minimal 2D canvas for jsdom.
 *
 * jsdom has no rasteriser without the native `canvas` package, so this stores
 * pixels per canvas element. It implements only what the sprite code uses;
 * that is enough for tests to compare real pixel output.
 */

const stores = new WeakMap();

function storeFor(canvas) {
  let store = stores.get(canvas);

  if (!store || store.width !== canvas.width || store.height !== canvas.height) {
    store = {
      width: canvas.width,
      height: canvas.height,
      data: new Uint8ClampedArray(canvas.width * canvas.height * 4),
    };
    stores.set(canvas, store);
  }

  return store;
}

function copyPixels(from, fromWidth, to, toWidth, width, height, offsetX = 0, offsetY = 0) {
  for (let row = 0; row < height; row++) {
    for (let column = 0; column < width; column++) {
      const targetX = offsetX + column;
      const targetY = offsetY + row;

      if (targetX < 0 || targetY < 0) continue;

      const sourceIndex = (row * fromWidth + column) * 4;
      const targetIndex = (targetY * toWidth + targetX) * 4;

      if (targetIndex + 3 >= to.length) continue;

      to[targetIndex] = from[sourceIndex];
      to[targetIndex + 1] = from[sourceIndex + 1];
      to[targetIndex + 2] = from[sourceIndex + 2];
      to[targetIndex + 3] = from[sourceIndex + 3];
    }
  }
}

function createContext(canvas) {
  return {
    canvas,

    createImageData(width, height) {
      return { width, height, data: new Uint8ClampedArray(width * height * 4) };
    },

    putImageData(image, offsetX = 0, offsetY = 0) {
      const store = storeFor(canvas);
      copyPixels(
        image.data,
        image.width,
        store.data,
        store.width,
        image.width,
        image.height,
        offsetX,
        offsetY,
      );
    },

    getImageData(x, y, width, height) {
      const store = storeFor(canvas);
      const data = new Uint8ClampedArray(width * height * 4);
      copyPixels(store.data, store.width, data, width, width, height, -x, -y);

      return { width, height, data };
    },

    drawImage(source, offsetX = 0, offsetY = 0) {
      const sourceStore = storeFor(source);
      const store = storeFor(canvas);
      copyPixels(
        sourceStore.data,
        sourceStore.width,
        store.data,
        store.width,
        sourceStore.width,
        sourceStore.height,
        offsetX,
        offsetY,
      );
    },

    clearRect() {},
    fillRect() {},
  };
}

export function installCanvasMock() {
  HTMLCanvasElement.prototype.getContext = function getContext(type) {
    if (type !== "2d") return null;

    if (!this.mockContext) {
      this.mockContext = createContext(this);
    }

    return this.mockContext;
  };
}
