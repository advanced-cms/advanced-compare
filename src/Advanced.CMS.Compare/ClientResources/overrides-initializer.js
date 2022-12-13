define([
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/when",
    "epi/shell/TypeDescriptorManager",
    "epi/shell/widget/WidgetSwitcher"
], function (
    array,
    lang,
    when,
    TypeDescriptorManager,
    WidgetSwitcher
) {
    function patchWidgetSwitcher() {
        // summary:
        //		Overriden version of WidgetSwitcher.contextChanged
        //      with custom view added

        WidgetSwitcher.prototype.contextChanged = function (/*Object*/context, data) {
            // summary:
            //      Called when the current context changes.
            // tags:
            //      protected

            if (!this._isContextTypeSupported(context)) {
                return;
            }

            var view = context.customViewType || (data ? data.viewType : null);
            var currentWidgetInfo = this._getCurrentWidgetInfo();
            //NOTE: when we change so that we can route to different views this should be rewritten.
            if (data && data.contextIdSyncChange && currentWidgetInfo) {
                view = currentWidgetInfo.type;
                data = lang.mixin({}, data, {
                    viewName: currentWidgetInfo.viewName,
                    availableViews: currentWidgetInfo.availableViews
                });
            }

            if (!view && context.dataType) {
                // If there is no custom view type, fall back to the widget for the type.
                // For backwards compatibility, check the obsoleted property mainWidgetType
                view = TypeDescriptorManager.getValue(context.dataType, "mainWidgetType");
            }

            if (view) {
                this._getObject(view, null, context, data);
            } else {
                var suggestedView = TypeDescriptorManager.getValue(context.dataType, "defaultView"),
                    availableViews = TypeDescriptorManager.getAvailableViews(context.dataType),
                    requestedViewName = data ? data.viewName : null;

                // try to load last selected view
                when(this._stickyViewSelector.get(context.hasTemplate, context.dataType))
                    .then(function (stickyView) {
                        if (stickyView) {
                            suggestedView = stickyView;
                        }

                        var viewsArr = [
                            "view",
                            "sidebysidecompare",
                            "allpropertiescompare"
                        ];

/* ********************************************************************************************************************************** */
/*  Code in this section is different than original file */
/* ********************************************************************************************************************************** */

                        viewsArr.push("contentcompare");

/* ********************************************************************************************************************************** */

                        // TODO: consider removing reference to "view"(preview) when refactoring the view rerouting
                        if (currentWidgetInfo && viewsArr.indexOf(currentWidgetInfo.viewName) >= 0) {
                            // if we're viewing the preview we should keep that view as long as it's available.
                            array.some(availableViews, function (availableView) {
                                if (availableView.key === currentWidgetInfo.viewName) {
                                    suggestedView = currentWidgetInfo.viewName;
                                    return true;
                                }
                                return false;
                            });
                        }

                        var viewToLoad = this._getViewByKey(requestedViewName || suggestedView, availableViews);

                        if (!viewToLoad) {
                            console.log("No default view found for " + context.dataType);
                            return;
                        }

                        this._loadViewComponentByConfiguration(viewToLoad, availableViews, null, context, data);
                    }.bind(this));
            }
        };
    }

    return function contentCompareInitializer() {
        patchWidgetSwitcher();
    };
});
