define([
    ],
    function () {
        return function convertDate (date) {
            function appendLeadingZeroes (n) {
                if (n <= 9) {
                    return "0" + n;
                }
                return n;
            }

            if (!date) {
                return "";
            }

            var formattedDate = date.getFullYear() +
                "-" +
                appendLeadingZeroes(date.getMonth() + 1) +
                "-" +
                appendLeadingZeroes(date.getDate()) +
                "-" +
                appendLeadingZeroes(date.getHours()) +
                "-" +
                appendLeadingZeroes(date.getMinutes()) +
                "-" +
                appendLeadingZeroes(date.getSeconds());
            return formattedDate;
        };
    });

