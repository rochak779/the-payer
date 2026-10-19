import type { SVGProps } from 'react';

/** One line-icon set: 24px grid, 1.75 stroke, round caps. Decorative unless given a title. */
function Icon({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {children}
    </svg>
  );
}

type P = SVGProps<SVGSVGElement>;

export const RulesIcon = (p: P) => <Icon {...p}><path d="M5 6h9M5 12h14M5 18h6" /><circle cx="18" cy="6" r="2" /><circle cx="15" cy="18" r="2" /></Icon>;
export const AskIcon = (p: P) => <Icon {...p}><path d="M4 12.5 19.5 5l-4 15-3.5-6.5Z" /><path d="m12 13.5 7.5-8.5" /></Icon>;
export const ApprovalsIcon = (p: P) => <Icon {...p}><path d="M4 13.5V18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4.5" /><path d="M4 13.5 6.5 5h11l2.5 8.5h-4.5a3.5 3.5 0 0 1-7 0Z" /></Icon>;
export const ActivityIcon = (p: P) => <Icon {...p}><path d="M6 3.5h12v17l-2-1.25-2 1.25-2-1.25-2 1.25-2-1.25-2 1.25Z" /><path d="M9 8.5h6M9 12h6M9 15.5h3" /></Icon>;
export const SearchIcon = (p: P) => <Icon {...p}><circle cx="11" cy="11" r="6" /><path d="m20 20-4.5-4.5" /></Icon>;
export const LinkIcon = (p: P) => <Icon {...p}><path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1" /><path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" /></Icon>;
export const BagIcon = (p: P) => <Icon {...p}><path d="M5 8h14l-1 12H6Z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></Icon>;
export const StampIcon = (p: P) => <Icon {...p}><path d="M9.5 10.5V7a2.5 2.5 0 0 1 5 0v3.5" /><path d="M5 14.5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2V16H5Z" /><path d="M6 20h12" /></Icon>;
export const AgentIcon = (p: P) => <Icon {...p}><rect x="5" y="8" width="14" height="11" rx="4" /><path d="M12 8V4.5" /><circle cx="12" cy="4" r="0.5" /><path d="M9.5 13v1M14.5 13v1" /></Icon>;
export const AlertIcon = (p: P) => <Icon {...p}><path d="M12 4 21 19.5H3Z" /><path d="M12 10v4M12 17v.01" /></Icon>;
export const CheckIcon = (p: P) => <Icon {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></Icon>;
export const CrossIcon = (p: P) => <Icon {...p}><path d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5" /></Icon>;
export const QuestionIcon = (p: P) => <Icon {...p}><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14" /><path d="M12 17.5v.01" /></Icon>;
export const CardIcon = (p: P) => <Icon {...p}><rect x="3.5" y="6" width="17" height="12" rx="2.5" /><path d="M3.5 10h17M7 14.5h3" /></Icon>;
export const ArrowIcon = (p: P) => <Icon {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Icon>;
export const ExternalIcon = (p: P) => <Icon {...p}><path d="M8 16 16 8M9.5 8H16v6.5" /></Icon>;
export const ChevronIcon = (p: P) => <Icon {...p}><path d="m9 6 6 6-6 6" /></Icon>;
export const PlusIcon = (p: P) => <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>;
export const PowerIcon = (p: P) => <Icon {...p}><path d="M12 3.5v8" /><path d="M7 6.5a7 7 0 1 0 10 0" /></Icon>;
export const ChartIcon = (p: P) => <Icon {...p}><path d="M4 20h16" /><path d="M7 16v-4M12 16V7M17 16v-6" /></Icon>;
