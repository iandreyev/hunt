(function(root, factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        define(function() {
            return factory();
        });
    } else if (typeof exports === 'object') {
        module.exports = factory;
    } else {
        root.hunt = factory();
    }
})(this, function() {
    'use strict';

    var huntedElements = [],
        ticking = false,
        viewport = window.innerHeight,
        y = 0;

    // request animation frame and cancel animation frame vendors
    var rAF = (function() {
        return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame;
    })();

    /*
     * Returns distance between element and window top
     * @method getOffsetTop
     * @param {Node} element
     */
    var getOffsetTop = function(element) {
        var top = element.offsetTop,
            offsetParent = element.offsetParent;

        // escalate offset parent assignation
        while (offsetParent) {
            top += offsetParent.offsetTop;
            offsetParent = offsetParent.offsetParent;
        }

        return top;
    };

    /*
     * Returns distance vertically scrolled
     * @method getScrollY
     */
    var getScrollY = function() {
        return viewport + window.scrollY || window.pageYOffset;
    };

    /*
     * Constructor for element that should be hunted
     * @constructor Hunted
     * @param {Node} element
     * @param {Object} options
     */
    var Hunted = function(element, config) {
        this.element = element;

        // instantiate element as not visible
        this.visible = false;

        // assign metrics of the first time
        this.updateMetrics();

        for (var prop in config) {
            if (config.hasOwnProperty(prop)) {
                this[prop] = config[prop];
            }
        }
    };

    // assign or updates instance metrics
    Hunted.prototype.updateMetrics = function() {
        this.height = this.element.clientHeight;
        this.top = getOffsetTop(this.element);
    };

    // by default offset is zero
    Hunted.prototype.offset = 0;

    // by default trigger events only once
    Hunted.prototype.persist = false;

    // fallback in function to avoid sanity check
    Hunted.prototype.in = function() {};

    // fallback out function to avoid sanity check
    Hunted.prototype.out = function() {};

    /*
     * Adds one or more elements to the hunted elements array
     * @method add
     * @param {Array|Node} elements
     * @param {Object} options
     */
    var add = function(elements, options) {
        // sanity check of arguments
        if (elements instanceof Node === false
                && typeof elements.length !== 'number'
                || typeof options !== 'object') {
            throw new TypeError('You must pass an element or a collection of them and an options object');
        }

        // treat single node as array
        if (elements instanceof Node === true) {
            elements = [ elements ];
        }

        var i = 0,
            len = elements.length;

        // add elements to general hunted array
        for (; i < len; i++) {
            huntedElements.push(new Hunted(elements[i], options));
        }

        // check if recently added elements are visible
        huntElements();

        i = len = null;
    };

    /*
     * Updates viewport and elements metrics
     * @method updateMetrics
     */
    var updateMetrics = function() {
        viewport = window.innerHeight;
        y = getScrollY();

        var i = 0,
            len = huntedElements.length;

        for (; i < len; i++) {
            huntedElements[i].updateMetrics();
        }

        i = len = null;
    };

    /*
     * Checks if hunted elements are visible and resets ticking
     * @method huntElements
     */
    var huntElements = function() {
        var len = huntedElements.length,
            hunted;

        if (len > 0) {
            y = getScrollY();

            while (len) {
                --len;

                hunted = huntedElements[len];

                /*
                 * trigger (in) event if element comes from a non visible state and the scrolled viewport has
                 * reached the visible range of the element without exceeding it
                 */
                if (!hunted.visible
                        && y > hunted.top - hunted.offset
                        && y < hunted.top + hunted.height + viewport + hunted.offset) {
                    hunted.in.apply(hunted.element);
                    hunted.visible = true;
                }

                /*
                 * trigger (out) event if element comes from a visible state and it's out of the visible
                 * range its bottom or top limit
                 */
                if (hunted.visible
                        && (y <= hunted.top - hunted.offset
                        || y >= hunted.top + hunted.height + viewport + hunted.offset)) {
                   hunted.out.apply(hunted.element);
                   hunted.visible = false;

                    // when hunting should not persist kick element out
                    if (!hunted.persist) {
                       huntedElements.splice(len, 1);
                    }
                }
            }
        }

        // reset ticking
        ticking = false;

        hunted = len = null;
    };

    /*
     * Delays action until next available frame according to technic
     * exposed by Paul Lewis http://www.html5rocks.com/en/tutorials/speed/animations/
     * @method debounceHunt
     */
    var debounceHunt = function() {
        if (!ticking) {
            rAF(huntElements);
        }
        ticking = true;
    };

    // on resize update viewport metrics
    window.addEventListener('resize', updateMetrics);

    // on scroll check for elements position and trigger methods
    window.addEventListener('scroll', debounceHunt);

    return add;
});
