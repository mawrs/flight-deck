export interface EdMedBoardedLoan {
  loanNumber: string;
  loanType: string;
  servicer: string | null;
  applicationStatusId: number;
  boardDate: string | null;
  amount: number;
}

export interface EdMedBoardedMonth {
  month: string | null;
  count: number;
  amount: number;
}

export const EDMED_BOARDED_AS_OF = "October 7, 2026";

function loan(
  loanNumber: string,
  applicationStatusId: number,
  amount: number,
  servicer: string | null = null,
  boardDate: string | null = null,
): EdMedBoardedLoan {
  return { loanNumber, loanType: "MS", servicer, applicationStatusId, boardDate, amount };
}

export const EDMED_BOARDED_LOANS: EdMedBoardedLoan[] = [
  loan("1399016", 1, 32000),
  loan("1404757", 20, 75296),
  loan("1404789", 7, 32084, "MOHELA", "7/17/2026"),
  loan("1404792", 1, 55296),
  loan("1404793", 20, 75000),
  loan("1404801", 20, 20000),
  loan("1404815", 20, 26000),
  loan("1404817", 20, 44000),
  loan("1404818", 20, 14430),
  loan("1404819", 20, 28766),
  loan("1404820", 20, 73000),
  loan("1404823", 20, 50000),
  loan("1404824", 20, 90000),
  loan("1404826", 20, 35000),
  loan("1404827", 20, 71015),
  loan("1404830", 20, 51000),
  loan("1404834", 20, 25006),
  loan("1404841", 20, 76000),
  loan("1404842", 7, 47296, "MOHELA", "8/12/2026"),
  loan("1404843", 20, 50000),
  loan("1404850", 20, 23376),
  loan("1404875", 5, 73744, "MOHELA"),
  loan("1404877", 20, 53000),
  loan("1404878", 20, 44523),
  loan("1404880", 20, 98146),
  loan("1404884", 20, 99536),
  loan("1404885", 20, 99999),
  loan("1404889", 20, 70000),
  loan("1404891", 20, 56000),
  loan("1404893", 20, 46805),
  loan("1404894", 20, 72744),
];

export const EDMED_BOARDED_MONTHS: EdMedBoardedMonth[] = [
  { month: null, count: 1926, amount: 88207291 },
  { month: "June 2026", count: 2, amount: 62817 },
  { month: "July 2026", count: 145, amount: 6744943 },
  { month: "August 2026", count: 445, amount: 20444795 },
  { month: "September 2026", count: 182, amount: 7883544 },
  { month: "October 2026", count: 16, amount: 645121 },
];
