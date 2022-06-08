import { GlubEventType, Uniform, Semester, GigRequest } from "state/models";
import {
  twentyFourHourTimeFormatter,
  hyphenDateFormatter,
  parseFormDateAndTimeString
} from "utils/datetime";

export interface EventAndGigForm {
  event: EventForm;
  gig: GigForm;
}

export interface EventForm {
  name: string;
  semester: string;
  type: GlubEventType;
  callTime: string;
  callDate: string;
  releaseTime: string;
  releaseDate: string;
  points: number | null;
  comments: string;
  location: string;
  gigCount: boolean;
  defaultAttend: boolean;
  repeat: RepeatPeriod;
  repeatUntil: string;
}

export interface GigForm {
  performanceTime: string;
  uniform: Uniform | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  price: number | null;
  public: boolean;
  summary: string;
  description: string;
}

export const emptyEventForm = (currentSemester: Semester): EventForm => ({
  name: "",
  semester: currentSemester.name,
  type: "Rehearsal",
  callTime: "",
  callDate: "",
  releaseTime: "",
  releaseDate: "",
  points: null,
  comments: "",
  location: "",
  gigCount: false,
  defaultAttend: true,
  repeat: "No",
  repeatUntil: ""
});

export const emptyGigForm: GigForm = {
  performanceTime: "",
  uniform: null,
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  price: null,
  public: false,
  summary: "",
  description: ""
};

export const eventFormFromGigRequest = (
  request: GigRequest,
  currentSemester: Semester
): EventForm => ({
  name: `${request.name} for ${request.organization}`,
  semester: currentSemester.name,
  type: "Volunteer Gig",
  callTime: twentyFourHourTimeFormatter(request.startTime),
  callDate: hyphenDateFormatter(request.startTime),
  releaseTime: "",
  releaseDate: "",
  points: 5,
  comments: request.comments || "",
  location: request.location,
  gigCount: true,
  defaultAttend: false,
  repeat: "No",
  repeatUntil: ""
});

export const gigFormFromGigRequest = (request: GigRequest): GigForm => ({
  performanceTime: twentyFourHourTimeFormatter(request.startTime),
  uniform: null,
  contactName: request.contactName,
  contactEmail: request.contactEmail,
  contactPhone: request.contactPhone,
  price: null,
  public: false,
  summary: "",
  description: ""
});

export type RepeatPeriod =
  | "No"
  | "Daily"
  | "Weekly"
  | "Biweekly"
  | "Monthly"
  | "Yearly";

export const allRepeatPeriods: RepeatPeriod[] = [
  "No",
  "Daily",
  "Weekly",
  "Biweekly",
  "Monthly",
  "Yearly"
];

export const formJson = ({ event, gig }: EventAndGigForm) => {
  const includeGig = !!(
    gig.performanceTime ||
    gig.uniform ||
    gig.contactName ||
    gig.contactEmail ||
    gig.contactPhone ||
    gig.price ||
    gig.summary ||
    gig.description
  );

  return {
    name: event.name,
    semester: event.semester,
    type: event.type,
    callTime: parseFormDateAndTimeString(event.callDate, event.callTime),
    releaseTime: parseFormDateAndTimeString(
      event.releaseDate,
      event.releaseTime
    ),
    points: event.points || 5,
    comments: event.comments,
    location: event.location,
    gigCount: event.gigCount,
    defaultAttend: event.defaultAttend,
    gig: includeGig
      ? {
          performanceTime: parseFormDateAndTimeString(
            event.callDate,
            gig.performanceTime
          ),
          uniform: gig.uniform?.id || null,
          contactName: gig.contactName,
          contactEmail: gig.contactEmail,
          contactPhone: gig.contactPhone,
          price: gig.price,
          public: gig.public,
          summary: gig.summary,
          description: gig.description
        }
      : null,
    repeat: event.repeat,
    repeatUntil: parseFormDateAndTimeString(event.repeatUntil, "00:00")
  };
};
