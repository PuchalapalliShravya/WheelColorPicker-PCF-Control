import {IInputs, IOutputs} from "./generated/ManifestTypes";

export class WheelColorPickControl implements ComponentFramework.StandardControl<IInputs, IOutputs> {

	 private _notifyOutputChanged: () => void;
    // This element contains all elements of Color Control
    private _container: HTMLDivElement;
    private _previewDivContainer: HTMLDivElement;
    private _colorPickerDivContainer: HTMLDivElement;
    private _canvasElement: HTMLCanvasElement;
    private _colorPropertyFieldName: string;
    private _colorPropertyFieldValue: string;
    private _canPreview: Boolean;
    // Reference to ComponentFramework Context object
    private _context: ComponentFramework.Context<IInputs>;
    
    constructor() {
        this._canPreview = false;
    }
    /**
     * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
     * Data-set values are not initialized here, use updateView.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
     * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
     * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
     * @param container If a control is marked control-type='starndard', it will receive an empty div element within which it can render its content.
     */
    public init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void, state: ComponentFramework.Dictionary, container: HTMLDivElement) {
        this._context = context;
        this._notifyOutputChanged = notifyOutputChanged;    
        // @ts-ignore       
        this._colorPropertyFieldName = this._context.parameters.ColorProperty.attributes.LogicalName;
        // @ts-ignore 
        this._colorPropertyFieldValue = Xrm.Page.getAttribute(this._colorPropertyFieldName).getValue();         
        this._container = document.createElement("div");            
        this.buildColorPickerCode();            
        container.appendChild(this._container);
    }
    /**
     * Build UI to display Color.
     */
    private buildColorPickerCode() {        
		this._previewDivContainer = document.createElement("div");
        this._previewDivContainer.setAttribute("class", "preview");
        this._previewDivContainer.setAttribute("id", "preview");
        this._previewDivContainer.addEventListener("click", this.onClickOfPreview.bind(this));

		this._container.append(this._previewDivContainer);

        this._canvasElement = this.generateColorWheel(200, "white"); //Wheel size and Center color of wheel
        this._canvasElement.setAttribute("class", "rotate");
        this._canvasElement.addEventListener("mousemove", this.onMouseHover.bind(this));
        this._canvasElement.addEventListener("click", this.onClickOfCanvas.bind(this));
        
        
        this._colorPickerDivContainer = document.createElement("div");
        this._colorPickerDivContainer.setAttribute("class", "colorpicker");
        this._colorPickerDivContainer.appendChild(this._canvasElement);

        if(this._colorPropertyFieldValue)
            this._previewDivContainer.style.backgroundColor = this._colorPropertyFieldValue;
        
        this._container.append(this._colorPickerDivContainer);
    }
    /**
     * On click of Color Canvas switch between Color freezing and Color Selection.
     */
    private onClickOfCanvas(e: any): void {
        this._canPreview = !this._canPreview;
        this._notifyOutputChanged();
    }
    /**
     * On click of UI element for Color hide and show Canvas.
     */
    private onClickOfPreview(e: any): void {
        if (!this._canPreview) {
            this._canPreview = true;
            this._colorPickerDivContainer.style.display = "block";
        }
        else {
            this._canPreview = false;
            this._colorPickerDivContainer.style.display = "none";
        }
        this._notifyOutputChanged();
    }
    /**
     * Update the record with the selected Color.
     */
    private onMouseHover(evt: any) {
        if (this._canPreview) {
            let imgData :any;
            var ctx = this._canvasElement.getContext("2d");
            if (ctx) imgData = ctx.getImageData(evt.offsetX, evt.offsetY, 1, 1);
            var pixel = imgData.data;
            var dColor = pixel[2] + 256 * pixel[1] + 65536 * pixel[0];
            var hexColor = '#' + ('0000' + dColor.toString(16)).substr(-6);
            this._previewDivContainer.style.backgroundColor = hexColor;
            this._colorPropertyFieldValue = hexColor;
            // @ts-ignore 
            Xrm.Page.getAttribute(this._colorPropertyFieldName).setValue(hexColor);
        }
    }
    /**
     * Convert Degree to Radians.
     */
    private degreesToRadians(degrees: any) {
        return degrees * (Math.PI / 180);
    }
    /**
     * Generate Color Wheel.
     */
    private generateColorWheel(size: any, centerColor: any) {
        if (size === void 0) { size = 400; }
        if (centerColor === void 0) { centerColor = "white"; }
        //Generate main canvas to return
        var canvas = document.createElement("canvas");
        var ctx = canvas.getContext("2d");
        canvas.width = canvas.height = size;
        //Generate canvas clone to draw increments on
        var canvasClone = document.createElement("canvas");
        canvasClone.width = canvasClone.height = size;
        var canvasCloneCtx = canvasClone.getContext("2d");
        //Initiate variables
        var angle = 0;
        var hexCode = [255, 0, 0];
        var pivotPointer = 0;
        var colorOffsetByDegree = 4.322;
        //For each degree in circle, perform operation
        while (angle++ < 360) {
            //find index immediately before and after our pivot
            var pivotPointerbefore = (pivotPointer + 3 - 1) % 3;
            //Modify colors
            if (hexCode[pivotPointer] < 255) {
                //If main points isn't full, add to main pointer
                hexCode[pivotPointer] = (hexCode[pivotPointer] + colorOffsetByDegree > 255 ? 255 : hexCode[pivotPointer] + colorOffsetByDegree);
            }
            else if (hexCode[pivotPointerbefore] > 0) {
                //If color before main isn't zero, subtract
                hexCode[pivotPointerbefore] = (hexCode[pivotPointerbefore] > colorOffsetByDegree ? hexCode[pivotPointerbefore] - colorOffsetByDegree : 0);
            }
            else if (hexCode[pivotPointer] >= 255) {
                //If main color is full, move pivot
                hexCode[pivotPointer] = 255;
                pivotPointer = (pivotPointer + 1) % 3;
            }
            if (canvasCloneCtx && ctx != null)
            //clear clone
            {
                canvasCloneCtx.clearRect(0, 0, size, size);
                //Generate gradient and set as fillstyle
                var grad = canvasCloneCtx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
                grad.addColorStop(0, centerColor);
                grad.addColorStop(1, "rgb(" + hexCode.map(function (h) { return Math.floor(h); }).join(",") + ")");
                canvasCloneCtx.fillStyle = grad;
                //draw full circle with new gradient
                canvasCloneCtx.globalCompositeOperation = "source-over";
                canvasCloneCtx.beginPath();
                canvasCloneCtx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
                canvasCloneCtx.closePath();
                canvasCloneCtx.fill();
                //Switch to "Erase mode"
                canvasCloneCtx.globalCompositeOperation = "destination-out";
                //Carve out the piece of the circle we need for this angle
                canvasCloneCtx.beginPath();
                canvasCloneCtx.arc(size / 2, size / 2, 0, this.degreesToRadians(angle + 1), this.degreesToRadians(angle + 1));
                canvasCloneCtx.arc(size / 2, size / 2, size / 2 + 1, this.degreesToRadians(angle + 1), this.degreesToRadians(angle + 1));
                canvasCloneCtx.arc(size / 2, size / 2, size / 2 + 1, this.degreesToRadians(angle + 1), this.degreesToRadians(angle - 1));
                canvasCloneCtx.arc(size / 2, size / 2, 0, this.degreesToRadians(angle + 1), this.degreesToRadians(angle - 1));
                canvasCloneCtx.closePath();
                canvasCloneCtx.fill();
                //Draw carved-put piece on main canvas
                ctx.drawImage(canvasClone, 0, 0);
            }
        }
        //return main canvas
        return canvas;
    }
    /**
     * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
     */
    public updateView(context: ComponentFramework.Context<IInputs>): void {
        // @ts-ignore 
        Xrm.Page.getAttribute(this._colorPropertyFieldName).setValue(this._colorPropertyFieldValue);
    }
    /** 
     * It is called by the framework prior to a control receiving new data. 
     * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as “bound” or “output”
     */
    public getOutputs(): IOutputs {
        var result = { ColorProperty: this._colorPropertyFieldValue };
        return result;
    }
    /** 
     * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
     * i.e. cancelling any pending remote calls, removing listeners, etc.
     */
    public destroy(): void {
        this._canvasElement.removeEventListener("mousemove", this.onMouseHover);
        this._canvasElement.removeEventListener("click", this.onClickOfCanvas);
        this._previewDivContainer.removeEventListener("click", this.onClickOfPreview);
    }
}
