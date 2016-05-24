class Quadratic {
    static fromPoints(inflection, control) {
        let q = new Quadratic();

        q.inflectionPoint = inflection;
        q.controlPoint = control;
        q.calculateParameters();

        return q;
    }

    static fromParameters(a, b, c) {
        let q = new Quadratic();

        q.a = a;
        q.b = b;
        q.c = c;

        return q;
    }

    static average(quad1, quad2) {
        return Quadratic.fromParameters(
            (quad1.a + quad2.a) / 2,
            (quad1.b + quad2.b) / 2,
            (quad1.c + quad2.c) / 2
        );
    }

    calculateParameters() {
        let x1 = this.inflectionPoint.x;
        let y1 = this.inflectionPoint.y;

        let x2 = this.controlPoint.x;
        let y2 = this.controlPoint.y;

        let x3 = x1 - (x2 - x1);
        let y3 = y2;

        let div = (x1 - x2) * (x1 - x3) * (x2 - x3);

        if (div == 0) {
            return;
        }

        // magic:

        this.a = (x3 * (y2 - y1) + x2 * (y1 - y3) + x1 * (y3 - y2)) / div;

        this.b = (x3 * x3 * (y1 - y2) + x1 * x1 * (y2 - y3) + x2 * x2 * (y3 - y1)) / div;

        this.c = y1 - (this.a * x1 * x1 + this.b * x1);
    }

    valueAtX(x) {
        return this.a * x * x + this.b * x + this.c;
    }

    negate() {
        return Quadratic.fromParameters(
            -this.a,
            -this.b,
            -this.c
        );
    }
}

class QuadSelector {
    constructor(canvasElement, image) {
        this.scalingFactor = image.width / 800; // TODO

        this.width = image.width;
        this.height = image.height;

        this.scaledWidth = this.width / this.scalingFactor;
        this.scaledHeight = this.height / this.scalingFactor;

        this.canvasElement = canvasElement;
        this.canvasElement.width = this.width;
        this.canvasElement.height = this.height;
        this.canvasElement.style.width = this.scaledWidth + "px";
        this.canvasElement.style.height = this.scaledHeight + "px";
        this.canvasElement.onmousemove = this.onMouseMove.bind(this);
        this.canvasElement.onmousedown = this.onMouseDown.bind(this);
        this.canvasElement.onmouseup = this.onMouseUp.bind(this);

        this.canvasContext = this.canvasElement.getContext("2d", { alpha: true });

        this.canvasContext.drawImage(image, 0, 0, this.width, this.height);

        this.imageData = this.canvasContext.getImageData(0, 0, this.width, this.height);

        let inflectX = Math.floor(this.width * 0.5);
        let controlX = Math.floor(this.width * 0.75);

        this.quad1 = Quadratic.fromPoints(
            { x: inflectX, y: 100 },
            { x: controlX, y: 100 }
        );

        this.quad2 = Quadratic.fromPoints(
            { x: inflectX, y: this.height - 100 },
            { x: controlX, y: this.height - 100 }
        );
    }

    render() {
        this.canvasContext.clearRect(0, 0, this.width, this.height);
        this.canvasContext.putImageData(this.imageData, 0, 0);
        this.drawQuad(this.quad1, "#ff0000");
        this.drawQuad(this.quad2, "#00ff00");
        this.drawZeroline("#0000ff");

        this.drawQuad(this.unwarpQuad(), "#ff00ff");
    }

    unwarpQuad() {
        return Quadratic.average(this.quad1, this.quad2);
    }

    drawQuad(quad, strokeStyle) {
        this.canvasContext.strokeStyle = strokeStyle;
        this.canvasContext.lineWidth = this.scalingFactor;

        this.canvasContext.beginPath();

        this.canvasContext.moveTo(0, quad.valueAtX(0));

        for (let x = 1; x <= this.scaledWidth; x++) {
            this.canvasContext.lineTo(x * this.scalingFactor, quad.valueAtX(x * this.scalingFactor));
        }

        this.canvasContext.stroke();

        // these guards are kinda nasty and are a result of Quadratic having a
        // weird dual-role (in that it represents ax^2 + bx + c curves as well
        // as knowing how to derive a, b, and c from a control and inflection
        // point)
        if (quad.controlPoint) {
            this.drawHandle(quad.controlPoint);
        }

        if (quad.inflectionPoint) {
            this.drawHandle(quad.inflectionPoint);

            this.canvasContext.beginPath();
            this.canvasContext.moveTo(quad.inflectionPoint.x, 0);
            this.canvasContext.lineTo(quad.inflectionPoint.x, this.height);
            this.canvasContext.stroke();
        }
    }

    zeroY() {
        let a1 = this.quad1.a,
            a2 = this.quad2.a,
            y1 = this.quad1.controlPoint.y,
            y2 = this.quad2.controlPoint.y;

        return y1 + (y2 - y1) * (-a1 / (a2 - a1));
    }

