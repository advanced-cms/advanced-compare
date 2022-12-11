define([
        "dojo/_base/declare",
        "epi-cms/compare/views/SideBySideCompareView",
        "advanced-cms-compare/date-formatter"
    ],
    function (
        declare,
        SideBySideCompareView,
        dateFormatter
    ) {
        return declare([SideBySideCompareView], {
            _setRightVersionUrlAttr: function (url) {
                if (url && url !== "about:blank") {
                    this._rightIframe.load(url + "&maxContentDate=" + dateFormatter(this.model.rightVersionDate))
                        .then(function () {

                        })
                        .otherwise(function (error) {

                        });
                } else {
                    this.inherited(arguments);
                }
            }
        });
    });

//TODO: compare when no blocks inside, then hide blocks filter
