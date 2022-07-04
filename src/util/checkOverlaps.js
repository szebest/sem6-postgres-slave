const dateRangeOverlaps = require('./dateRangeOverlaps')

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

    return retArr.sort((overlap1, overlap2) => {
        return (overlap1.overlap.end - overlap1.overlap.start) > (overlap2.overlap.end - overlap2.overlap.start) ?
            -1 : 1
    })
}