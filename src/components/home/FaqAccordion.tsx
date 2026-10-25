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
    <div className="space-y-3">
      {items.map((faq) => {
        const open = openId === faq.id;
        return (
          <div
            key={faq.id}
            className="card-elevated overflow-hidden border border-border/80 transition-shadow duration-300 hover:shadow-md hover:shadow-gold/5"
          >
            <button
              type="button"
              onClick={() => setOpenId(open ? null : faq.id)}
              className="w-full px-5 py-4 flex items-center justify-between gap-3 text-left"
              aria-expanded={open}
            >
              <span className="font-medium text-foreground text-sm leading-snug">
                {faq.question}
              </span>
              <span
                className={cn(
                  "shrink-0 w-8 h-8 rounded-full border border-border flex items-center justify-center text-gold transition-transform duration-300",
                  open && "rotate-180 bg-gold/10 border-gold/30"
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
                <div className="px-6 pb-5 text-sm text-muted leading-relaxed border-t border-border/60 pt-4">
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
