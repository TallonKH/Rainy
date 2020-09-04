import NPoint from "./Libraries/NLib/npoint.js";
import NViewport from "./Libraries/NLib/NViewport/nviewport.js";
import RainBackground from "./rainy_bg.js";
import RainHandler from "./rainhandler.js";

class RainyVP extends NViewport {
    constructor() {
        super({
            minZoomFactor: 1,
            maxZoomFactor: 4,
            navigable: true,
            activeAreaBounded: true,
            zoomCenterMode: "pointer",
            fittingMode: "shrink",
            activeBackgroundClass: RainBackground,
            baseActiveDims: new NPoint(800, 500),
            activeAreaPadding: NPoint.ZERO,
        });

        /** RainParticleHandler */
        this.rainHandler;
    }

    onSetup(){
        super.onSetup();
        this.rainHandler = new RainHandler(this);
        this.registerObj(this.rainHandler);
    }
}

window.onload = function () {
    setupElements();
};

function setupElements() {
    const rootDiv = document.getElementById("viewportContainer");
    rootDiv.style.backgroundColor = "#101010";

    const viewport = new RainyVP();
    viewport.setup(rootDiv);
    viewport._setupSimpleLoop();
}