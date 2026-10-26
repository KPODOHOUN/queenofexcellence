"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  return (
    <div className="border-t border-border">
      {items.map((faq) => {
        const open = openId === faq.id;
        return (
          <div
            key={faq.id}
            className="border-b border-border"
          >
            <button
              type="button"
              onClick={() => setOpenId(open ? null : faq.id)}
              className="group w-full py-5 flex items-center justify-between gap-6 text-left"
              aria-expanded={open}
            >
              <span className="font-medium text-[1rem] leading-snug text-foreground">
                {faq.question}
              </span>
              <span
                className={cn(
                  "shrink-0 text-muted transition-transform duration-300",
                  open && "rotate-180"
                )}
              >
                <ChevronDown size={16} />
              </span>
            </button>
            <div
              className={cn(
                "grid transition-[grid-template-rows] duration-300 ease-out",
                open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              )}
            >
              <div className="overflow-hidden">
                <div className="pb-6 pr-10 text-[0.95rem] text-muted leading-[1.75]">
                  {faq.answer}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
