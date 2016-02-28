class Quadratic {
    constructor(inflection, control) {
        this.inflectionPoint = inflection;
        this.controlPoint = control;
        this.calculateParameters();
    }

    calculateParameters() {
        let x1 = this.inflectionPoint.x;
        let x2 = this.controlPoint.x;
        let x3 = x1 - (x2 - x1);

        let y1 = this.inflectionPoint.y;
        let y2 = this.controlPoint.y;
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
}

class QuadSelector {
    constructor(targetElement, imageUrl) {
        this.width = 800;
        this.height = 480;

        this.targetElement = targetElement;
        this.targetElement.innerHTML = "";

        this.imageElement = this.targetElement.ownerDocument.createElement("img");
        this.imageElement.width = this.width;
        this.imageElement.height = this.height;
        this.imageElement.src = imageUrl;
        this.imageElement.style.position = "absolute";
        this.imageElement.style.zIndex = 1;

        this.targetElement.appendChild(this.imageElement);

        this.canvasElement = this.targetElement.ownerDocument.createElement("canvas");
        this.canvasElement.width = this.width;
        this.canvasElement.height = this.height;
        this.canvasElement.style.position = "absolute";
        this.canvasElement.style.zIndex = 2;
        this.canvasElement.onmousemove = this.onMouseMove.bind(this);
        this.canvasElement.onmousedown = this.onMouseDown.bind(this);
        this.canvasElement.onmouseup = this.onMouseUp.bind(this);

        this.targetElement.appendChild(this.canvasElement);

        this.canvasContext = this.canvasElement.getContext("2d", { alpha: true });

        let inflectX = Math.floor(this.width * 0.5);
        let controlX = Math.floor(this.width * 0.75);

        this.quad1 = new Quadratic(
            { x: inflectX, y: 100 },
            { x: controlX, y: 100 }
        );

        this.quad2 = new Quadratic(
            { x: inflectX, y: this.height - 100 },
            { x: controlX, y: this.height - 100 }
        );
    }

    render() {
        this.canvasContext.clearRect(0, 0, this.width, this.height);
        this.drawQuad(this.quad1, "#ff0000");
        this.drawQuad(this.quad2, "#00ff00");
        this.drawZeroline("#0000ff");
    }

    drawQuad(quad, strokeStyle) {
        this.canvasContext.strokeStyle = strokeStyle;

        this.canvasContext.beginPath();

        this.canvasContext.moveTo(0, quad.valueAtX(0));

        for (let x = 1; x <= this.width; x++) {
            this.canvasContext.lineTo(x, quad.valueAtX(x));
        }

        this.canvasContext.stroke();

        this.drawHandle(quad.controlPoint);
        this.drawHandle(quad.inflectionPoint);

        this.canvasContext.beginPath();
        this.canvasContext.moveTo(quad.inflectionPoint.x, 0);
        this.canvasContext.lineTo(quad.inflectionPoint.x, this.height);
        this.canvasContext.stroke();
    }

    drawZeroline(strokeStyle) {
        let a1 = this.quad1.a,
            a2 = this.quad2.a,
            y1 = this.quad1.controlPoint.y,
            y2 = this.quad2.controlPoint.y;

        let zeroY = y1 + (y2 - y1) * (-a1 / (a2 - a1));

        console.log(`a1=${a1}; a2=${a2}; y1=${y1}; y2=${y2}; zeroY=${zeroY}`);

        this.canvasContext.strokeStyle = strokeStyle;

        this.canvasContext.beginPath();
        this.canvasContext.moveTo(0, zeroY);
        this.canvasContext.lineTo(this.width, zeroY);
        this.canvasContext.stroke();
    }

    drawHandle(point) {
        this.canvasContext.strokeRect(
            point.x - 4,
            point.y - 4,
            8,
            8
        );
    }

    isMouseOnHandle(ev, point) {
        let x = ev.offsetX, y = ev.offsetY;

        return point.x - 4 <= x &&
               x <= point.x + 4 &&
               point.y - 4 <= y &&
               y <= point.y + 4;
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
            this.selectedPoint.x = ev.offsetX;
            this.selectedPoint.y = ev.offsetY;
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

let imageInput = document.getElementById("image_input");

imageInput.onchange = function() {
    getImageUrlFromInputElement(imageInput, (imageUrl) => {
        let target = document.getElementById("target");
        let quadSelector = new QuadSelector(target, imageUrl);
        quadSelector.render();
    });
};
