export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const DEFAULT_SCHEDULE_CONFIG = {
  startTime: '08:00',
  schoolEndTime: '15:30', // 03:30 PM
  numPeriods: 7,
  periodDuration: 45, // minutes
  customPeriodDurations: {}, // { [periodNum]: durationInMinutes }
  breaks: [
    {
      id: 'break-1',
      name: 'Break',
      afterPeriod: 3,
      duration: 30
    }
  ],
  scheduleMode: 'all', // 'all' (same for all days) or 'custom' (per day)
  daySchedules: {} // { [day]: { numPeriods, periodDuration, customPeriodDurations, breaks, startTime } }
};

/**
 * Format minutes from midnight to 12-hour AM/PM string (e.g. 08:30 AM)
 */
export function formatMinutesToTime(mins) {
  const normalized = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = h > 12 ? h - 12 : (h === 0 ? 12 : h);
  return `${hr.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
}

/**
 * Format minutes from midnight to HH:MM:SS for database TIME columns
 */
export function formatMinutesTo24h(mins) {
  const normalized = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`;
}

/**
 * Convert HH:MM or HH:MM:SS or "08:00 AM" to minutes from midnight
 */
export function timeToMinutes(timeStr) {
  if (!timeStr) return 480; // 08:00 AM default
  if (typeof timeStr !== 'string') return 480;

  // Check 12-hour AM/PM format
  const ampmMatch = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampmMatch) {
    let [_, h, m, ampm] = ampmMatch;
    let hours = parseInt(h, 10);
    const minutes = parseInt(m, 10);
    if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
    if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  // Check 24-hour HH:MM or HH:MM:SS format
  const parts = timeStr.split(':').map(Number);
  const hours = parts[0] || 0;
  const minutes = parts[1] || 0;
  return hours * 60 + minutes;
}

/**
 * Get effective schedule configuration for a given day
 */
export function getScheduleForDay(day, config = DEFAULT_SCHEDULE_CONFIG) {
  if (config.scheduleMode === 'custom' && config.daySchedules?.[day]) {
    const ds = config.daySchedules[day];
    return {
      startTime: ds.startTime || config.startTime || '08:00',
      numPeriods: Number(ds.numPeriods ?? config.numPeriods ?? 7),
      periodDuration: Number(ds.periodDuration ?? config.periodDuration ?? 45),
      customPeriodDurations: ds.customPeriodDurations || config.customPeriodDurations || {},
      breaks: Array.isArray(ds.breaks) ? ds.breaks : (config.breaks || [])
    };
  }
  return {
    startTime: config.startTime || '08:00',
    numPeriods: Number(config.numPeriods ?? 7),
    periodDuration: Number(config.periodDuration ?? 45),
    customPeriodDurations: config.customPeriodDurations || {},
    breaks: Array.isArray(config.breaks) ? config.breaks : []
  };
}

/**
 * Calculate the full sequential timeline (periods + breaks) for a day's schedule
 */
