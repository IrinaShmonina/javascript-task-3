'use strict';

var DATE = /^([А-Я]{2})?[ ]?(\d\d)[:](\d\d)\+(\d+)$/;
var WEEKDAY = ['ПН', 'ВТ', 'СР'];
var HOUR = 60;
var DAY = 24 * HOUR;
var shift = 0;
exports.isStar = false;

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */


function getTime(timeFrom, timeTo) {
    var start = getMinut(timeFrom); // in minuts
    var end = getMinut(timeTo);

    return [start, end];
}

function getMinut(str) {
    var re = /^(\d\d):(\d\d)[+](\d)$/;
    var rez = str.match(re);
    shift = parseInt(rez[3]);

    return (parseInt(rez[1]) * HOUR + parseInt(rez[2]));
}

function getTimeForAll(schedule) {
    var rez = [];
    var listTime = schedule.Danny.concat(schedule.Rusty).concat(schedule.Linus);
    for (var i = 0; i < listTime.length; i++) {
        var dataTimeStart = listTime[i].from.match(DATE);

        var dataTimeEnd = listTime[i].to.match(DATE);

        rez.push({ start: WEEKDAY.indexOf(dataTimeStart[1]) * DAY + (parseInt(dataTimeStart[2]) +
            shift - parseInt(dataTimeStart[4])) * HOUR + parseInt(dataTimeStart[3]),
        end: WEEKDAY.indexOf(dataTimeEnd[1]) * DAY + (parseInt(dataTimeEnd[2]) +
        shift - parseInt(dataTimeEnd[4])) * HOUR + parseInt(dataTimeEnd[3]) });
    }

    return rez;
}

function searchTimeInAllRang(timeBank, time, busyTime, day) {
    for (var startRobbery = timeBank[0]; startRobbery < timeBank[1] - time + 1; startRobbery++) {

        var timeless = searchTime(busyTime, startRobbery, time, day);
        if (timeless) {

            return timeless;
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

    var timeWorkBank = getTime(workingHours.from, workingHours.to);
    var freeTimeAllParticipants = getTimeForAll(schedule);

    var startRobbery;
    for (var i = 0; i < 3; i++) {
        startRobbery = searchTimeInAllRang(timeWorkBank, duration, freeTimeAllParticipants, i);
        if (startRobbery) {
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
