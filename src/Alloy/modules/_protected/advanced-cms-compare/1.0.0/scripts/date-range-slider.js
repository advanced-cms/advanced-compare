define([
    "dojo/_base/declare",
    "dojo/on",
    "dojo/dom-geometry",

    "dijit/_Widget",
    "dijit/layout/_LayoutWidget",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",

    "advanced-cms-compare/utils/date-converter",
    "dojo/text!advanced-cms-compare/date-range-slider-template.html",

    "dojox/form/RangeSlider",
        
    "xstyle/css!dojox/form/resources/RangeSlider.css",
    "xstyle/css!advanced-cms-compare/date-range-slider.css"
    ],
    function (
        declare,
        on,
        domGeometry,

        _Widget,
        _LayoutWidget,
        _TemplatedMixin,
        _WidgetsInTemplateMixin,
        dateConverter,
        template
    ) {
        // point on range scale where content or block changed
        var Point = declare([_Widget, _TemplatedMixin, _WidgetsInTemplateMixin], {
            templateString: "<div class='point'></div>",

            buildRendering: function () {
                this.inherited(arguments);
                this.set("position", this._position);
            },

            _setPositionAttr: function (value) {
                this._position = value || 0;
                if (this.domNode) {
                    this.domNode.style.left = this._position + "px";
                }
            }
        });


        //TODO: compare show dots represinting content changes in time
        //      it should be similar to time-slider, but the height should be smaller and no colors for blocks
        //      and no different shapes between content and blocks
        //      It should just show the user when content changed

        var sliderMin = 0;
        var sliderMax = 10000;

        return declare([_LayoutWidget, _TemplatedMixin, _WidgetsInTemplateMixin], {
            templateString: template,

            _points: null,

            buildRendering: function () {
                this.inherited(arguments);

                this._points = [];

                this.slider.set("minimum", sliderMin);
                this.slider.set("maximum", sliderMax);
                this.slider.set("value", [sliderMin, sliderMax]);

                // use setTimeout because setters for minimum and maximum have defered
                // and we don't want to call onChange at the beggining
                setTimeout(function () {
                    this.own(on(this.slider, "change", function (range) {
                        // rescale points
                        var from = dateConverter.toDate(sliderMin, sliderMax, this._minDate, this._maxDate, range[0]);
                        var to = dateConverter.toDate(sliderMin, sliderMax, this._minDate, this._maxDate, range[1]);
                        this.onRangeChanged(from, to);
                    }.bind(this)));
                }.bind(this, 0));
            },

            _setDateRangeAttr: function (minValue, maxValue) {
                this._minDate = minValue;
                this._maxDate = maxValue;
            },

            addPoint: function (dateValue) {
                var point = new Point();
                point.set("value", dateValue);
                point.set("position", dateConverter.toPoint(10, this._maxWidth - 10, this._minDate, this._maxDate, dateValue));
                this._points.push(point);
                point.placeAt(this.rangePoints);
            },

            clear: function () {
                this._points.forEach(function (point, index) {
                    this._points[index] = null;
                    point.destroyRecursive(false);
                }, this);
                this._points.length = 0;
            },

            layout: function () {
                var sliderScaleRectangle = domGeometry.getMarginBox(this.rangePoints);
                this._maxWidth = sliderScaleRectangle.w;
            },

            // event - triggered when slider values changed
            onRangeChanged: function (minDate, maxDate) {}
        });
    });
