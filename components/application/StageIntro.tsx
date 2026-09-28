import type { ReactNode } from "react";

export function StageIntro({
  title,
  lede,
  action,
  children,
}: {
  title: string;
  lede?: string;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="bg-white">
      <div className="uw-card-header">
        <h1 className="text-lg text-black">{title}</h1>
        {action}
      </div>
      {lede ? <p className="max-w-[62ch] px-xl py-md text-sm text-gray-medium">{lede}</p> : null}
      {children}
    </div>
  );
}
