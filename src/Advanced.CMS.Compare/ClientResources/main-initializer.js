define([
    "dojo/_base/declare",
    "epi/_Module",
    "advanced-cms-compare/overrides-initializer",
    "advanced-cms-compare/initializer"
], function (
    declare,
    _Module,
    overridesInitializer,
    contentCompareInitializer
) {
    return declare([_Module], {
        initialize: function () {
            this.inherited(arguments);

            overridesInitializer();

            contentCompareInitializer();
        }
    });
});
