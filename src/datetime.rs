import moment from "moment";

export const fullDateTimeFormatter = (timestamp: number): string =>
  moment(timestamp).format("dddd, MMMM D, YYYY h:mm A");

export const simpleDateTimeFormatter = (timestamp: number): string =>
  moment(timestamp).format("MMM D h:mm A");

export const timeFormatter = (timestamp: number): string =>
  moment(timestamp).format("H:mm A");

export const hyphenDateFormatter = (timestamp: number): string =>
  moment(timestamp).format("YYYY-MM-DD");

export const twentyFourHourTimeFormatter = (timestamp: number): string =>
  moment(timestamp).format("HH:MM");

export const dateFormatter = (timestamp: number): string =>
  moment(timestamp).format("dddd, MMMM Do");

export const simpleDateWithYearFormatter = (timestamp: number): string =>
  moment(timestamp).format("MMM DD, YYYY");

export const simpleDateFormatter = (timestamp: number): string =>
  moment(timestamp).format("M/D");

export const timeFromNow = (timestamp: number): string =>
  moment(timestamp).fromNow();

export const parseFormDateString = (date: string): number | null =>
  moment(date)
    ?.toDate()
    ?.getTime() || null;

export const parseFormDateAndTimeString = (
  date: string,
  time: string
): number | null =>
  moment(`${date} ${time}`)
    ?.toDate()
    ?.getTime() || null;