    drawZeroline(strokeStyle) {
        let zeroY = this.zeroY();

        this.canvasContext.strokeStyle = strokeStyle;

        this.canvasContext.beginPath();
        this.canvasContext.moveTo(0, zeroY);
        this.canvasContext.lineTo(this.width, zeroY);
        this.canvasContext.stroke();
    }

    drawHandle(point) {
        let size = 4 * this.scalingFactor;

        this.canvasContext.strokeRect(
            point.x - size,
            point.y - size,
            2 * size,
            2 * size
        );
    }

    isMouseOnHandle(ev, point) {
        let eX = ev.offsetX,
            eY = ev.offsetY;

        let pX = point.x / this.scalingFactor,
            pY = point.y / this.scalingFactor;

        return pX - 4 <= eX &&
               eX <= pX + 4 &&
               pY - 4 <= eY &&
               eY <= pY + 4;
    }

    onMouseMove(ev) {
        if (this.isMouseOnHandle(ev, this.quad1.inflectionPoint) ||
            this.isMouseOnHandle(ev, this.quad1.controlPoint) ||
            this.isMouseOnHandle(ev, this.quad2.inflectionPoint) ||
            this.isMouseOnHandle(ev, this.quad2.controlPoint))
        {
            this.canvasElement.style.cursor = "move";
        } else {
            this.canvasElement.style.cursor = "crosshair";
        }

        if (this.selectedPoint) {
            this.selectedPoint.x = ev.offsetX * this.scalingFactor;
            this.selectedPoint.y = ev.offsetY * this.scalingFactor;
            this.selectedQuad.calculateParameters();
            this.render();
        }
    }

    onMouseDown(ev) {
        for (let quad of [this.quad1, this.quad2]) {
            for (let point of [quad.inflectionPoint, quad.controlPoint]) {
                if (this.isMouseOnHandle(ev, point)) {
                    this.selectedQuad = quad;
                    this.selectedPoint = point;
                }
            }
        }
    }

    onMouseUp(ev) {
        this.selectedQuad = null;
        this.selectedPoint = null;
    }

    // TODO - move this out of QuadSelector
    unwarp(targetCanvas) {
        targetCanvas.width = this.width;
        targetCanvas.height = this.height;
        targetCanvas.style.width = this.scaledWidth + "px";
        targetCanvas.style.height = this.scaledHeight + "px";

        let inputImageData = this.imageData;
        let inputBuffer = inputImageData.data;
        let unwarpedBuffer = new Uint8ClampedArray(inputBuffer.length);

        let width = inputImageData.width;
        let height = inputImageData.height;

        let zeroY = this.zeroY();
        let unwarpQuad = this.unwarpQuad();

        for (let x = 0; x < width; x++) {
            let scalingFactor = (unwarpQuad.valueAtX(x) - zeroY) / (unwarpQuad.valueAtX(width / 2) - zeroY);

            for (let y = 0; y < height; y++) {
                let bufferPos = (y * width + x) * 4;

                // TODO: lerp between points
                let scaledY = (((y - zeroY) * scalingFactor) + zeroY) | 0;

                let scaledBufferPos = (scaledY * width + x) * 4;

                unwarpedBuffer[bufferPos + 0] = inputBuffer[scaledBufferPos + 0];
                unwarpedBuffer[bufferPos + 1] = inputBuffer[scaledBufferPos + 1];
                unwarpedBuffer[bufferPos + 2] = inputBuffer[scaledBufferPos + 2];
                unwarpedBuffer[bufferPos + 3] = inputBuffer[scaledBufferPos + 3];
            }
        }

        let unwarpedImageData = new ImageData(unwarpedBuffer, width, height);

        let targetCanvasContext = targetCanvas.getContext("2d", { "alpha": true });

        targetCanvasContext.putImageData(unwarpedImageData, 0, 0);
    }
}

function getImageUrlFromInputElement(inputElement, cb) {
    if (inputElement.files.length < 1) {
        cb(null);
        return;
    }

    let fileReader = new FileReader();

    fileReader.onload = function() {
        cb(fileReader.result);
    };

    fileReader.readAsDataURL(inputElement.files[0]);
}

let quadSelector = null;

let imageInput = document.getElementById("image-input");

imageInput.onchange = function() {
    getImageUrlFromInputElement(imageInput, (imageUrl) => {
        let image = new Image();
        image.src = imageUrl;
        image.onload = () => {
            let selector = document.getElementById("selector");
            quadSelector = new QuadSelector(selector, image);
            quadSelector.render();
        };
    });
};

let unwarpButton = document.getElementById("unwarp-button");

unwarpButton.onclick = function() {
    quadSelector.unwarp(document.getElementById("target"));
};
