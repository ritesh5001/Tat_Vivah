import React from "react";
import type { PolicyDocument } from "@/lib/legal-policies";

export function PolicyDocumentView({ policy }: { policy: PolicyDocument }) {
  return (
    <>
      {policy.intro}
      {policy.sections.map((section) => (
        <section key={section.id} id={section.id}>
          <h2>{section.title}</h2>
          {section.body}
        </section>
      ))}
    </>
  );
}
