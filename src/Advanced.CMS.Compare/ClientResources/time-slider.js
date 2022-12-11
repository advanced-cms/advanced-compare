define([
        "dojo/_base/declare",
        "dojo/on",
        "dojo/dom-geometry",
        "dojo/dom-class",
        "dijit/_CssStateMixin",
        "dijit/_Widget",
        "dijit/_TemplatedMixin",
        "dijit/_WidgetsInTemplateMixin",
        "dijit/layout/_LayoutWidget",
        "advanced-cms-compare/utils/date-converter",
        "dojo/text!advanced-cms-compare/time-slider.html",
        "xstyle/css!advanced-cms-compare/time-slider.css"
    ],
    function (
        declare,
        on,
        domGeometry,
        domClass,
        _CssStateMixin,
        _Widget,
        _TemplatedMixin,
        _WidgetsInTemplateMixin,
        _LayoutWidget,
        dateConverter,
        template
    ) {
        var SliderPoint = declare([_Widget, _TemplatedMixin, _WidgetsInTemplateMixin, _CssStateMixin], {
            buildRendering: function () {
                this.inherited(arguments);
                this.set("position", this._position);
                this.set("bottom", this._top);
            },

            _setPositionAttr: function (value) {
                this._position = value || 0;
                if (this.domNode) {
                    this.domNode.style.left = this._position + "px";
                }
            },

            _setBottomAttr: function (value) {
                if (!value) {
                    return;
                }
                this._bottom = value;
                if (this.domNode) {
                    this.domNode.style.bottom = this._bottom + "px";
                }
            },

            _setValueAttr: function (value) {
                this._value = value;
            },

            _getValueAttr: function () {
                if (!this._value) {
                    return null;
                }
                return new Date(this._value.getTime());
            },

            _setMaxPositionAttr: function (value) {
                this._maxPosition = value;
            },

            addClass: function (value) {
                this.domNode.classList.add(value);
            },

            _setVisibleAttr: function (value) {
                this._visible = value;
                domClass.toggle(this.domNode, "dijitHidden", !value);
            }
        });

        /// used to change selected time
        var SliderHandle = declare([SliderPoint], {
            templateString: "<div class='slider-handle'><span class='line'><span data-dojo-attach-point='label' class='label'>test<span></span></div>",

            buildRendering: function () {
                this.inherited(arguments);

                var that = this;

                this._updateLabel();

                this.own(on(this.domNode, "mousedown", function (e) {
                    e = e || window.event;
                    var start = 0, diff = 0;
                    if (e.pageX) start = e.pageX;
                    else if (e.clientX) start = e.clientX;

                    var updatedPosition;

                    function onMouseMove(e) {
                        console.log(that._position);
                        e = e || window.event;
                        var end = 0;
                        if (e.pageX) end = e.pageX;
                        else if (e.clientX) end = e.clientX;

                        diff = end - start;
                        var newPosition = that._position + diff;
                        if (newPosition < 0) {
                            newPosition = 0;
                        } else if (newPosition > (start + that._maxPosition)) {
                            newPosition = start + this._maxPosition;
                        }
                        updatedPosition = newPosition;
                        that.domNode.style.left = newPosition + "px";
                    }

                    function onMouseUp() {
                        if (typeof updatedPosition !== "undefined") {
                            that._position = updatedPosition;
                            that.onPositionChanged(updatedPosition);
                        }
                        document.body.removeEventListener("mousemove", onMouseMove);
                        document.body.removeEventListener("mouseup", onMouseUp);
                    }

                    document.body.addEventListener("mousemove", onMouseMove);
                    document.body.addEventListener("mouseup", onMouseUp);
                }));
            },

            _setTitleAttr: function (value) {
                this.domNode.title = value;
            },

            _updateLabel: function () {
                if (!this.label) {
                    return;
                }
                var date = this.get("value");
                if (!date) {
                    this.label.textContent = "";
                    return;
                }
                var text = (date.getFullYear() % 1000) + "/" + (date.getMonth() + 1) + "/" + date.getDate() + " " + date.getUTCHours() + ":" + date.getUTCMinutes();
                this.label.textContent = text;
            },

            _setValueAttr: function (value) {
                this.inherited(arguments);
                this._updateLabel();
            },

            // event
            onPositionChanged: function (position) {
            }
        });


        var SliderLabel = declare([SliderPoint], {
            templateString: "<div class='slider-label'></div>",

            _setColorStyleAttr: function (value) {
                this.domNode.style.backgroundColor = value;
            },

            _setIdAttr: function (value) {
                this._id = value;
            },

            _setTextAttr: function (value) {
                this.domNode.title = value;
            },

            _setGroupAttr: function (value) {
                this._group = value;
            },

            _setGroupIndexAttr: function (value) {
                this._groupIndex = value;
            }
        });

        return declare([_LayoutWidget, _TemplatedMixin, _WidgetsInTemplateMixin, _CssStateMixin], {
            _labels: null,

            _groupVisibility: {},

            templateString: template,

            buildRendering: function () {
                this.inherited(arguments);

                this._createHandles();

                this._labels = [];
            },

            _createHandles: function () {
                this.leftVersionHandle = new SliderHandle();
                this.leftVersionHandle.placeAt(this.handlesContainer);
                this.leftVersionHandle.addClass("left");
                this.leftVersionHandle.set("title", "Left content version"); //TODO: compare resources
                this.leftVersionHandle.set("value", 0);
                this.own(on(this.leftVersionHandle, "positionChanged", function (position) {
                    var value = this._convertPositionToDate(position);
                    this.leftVersionHandle.set("value", value);
                    this.onLeftHandleChanged(value);
                }.bind(this)));

                this.rightVersionHandle = new SliderHandle();
                this.rightVersionHandle.placeAt(this.handlesContainer);
                this.rightVersionHandle.addClass("right");
                this.rightVersionHandle.set("title", "Right content version"); //TODO: compare resources
                this.rightVersionHandle.set("value", 0);
                this.own(on(this.rightVersionHandle, "positionChanged", function (position) {
                    var value = this._convertPositionToDate(position);
                    this.rightVersionHandle.set("value", value);
                    this.onRightHandleChanged(value);
                }.bind(this)));
            },

            _setHandlesVisibleAttr: function (visible) {
                this.leftVersionHandle.set("visible", visible);
                this.rightVersionHandle.set("visible", visible);
            },

            // event
            onLeftHandleChanged: function (date) {
            },

            // event
            onRightHandleChanged: function (date) {
            },


            // groups count
            _setGroupsCountAttr: function (value) {
                this._groupsCount = value;
            },

            // groupIndex - allows to vertically position label
            addLabel: function (id, group, text, value, type, color, groupIndex) {
                var sliderLabel = new SliderLabel();
                this._labels.push(sliderLabel);
                sliderLabel.placeAt(this.labelsContainer);

                sliderLabel.set("id", id);
                sliderLabel.set("group", group);
                sliderLabel.set("text", text + " (" + id + ")\n" + value);
                sliderLabel.set("colorStyle", color);
                sliderLabel.set("value", value);
                sliderLabel.set("groupIndex", groupIndex);
                sliderLabel.addClass(type);

                return sliderLabel;
            },

            clear: function () {
                this._labels.forEach(function (label, index) {
                    this._labels[index] = null;
                    label.destroyRecursive(false);
                }, this);
                this._labels.length = 0;
                this._groupVisibility = {};
            },

            _convertDateToPoint: function (date) {
                var scaleMin = 0;
                return dateConverter.toPoint(scaleMin, this._maxWidth, this._minDate, this._maxDate, date);
            },

            _convertPositionToDate: function (position) {
                var sliderMin = 0;
                return dateConverter.toDate(sliderMin, this._maxWidth, this._minDate, this._maxDate, position);
            },

            updateLeftHandleDate: function (value) {
                this.leftVersionHandle.set("value", value);
                this.leftVersionHandle.set("position", this._convertDateToPoint(this.leftVersionHandle._value));
            },

            updateRightHandleDate: function (value) {
                this.rightVersionHandle.set("value", value);
                this.rightVersionHandle.set("position", this._convertDateToPoint(this.rightVersionHandle._value));
            },

            _getLeftHandleValueAttr: function () {
                return this.leftVersionHandle.get("value");
            },

            _getRightHandleValueAttr: function () {
                return this.rightVersionHandle.get("value");
            },

            setDateRange: function (minDate, maxDate) {
                this._minDate = minDate;
                this._maxDate = maxDate;

                this.leftVersionHandle.set("value", minDate);
                this.rightVersionHandle.set("value", maxDate);
                this._refreshPositions();
            },

            toggleGroupVisibility: function (group, isVisible) {
                this._groupVisibility[group] = isVisible;
                this._labels.forEach(function (label) {
                    if (label._group !== group) {
                        return;
                    }
                    this._setLabelVisible(label);
                }, this);
            },

            layout: function () {
                var sliderScaleRectangle = domGeometry.getMarginBox(this.sliderScale);
                this._maxWidth = sliderScaleRectangle.w;
                this._maxHeight = sliderScaleRectangle.h;

                this._refreshPositions();
            },

            _refreshPositions: function () {
                this.leftVersionHandle.set("maxPosition", this._maxWidth);
                this.leftVersionHandle.set("position", this._convertDateToPoint(this.leftVersionHandle._value));

                this.rightVersionHandle.set("maxPosition", this._maxWidth);
                this.rightVersionHandle.set("position", this._convertDateToPoint(this.rightVersionHandle._value));

                this._labels.forEach(function (label) {
                    label.set("maxPosition", this._maxWidth);
                    var point = this._convertDateToPoint(label._value);
                    label.set("position", point);
                    if (label._groupIndex && this._groupsCount) {
                        var offset = 20;
                        // caclulate vertical position of points on scale
                        label.set("bottom", ((this._maxHeight - offset) * label._groupIndex / this._groupsCount) + offset);
                    }

                    // label can be out of range from current scale
                    this._setLabelVisible(label);
                }, this);
            },

            // label can be set to visible when group is visible and label position is in scale
            _setLabelVisible: function (label) {
                var point = label._position;
                var isInScale = point >= 0 || point <= this._maxWidth;
                var groupVisibility = this._groupVisibility[label._group];
                var isGroupVisible = typeof groupVisibility === "undefined" || groupVisibility;
                label.set("visible", isInScale && isGroupVisible);
            }
        });
    });

//TODO: compare when get all group filters, assign min max dates to each group. If group is out of date range it should not be visible
