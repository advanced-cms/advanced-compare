define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/dom-class",
    "dojo/on",
    "dojo/topic",
    "dojo/when",
    "epi/dependency",
    "epi-cms/core/ContentReference",
    "epi-cms/compare/views/CompareView",
    "epi-cms/compare/CompareToolbar",
    "advanced-cms-compare/version-selector",
    "advanced-cms-compare/date-formatter"
    ],

    function (
        declare,
        lang,
        domClass,
        on,
        topic,
        when,
        dependency,
        ContentReference,
        CompareView,
        CompareToolbar,
        VersionSelector,
        dateFormatter
    ) {
        return declare([CompareView], {
            buildRendering: function () {
                this.inherited(arguments);

                this._comparestore = dependency.resolve("epi.storeregistry").get("episerver.labs.contentcompare");
                this._contentVersionStore = dependency.resolve("epi.storeregistry").get("epi.cms.contentversion");

                // hide compare mode toolbar and load custom version
                var toolbar = this.mainLayoutContainer.getChildren().filter(function (x) {
                    return x instanceof CompareToolbar;
                })[0];

                domClass.add(toolbar.domNode, "dijitHidden");

                this.versionSelector = new VersionSelector();
                this.mainLayoutContainer.addChild(this.versionSelector);
                this.own(this.versionSelector);

                this.compareModel._rightVersionUrlSetter = function (value) {
                        this.rightVersionUrl = value;

                        if (value && value !== "about:blank") {
                            this.rightVersionUrl = value + "&dasdasda=fsdfsdf";
                        }
                    },
                    this.own(
                        on(this.versionSelector, "leftVersionDateChanged", this._changeLeftVersionDate.bind(this)),
                        on(this.versionSelector, "rightVersionDateChanged", this._changeRightVersionDate.bind(this)),
                        on(this.versionSelector, "languageChanged", this._onLanguageChanged.bind(this))
                    );

                // when view is different than custom compare view, then data should not be loaded
                this._viewEnabled = true;
                this.own(
                    topic.subscribe("/epi/shell/action/viewchanged", function (type) {
                        if (type ===
                            "advanced-cms-compare/content-compare-view-controller") {
                            this._viewEnabled = true;
                            when(this.getCurrentContent()).then(function (content) {
                                var handle = this.compareModel.watch("rightVersion", function () {
                                    handle.remove();
                                    if (this.compareModel.leftVersion && this.compareModel.leftVersion.savedDate) {
                                        this.versionSelector.timeSlider.updateLeftHandleDate(new Date(this.compareModel.leftVersion.savedDate));
                                    }
                                    if (this.compareModel.rightVersion && this.compareModel.rightVersion.savedDate) {
                                        this.versionSelector.timeSlider.updateRightHandleDate(new Date(this.compareModel.rightVersion.savedDate));
                                    }
                                }.bind(this));
                                this._refreshData(content.contentLink);
                            }.bind(this));
                            return;
                        }
                        this._viewEnabled = false;
                    }.bind(this))
                );
            },

            contentContextChanged: function (context, callerData, request) {
                if (!this._viewEnabled) {
                    return;
                }
                this._refreshData(context.id);
            },

            _onLanguageChanged: function (language) {
                var id = this._lastId;
                this._lastId = undefined;
                this._refreshData(id.toString());
            },

            _refreshData: function (contextId) {
                var contentLink = new ContentReference(contextId).id;
                if (contentLink === this._lastId) {
                    return;
                }
                this._lastId = contentLink;

                var language = this.versionSelector.getSelectedLanguage();

                this.versionSelector.clear();
                this._contentVersionStore.query({ contentLink: contextId, language: language }).then(function (versions) {
                    //TODO: compare Min an Max values for version selector
                    this._comparestore.executeMethod("GetAllReferencedContents", null,
                        {
                            contentLink: contextId,
                            language: language
                        }).then(function (contents) {
                            // all content is used to get min and max version date
                            var allContents = contents.concat(versions).map(function (x) {
                                return new Date(x.savedDate).getTime();
                            });

                            this.versionSelector.set("dateSelectionVisible", allContents.length > 1);
                            this.versionSelector.set("filtersVisible", contents.length > 0);

                            var minDate = new Date(Math.min.apply(null, allContents));
                            var maxDate = new Date(Math.max.apply(null, allContents));

                            this.versionSelector.set("dateRange", minDate, maxDate);

                            this.versionSelector.setContentVersions(versions);
                            this.versionSelector.setReferencedContents(contents);
                    }.bind(this));
                }.bind(this));
            },

            _changeLeftVersionDate: function (date) {
                var that = this;

                this._changeDate(date, function (contentVersion) {
                    var lastDateChanged = (!that.compareModel.leftVersionDate && date) || that.compareModel.leftVersionDate.getTime() !== date.getTime();
                    that.compareModel.leftVersionDate = date;
                    var lastModelUri = that.compareModel.leftVersionUri;
                    that.compareModel.set("leftVersion", contentVersion);

                    // if the version didn't change, then 'watch' is not called and URL is not changed
                    if (lastDateChanged && lastModelUri === that.compareModel.leftVersionUri) {
                        topic.publish("/epi/shell/context/request", { uri: that.compareModel.leftVersionUri }, { sender: this });
                    }
                });
            },

            _changeRightVersionDate: function (date) {
                var that = this;

                this._changeDate(date, function (contentVersion) {
                    var lastDateChanged = (!that.compareModel.rightVersionDate && date) || that.compareModel.rightVersionDate.getTime() !== date.getTime();
                    that.compareModel.rightVersionDate = date;
                    if (lastDateChanged && contentVersion.contentLink === (that.compareModel.rightVersion || {}).contentLink) {
                        that.compareModel.set("rightVersion", null);
                    }
                    that.compareModel.set("rightVersion", contentVersion);
                });
            },

            _changeDate: function (date, afterVersionGetCallback) {
                //TODO: compare Lock dropdown until new version is loaded

                var that = this;

                when(that.getCurrentContent()).then(function (currentContent) {
                    if (!currentContent || !currentContent.contentLink) {
                        return;
                    }

                    var language = that.versionSelector.getSelectedLanguage();

                    // get content link to the version version by date
                    that._comparestore.executeMethod("GetContentVersionByDate", null,
                        {
                            contentLink: currentContent.contentLink,
                            date: date,
                            language: language
                        }).then(function (contentLink) {

                            // load content version
                            when(that._contentVersionStore.get(contentLink)).then(function (contentVersion) {
                                afterVersionGetCallback(contentVersion);
                            });
                        });
                });
            },

            _changeUrl: function (url, forceReload) {
                this._previewQueryParameters =
                    lang.mixin(this._previewQueryParameters, { maxContentDate: dateFormatter(this.compareModel.leftVersionDate) });

                return this.inherited(arguments);
            },

            setView: function () {
                this.versionSelector.container.resize();
                return this.inherited(arguments);
            }
        });
    });
