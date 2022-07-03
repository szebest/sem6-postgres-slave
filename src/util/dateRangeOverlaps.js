module.exports = function dateRangeOverlaps(startDateA, endDateA, startDateB, endDateB) {
    var obj = {};
    obj.start = startDateA <= startDateB ? startDateB : startDateA;
    obj.end = endDateA <= endDateB ? endDateA : endDateB;

    if (new Date(+obj.start - 1) > obj.end) {
        return null
    }

    return obj;
}