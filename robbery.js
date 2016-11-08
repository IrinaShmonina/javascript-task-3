'use strict';

var TIME_REGEX = /(?:([ПН|ВТ|СР|ЧТ|ПТ|СБ|ВС]{2})\s)?(\d{2}):(\d{2})\+(\d{1,2})/;
var WEEKDAY = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
var HOUR_IN_MINUTES = 60;
var DAY_IN_MINUTES = 24 * HOUR_IN_MINUTES;

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

    return {
        from: getMinutes(timeFrom),
        to: getMinutes(timeTo)
    };
}

function getMinutes(hoursAndMinutes) {
    var partsTime = hoursAndMinutes.match(TIME_REGEX);

    return parseInt(partsTime[2], 10) * HOUR_IN_MINUTES + parseInt(partsTime[3], 10);
}

function getTimeZone(time) {
    return parseInt(time.match(TIME_REGEX)[4], 10);
}

function getTimeline(schedule, shiftInHours) {

    return Object
        .keys(schedule)
        .reduce(function (acc, key) {
            return acc.concat(schedule[key]);
        }, [])
        .map(function (record) {
            return {
                start: convertDataToMinutes(parseDate(record.from), shiftInHours),
                end: convertDataToMinutes(parseDate(record.to), shiftInHours)
            };
        });
}

function parseDate(dateString) {
    var dateComponents = dateString.match(TIME_REGEX);

    return {
        day: dateComponents[1],
        hour: parseInt(dateComponents[2], 10),
        minutes: parseInt(dateComponents[3], 10),
        timezone: parseInt(dateComponents[4], 10)
    };
}

function convertDataToMinutes(record, shiftInHours) {
    var dayInMinutes = WEEKDAY.indexOf(record.day) * DAY_IN_MINUTES;
    var hourInMinutesWithShift = (record.hour + shiftInHours - record.timezone) * HOUR_IN_MINUTES;
    var minutes = record.minutes;

    return (dayInMinutes + hourInMinutesWithShift + minutes);
}

function searchTimeRobbery(timeBank, duration, timeline, day) {
    for (var startRobbery = timeBank.from;
         startRobbery < timeBank.to - duration + 1;
         startRobbery++) {
        var period = searchTime(timeline, startRobbery, duration, day);
        if (period !== undefined) {
            return period;
        }
    }
}

function areIntersects(busyTime, start, end) {
    return busyTime.end > start && busyTime.start < end;
}

function searchTime(timeline, startRobbery, duration, day) {
    var isPossibleRobberyTime = timeline.every(function (busyTime) {
        return !areIntersects(busyTime, day * DAY_IN_MINUTES + startRobbery,
            day * DAY_IN_MINUTES + startRobbery + duration);
    });
    if (isPossibleRobberyTime) {
        return day * DAY_IN_MINUTES + startRobbery;
    }
}

exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    var timeZone = getTimeZone(workingHours.from);
    var timeWorkBank = getIntervalInMinutes(workingHours.from, workingHours.to);
    var timeline = getTimeline(schedule, timeZone);
    var startRobbery;
    for (var day = 0; day < 3; day++) {
        startRobbery = searchTimeRobbery(timeWorkBank, duration, timeline, day);
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
            var date = createDateFromMinutes(startRobbery);

            return template.replace('%HH', date.hours)
            .replace('%MM', date.minutes)
            .replace('%DD', date.day);
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

function padLeftZero(number) {
    return ('0' + number).slice(-2);
}

function createDateFromMinutes(minutes) {
    var dayRobbery = Math.floor(minutes / DAY_IN_MINUTES);
    var hoursRobbery = Math.floor((minutes % DAY_IN_MINUTES) / HOUR_IN_MINUTES);
    var minutesRobbery = minutes % DAY_IN_MINUTES % HOUR_IN_MINUTES;

    return {
        day: WEEKDAY[dayRobbery],
        hours: padLeftZero(hoursRobbery),
        minutes: padLeftZero(minutesRobbery)
    };
}
