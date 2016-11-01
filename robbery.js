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


function getInterval(timeFrom, timeTo) {
    var start = getMinutes(timeFrom); 
    var end = getMinutes(timeTo);

    return [start, end];
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
        var dataTimeStart = times[i].from.match(DATE);
        var dataTimeEnd = times[i].to.match(DATE);
        timeline.push({
            start: convertDataToMinutesWithShiftInHours(dataTimeStart, shiftInHours),
            end: convertDataToMinutesWithShiftInHours(dataTimeEnd, shiftInHours)
        });
    }

    return timeline;
}

function convertDataToMinutesWithShiftInHours(time, shiftInHours) {
    return (WEEKDAY.indexOf(time[1]) * DAY +
                (parseInt(time[2], 10) + shiftInHours - parseInt(time[4], 10)) * HOUR +
                parseInt(time[3], 10));
}

function concatTimeline(schedule) {
    return Object.keys(schedule).reduce(function (acc, key) {
        return acc.concat(schedule[key]);
    }, []);
}

function searchTimeRobbery(timeBank, time, busyTime, day) {
    for (var startRobbery = timeBank[0]; startRobbery < timeBank[1] - time + 1; startRobbery++) {
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

    var timeWorkBank = getInterval(workingHours.from, workingHours.to);

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
        return '0' + String(number);
    }

    return String(number);
}

function createDateFromMinures(minutes) {
    var day = Math.floor(minutes / DAY);
    var hours = Math.floor((minutes % DAY) / HOUR);
    var minutess = minutes % DAY % HOUR;

    return {
        day: WEEKDAY[day],
        hours: convertToString(hours),
        minutes: convertToString(minutess)
    };
}
