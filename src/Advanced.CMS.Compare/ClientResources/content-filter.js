define([
    "dojo/_base/declare",
    "dojo/on",
    "dijit/_CssStateMixin",
    "dijit/_Widget",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dijit/layout/_LayoutWidget",

    "dojo/text!advanced-cms-compare/content-filter-template.html",
    "dojo/text!advanced-cms-compare/content-filter-item-template.html",

    "dijit/form/CheckBox",
    "xstyle/css!advanced-cms-compare/content-filters.css"
],
    function (
        declare,
        on,
        _CssStateMixin,
        _Widget,
        _TemplatedMixin,
        _WidgetsInTemplateMixin,
        _LayoutWidget,

        contentFilterTemplate,
        contentFilterItemTemplate
    ) {
        var ContentFilterItem = declare([_Widget, _TemplatedMixin, _WidgetsInTemplateMixin, _CssStateMixin], {
            _selected: null,

            templateString: contentFilterItemTemplate,

            buildRendering: function () {
                this.inherited(arguments);

                this._selected = true;
            },

            _setContentLinkAttr: function (value) {
                this._contentLink = value;
                this.name.title = value;
            },

            _setContentNameAttr: function (value) {
                this._contentName = value;
                this.name.innerText = value;
            },

            _setColorAttr: function (value) {
                this._color = value;
                this.filterBox.style.backgroundColor = value;
            },

            _setSelectedAttr: function (value) {
                this._selected = value;
                this.checkbox.set("checked", value);
            },

            onChange: function (value) {
                this._selected = value;
                this.onFilterChanged(value);
            },

            // event
            onFilterChanged: function (value) {
            }
        });

        return declare([_LayoutWidget, _TemplatedMixin, _WidgetsInTemplateMixin, _CssStateMixin], {
            _groups: null,

            templateString: contentFilterTemplate,

            buildRendering: function () {
                this.inherited(arguments);

                this._groups = [];
            },

            addFilter: function (contentLink, name, color) {
                var contentFilterItem = new ContentFilterItem({
                    contentLink: contentLink,
                    contentName: name,
                    color: color
                });
                this._groups.push(contentFilterItem);
                contentFilterItem.placeAt(this.filters);

                this.own(on(contentFilterItem, "filterChanged", function (value) {
                    this.onContentFilterChanged(contentLink, value);

                    var hasSelection = true;
                    for (var i = 0; i < this._groups.length; i++) {
                        if (!this._groups[i]._selected) {
                            hasSelection = false;
                            break;
                        }
                    }
                    this.selectAllCheckbox.set("checked", hasSelection);
                    this._updateSelectAllLabel(hasSelection);
                }.bind(this)));
            },

            // event
            onContentFilterChanged: function (contentLink, isSslected) {
            },

            clear: function () {
                this._groups.forEach(function (widget) {
                    widget.destroyRecursive(false);
                });
                this._groups = [];
            },

            onSelectAllClick: function () {
                var selectAll = this.selectAllCheckbox.get("checked");
                this._groups.forEach(function (widget) {
                    widget.set("selected", selectAll);
                });
                this._updateSelectAllLabel(selectAll);
            },

            _updateSelectAllLabel: function (selectAll) {
                this.selectAllLabel.innerText = selectAll ? "Unselect all" : "Select all";
            }
        });
    });
