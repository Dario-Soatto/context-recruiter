"use client";

import { type Candidate } from "@/lib/candidates";
import {
  MapPin,
  ExternalLink,
  Link,
  GraduationCap,
  Briefcase,
  Wrench,
} from "lucide-react";

function formatDate(dateStr?: string) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  } catch {
    return null;
  }
}

export function CandidateProfile({
  candidate,
  compact = false,
}: {
  candidate: Candidate;
  compact?: boolean;
}) {
  const enrichment = candidate.enrichment;
  const textSize = compact ? "text-xs" : "text-sm";
  const labelSize = compact ? "text-[11px]" : "text-xs";
  const smallSize = compact ? "text-[11px]" : "text-xs";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className={`${compact ? "size-10" : "size-14"} rounded-full bg-primary/10 flex items-center justify-center shrink-0`}
        >
          <span
            className={`${compact ? "text-sm" : "text-lg"} font-semibold text-primary`}
          >
            {candidate.fullName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`${compact ? "text-sm" : "text-lg"} font-semibold`}>
            {candidate.fullName}
          </h3>
          {enrichment?.headline && (
            <p className={`${smallSize} text-muted-foreground mt-0.5`}>
              {enrichment.headline}
            </p>
          )}
          {candidate.location && (
            <div className="flex items-center gap-1 mt-1">
              <MapPin className="size-3 text-muted-foreground/60 shrink-0" />
              <span className={`${smallSize} text-muted-foreground/60`}>
                {candidate.location}
              </span>
            </div>
          )}
          {/* Links */}
          <div className="flex items-center gap-3 mt-2">
            {candidate.linkedinUrl && (
              <a
                href={`https://${candidate.linkedinUrl.replace(/^https?:\/\//, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1 ${smallSize} text-primary hover:underline`}
              >
                <Link className="size-3" />
                LinkedIn
              </a>
            )}
            {candidate.twitterUrl && (
              <a
                href={`https://${candidate.twitterUrl.replace(/^https?:\/\//, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1 ${smallSize} text-primary hover:underline`}
              >
                <ExternalLink className="size-3" />
                X
              </a>
            )}
          </div>
        </div>
      </div>

      {/* About */}
      {enrichment?.about && (
        <div>
          <p className={`${textSize} text-muted-foreground leading-relaxed`}>
            {enrichment.about}
          </p>
        </div>
      )}

      {/* Experience */}
      {enrichment?.experience && enrichment.experience.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Briefcase className="size-3 text-muted-foreground" />
            <span
              className={`${labelSize} font-semibold text-muted-foreground uppercase tracking-wider`}
            >
              Experience
            </span>
          </div>
          <div className="space-y-3">
            {enrichment.experience.map((exp, i) => (
              <div key={i}>
                {exp.positions?.map((pos, j) => (
                  <div key={j}>
                    <p className={`${textSize} font-medium`}>{pos.title}</p>
                    <p className={`${smallSize} text-muted-foreground`}>
                      {exp.company}
                      {pos.department && (
                        <span className="text-muted-foreground/60">
                          {" "}
                          · {pos.department}
                        </span>
                      )}
                    </p>
                  </div>
                ))}
                {(exp.startDate || exp.endDate) && (
                  <p className={`${smallSize} text-muted-foreground/60 mt-0.5`}>
                    {formatDate(exp.startDate)}
                    {exp.startDate && " — "}
                    {exp.endDate ? formatDate(exp.endDate) : "Present"}
                  </p>
                )}
                {exp.positions?.[0]?.description && (
                  <p
                    className={`${smallSize} text-muted-foreground/80 mt-1 leading-relaxed ${compact ? "line-clamp-3" : ""}`}
                  >
                    {exp.positions[0].description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {enrichment?.education && enrichment.education.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <GraduationCap className="size-3 text-muted-foreground" />
            <span
              className={`${labelSize} font-semibold text-muted-foreground uppercase tracking-wider`}
            >
              Education
            </span>
          </div>
          <div className="space-y-2">
            {enrichment.education.map((edu, i) => (
              <div key={i}>
                <p className={`${textSize} font-medium`}>{edu.school}</p>
                {edu.field && (
                  <p className={`${smallSize} text-muted-foreground`}>
                    {edu.field}
                  </p>
                )}
                {(edu.startDate || edu.endDate) && (
                  <p className={`${smallSize} text-muted-foreground/60`}>
                    {formatDate(edu.startDate)}
                    {edu.startDate && edu.endDate && " — "}
                    {formatDate(edu.endDate)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {enrichment?.skills && enrichment.skills.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Wrench className="size-3 text-muted-foreground" />
            <span
              className={`${labelSize} font-semibold text-muted-foreground uppercase tracking-wider`}
            >
              Skills
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {enrichment.skills.slice(0, compact ? 12 : 20).map((skill, i) => (
              <span
                key={i}
                className={`${labelSize} px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground`}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
