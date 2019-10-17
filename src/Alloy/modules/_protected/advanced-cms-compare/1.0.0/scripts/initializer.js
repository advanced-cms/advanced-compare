define([
    "epi/dependency",
    "epi/routes",
    "epi/shell/store/JsonRest",
    "epi/shell/store/Throttle",

    "epi-cms/command/_NonEditViewCommandMixin",
    "epi-cms/compare/command/CompareCommandProvider"
], function (
    dependency,
    routes,
    JsonRest,
    Throttle,
    _NonEditViewCommandMixin,
    CompareCommandProvider
) {
    function patchCompareCommandProvider() {
        // summary:
        //		Modified version of CompareCommandProvider postscript
        //      It add InliEdit command and change text for Edit command

        var commandregistry = dependency.resolve("epi.globalcommandregistry");
        var compareModeProvider = commandregistry.get("epi.cms.globalToolbar").providers.filter(function (x) {
            return x instanceof CompareCommandProvider;
        })[0];

        compareModeProvider.commands[0].model.modeOptions.push(
            { label: "Content compare", value: "contentcompare", iconClass: "epi-iconForms" });

        var originalViewChanged = compareModeProvider.commands[0]._viewChanged;
        compareModeProvider.commands[0]._viewChanged = function (type, args, data) {
            if (type === "advanced-cms-compare/content-compare-view-controller") {
                this.set("isAvailable", true);
                return;
            }
            originalViewChanged.apply(this, arguments);
        };
    }

    function patchNonEditViewCommandMixin () {
        var originalViewChanged = _NonEditViewCommandMixin.prototype._viewChanged;
        _NonEditViewCommandMixin.prototype._viewChanged = function (type, args, data) {
            if (type === "advanced-cms-compare/content-compare-view-controller") {
                this.set("isAvailable", true);
                return;
            }
            originalViewChanged.apply(this, arguments);
        };
    };

    function initializeStore () {
        var registry = dependency.resolve("epi.storeregistry");
        registry.add("episerver.labs.contentcompare",
            new Throttle(
                new JsonRest({
                    target: routes.getRestPath({ moduleArea: "advanced-cms-compare", storeName: "contentcomparestore" })
                })
            )
        );
    }

    return function contentCompareInitializer() {
        initializeStore();
        patchCompareCommandProvider();
        patchNonEditViewCommandMixin();
    };
});
