function dateRangeOverlaps(startDateA, endDateA, startDateB, endDateB) {
    var obj = {};
    obj.start = startDateA <= startDateB ? startDateB : startDateA;
    obj.end = endDateA <= endDateB ? endDateA : endDateB;

    if (new Date(+obj.start - 1) > obj.end) {
        return null
    }

    return obj;
}

module.exports = function checkOverlaps(arrayOfDates, singleDate) {
    const retArr = []

    arrayOfDates.forEach((singleDateFirst) => {
        let tmpDate = dateRangeOverlaps(singleDateFirst.start, singleDateFirst.end, singleDate.start, singleDate.end)
        let date = tmpDate
        let sum = 0

        if (date != null) {
            arrayOfDates.forEach((singleDateSecond) => {
                const tmpDate2 = dateRangeOverlaps(singleDateSecond.start, singleDateSecond.end, date.start, date.end)

                if (tmpDate2 != null) {
                    date = tmpDate2
                    sum += 1
                }
            })
        }

        const newOverlapDate = {
            amount: sum,
            overlap: tmpDate
        }

        if (tmpDate != null && !retArr.some((dateInsideArray) => +dateInsideArray.overlap.start === +newOverlapDate.overlap.start && +dateInsideArray.overlap.end === +newOverlapDate.overlap.end)) {
            retArr.push(newOverlapDate)
        }
    })

    return retArr
}