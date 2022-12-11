define([
        "dojo/_base/declare",
        "dojo/on",
        "dojo/dom-class",
        "dijit/_CssStateMixin",
        "dijit/_Widget",
        "dijit/_TemplatedMixin",
        "dijit/_WidgetsInTemplateMixin",
        "epi/dependency",
        "epi-cms/core/ContentReference",
        "advanced-cms-compare/label-color-resolver",
        "dojo/text!advanced-cms-compare/version-selector-template.html",
        "epi/shell/widget/DateTimeSelectorDropDown",
        "advanced-cms-compare/time-slider",
        "advanced-cms-compare/content-filter",
        "advanced-cms-compare/date-range-slider",
        "xstyle/css!advanced-cms-compare/styles.css"
    ],
    function (
        declare,
        on,
        domClass,
        _CssStateMixin,
        _Widget,
        _TemplatedMixin,
        _WidgetsInTemplateMixin,
        dependency,
        ContentReference,
        labelColorResolver,
        template
    ) {
        function compare(a, b) {
            a = a.name.toUpperCase();
            b = b.name.toUpperCase();

            if (a.last_nom < b.last_nom) {
                return -1;
            }
            if (a.last_nom > b.last_nom) {
                return 1;
            }
            return 0;
        }

        return declare([_Widget, _TemplatedMixin, _WidgetsInTemplateMixin, _CssStateMixin], {
            region: "top",

            templateString: template,

            buildRendering: function () {
                this.inherited(arguments);

                this._initializeLanguageDropdown();

                this.own(this.leftVersionDate.watch("value", function (property, oldValue, newValue) {
                    this._updateLeftVersionDate(newValue, "dateTimePicker");
                }.bind(this)));

                this.own(this.rightVersionDate.watch("value", function (property, oldValue, newValue) {
                    this._updateRightVersionDate(newValue, "dateTimePicker");
                }.bind(this)));

                this.own(on(this.timeSlider, "leftHandleChanged", function (date) {
                    this._updateLeftVersionDate(date, "handle");
                }.bind(this)));

                this.own(on(this.timeSlider, "rightHandleChanged", function (date) {
                    this._updateRightVersionDate(date, "handle");
                }.bind(this)));

                this.own(on(this.contentFilter, "contentFilterChanged", function (contentLink, isSelected) {
                    this.timeSlider.toggleGroupVisibility(contentLink, isSelected);
                }.bind(this)));

                this.own(on(this.rangeSlice, "rangeChanged", function (fromDate, toDate) {
                    this.timeSlider.setDateRange(fromDate, toDate);
                    this._updateDatePickersConstraints();
                }.bind(this)));

                // do not allow to set date manually, user has to use dropdown
                this.leftVersionDate.textbox.readOnly = true;
                this.rightVersionDate.textbox.readOnly = true;
            },

            _initializeLanguageDropdown: function () {
                var languageStore = this.languageStore || dependency.resolve("epi.storeregistry").get("epi.cms.language");
                languageStore.query().then(function (languages) {
                    var options = [];
                    languages.forEach(function (l) {
                        options.push({
                            label: l.name,
                            value: l.languageId
                        });
                    });
                    this.languageFilter.set("options", options);
                    this.languageFilter.set("value", "en");

                    this.defer(function () {
                        this.own(
                            this.languageFilter.on("change", function (value) {
                                this.onLanguageChanged(value);
                            }.bind(this))
                        );
                    });
                }.bind(this));
            },

            getSelectedLanguage: function () {
                return this.languageFilter.get("value") || "en";
            },

            // event
            onLanguageChanged: function (language) {
            },

            _updateLeftVersionDate: function (value, trigger) {
                var lastDateChanged = (!this._lastLeftVersionDate && value) || this._lastLeftVersionDate.getTime() !== value.getTime();
                if (!lastDateChanged) {
                    return;
                }
                this._lastLeftVersionDate = value;
                if (trigger !== "handle") {
                    // dateTimePicker store only minutes and seconds, but handle contains also seconds and milliseconds
                    // to compare those dates we have to clear those values
                    var dateCopy = new Date(value.getTime());
                    dateCopy.setSeconds(0);
                    dateCopy.setMilliseconds(0);

                    var handleDate = this.timeSlider.get("leftHandleValue");
                    handleDate.setSeconds(0);
                    handleDate.setMilliseconds(0);
                    if (handleDate.getTime() !== dateCopy.getTime()) {
                        this.timeSlider.updateLeftHandleDate(value);
                        this.onLeftVersionDateChanged(value);
                    }
                }
                if (trigger !== "dateTimePicker") {
                    this.leftVersionDate.set("value", value);
                    this.onLeftVersionDateChanged(value);
                }
            },

            _updateRightVersionDate: function (value, trigger) {
                var lastRightVersionDateChanged = (!this._lastRightVersionDate && value) || this._lastRightVersionDate.getTime() !== value.getTime();
                if (!lastRightVersionDateChanged) {
                    return;
                }
                this._lastRightVersionDate = value;

                if (trigger !== "handle") {
                    // dateTimePicker store only minutes and seconds, but handle contains also seconds and milliseconds
                    // to compare those dates we have to clear those values
                    var dateCopy = new Date(value.getTime());
                    dateCopy.setSeconds(0);
                    dateCopy.setMilliseconds(0);

                    var handleDate = this.timeSlider.get("rightHandleValue");
                    handleDate.setSeconds(0);
                    handleDate.setMilliseconds(0);
                    if (handleDate.getTime() !== dateCopy.getTime()) {
                        this.timeSlider.updateRightHandleDate(value);
                        this.onRightVersionDateChanged(value);
                    }
                }
                if (trigger !== "dateTimePicker") {
                    this.rightVersionDate.set("value", value);
                    this.onRightVersionDateChanged(value);
                }
            },

            // event
            onLeftVersionDateChanged: function (date) { },

            // event
            onRightVersionDateChanged: function (date) { },

            clear: function () {
                this.timeSlider.clear();
                this.contentFilter.clear();
                this.rangeSlice.clear();
            },

            _setDateSelectionVisibleAttr: function (visible) {
                this.timeSlider.set("handlesVisible", visible);
            },

            _setFiltersVisibleAttr: function (value) {
                this._visible = value;
                if (!value) {
                    this.filtersContainer.domNode.style.width = "5px";
                } else if (this.filtersContainer.domNode.style.width === "5px") {
                    this.filtersContainer.domNode.style.width = "250px";
                }
                this.container.layout();
            },

            setContentVersions: function (versions) {
                versions.forEach(function (v) {
                    var group = new ContentReference(v.contentLink).id;
                    this.timeSlider.addLabel(v.contentLink, group, v.name, new Date(v.savedDate), "square", "#c0c0c0", 0);
                    this.rangeSlice.addPoint(new Date(v.savedDate));
                }, this);
                this.timeSlider.layout();
            },

            setReferencedContents: function (contents) {
                // get all distinct contents
                var groups = [];
                var groupFilters = [];
                contents.forEach(function (c) {
                    var group = new ContentReference(c.contentLink).id;
                    if (groups.indexOf(group) === -1) {
                        var color = labelColorResolver(groups.length);
                        groupFilters.push({
                            id: group, name: c.name, color
                        });
                        groups.push(group);
                    }
                });

                groupFilters.sort(compare);
                groupFilters.forEach(function (g) {
                    this.contentFilter.addFilter(g.id, g.name, g.color);
                }, this);

                this.timeSlider.set("groupsCount", groups.length);

                contents.forEach(function (c) {
                    var group = new ContentReference(c.contentLink).id;
                    var groupIndex = groups.indexOf(group);
                    var color = labelColorResolver(groupIndex);
                    this.timeSlider.addLabel(c.contentLink, group, c.name, new Date(c.savedDate), "circle", color, groupIndex + 1);
                    this.rangeSlice.addPoint(new Date(c.savedDate));
                }, this);

                this.timeSlider.layout();
            },

            _setDateRangeAttr: function (minValue, maxValue) {
                this._minDate = minValue;
                this._maxDate = maxValue;

                this.rangeSlice.set("dateRange", minValue, maxValue);
                this.timeSlider.setDateRange(minValue, maxValue);
                this._updateDatePickersConstraints();
            },

            _updateDatePickersConstraints: function () {
                this.leftVersionDate.set("constraints", {
                    min: this._minDate,
                    max: this._maxDate
                });
                this.rightVersionDate.set("constraints", {
                    min: this._minDate,
                    max: this._maxDate
                });
            }
        });
    });


//TODO: compare Date pickers should have min and max dates


//TODO: compare set initial dates for date pickers

//TODO: compare when changing language should refresh filters and dates

//TODO: compare when changing filters should reload the page

//TODO: compare Set initial dates when loading new content

//TODO: filters do not clear when changing language

//TODO: when change language should reload the page
