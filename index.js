const canvas = document.getElementById("c1");
const ctx = canvas.getContext("2d");

const settings = {
  maxWidth: null,
  maxHeight: null,
};

const setCanvasSize = () => {
  canvas.height = window.innerHeight;
  canvas.width = window.innerWidth;
  settings.maxWidth = window.innerWidth;
  settings.maxHeight = window.innerHeight;
};

window.addEventListener("resize", setCanvasSize);

setCanvasSize();

const image = new Image();

const mouseGlobal = {
  x: null,
  y: null,
  isMoving: false
};

window.addEventListener("mousemove", ({ x, y }) => {
  mouseGlobal.x = x;
  mouseGlobal.y = y;
});

window.addEventListener("mousedown", ({ x, y }) => {
  mouseGlobal.x = x;
  mouseGlobal.y = y;
  mouseGlobal.isMoving = true;
});

window.addEventListener("mouseup", ({ x, y }) => {
  mouseGlobal.x = x;
  mouseGlobal.y = y;
  mouseGlobal.isMoving = false;
});

const imageGeometry = initialValues => ({
  x: 0,
  y: 0,
  width: 50,
  height: 50,
  controlRadius: 15,
  isMoving: false,
  isResizing: false,
  resizingIndex: -1,
  ...initialValues
});

const getControlsCoordinates = geometry => {
  const r = geometry.controlRadius;
  const { x, y, width, height } = geometry;

  return [
    [x + r, y + r],
    [x + width + 2 * r, y + r],
    [x + width + 2 * r, height + y + 2 * r],
    [x + r, height + y + 2 * r]
  ];
};

const isMouseInRect = (mouse, x, x1, y, y1) =>
  mouse.x >= x && mouse.x <= x1 && mouse.y >= y && mouse.y <= y1;

const renderCircle = (x, y, radious) => {
  ctx.beginPath();
  ctx.fillStyle = "green";
  ctx.arc(x, y, radious, 0, Math.PI * 2, true);
  ctx.fill();
};

const render = (image, geometry) => {
  ctx.clearRect(0, 0, settings.maxWidth, settings.maxWidth);

  const controlRadius = geometry.controlRadius;

  ctx.drawImage(
    image,
    geometry.x + controlRadius,
    geometry.y + controlRadius,
    geometry.width + controlRadius,
    geometry.height + controlRadius
  );

  getControlsCoordinates(geometry).forEach(([x, y], index) => {
    renderCircle(
      x,
      y,
      index === geometry.resizingIndex ? 1.5 * controlRadius : controlRadius
    );
  });
};

const modifyGeometry = (geometry, oldMouse, mouse, settings) => {
  const dx = mouse.x - oldMouse.x;
  const dy = mouse.y - oldMouse.y;

  if (
    geometry.resizingIndex == -1 &&
    ((mouse.isMoving && geometry.isMoving) ||
      (oldMouse &&
        !oldMouse.isMoving &&
        mouse.isMoving &&
        isMouseInRect(
          mouse,
          geometry.x + geometry.controlRadius,
          geometry.x + geometry.width + 2 * geometry.controlRadius,
          geometry.y + geometry.controlRadius,
          geometry.y + geometry.height + 2 * geometry.controlRadius
        )))
  ) {
    return {
      ...geometry,
      isMoving: true,
      x: Math.max(geometry.x + dx, 0),
      y: Math.max(geometry.y + dy, 0)
    };
  } else {
    const radious = geometry.controlRadius;

    const controlsCoordinates = getControlsCoordinates(geometry);

    const resizingIndex = controlsCoordinates.findIndex(([x, y]) =>
      isMouseInRect(
        oldMouse,
        x - radious,
        x + radious,
        y - radious,
        y + radious
      )
    );

    let newState = {};

    const newY = Math.max(geometry.y + dy, 0);
    const newX = Math.max(geometry.x + dx, 0);

    const newHeightIfTop =
      dy > 0 ? geometry.height - dy : geometry.height + -1 * dy;

    const newWidthIfLeft =
      dx > 0 ? geometry.width - dx : geometry.width + -1 * dx;

    if (mouse.isMoving) {
      switch (resizingIndex) {
        case 0: {
          newState = {
            width: newWidthIfLeft,
            height: newHeightIfTop,
            x: newX,
            y: newY
          };
          break;
        }
        case 1: {
          const newWidth = geometry.width + dx;
          newState = {
            width: newWidth,
            height: newHeightIfTop,
            y: newY
          };
          break;
        }

        case 3: {
          const newHeight =
            dy > 0 ? geometry.height + dy : geometry.height + dy;
          newState = {
            height: newHeight,
            x: newX,
            width: newWidthIfLeft
          };
          break;
        }

        default: {
          const newWidth = geometry.width + dx;
          const newHeight = geometry.height + dy;
          newState = {
            width: newWidth,
            height: newHeight
          };
          break;
        }
      }
      return {
        ...geometry,
        ...newState
      };
    } else {
      return {
        ...geometry,
        isMoving: false,
        resizingIndex,
        isResizing: false
      };
    }
  }
};

function drawImageInSize() {
  const imageWidth = this.naturalWidth;
  const imageHeight = this.naturalHeight;

  const aspectRation = (imageWidth / imageHeight);


  const initialHeight = 400;
  const initalWidth = initialHeight * aspectRation;

  let oldGeometry = imageGeometry({
    width: initalWidth,
    height: initialHeight
  });

  let oldMouse = mouseGlobal;

  const startAnimation = () => {
    geometry = modifyGeometry(oldGeometry, oldMouse, mouseGlobal, settings);
    render(image, geometry, mouseGlobal);
    oldMouse = { ...mouseGlobal };
    oldGeometry = geometry;
    requestAnimationFrame(startAnimation);
  };

  startAnimation();
}

image.onload = drawImageInSize;
image.src =
  "https://source.unsplash.com/random";
