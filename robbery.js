'use strict';

var DATE = /^([А-Я]{2})?[ ]?(\d{2})[:](\d{2})\+(\d+)$/;
var TIME_FORMAT = /^(\d\d):(\d\d)[+](\d)$/;
var WEEKDAY = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
var HOUR = 60;
var DAY = 24 * HOUR;

exports.isStar = false;

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */


function getIntervalInMinutes(timeFrom, timeTo) {
    var start = getMinutes(timeFrom);
    var end = getMinutes(timeTo);

    return {
        from: start,
        to: end
    };
}

function getMinutes(hoursAndMinutes) {
    var partsTime = hoursAndMinutes.match(TIME_FORMAT);

    return parseInt(partsTime[1], 10) * HOUR + parseInt(partsTime[2], 10);
}

function getShiftInHours(time) {
    return (parseInt(time.match(TIME_FORMAT)[3], 10));
}

function getTimeline(schedule, shiftInHours) {
    var timeline = [];
    var times = concatTimeline(schedule);
    for (var i = 0; i < times.length; i++) {
        var timeStart = times[i].from.match(DATE);
        var timeEnd = times[i].to.match(DATE);
        timeline.push({
            start: convertDataToMinutes(timeStart, shiftInHours),
            end: convertDataToMinutes(timeEnd, shiftInHours)
        });
    }

    return timeline;
}

function convertDataToMinutes(time, shiftInHours) {
    var dayInMinutes = WEEKDAY.indexOf(time[1]) * DAY;
    var hourInMinutesWithShift = (parseInt(time[2], 10) + shiftInHours -
        parseInt(time[4], 10)) * HOUR;
    var minutes = parseInt(time[3], 10);

    return (dayInMinutes + hourInMinutesWithShift + minutes);
}

function concatTimeline(schedule) {
    return Object.keys(schedule).reduce(function (acc, key) {
        return acc.concat(schedule[key]);
    }, []);
}

function searchTimeRobbery(timeBank, time, busyTime, day) {
    for (var startRobbery = timeBank.from; startRobbery < timeBank.to - time + 1; startRobbery++) {
        var period = searchTime(busyTime, startRobbery, time, day);
        if (period !== undefined) {
            return period;
        }
    }
}

function areIntersects(busyTime, start, end) {
    return !(busyTime.end <= start || busyTime.start >= end);
}

function searchTime(busyTimes, startRobbery, time, day) {
    if (busyTimes.every(function (busyTime) {
        return !areIntersects(busyTime, day * DAY + startRobbery, day * DAY + startRobbery + time);
    })) {
        return day * DAY + startRobbery;
    }
}

exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    var shiftInHours = getShiftInHours(workingHours.from);
    var timeWorkBank = getIntervalInMinutes(workingHours.from, workingHours.to);
    var timeline = getTimeline(schedule, shiftInHours);
    var startRobbery;
    for (var i = 0; i < 3; i++) {
        startRobbery = searchTimeRobbery(timeWorkBank, duration, timeline, i);
        if (startRobbery !== undefined) {
            break;
        }
    }

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return startRobbery !== undefined;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (!this.exists()) {
                return '';
            }
            var date = createDateFromMinures(startRobbery);

            return template.replace(/%HH/, date.hours)
            .replace(/%MM/, date.minutes)
            .replace(/%DD/, date.day);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            return false;
        }
    };
};

function convertToString(number) {
    if (number === 0) {
        return '00';
    }
    if (number < 10) {
        return '0' + number;
    }

    return String(number);
}

function createDateFromMinures(minutes) {
    var dayRobbery = Math.floor(minutes / DAY);
    var hoursRobbery = Math.floor((minutes % DAY) / HOUR);
    var minutesRobbery = minutes % DAY % HOUR;

    return {
        day: WEEKDAY[dayRobbery],
        hours: convertToString(hoursRobbery),
        minutes: convertToString(minutesRobbery)
    };
}
