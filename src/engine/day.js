// Local calendar day as an integer, so scheduling ignores time of day and time zones.
export const toDay = (date = new Date()) =>
  Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000)