export function calculateDayTimeline(schedule, schoolEndTime = '15:30') {
  const startMins = timeToMinutes(schedule.startTime || '08:00');
  let currentMins = startMins;

  // Group breaks by afterPeriod
  const breaksByAfterPeriod = {};
  (schedule.breaks || []).forEach(b => {
    const ap = Number(b.afterPeriod ?? 0);
    if (!breaksByAfterPeriod[ap]) breaksByAfterPeriod[ap] = [];
    breaksByAfterPeriod[ap].push(b);
  });

  const timeline = [];
  const numPeriods = Math.max(1, Number(schedule.numPeriods) || 7);

  // Breaks before period 1 (e.g., morning assembly / homeroom)
  if (breaksByAfterPeriod[0]) {
    breaksByAfterPeriod[0].forEach(b => {
      const bStart = currentMins;
      const bDur = Math.max(5, Number(b.duration) || 15);
      currentMins += bDur;
      timeline.push({
        id: b.id || `break-0-${bStart}`,
        isBreak: true,
        name: b.name || 'Break',
        duration: bDur,
        afterPeriod: 0,
        startMins: bStart,
        endMins: currentMins,
        startTime24: formatMinutesTo24h(bStart),
        endTime24: formatMinutesTo24h(currentMins),
        time: `${formatMinutesToTime(bStart)} - ${formatMinutesToTime(currentMins)}`
      });
    });
  }

  for (let i = 1; i <= numPeriods; i++) {
    const pDur = Math.max(
      10,
      Number(schedule.customPeriodDurations?.[i] || schedule.periodDuration || 45)
    );
    const pStart = currentMins;
    currentMins += pDur;

    timeline.push({
      num: i,
      isBreak: false,
      duration: pDur,
      startMins: pStart,
      endMins: currentMins,
      startTime24: formatMinutesTo24h(pStart),
      endTime24: formatMinutesTo24h(currentMins),
      time: `${formatMinutesToTime(pStart)} - ${formatMinutesToTime(currentMins)}`
    });

    // Check if any breaks occur after this period
    if (breaksByAfterPeriod[i]) {
      breaksByAfterPeriod[i].forEach(b => {
        const bStart = currentMins;
        const bDur = Math.max(5, Number(b.duration) || 15);
        currentMins += bDur;
        timeline.push({
          id: b.id || `break-${i}-${bStart}`,
          isBreak: true,
          name: b.name || 'Break',
          duration: bDur,
          afterPeriod: i,
          startMins: bStart,
          endMins: currentMins,
          startTime24: formatMinutesTo24h(bStart),
          endTime24: formatMinutesTo24h(currentMins),
          time: `${formatMinutesToTime(bStart)} - ${formatMinutesToTime(currentMins)}`
        });
      });
    }
  }

  const closingMins = timeToMinutes(schoolEndTime || '15:30');
  const isExceedingClosingTime = currentMins > closingMins;
  const exceedMinutes = isExceedingClosingTime ? currentMins - closingMins : 0;

  return {
    timeline,
    startMins,
    totalMins: currentMins,
    startTimeFormatted: formatMinutesToTime(startMins),
    endTimeFormatted: formatMinutesToTime(currentMins),
    closingTimeFormatted: formatMinutesToTime(closingMins),
    isExceedingClosingTime,
    exceedMinutes
  };
}

/**
 * Get the maximum number of periods across all working days
 */
export function getMaxPeriods(config = DEFAULT_SCHEDULE_CONFIG, days = DAYS) {
  if (config.scheduleMode !== 'custom' || !config.daySchedules) {
    return Number(config.numPeriods) || 7;
  }
  let maxP = Number(config.numPeriods) || 7;
  days.forEach(d => {
    const dayP = Number(config.daySchedules?.[d]?.numPeriods);
    if (dayP && dayP > maxP) maxP = dayP;
  });
  return maxP;
}

/**
 * Generate a unified column list for weekly display
 */
export function getUnifiedColumns(config = DEFAULT_SCHEDULE_CONFIG) {
  // If schedule is uniform for all days, use the base schedule's timeline
  if (config.scheduleMode !== 'custom') {
    return calculateDayTimeline(getScheduleForDay(DAYS[0], config), config.schoolEndTime).timeline;
  }

  // If custom schedules exist, build a union of periods and breaks across active days
  const maxP = getMaxPeriods(config);
  const baseTimeline = calculateDayTimeline(getScheduleForDay(DAYS[0], config), config.schoolEndTime).timeline;

  // If base covers maxP, use base
  if (baseTimeline.filter(t => !t.isBreak).length >= maxP) {
    return baseTimeline;
  }

  // Otherwise, construct columns up to maxP
  const list = [];
  for (let i = 1; i <= maxP; i++) {
    list.push({
      num: i,
      isBreak: false,
      time: `Period ${i}`
    });
  }
  return list;
}

