define([
    ],
    function (
    ) {
        // converts point on scale to date, based on min and max dates
        function convertPointOnScaleToDate(scaleMin, scaleMax, dateMin, dateMax, position) {
            if (position <= 0) {
                return dateMin;
            }

            if (position === scaleMin) {
                return dateMin;
            }

            if (position === scaleMax) {
                return dateMax;
            }

            if (position >= scaleMax) {
                var maxDate = new Date(dateMax.getTime());
                maxDate.setSeconds(dateMax.getSeconds() + 1);
                return maxDate;
            }

            // orignal values before transforming into scale
            var originalMin = dateMin.getTime();
            var originalMax = dateMax.getTime();

            // rescale range
            var date = (position - scaleMin) / (scaleMax - scaleMin) * (originalMax - originalMin);
            date += Math.round(originalMin);

            var result = new Date(date);
            return result;
        }

        // converts date to point on scale
        function convertDateToPoint(scaleMin, scaleMax, dateMin, dateMax, date) {
            if (date === 0) {
                return 0;
            }

            if (!dateMin || !dateMax) {
                return 0;
            }

            // orignal values before transforming into scale
            var originalPoint = date.getTime();
            var originalMin = dateMin.getTime();
            var originalMax = dateMax.getTime();

            // rescale range
            var transofrmedPoint = ((originalPoint - originalMin) * (scaleMax - scaleMin)) / (originalMax - originalMin);

            transofrmedPoint += scaleMin;
            return Math.round(transofrmedPoint);
        }

        return {
            toDate: convertPointOnScaleToDate,
            toPoint: convertDateToPoint
        };
    });
