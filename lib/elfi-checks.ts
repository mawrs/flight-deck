export const ELFI_CHECKS_AS_OF = "10/7/2026 12:16:31 PM";

export interface ElfiCheck {
  number: string;
  issued: string;
  payTo: string;
  memo: string;
  status: string;
  employee: string;
  days: number;
  amount: number;
}

function check(
  number: string,
  issued: string,
  payTo: string,
  memo: string,
  employee: string,
  days: number,
  amount: number,
): ElfiCheck {
  return { number, issued, payTo, memo, status: "Printed", employee, days, amount };
}

export const ELFI_CHECKS: ElfiCheck[] = [
  check("58539", "9/28/2026", "Sallie Mae 5622598190 LID9314,0394,", "Samuel Spillers LID7333,8322,8479,8101", "Jaimie Jamison", 9, 91591.5),
  check("58540", "9/28/2026", "Sallie Mae 5008090435", "Nicole Fellows (Kenneally) LID6973,8473", "Jaimie Jamison", 9, 65476.85),
  check("58541", "9/28/2026", "Sallie Mae 5744129213 LID3579", "Christopher Anum LID9791,9502,0738,0704", "Jaimie Jamison", 9, 129037.92),
  check("58551", "9/26/2026", "Sallie Mae 5298895981", "Lance Palmer LID-4311,0498,7097", "Jaimie Owens", 8, 58706.8),
  check("58563", "9/30/2026", "Sallie Mae 5927591246 LID2237", "Sawyer Broughton LID7235,0055,9664,5515", "Jaimie Jamison", 7, 146510.01),
  check("58564", "9/30/2026", "Sallie Mae 5021572065", "Caleb Graham LID2909", "Jaimie Jamison", 7, 10737.23),
  check("58565", "9/30/2026", "Sallie Mae 5523904936", "Samuel Speiser LID8727,2381,7165", "Jaimie Jamison", 7, 24679.43),
  check("58576", "10/1/2026", "Sallie Mae 5465133372", "John Cleary LID2199,9732", "Jaimie Jamison", 6, 77114.92),
  check("58577", "10/1/2026", "Citizens 6187109688", "Abigail Kostic LID434650426824", "Jaimie Jamison", 6, 14850.48),
];

export function isOverdueCheck(check: Pick<ElfiCheck, "days">) {
  return check.days > 30;
}
