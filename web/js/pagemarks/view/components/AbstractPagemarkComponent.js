const {Component} = require("../../../components/Component");
const {DocFormatFactory} = require("../../../docformat/DocFormatFactory");
const {Styles} = require("../../../util/Styles");
const {Preconditions} = require("../../../Preconditions");
const {BoxController} = require("../../../pagemarks/controller/interact/BoxController");
const {Rects} = require("../../../Rects");
const {Optional} = require("../../../Optional");
const log = require("../../../logger/Logger").create();

const ENABLE_BOX_CONTROLLER = false;

class AbstractPagemarkComponent extends Component {

    constructor() {
        super();

        /**
         *
         * @type {DocFormat}
         */
        this.docFormat = DocFormatFactory.getInstance();

        /**
         *
         * @type {Pagemark}
         */
        this.pagemark = undefined;

        /**
         *
         * @type {AnnotationEvent}
         */
        this.annotationEvent = undefined;

        this.pagemarkBoxController = undefined;

        /**
         *
         * The element created to represent the pagemark.
         *
         * @type {HTMLElement}
         */
        this.pagemarkElement = null;

        this.options = {
            templateElement: null,
            placementElement: null
        };

    }

    /**
     * @Override
     * @param annotationEvent {AnnotationEvent}
     */
    init(annotationEvent) {

        this.annotationEvent = annotationEvent;
        this.pagemark = annotationEvent.value;

        this.pagemarkBoxController = new BoxController(this.pagemarkMoved);

    }

    pagemarkMoved(boxMoveEvent) {

        // TODO: actually I think this belongs in the controller... not the view
        //
        //

        // TODO: remove the pagemark, then recreate it...

        console.log("Box moved: ", boxMoveEvent);
    }

    /**
     * @Override
     *
     */
    render() {

        //
        // - the options building can't be reliably tested
        //
        // - there are too many ways to compute the options
        //
        // - we PLACE the element as part of this function.  Have a secondary
        //   way to just CREATE the element so that we can test the settings
        //   properly.

        let container = this.annotationEvent.container;
        Preconditions.assertNotNull(container, "container")

        if(! this.pagemark) {
            throw new Error("Pagemark is required");
        }

        if(! this.pagemark.percentage) {
            throw new Error("Pagemark has no percentage");
        }

        let templateElement = this.options.templateElement;
        let placementElement = this.options.placementElement;

        if(! templateElement) {
            templateElement = container.element;
        }

        if (! placementElement) {
            // TODO: move this to the proper component
            placementElement = container.element.querySelector(".canvasWrapper, .iframeWrapper");
            // TODO: we need to code this directly into the caller
            log.warn("Using a default placementElement from selector: ", placementElement);
        }

        Preconditions.assertNotNull(templateElement, "templateElement")
        Preconditions.assertNotNull(placementElement, "placementElement")

        console.log("Using templateElement: ", templateElement);
        console.log("Using placementElement: ", placementElement);

        if (container.element.querySelector("#pagemark-" + this.pagemark.id)) {
            // do nothing if the current page already has a pagemark.
            console.warn("Pagemark already exists");
            return;
        }

        this.pagemarkElement = document.createElement("div");

        // set a pagemark-id in the DOM so that we can work with it when we use
        // the context menu, etc.
        this.pagemarkElement.setAttribute("id", "pagemark-" + this.pagemark.id);
        this.pagemarkElement.setAttribute("data-pagemark-id", this.pagemark.id);

        // make sure we have a reliable CSS classname to work with.
        this.pagemarkElement.className="pagemark annotation";

        //pagemark.style.backgroundColor="rgb(198, 198, 198)";
        this.pagemarkElement.style.backgroundColor="#00CCFF";
        this.pagemarkElement.style.opacity="0.3";

        this.pagemarkElement.style.position="absolute";


        let templateRect = this.createTemplateRect(templateElement);
        let pagemarkRect = this.createPagemarkRect(templateRect, this.pagemark);

        this.pagemarkElement.style.left = `${pagemarkRect.left}px`;
        this.pagemarkElement.style.top = `${pagemarkRect.top}px`;
        this.pagemarkElement.style.width = `${pagemarkRect.width}px`;
        this.pagemarkElement.style.height = `${pagemarkRect.height}px`;
        this.pagemarkElement.style.zIndex = '1';

        placementElement.parentElement.insertBefore(this.pagemarkElement, placementElement);

        // TODO: this enables resize but we don't yet support updating the
        // pagemark data itself.  We're probably going to have to implement
        // mutation listeners there.

        if(ENABLE_BOX_CONTROLLER) {
            console.log("Creating box controller for pagemarkElement: ", this.pagemarkElement);
            this.pagemarkBoxController.register(this.pagemarkElement);
        }

    }

    createTemplateRect(templateElement) {

        let positioning = Styles.positioning(templateElement);
        positioning = Styles.positioningToPX(positioning);

        console.log("FIXME: positioning: " , positioning );

        let result = {
            left: 0,
            top: 0,
            width: Optional.of(positioning.width).getOrElse(templateElement.offsetWidth),
            height: Optional.of(positioning.height).getOrElse(templateElement.offsetHeight),
        };

        return Rects.createFromBasicRect(result);

    }

    createTemplateRect1(templateElement) {

        return {
            left: templateElement.offsetLeft,
            top: templateElement.offsetTop,
            width: templateElement.style.width,
            height: Styles.parsePX(templateElement.style.height)
        };

        if(!result.height) {
            result.height = templateElement.offsetHeight;
        }

        return result;

    }

    createPagemarkRect(templateRect, pagemark) {

        let rect = {
            left: templateRect.left,
            top: templateRect.top,
            height: templateRect.height,
            width: templateRect.width,
        };

        // read the percentage coverage from the pagemark and adjust the height
        // to reflect the portion we've actually read.

        rect.height = rect.height * (pagemark.percentage / 100);

        return Rects.createFromBasicRect(rect);

    }

    /**
     * @Override
     * @returns {*}
     */
    destroy() {

        if(this.pagemarkElement) {

            if(this.pagemarkElement.parentElement) {
                this.pagemarkElement.parentElement.removeChild(this.pagemarkElement);
            }

            //this.pagemarkBoxController.unregister(this.pagemarkElement);
            this.pagemarkElement = null;

        }

    }

}

module.exports.AbstractPagemarkComponent = AbstractPagemarkComponent;
