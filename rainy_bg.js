import VPObject from "./Libraries/NLib/NViewport/vp_object.js";
import NPoint from "./Libraries/NLib/npoint.js";

export default class RainBackground extends VPObject {
    constructor(viewport, {} = {}) {
        super(viewport, {
            mouseListening: true,
            zOrder: -65536,
        });

        this.gradient = this._vp._ctx.createLinearGradient(0, this._vp._activeAreaCorners[2].y, 0, this._vp._activeAreaCorners[0].y);
        this.gradient.addColorStop(0, "#05060D");
        this.gradient.addColorStop(1, "#132431");
    }

    draw(ctx) {
        ctx.fillStyle = this.gradient;
        if (this._vp._activeAreaBounded) {
            const corner = this._vp._activeAreaCorners[0];
            const dims = this._vp._baseActiveAreaDims;
            ctx.fillRect(-corner.x, -corner.y, dims.x, dims.y);
        } else {
            let currentTransform = ctx.getTransform();
            ctx.resetTransform();
            const cvs = this._vp._canvas;
            ctx.fillRect(0, 0, cvs.width, cvs.height);
            ctx.setTransform(currentTransform);
        }
    }

    intersects(point, isInBounds) {
        return true;
    }

    onDragStarted(pointerMoveEvent) {
        super.onDragStarted(pointerMoveEvent);
        if (this._vp._navigable) {
            this.suggestCursor("move");
        }
    }

    onDragged(pointerMoveEvent) {
        super.onDragged(pointerMoveEvent);
        if (this._vp._navigable) {
            this._vp.setPanCenter(this._vp._panCenter.addp(this._vp._pointerElemDelta), true);
        }
    }

    onDragEnded(pointerUpEvent) {
        super.onDragEnded(pointerUpEvent);
        this.unsuggestCursor("move");
    }

    onWheel(wheelEvent) {
        super.onWheel(wheelEvent);
        if (this._vp._navigable) {
            if (wheelEvent.ctrlKey) {
                this._vp.scrollZoomCounter(-wheelEvent.deltaY);
            } else {
                this._vp.scrollPanCenter(wheelEvent.deltaX, wheelEvent.deltaY);
            }
        }
    }
}