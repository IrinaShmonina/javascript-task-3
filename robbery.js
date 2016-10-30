'use strict';

var DATE = /^([А-Я]{2})?[ ]?(\d{2})[:](\d{2})\+(\d+)$/;
var TIME = /^(\d\d):(\d\d)[+](\d)$/;
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
    var start = getMinutes(timeFrom); // in minuts
    var end = getMinutes(timeTo);

    return [start, end];
}

function getMinutes(str) {
    var partsTime = str.match(TIME);

    return (parseInt(partsTime[1], 10) * HOUR + parseInt(partsTime[2], 10));
}

function getShift(time) {

    return (parseInt(time.match(TIME)[3], 10));
}

function getTimeline(schedule, shift) {
    var timeline = [];
    var times = schedule.Danny.concat(schedule.Rusty).concat(schedule.Linus);
    for (var i = 0; i < times.length; i++) {
        var dataTimeStart = times[i].from.match(DATE);
        var dataTimeEnd = times[i].to.match(DATE);
        timeline.push({

            start: WEEKDAY.indexOf(dataTimeStart[1]) * DAY + 
            (parseInt(dataTimeStart[2], 10) + shift - parseInt(dataTimeStart[4], 10)) * HOUR + 
            parseInt(dataTimeStart[3], 10),


            end: WEEKDAY.indexOf(dataTimeEnd[1]) * DAY + 
            (parseInt(dataTimeEnd[2], 10) + shift - parseInt(dataTimeEnd[4], 10)) * HOUR + 
            parseInt(dataTimeEnd[3], 10)
        });
    }

    return timeline;
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

function isIntersects(bTime, start, end) {
    return !(bTime.end <= start || bTime.start >= end);
}

function searchTime(busyTime, startRobbery, time, day) {
    if (busyTime.every(function (bTime) {
        return !isIntersects(bTime, day * DAY + startRobbery, day * DAY + startRobbery + time);
    })) {
        return day * DAY + startRobbery;
    }
}

exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    var shift = getShift(workingHours.from);

    var timeWorkBank = getInterval(workingHours.from, workingHours.to);

    var timeline = getTimeline(schedule, shift);

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
