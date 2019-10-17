define([],
    function () {
        var colors = [
            "#FF0000",
            "#FFD800",
            "#0026FF",
            "#FF7F7F",
            "#7FC9FF",
            "#FFE97F",
            "#FF7F00",
            "#0000FF",
            "#4B0082",
            "#8B00FF",
            "#8B00FF",
            "#e6194B",
            "#fabebe",
            "#9A6324",
            "#f58231",
            "#ffd8b1",
            "#808000",
            "#ffe119",
            "#fffac8",
            "#aaffc3",
            "#469990",
            "#42d4f4",
            "#e6beff",
            "#a9a9a9"
        ];

        return function getColor (index) {
            return colors[index % colors.length];
        };
    });
