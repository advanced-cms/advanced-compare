define([
    "dojo/_base/declare",
    "epi/_Module",
    "advanced-cms-compare/initializer"
], function (
    declare,
    _Module,
    contentCompareInitializer
) {
    return declare([_Module], {
        initialize: function () {
            this.inherited(arguments);

            //TODO: merge with intializer
            contentCompareInitializer();
        }
    });
});
